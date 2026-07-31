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
	// suspending/pending-ing a gym owner locks out their whole team too,
	// since manager/instructor/staff/member accounts inherit their owner's
	// status via the same gym-owner lookup getAccountPlan already does.
	const { status } = await getAccountPlan(locals);
	if (status !== 'active') {
		redirect(303, '/account-status');
	}

	const gymId = locals.profile?.role === 'superadmin' ? null : locals.profile?.gym_id;
	let gymsQuery = locals.supabase.from('gyms').select('id, name, city, status, logo').order('name');
	if (gymId) gymsQuery = gymsQuery.eq('id', gymId);
	const { data: gyms } = await gymsQuery;

	return {
		user: locals.user,
		profile: locals.profile ?? {},
		gyms: gyms ?? []
	};
};
