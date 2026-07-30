import { fail, redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', params.id)
		.single();

	if (profileError || !profile) error(404, 'Member not found');

	const { data: subscriptions } = await locals.supabase
		.from('subscriptions')
		.select('*, packages(name, amount), gyms(name)')
		.eq('user_id', params.id)
		.order('created_at', { ascending: false });

	const { data: payments } = await locals.supabase
		.from('payments')
		.select('*')
		.eq('user_id', params.id)
		.order('paid_at', { ascending: false });

	const { data: attendance } = await locals.supabase
		.from('attendance')
		.select('*')
		.eq('user_id', params.id)
		.order('checked_in_at', { ascending: false })
		.limit(20);

	const { data: packages } = await locals.supabase.from('packages').select('id, name, amount').eq('status', 'active');
	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');

	const totalPaid = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

	return {
		profile,
		subscriptions: subscriptions ?? [],
		payments: payments ?? [],
		attendance: attendance ?? [],
		packages: packages ?? [],
		gyms: gyms ?? [],
		totalPaid,
	};
};

export const actions = {
	updateProfile: async ({ request, locals, params }) => {
		const data = await request.formData();
		const updates = Object.fromEntries(
			['full_name','phone_number','cnic_number','gender','date_of_birth',
			 'address','city','emergency_contact_name','emergency_contact_phone',
			 'medical_notes','status'].map(k => [k, data.get(k)])
		);

		const { error: err } = await locals.supabase
			.from('profiles').update(updates).eq('id', params.id);

		if (err) return fail(400, { error: err.message });
		return { success: true };
	},

	addPayment: async ({ request, locals, params }) => {
		const data = await request.formData();
		const { error: err } = await locals.supabase.from('payments').insert({
			user_id: params.id,
			subscription_id: data.get('subscription_id') || null,
			gym_id: data.get('gym_id') || null,
			amount: Number(data.get('amount')),
			method: data.get('method'),
			notes: data.get('notes'),
			status: 'completed',
			paid_at: new Date().toISOString(),
		});

		if (err) return fail(400, { error: err.message });

		// Update subscription amount_paid
		const subId = data.get('subscription_id');
		if (subId) {
			const { data: sub } = await locals.supabase.from('subscriptions').select('amount_due').eq('id', subId).single();
			const { data: payments } = await locals.supabase.from('payments').select('amount').eq('subscription_id', subId).eq('status', 'completed');
			const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
			await locals.supabase.from('subscriptions').update({
				amount_paid: totalPaid,
				payment_status: totalPaid >= (sub?.amount_due ?? 0) ? 'paid' : 'pending',
			}).eq('id', subId);
		}

		return { success: true };
	},
};
