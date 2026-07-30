import { fail } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const gymId = scopeGymId(locals);
	const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

	const [{ data: attendance }, { data: members }] = await Promise.all([
		applyGymScope(
			locals.supabase
				.from('attendance')
				.select('*, profiles(full_name, avatar_url)')
				.gte('checked_in_at', date + 'T00:00:00')
				.lte('checked_in_at', date + 'T23:59:59'),
			gymId
		).order('checked_in_at', { ascending: false }),
		applyGymScope(
			locals.supabase
				.from('profiles')
				.select('id, full_name, gym_id')
				.eq('role', 'member')
				.eq('status', 'active'),
			gymId
		).order('full_name'),
	]);

	return { attendance: attendance ?? [], members: members ?? [], date };
};

/**
 * Blocks check-in for inactive members or subscriptions overdue beyond the
 * gym's configured grace period — the app-layer half of status-linked access
 * (RLS still restricts the query, this adds the business rule on top).
 */
async function checkAccessAllowed(supabase, member) {
	if (member.status === 'inactive') return 'This member\'s account is inactive.';

	const { data: settingsRow } = await supabase.from('reminder_settings').select('overdue_grace_days').is('gym_id', null).limit(1).maybeSingle();
	const graceDays = settingsRow?.overdue_grace_days ?? 0;

	const { data: overdueSub } = await supabase
		.from('subscriptions')
		.select('due_date')
		.eq('user_id', member.id)
		.eq('payment_status', 'overdue')
		.order('due_date', { ascending: true })
		.limit(1)
		.maybeSingle();

	if (overdueSub) {
		const daysOverdue = Math.round((Date.now() - new Date(overdueSub.due_date)) / 86400000);
		if (daysOverdue > graceDays) return `Check-in blocked: payment is ${daysOverdue} days overdue.`;
	}

	return null;
}

export const actions = {
	checkIn: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
		const data = await request.formData();
		const user_id = data.get('user_id');
		const { data: member } = await locals.supabase.from('profiles').select('id, gym_id, status').eq('id', user_id).single();
		if (!member) return fail(400, { error: 'Member not found.' });
		requireGymAccess(locals, member.gym_id);

		const blockedReason = await checkAccessAllowed(locals.supabase, member);
		if (blockedReason) return fail(400, { error: blockedReason });

		const { error } = await locals.supabase.from('attendance').insert({
			user_id,
			gym_id: member.gym_id ?? null,
			checked_in_at: new Date().toISOString(),
			checkin_method: 'manual',
		});
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	checkInByCode: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
		const data = await request.formData();
		const code = String(data.get('code') ?? '').trim();
		if (!code) return fail(400, { codeError: 'Enter a check-in code.' });

		const { data: member } = await locals.supabase
			.from('profiles')
			.select('id, gym_id, status, full_name, checkin_code_expires_at')
			.eq('checkin_code', code)
			.single();

		if (!member || !member.checkin_code_expires_at || new Date(member.checkin_code_expires_at) < new Date()) {
			return fail(400, { codeError: 'Invalid or expired code.' });
		}
		requireGymAccess(locals, member.gym_id);

		const blockedReason = await checkAccessAllowed(locals.supabase, member);
		if (blockedReason) return fail(400, { codeError: blockedReason });

		const { error } = await locals.supabase.from('attendance').insert({
			user_id: member.id,
			gym_id: member.gym_id ?? null,
			checked_in_at: new Date().toISOString(),
			checkin_method: 'code',
		});
		if (error) return fail(400, { codeError: error.message });
		return { codeSuccess: true, checkedInName: member.full_name };
	},

	checkOut: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
		const data = await request.formData();
		const { error } = await locals.supabase
			.from('attendance')
			.update({ checked_out_at: new Date().toISOString() })
			.eq('id', data.get('id'));
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
};
