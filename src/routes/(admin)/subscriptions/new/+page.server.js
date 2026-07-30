import { fail, redirect, error } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';
import { createSubscription } from '$lib/server/billing.js';
import { subscriptionConfirmationEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const gymId = scopeGymId(locals);
	const user_id = url.searchParams.get('user_id') ?? '';

	const { data: members } = await applyGymScope(
		locals.supabase.from('profiles').select('id, full_name, phone_number').eq('role', 'member'),
		gymId
	).order('full_name');

	let member = null;
	if (user_id) {
		const { data } = await locals.supabase.from('profiles').select('id, full_name, gym_id').eq('id', user_id).single();
		if (!data) error(404, 'Member not found');
		requireGymAccess(locals, data.gym_id);
		member = data;
	}

	const { data: packages } = await locals.supabase
		.from('packages')
		.select('id, name, amount, cycle_id, cycles(name, interval_days)')
		.eq('status', 'active');

	let gymsQuery = locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	if (gymId) gymsQuery = gymsQuery.eq('id', gymId);
	const { data: gyms } = await gymsQuery;

	return {
		user_id,
		member,
		members: members ?? [],
		packages: packages ?? [],
		gyms: gyms ?? [],
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const scopedGymId = scopeGymId(locals);
		const data = await request.formData();
		const user_id = data.get('user_id');
		const package_id = data.get('package_id');
		const gym_id = scopedGymId ?? (data.get('gym_id') || null);
		const start_date = data.get('start_date') || null;
		const amount_due = data.get('amount_due');

		if (!user_id) return fail(400, { error: 'Select a member.' });
		if (!package_id) return fail(400, { error: 'Select a membership plan.' });
		if (!gym_id) return fail(400, { error: 'Gym location is required.' });
		if (!start_date) return fail(400, { error: 'Start date is required.' });
		if (!amount_due) return fail(400, { error: 'Fee amount is required.' });

		const { data: target } = await locals.supabase.from('profiles').select('gym_id, full_name').eq('id', user_id).single();
		requireGymAccess(locals, target?.gym_id);

		const { subscription, pkg, error: err } = await createSubscription(locals.supabase, { user_id, package_id, gym_id, start_date, amount_due });
		if (err) return fail(400, { error: err });

		const [{ data: emailData }, gymRes] = await Promise.all([
			locals.supabase.rpc('get_auth_email', { uid: user_id }),
			gym_id ? locals.supabase.from('gyms').select('name').eq('id', gym_id).single() : Promise.resolve({ data: null }),
		]);
		if (emailData) {
			const { subject, html } = subscriptionConfirmationEmail({
				full_name: target?.full_name,
				planName: pkg.name,
				amount: subscription.amount_due,
				startDate: subscription.start_date,
				dueDate: subscription.due_date,
				gymName: gymRes?.data?.name,
			});
			await sendEmail(emailData, subject, html);
		}

		redirect(303, `/members/${user_id}`);
	}
};
