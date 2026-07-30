import { error } from '@sveltejs/kit';
import { requireRole, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, params }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const scopedGymId = scopeGymId(locals);

	const { data: pkg, error: pkgError } = await locals.supabase
		.from('packages')
		.select('*, cycles(name, interval_days), package_services(services(name))')
		.eq('id', params.id)
		.single();
	if (pkgError || !pkg) error(404, 'Plan not found');

	const { data: subscriptions } = await applyGymScope(
		locals.supabase
			.from('subscriptions')
			.select('user_id, payment_status, due_date, amount_due, amount_paid, status, profiles!inner(id, full_name, phone_number, status, avatar_url)')
			.eq('package_id', params.id)
			.eq('status', 'active'),
		scopedGymId
	).order('due_date');

	return {
		pkg,
		members: subscriptions ?? [],
	};
};
