import { redirect } from '@sveltejs/kit';
import { getAccountPlan } from '$lib/server/plan.js';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.profile?.role === 'service_provider') redirect(303, '/provider');

	const { ownerId, status, plan } = await getAccountPlan(locals);
	const isOwner = locals.profile?.role === 'superadmin';

	// Non-owners (manager/instructor/staff/member) landing here can't act on
	// billing themselves — the request belongs to their gym owner's account,
	// not their own row — so only look it up (and only surface a "choose a
	// plan" CTA) when the caller *is* the owner.
	let latestRequest = null;
	if (isOwner && ownerId) {
		const { data } = await locals.supabase
			.from('subscription_requests')
			.select('id, plan, status, created_at, reviewed_at')
			.eq('user_id', ownerId)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		latestRequest = data ?? null;
	}

	return {
		status,
		plan,
		isOwner,
		full_name: locals.profile?.full_name ?? '',
		latestRequest,
	};
};
