import { error } from '@sveltejs/kit';
import { requireRole, requireGymAccess } from '$lib/server/rbac.js';

export const load = async ({ locals, params }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);

	const { data: payment, error: paymentError } = await locals.supabase
		.from('payments')
		.select('*, profiles(full_name, phone_number), gyms(name), subscriptions(packages(name))')
		.eq('id', params.id)
		.single();

	if (paymentError || !payment) error(404, 'Payment not found');
	requireGymAccess(locals, payment.gym_id);

	return { payment };
};
