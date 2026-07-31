import { fail, redirect } from '@sveltejs/kit';
import { requireRole } from '$lib/server/rbac.js';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { getAccountPlan, countGymsForOwner, countMembersForOwner, countStaffForOwner } from '$lib/server/plan.js';

// Supabase throttles outgoing auth emails per-address; its raw message
// ("email rate limit exceeded") reads like a system error rather than
// something the user caused, so translate it into actionable guidance.
function friendlyAuthEmailError(error) {
	if (!error) return null;
	if (error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message)) {
		return 'Too many email requests in a short time. Please wait a few minutes and try again.';
	}
	return error.message;
}

export const load = async ({ locals }) => {
	const [
		{ data: profile },
		{ data: reminderSettings },
		{ data: cycles },
		{ data: services },
	] = await Promise.all([
		locals.supabase.from('profiles').select('*').eq('id', locals.user.id).single(),
		locals.supabase.from('reminder_settings').select('*').limit(1).single(),
		locals.supabase.from('cycles').select('*').eq('status', 'active').order('name'),
		locals.supabase.from('services').select('*').eq('status', 'active').order('name'),
	]);

	let planInfo = null;
	if (locals.profile?.role === 'superadmin') {
		const { ownerId, plan, limits } = await getAccountPlan(locals);
		const [gyms, members, staff] = await Promise.all([
			countGymsForOwner(locals.supabase, ownerId),
			countMembersForOwner(locals.supabase, ownerId),
			countStaffForOwner(locals.supabase, ownerId),
		]);
		planInfo = { plan, limits, usage: { gyms, members, staff } };
	}

	return {
		planInfo,
		profile: profile ?? {},
		email: locals.user?.email ?? '',
		reminderSettings: reminderSettings ?? {
			due_soon_days: 3,
			due_soon_email: true,
			due_today_email: true,
			overdue_intervals: '3,7,14',
			overdue_email: true,
			expiry_reminder_days: 7,
			expiry_reminder_email: true,
			overdue_grace_days: 0,
			inactivity_days: 14,
			inactivity_email: false,
		},
		cycles: cycles ?? [],
		services: services ?? [],
	};
};

export const actions = {
	// Single "Update" button covers profile fields, an optional password
	// change, and an optional email change all in one submit. Email can't
	// take effect immediately (Supabase requires OTP confirmation of the new
	// address), so when it changes this returns emailChangeRequested and the
	// client pops the OTP modal; profile/password changes are already saved.
	updateAccount: async ({ request, locals }) => {
		const data = await request.formData();

		let avatar_url;
		const avatarFile = data.get('avatar');
		if (avatarFile?.size) {
			const ext = avatarFile.name.split('.').pop();
			const { data: uploaded } = await locals.supabase.storage
				.from('avatars')
				.upload(`${locals.user.id}/avatar.${ext}`, avatarFile, { upsert: true });
			if (uploaded) {
				const { data: { publicUrl } } = locals.supabase.storage.from('avatars').getPublicUrl(uploaded.path);
				avatar_url = publicUrl;
			}
		}

		const updates = {
			full_name: data.get('full_name'),
			phone_number: data.get('phone_number'),
			city: data.get('city'),
			address: data.get('address'),
		};
		if (avatar_url) updates.avatar_url = avatar_url;

		const { error: profileError } = await locals.supabase.from('profiles').update(updates).eq('id', locals.user.id);
		if (profileError) return fail(400, { profileError: profileError.message });

		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');
		if (password || confirm) {
			if (password.length < 8) return fail(400, { passwordError: 'Password must be at least 8 characters.' });
			if (password !== confirm) return fail(400, { passwordError: 'Passwords do not match.' });
			const { error: passwordError } = await locals.supabase.auth.updateUser({ password });
			if (passwordError) return fail(400, { passwordError: passwordError.message });
		}

		const email = String(data.get('email') ?? '').trim();
		if (email && email !== locals.user?.email) {
			const { error: emailError } = await locals.supabase.auth.updateUser({ email });
			if (emailError) return fail(400, { profileSuccess: true, emailError: friendlyAuthEmailError(emailError) });
			return { profileSuccess: true, emailChangeRequested: true, pendingEmail: email };
		}

		return { profileSuccess: true };
	},

	verifyEmailChange: async ({ request, locals }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const token = String(data.get('token') ?? '').trim();
		if (!token || token.length !== 6) return fail(400, { otpError: 'Enter the complete 6-digit code.', pendingEmail: email });

		const { error } = await locals.supabase.auth.verifyOtp({ email, token, type: 'email_change' });
		if (error) return fail(400, { otpError: 'Invalid or expired code. Please try again.', pendingEmail: email });

		return { emailSuccess: true };
	},

	resendEmailChangeOtp: async ({ request, locals }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		if (!email) return fail(400, { otpError: 'Missing email address.' });

		const { error } = await locals.supabase.auth.updateUser({ email });
		if (error) return fail(400, { otpError: friendlyAuthEmailError(error), pendingEmail: email });
		return { emailChangeRequested: true, pendingEmail: email };
	},

	deleteAccount: async ({ request, locals }) => {
		const data = await request.formData();
		const confirmText = String(data.get('confirm') ?? '');
		if (confirmText !== 'DELETE') return fail(400, { deleteAccountError: 'Type DELETE to confirm.' });

		// gyms.owner_id references profiles(id) on delete cascade — deleting a
		// gym owner's own account would silently cascade-delete every gym they
		// own along with all of its members, subscriptions, and payments. Block
		// that outright rather than let a self-service action nuke a whole gym.
		const { data: ownedGyms } = await locals.supabase.from('gyms').select('id').eq('owner_id', locals.user.id).limit(1);
		if (ownedGyms?.length) {
			return fail(400, { deleteAccountError: 'You own one or more gym locations. Transfer ownership or remove those gyms before deleting your account.' });
		}

		const adminClient = createSupabaseAdminClient();
		const { error } = await adminClient.auth.admin.deleteUser(locals.user.id);
		if (error) return fail(400, { deleteAccountError: error.message });

		redirect(303, '/login');
	},

	updateReminders: async ({ request, locals }) => {
		requireRole(locals, ['superadmin']);
		const data = await request.formData();
		const settings = {
			due_soon_days: Number(data.get('due_soon_days')),
			due_soon_email: data.get('due_soon_email') === 'on',
			due_soon_sms: data.get('due_soon_sms') === 'on',
			due_today_email: data.get('due_today_email') === 'on',
			overdue_intervals: data.get('overdue_intervals'),
			overdue_email: data.get('overdue_email') === 'on',
			expiry_reminder_days: Number(data.get('expiry_reminder_days')),
			expiry_reminder_email: data.get('expiry_reminder_email') === 'on',
			overdue_grace_days: Number(data.get('overdue_grace_days')) || 0,
			inactivity_days: Number(data.get('inactivity_days')) || 14,
			inactivity_email: data.get('inactivity_email') === 'on',
		};

		// Postgres treats every NULL as distinct, so `unique(gym_id)` never lets
		// upsert's ON CONFLICT match an existing gym_id-is-null row — it would
		// insert a fresh duplicate row on every save instead of updating.
		const { data: existing } = await locals.supabase
			.from('reminder_settings')
			.select('id')
			.is('gym_id', null)
			.limit(1)
			.maybeSingle();

		const { error } = existing
			? await locals.supabase.from('reminder_settings').update(settings).eq('id', existing.id)
			: await locals.supabase.from('reminder_settings').insert({ ...settings, gym_id: null });

		if (error) return fail(400, { reminderError: error.message });
		return { reminderSuccess: true };
	},

	addCycle: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase.from('cycles').insert({
			name: data.get('name'),
			interval_days: Number(data.get('interval_days')),
		});
		if (error) return fail(400, { cycleError: error.message });
		return { cycleSuccess: true };
	},

	updateCycle: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase
			.from('cycles')
			.update({ name: data.get('name'), interval_days: Number(data.get('interval_days')) })
			.eq('id', data.get('id'));
		if (error) return fail(400, { cycleError: error.message });
		return { cycleSuccess: true };
	},

	deleteCycle: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase.from('cycles').update({ status: 'inactive' }).eq('id', data.get('id'));
		if (error) return fail(400, { cycleError: error.message });
		return { cycleSuccess: true };
	},

	addService: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase.from('services').insert({
			name: data.get('name'),
			description: data.get('description'),
			status: 'active',
		});
		if (error) return fail(400, { serviceError: error.message });
		return { serviceSuccess: true };
	},

	updateService: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase
			.from('services')
			.update({ name: data.get('name'), description: data.get('description') })
			.eq('id', data.get('id'));
		if (error) return fail(400, { serviceError: error.message });
		return { serviceSuccess: true };
	},

	deleteService: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const { error } = await locals.supabase.from('services').update({ status: 'inactive' }).eq('id', data.get('id'));
		if (error) return fail(400, { serviceError: error.message });
		return { serviceSuccess: true };
	},
};
