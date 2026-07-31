import { error, fail, redirect } from '@sveltejs/kit';
import {
	subscriptionRequestEmail,
	subscriptionRequestReceivedEmail,
	sendEmail,
} from '$lib/server/email.js';

const PLAN_INFO = {
	starter: { label: 'Starter', amount: 1500 },
	pro: { label: 'Pro', amount: 4000 },
};

const TEAM_EMAIL = 'seemakram15@gmail.com';

export const load = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.profile?.role === 'service_provider') redirect(303, '/provider');

	const planInfo = PLAN_INFO[params.plan];
	if (!planInfo) error(404, 'Unknown plan.');

	const { data: gym } = await locals.supabase
		.from('gyms')
		.select('id, name')
		.eq('owner_id', locals.user.id)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();

	return {
		plan: params.plan,
		planInfo,
		full_name: locals.profile?.full_name ?? '',
		gym: gym ?? null,
	};
};

export const actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) redirect(303, '/login');

		const planInfo = PLAN_INFO[params.plan];
		if (!planInfo) error(404, 'Unknown plan.');

		const data = await request.formData();
		const payment_method = String(data.get('payment_method') ?? '');
		const reference_number = String(data.get('reference_number') ?? '').trim();
		const receipt = data.get('receipt');

		if (!['bank_transfer', 'jazzcash'].includes(payment_method)) {
			return fail(400, { error: 'Select a payment method.', reference_number });
		}
		if (!receipt?.size) {
			return fail(400, { error: 'A payment receipt is required to submit this request.', payment_method, reference_number });
		}

		const { data: gym } = await locals.supabase
			.from('gyms')
			.select('id, name')
			.eq('owner_id', locals.user.id)
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle();

		const ext = receipt.name.split('.').pop();
		const { data: uploaded, error: uploadError } = await locals.supabase.storage
			.from('receipts')
			.upload(`subscription-requests/${locals.user.id}/${Date.now()}.${ext}`, receipt, {
				upsert: true,
				contentType: receipt.type || 'application/octet-stream',
			});
		if (uploadError || !uploaded) {
			return fail(500, { error: 'Could not upload your receipt. Please try again.', payment_method, reference_number });
		}
		const { data: { publicUrl } } = locals.supabase.storage.from('receipts').getPublicUrl(uploaded.path);

		const { error: insertError } = await locals.supabase.from('subscription_requests').insert({
			user_id: locals.user.id,
			gym_id: gym?.id ?? null,
			plan: params.plan,
			amount: planInfo.amount,
			payment_method,
			reference_number: reference_number || null,
			receipt_url: publicUrl,
		});
		if (insertError) {
			return fail(500, { error: 'Could not submit your request. Please try again.', payment_method, reference_number });
		}

		const full_name = locals.profile?.full_name ?? 'A GymLi user';

		const toTeam = subscriptionRequestEmail({
			requesterName: full_name,
			requesterEmail: locals.user.email,
			gymName: gym?.name,
			plan: planInfo.label,
			amount: planInfo.amount,
			method: payment_method === 'jazzcash' ? 'JazzCash' : 'Bank Transfer',
			referenceNumber: reference_number,
			receiptUrl: publicUrl,
		});
		const toRequester = subscriptionRequestReceivedEmail({ full_name, plan: planInfo.label, amount: planInfo.amount });

		await Promise.all([
			sendEmail(TEAM_EMAIL, toTeam.subject, toTeam.html, locals.user.email),
			sendEmail(locals.user.email, toRequester.subject, toRequester.html),
		]);

		return { success: true };
	},
};
