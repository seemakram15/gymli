import { fail, error } from '@sveltejs/kit';
import { requireRole, requireGymAccess, isSuperadmin } from '$lib/server/rbac.js';
import { renewSubscription } from '$lib/server/billing.js';
import { subscriptionConfirmationEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals, params }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);

	const { data: subscription, error: subError } = await locals.supabase
		.from('subscriptions')
		.select('*, profiles(id, full_name, phone_number, gym_id), packages(name, amount, cycles(name, interval_days)), gyms(name)')
		.eq('id', params.id)
		.single();

	if (subError || !subscription) error(404, 'Subscription not found');
	requireGymAccess(locals, subscription.gym_id);

	const { data: payments } = await locals.supabase
		.from('payments')
		.select('*')
		.eq('subscription_id', params.id)
		.order('paid_at', { ascending: false });

	return { subscription, payments: payments ?? [], viewerRole: locals.profile?.role };
};

export const actions = {
	update: async ({ request, locals, params }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const { data: target } = await locals.supabase.from('subscriptions').select('gym_id').eq('id', params.id).single();
		requireGymAccess(locals, target?.gym_id);

		const data = await request.formData();
		const { error: err } = await locals.supabase
			.from('subscriptions')
			.update({
				amount_due: Number(data.get('amount_due')),
				discount: Number(data.get('discount')) || 0,
				due_date: data.get('due_date') || null,
				status: data.get('status') || 'active',
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });
		return { success: true };
	},

	cancel: async ({ locals, params }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const { data: target } = await locals.supabase.from('subscriptions').select('gym_id').eq('id', params.id).single();
		requireGymAccess(locals, target?.gym_id);

		const { error: err } = await locals.supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', params.id);
		if (err) return fail(400, { error: err.message });
		return { success: true };
	},

	renew: async ({ locals, params }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const { data: target } = await locals.supabase
			.from('subscriptions')
			.select('gym_id, user_id, profiles(full_name), gyms(name)')
			.eq('id', params.id)
			.single();
		requireGymAccess(locals, target?.gym_id);

		const { subscription, pkg, error: err } = await renewSubscription(locals.supabase, params.id);
		if (err) return fail(400, { error: err });

		const { data: emailData } = await locals.supabase.rpc('get_auth_email', { uid: target.user_id });
		if (emailData) {
			const { subject, html } = subscriptionConfirmationEmail({
				full_name: target?.profiles?.full_name,
				planName: pkg?.name,
				amount: subscription.amount_due,
				startDate: subscription.start_date,
				dueDate: subscription.due_date,
				gymName: target?.gyms?.name,
			});
			await sendEmail(emailData, subject, html);
		}

		return { success: true, newSubscriptionId: subscription.id };
	},
};
