import { fail, redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { requireRole, requireGymAccess } from '$lib/server/rbac.js';
import { recordPayment } from '$lib/server/billing.js';
import { paymentReceiptEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals, params }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', params.id)
		.single();

	if (profileError || !profile) error(404, 'Member not found');
	requireGymAccess(locals, profile.gym_id);

	const [
		{ data: subscriptions },
		{ data: payments },
		{ data: attendance },
		{ data: packages },
		{ data: gyms },
	] = await Promise.all([
		locals.supabase
			.from('subscriptions')
			.select('*, packages(name, amount), gyms(name)')
			.eq('user_id', params.id)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('payments')
			.select('*')
			.eq('user_id', params.id)
			.order('paid_at', { ascending: false }),
		locals.supabase
			.from('attendance')
			.select('*')
			.eq('user_id', params.id)
			.order('checked_in_at', { ascending: false })
			.limit(20),
		locals.supabase.from('packages').select('id, name, amount').eq('status', 'active'),
		locals.supabase.from('gyms').select('id, name').eq('status', 'active'),
	]);

	const totalPaid = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

	return {
		profile,
		viewerRole: locals.profile?.role,
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
		requireRole(locals, ['superadmin', 'manager']);
		const { data: target } = await locals.supabase.from('profiles').select('gym_id').eq('id', params.id).single();
		requireGymAccess(locals, target?.gym_id);

		const data = await request.formData();
		const updates = Object.fromEntries(
			['full_name','phone_number','cnic_number','gender','date_of_birth',
			 'address','city','emergency_contact_name','emergency_contact_phone',
			 'medical_notes','status','registration_code'].map(k => [k, data.get(k)])
		);

		const { error: err } = await locals.supabase
			.from('profiles').update(updates).eq('id', params.id);

		if (err) {
			const message = err.code === '23505'
				? `Registration code "${updates.registration_code}" is already in use by another member.`
				: err.message;
			return fail(400, { error: message });
		}
		return { success: true };
	},

	uploadDocuments: async ({ request, locals, params }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const { data: target } = await locals.supabase.from('profiles').select('gym_id').eq('id', params.id).single();
		requireGymAccess(locals, target?.gym_id);

		const data = await request.formData();

		async function uploadTo(bucket, path, file) {
			if (!file?.size) return null;
			const ext = file.name.split('.').pop();
			const { data: uploaded } = await locals.supabase.storage
				.from(bucket)
				.upload(`${path}.${ext}`, file, { upsert: true });
			if (!uploaded) return null;
			const { data: { publicUrl } } = locals.supabase.storage.from(bucket).getPublicUrl(uploaded.path);
			return publicUrl;
		}

		const [avatarUrl, cnicFrontUrl, cnicBackUrl] = await Promise.all([
			uploadTo('avatars', `${params.id}/avatar`, data.get('avatar')),
			uploadTo('cnic', `${params.id}/front`, data.get('cnic_front')),
			uploadTo('cnic', `${params.id}/back`, data.get('cnic_back')),
		]);

		const urlUpdates = {};
		if (avatarUrl) urlUpdates.avatar_url = avatarUrl;
		if (cnicFrontUrl) urlUpdates.cnic_front_url = cnicFrontUrl;
		if (cnicBackUrl) urlUpdates.cnic_back_url = cnicBackUrl;

		if (!Object.keys(urlUpdates).length) return fail(400, { error: 'Choose at least one file to upload.' });

		const { error: err } = await locals.supabase.from('profiles').update(urlUpdates).eq('id', params.id);
		if (err) return fail(400, { error: err.message });
		return { success: true };
	},

	addPayment: async ({ request, locals, params, url }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor']);
		const { data: target } = await locals.supabase.from('profiles').select('gym_id, full_name').eq('id', params.id).single();
		requireGymAccess(locals, target?.gym_id);

		const data = await request.formData();
		const gym_id = data.get('gym_id') || target?.gym_id || null;
		const { payment, subscription, error: err } = await recordPayment(locals.supabase, {
			user_id: params.id,
			subscription_id: data.get('subscription_id') || null,
			gym_id,
			amount: Number(data.get('amount')),
			method: data.get('method'),
			notes: data.get('notes'),
		});

		if (err) return fail(400, { error: err });

		const [{ data: emailData }, gymRes] = await Promise.all([
			locals.supabase.rpc('get_auth_email', { uid: params.id }),
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

		return { success: true };
	},
};
