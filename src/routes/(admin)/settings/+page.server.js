import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', locals.user.id)
		.single();

	const { data: reminderSettings } = await locals.supabase
		.from('reminder_settings')
		.select('*')
		.limit(1)
		.single();

	const { data: cycles } = await locals.supabase.from('cycles').select('*').order('name');
	const { data: services } = await locals.supabase.from('services').select('*').order('name');

	return {
		profile: profile ?? {},
		reminderSettings: reminderSettings ?? {
			due_soon_days: 3,
			due_soon_email: true,
			due_today_email: true,
			overdue_intervals: '3,7,14',
			overdue_email: true,
			expiry_reminder_days: 7,
			expiry_reminder_email: true,
		},
		cycles: cycles ?? [],
		services: services ?? [],
	};
};

export const actions = {
	updateProfile: async ({ request, locals }) => {
		const data = await request.formData();
		const { error } = await locals.supabase.from('profiles').update({
			full_name: data.get('full_name'),
			phone_number: data.get('phone_number'),
			city: data.get('city'),
		}).eq('id', locals.user.id);
		if (error) return fail(400, { profileError: error.message });
		return { profileSuccess: true };
	},

	updateReminders: async ({ request, locals }) => {
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
		const data = await request.formData();
		const { error } = await locals.supabase.from('cycles').insert({
			name: data.get('name'),
			interval_days: Number(data.get('interval_days')),
		});
		if (error) return fail(400, { cycleError: error.message });
		return { cycleSuccess: true };
	},

	addService: async ({ request, locals }) => {
		const data = await request.formData();
		const { error } = await locals.supabase.from('services').insert({
			name: data.get('name'),
			description: data.get('description'),
			status: 'active',
		});
		if (error) return fail(400, { serviceError: error.message });
		return { serviceSuccess: true };
	},
};
