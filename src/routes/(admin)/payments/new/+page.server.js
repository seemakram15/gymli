import { fail, redirect } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';
import { recordPayment } from '$lib/server/billing.js';
import { paymentReceiptEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor']);
	const gymId = scopeGymId(locals);

	const { data: members } = await applyGymScope(
		locals.supabase.from('profiles').select('id, full_name, phone_number').eq('role', 'member').eq('status', 'active'),
		gymId
	).order('full_name');

	let gymsQuery = locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	if (gymId) gymsQuery = gymsQuery.eq('id', gymId);
	const { data: gyms } = await gymsQuery;

	const { data: subscriptions } = await applyGymScope(
		locals.supabase.from('subscriptions').select('id, user_id, amount_due, amount_paid, packages(name)').eq('status', 'active'),
		gymId
	);

	return { members: members ?? [], gyms: gyms ?? [], subscriptions: subscriptions ?? [] };
};

export const actions = {
	default: async ({ request, locals, url }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor']);
		const scopedGymId = scopeGymId(locals);
		const data = await request.formData();
		const user_id = data.get('user_id');
		const amount = Number(data.get('amount'));

		if (!user_id) return fail(400, { error: 'Select a member.' });
		if (!amount || amount <= 0) return fail(400, { error: 'Enter a valid amount.' });

		const { data: target } = await locals.supabase.from('profiles').select('gym_id, full_name').eq('id', user_id).single();
		requireGymAccess(locals, target?.gym_id);

		const subscription_id = data.get('subscription_id') || null;
		const gym_id = scopedGymId ?? (data.get('gym_id') || null);
		if (!gym_id) return fail(400, { error: 'Select a gym.' });

		let receipt_url = null;
		const receiptFile = data.get('receipt');
		if (receiptFile?.size) {
			const ext = receiptFile.name.split('.').pop();
			const { data: uploaded } = await locals.supabase.storage
				.from('receipts')
				.upload(`${user_id}/${Date.now()}.${ext}`, receiptFile, { upsert: true });
			if (uploaded) {
				const { data: { publicUrl } } = locals.supabase.storage.from('receipts').getPublicUrl(uploaded.path);
				receipt_url = publicUrl;
			}
		}

		const paid_at = data.get('paid_at') || null;

		const { payment, subscription, error: err } = await recordPayment(locals.supabase, {
			user_id,
			subscription_id,
			gym_id,
			amount,
			method: data.get('method') || 'cash',
			notes: data.get('notes') || null,
			receipt_url,
			paid_at,
		});
		if (err) return fail(400, { error: err });

		const [{ data: emailData }, gymRes] = await Promise.all([
			locals.supabase.rpc('get_auth_email', { uid: user_id }),
			gym_id ? locals.supabase.from('gyms').select('name').eq('id', gym_id).single() : Promise.resolve({ data: null }),
		]);
		if (emailData) {
			const { subject, html } = paymentReceiptEmail({
				full_name: target?.full_name,
				amount: payment.amount,
				method: payment.method,
				paid_at: payment.paid_at,
				planName: subscription?.packages?.name,
				gymName: gymRes?.data?.name,
				totalPaid: subscription?.amount_paid,
				amountDue: subscription?.amount_due,
				receiptUrl: `${url.origin}/payments/${payment.id}/receipt`,
			});
			await sendEmail(emailData, subject, html);
		}

		redirect(303, `/members/${user_id}`);
	}
};
