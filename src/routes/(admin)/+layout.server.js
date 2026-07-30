import { redirect, error } from '@sveltejs/kit';

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
