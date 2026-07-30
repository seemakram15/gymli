import { error } from '@sveltejs/kit';
import { requireRole, requireGymAccess } from '$lib/server/rbac.js';

export const load = async ({ locals, params }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);

	const { data: gym, error: gymError } = await locals.supabase
		.from('gyms')
		.select('*')
		.eq('id', params.id)
		.single();
	if (gymError || !gym) error(404, 'Gym not found');
	requireGymAccess(locals, gym.id);

	const { data: members } = await locals.supabase
		.from('profiles')
		.select('id, full_name, phone_number, status, avatar_url')
		.eq('gym_id', params.id)
		.eq('role', 'member')
		.order('full_name');

	const memberIds = (members ?? []).map((m) => m.id);
	const { data: subscriptions } = memberIds.length
		? await locals.supabase
				.from('subscriptions')
				.select('user_id, payment_status, due_date, amount_due, amount_paid, packages(name)')
				.in('user_id', memberIds)
				.eq('status', 'active')
		: { data: [] };

	const subByUser = new Map();
	for (const s of subscriptions ?? []) {
		if (!subByUser.has(s.user_id)) subByUser.set(s.user_id, s);
	}

	return {
		gym,
		members: (members ?? []).map((m) => ({ ...m, subscription: subByUser.get(m.id) ?? null })),
	};
};
