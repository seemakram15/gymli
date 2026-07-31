import { redirect, error } from '@sveltejs/kit';
import { getAccountPlan } from '$lib/server/plan.js';

export const load = async ({ locals }) => {
	if (!locals.supabase) {
		error(
			503,
			'Supabase is not configured. Add PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.'
		);
	}

	if (!locals.user) {
		redirect(303, '/login');
	}

	// Gate the whole gym-admin shell on the account owner's access status —
	// suspending a gym owner locks out their whole team too, since
	// manager/instructor/staff/member accounts inherit their owner's status
	// via the same gym-owner lookup getAccountPlan already does. A 'pending'
	// account (awaiting service-provider review) is let into the shell so
	// they can see the menu and navigate, but every mutating request is
	// blocked in hooks.server.js and the layout swaps the page content for
	// a review-status message instead of rendering it.
	const { ownerId, status } = await getAccountPlan(locals);
	if (status !== 'active' && status !== 'pending') {
		redirect(303, '/account-status');
	}

	const accessPending = status === 'pending';
	const isOwner = ownerId === locals.user.id;
	let pendingPlan = null;
	if (accessPending && isOwner) {
		const { data: reqRow } = await locals.supabase
			.from('subscription_requests')
			.select('plan, status')
			.eq('user_id', ownerId)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		// Only an actual pending request gets the "under review" in-shell
		// experience. No request yet (never subscribed) or a rejected one
		// need their own dedicated pages, not a misleading review message.
		if (!reqRow) redirect(303, '/choose-plan');
		if (reqRow.status !== 'pending') redirect(303, '/account-status');
		pendingPlan = reqRow.plan;
	}

	const gymId = locals.profile?.role === 'superadmin' ? null : locals.profile?.gym_id;
	let gymsQuery = locals.supabase.from('gyms').select('id, name, city, status, logo').order('name');
	if (gymId) gymsQuery = gymsQuery.eq('id', gymId);
	const { data: gyms } = await gymsQuery;

	return {
		user: locals.user,
		profile: locals.profile ?? {},
		gyms: gyms ?? [],
		accessPending,
		pendingPlan
	};
};
