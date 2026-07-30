import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { formatPKR, formatDate } from '$lib/utils/format.js';
import { sendEmail } from '$lib/server/email.js';

const DEFAULT_SETTINGS = {
	due_soon_days: 3,
	due_soon_email: true,
	due_today_email: true,
	overdue_intervals: '3,7,14',
	overdue_email: true,
	expiry_reminder_days: 7,
	expiry_reminder_email: true,
	inactivity_days: 14,
	inactivity_email: false,
};

function todayISO() {
	return new Date().toISOString().split('T')[0];
}

function addDays(iso, days) {
	const d = new Date(iso);
	d.setDate(d.getDate() + days);
	return d.toISOString().split('T')[0];
}

function daysBetween(a, b) {
	return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function emailShell(title, bodyHtml) {
	return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
	<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
	<table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden">
	<tr><td style="padding:32px">
	<div style="font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#71717a;margin-bottom:8px">GymLi</div>
	<div style="font-size:20px;font-weight:800;color:#18181b;margin-bottom:16px">${title}</div>
	${bodyHtml}
	</td></tr></table>
	</td></tr></table>
	</body></html>`;
}

/**
 * Marks a subscription+kind as sent for today; returns false if already sent
 * (unique constraint on subscription_id/kind/sent_date dedupes across runs).
 */
async function claimSend(supabase, subscription_id, kind) {
	const { error } = await supabase.from('reminder_log').insert({ subscription_id, kind });
	return !error;
}

/** Same dedupe mechanism as claimSend, keyed by member instead of subscription (for reminders that aren't billing-cycle-scoped). */
async function claimSendForUser(supabase, user_id, kind) {
	const { error } = await supabase.from('reminder_log').insert({ user_id, kind });
	return !error;
}

export const GET = async ({ request }) => {
	if (env.CRON_SECRET) {
		const auth = request.headers.get('authorization');
		if (auth !== `Bearer ${env.CRON_SECRET}`) {
			return json({ error: 'unauthorized' }, { status: 401 });
		}
	}

	const supabase = createSupabaseAdminClient();
	const today = todayISO();
	const result = { flippedOverdue: 0, dueSoon: 0, dueToday: 0, overdue: 0, expiry: 0, inactivity: 0, errors: [] };

	const { data: settingsRow } = await supabase
		.from('reminder_settings')
		.select('*')
		.is('gym_id', null)
		.limit(1)
		.maybeSingle();
	const settings = { ...DEFAULT_SETTINGS, ...(settingsRow ?? {}) };
	const overdueIntervals = String(settings.overdue_intervals ?? '')
		.split(',')
		.map((s) => Number(s.trim()))
		.filter((n) => Number.isFinite(n) && n > 0);

	// Flip anything past due from pending -> overdue.
	const { data: flipped } = await supabase
		.from('subscriptions')
		.update({ payment_status: 'overdue' })
		.lt('due_date', today)
		.eq('payment_status', 'pending')
		.select('id');
	result.flippedOverdue = flipped?.length ?? 0;

	async function notify(sub, kind, subject, bodyHtml) {
		const claimed = await claimSend(supabase, sub.id, kind);
		if (!claimed) return; // already sent today
		const email = await supabase.rpc('get_auth_email', { uid: sub.user_id });
		const to = email?.data;
		if (!to) return;
		const ok = await sendEmail(to, subject, emailShell(subject, bodyHtml));
		if (ok) result[kind === 'due_soon' ? 'dueSoon' : kind === 'due_today' ? 'dueToday' : kind] += 1;
	}

	// Due-soon: pending subscriptions whose due_date is exactly N days out.
	if (settings.due_soon_email) {
		const targetDate = addDays(today, settings.due_soon_days);
		const { data: subs } = await supabase
			.from('subscriptions')
			.select('id, user_id, due_date, amount_due, amount_paid, packages(name)')
			.eq('payment_status', 'pending')
			.eq('due_date', targetDate);
		for (const sub of subs ?? []) {
			const balance = Number(sub.amount_due) - Number(sub.amount_paid);
			await notify(
				sub,
				'due_soon',
				`Your GymLi payment is due in ${settings.due_soon_days} day${settings.due_soon_days === 1 ? '' : 's'}`,
				`<p style="color:#52525b;font-size:14px;line-height:1.6">Your <strong>${sub.packages?.name ?? 'membership'}</strong> payment of <strong>${formatPKR(balance)}</strong> is due on ${formatDate(sub.due_date)}.</p>`
			);
		}
	}

	// Due-today: pending subscriptions due exactly today.
	if (settings.due_today_email) {
		const { data: subs } = await supabase
			.from('subscriptions')
			.select('id, user_id, due_date, amount_due, amount_paid, packages(name)')
			.eq('payment_status', 'pending')
			.eq('due_date', today);
		for (const sub of subs ?? []) {
			const balance = Number(sub.amount_due) - Number(sub.amount_paid);
			await notify(
				sub,
				'due_today',
				'Your GymLi payment is due today',
				`<p style="color:#52525b;font-size:14px;line-height:1.6">Your <strong>${sub.packages?.name ?? 'membership'}</strong> payment of <strong>${formatPKR(balance)}</strong> is due today.</p>`
			);
		}
	}

	// Overdue escalation: subscriptions overdue by exactly one of the configured intervals.
	if (settings.overdue_email && overdueIntervals.length) {
		const { data: subs } = await supabase
			.from('subscriptions')
			.select('id, user_id, due_date, amount_due, amount_paid, packages(name)')
			.eq('payment_status', 'overdue');
		for (const sub of subs ?? []) {
			const overdueDays = daysBetween(sub.due_date, today);
			if (!overdueIntervals.includes(overdueDays)) continue;
			const balance = Number(sub.amount_due) - Number(sub.amount_paid);
			await notify(
				sub,
				'overdue',
				`Your GymLi payment is ${overdueDays} days overdue`,
				`<p style="color:#52525b;font-size:14px;line-height:1.6">Your <strong>${sub.packages?.name ?? 'membership'}</strong> payment of <strong>${formatPKR(balance)}</strong> was due on ${formatDate(sub.due_date)} and is now <strong>${overdueDays} days overdue</strong>. Please settle it as soon as possible.</p>`
			);
		}
	}

	// Expiry: active subscriptions whose expires_at is N days out.
	if (settings.expiry_reminder_email) {
		const targetDate = addDays(today, settings.expiry_reminder_days);
		const { data: subs } = await supabase
			.from('subscriptions')
			.select('id, user_id, expires_at, packages(name)')
			.eq('status', 'active')
			.not('expires_at', 'is', null)
			.gte('expires_at', `${targetDate}T00:00:00`)
			.lte('expires_at', `${targetDate}T23:59:59`);
		for (const sub of subs ?? []) {
			await notify(
				sub,
				'expiry',
				`Your GymLi membership expires in ${settings.expiry_reminder_days} days`,
				`<p style="color:#52525b;font-size:14px;line-height:1.6">Your <strong>${sub.packages?.name ?? 'membership'}</strong> expires on ${formatDate(sub.expires_at)}. Renew to keep your access.</p>`
			);
		}
	}

	// Attendance-based re-engagement: active members who haven't checked in for
	// exactly `inactivity_days` (or never have, counted from signup).
	if (settings.inactivity_email) {
		const { data: activeMembers } = await supabase
			.from('profiles')
			.select('id, full_name, created_at')
			.eq('role', 'member')
			.eq('status', 'active');
		const { data: attendanceRows } = await supabase
			.from('attendance')
			.select('user_id, checked_in_at')
			.order('checked_in_at', { ascending: false });

		const lastVisitByUser = new Map();
		for (const row of attendanceRows ?? []) {
			if (!lastVisitByUser.has(row.user_id)) lastVisitByUser.set(row.user_id, row.checked_in_at);
		}

		for (const member of activeMembers ?? []) {
			const lastVisit = lastVisitByUser.get(member.id) ?? member.created_at;
			if (!lastVisit) continue;
			const daysSince = daysBetween(lastVisit.split('T')[0], today);
			if (daysSince !== settings.inactivity_days) continue;

			const claimed = await claimSendForUser(supabase, member.id, 'inactivity');
			if (!claimed) continue;
			const email = await supabase.rpc('get_auth_email', { uid: member.id });
			const to = email?.data;
			if (!to) continue;

			const subject = 'We miss you at the gym!';
			const ok = await sendEmail(
				to,
				subject,
				emailShell(subject, `<p style="color:#52525b;font-size:14px;line-height:1.6">Hi ${member.full_name ?? 'there'}, it's been ${settings.inactivity_days} days since your last visit. Come back and keep your progress going!</p>`)
			);
			if (ok) result.inactivity += 1;
		}
	}

	return json(result);
};
