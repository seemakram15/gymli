import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data: members } = await locals.supabase
		.from('profiles')
		.select('id, full_name, phone_number')
		.eq('role', 'member')
		.order('full_name');

	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');

	const { data: subscriptions } = await locals.supabase
		.from('subscriptions')
		.select('id, user_id, amount_due, amount_paid, packages(name)')
		.eq('status', 'active');

	return { members: members ?? [], gyms: gyms ?? [], subscriptions: subscriptions ?? [] };
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const user_id = data.get('user_id');
		const amount = Number(data.get('amount'));

		if (!user_id) return fail(400, { error: 'Select a member.' });
		if (!amount || amount <= 0) return fail(400, { error: 'Enter a valid amount.' });

		const subscription_id = data.get('subscription_id') || null;
		const gym_id = data.get('gym_id') || null;

		const { error: err } = await locals.supabase.from('payments').insert({
			user_id,
			subscription_id,
			gym_id,
			amount,
			method: data.get('method') || 'cash',
			notes: data.get('notes') || null,
			status: 'completed',
			paid_at: new Date().toISOString(),
		});

		if (err) return fail(400, { error: err.message });

		if (subscription_id) {
			const { data: sub } = await locals.supabase.from('subscriptions').select('amount_due').eq('id', subscription_id).single();
			const { data: payments } = await locals.supabase.from('payments').select('amount').eq('subscription_id', subscription_id).eq('status', 'completed');
			const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
			await locals.supabase.from('subscriptions').update({
				amount_paid: totalPaid,
				payment_status: totalPaid >= (sub?.amount_due ?? 0) ? 'paid' : 'pending',
			}).eq('id', subscription_id);
		}

		redirect(303, `/members/${user_id}`);
	}
};
