import { fail } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { subscriptionApprovedEmail, subscriptionRejectedEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ url }) => {
	const admin = createSupabaseAdminClient();
	const status = url.searchParams.get('status') ?? 'pending';

	let query = admin
		.from('subscription_requests')
		.select(
			'id, plan, amount, payment_method, reference_number, receipt_url, status, created_at, reviewed_at, user_id, profiles!subscription_requests_user_id_fkey(full_name, phone_number), gyms(name)'
		)
		.order('created_at', { ascending: false });

	if (status !== 'all') query = query.eq('status', status);

	const { data: requests } = await query;

	return { requests: requests ?? [], status };
};

export const actions = {
	approve: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id');

		const admin = createSupabaseAdminClient();
		const { data: reqRow } = await admin
			.from('subscription_requests')
			.select('id, user_id, plan, status, profiles!subscription_requests_user_id_fkey(full_name), gyms(name)')
			.eq('id', id)
			.single();

		if (!reqRow) return fail(404, { error: 'Request not found.' });
		if (reqRow.status !== 'pending') return fail(400, { error: 'This request has already been reviewed.' });

		const { data: authUser } = await admin.auth.admin.getUserById(reqRow.user_id);

		await Promise.all([
			admin
				.from('subscription_requests')
				.update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: locals.user.id })
				.eq('id', id),
			admin.from('profiles').update({ plan: reqRow.plan, status: 'active' }).eq('id', reqRow.user_id),
		]);

		if (authUser?.user?.email) {
			const { subject, html } = subscriptionApprovedEmail({
				full_name: reqRow.profiles?.full_name ?? 'there',
				plan: reqRow.plan,
				gymName: reqRow.gyms?.name,
			});
			await sendEmail(authUser.user.email, subject, html);
		}

		return { success: true };
	},

	reject: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id');
		const reason = String(data.get('reason') ?? '').trim();

		const admin = createSupabaseAdminClient();
		const { data: reqRow } = await admin
			.from('subscription_requests')
			.select('id, user_id, plan, status, profiles!subscription_requests_user_id_fkey(full_name)')
			.eq('id', id)
			.single();

		if (!reqRow) return fail(404, { error: 'Request not found.' });
		if (reqRow.status !== 'pending') return fail(400, { error: 'This request has already been reviewed.' });

		await admin
			.from('subscription_requests')
			.update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: locals.user.id })
			.eq('id', id);

		const { data: authUser } = await admin.auth.admin.getUserById(reqRow.user_id);
		if (authUser?.user?.email) {
			const { subject, html } = subscriptionRejectedEmail({
				full_name: reqRow.profiles?.full_name ?? 'there',
				plan: reqRow.plan,
				reason,
			});
			await sendEmail(authUser.user.email, subject, html);
		}

		return { success: true };
	},
};
