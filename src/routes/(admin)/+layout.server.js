import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.session) {
		redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('id, full_name, role, phone_number, city, avatar_url, gym_id')
		.eq('id', locals.session.user.id)
		.single();

	const { data: gyms } = await locals.supabase
		.from('gyms')
		.select('id, name, city, status, logo')
		.order('name');

	return {
		user: locals.session.user,
		profile: profile ?? {},
		gyms: gyms ?? [],
	};
};
