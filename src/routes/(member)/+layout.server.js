import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.profile?.role !== 'member') redirect(303, '/dashboard');
	return { profile: locals.profile };
};
