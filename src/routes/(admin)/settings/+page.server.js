import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/rbac.js';

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

	return {
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
	updateProfile: async ({ request, locals }) => {
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
		};
		if (avatar_url) updates.avatar_url = avatar_url;

		const { error } = await locals.supabase.from('profiles').update(updates).eq('id', locals.user.id);
		if (error) return fail(400, { profileError: error.message });
		return { profileSuccess: true };
	},

	updateEmail: async ({ request, locals }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		if (!email) return fail(400, { emailError: 'Enter an email address.' });

		const { error } = await locals.supabase.auth.updateUser({ email });
		if (error) return fail(400, { emailError: error.message });
		return { emailSuccess: true };
	},

	updatePassword: async ({ request, locals }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!password || password.length < 8) return fail(400, { passwordError: 'Password must be at least 8 characters.' });
		if (password !== confirm) return fail(400, { passwordError: 'Passwords do not match.' });

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) return fail(400, { passwordError: error.message });
		return { passwordSuccess: true };
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
