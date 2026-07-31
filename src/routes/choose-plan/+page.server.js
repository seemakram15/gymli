import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.profile?.role === 'service_provider') redirect(303, '/provider');
	return { full_name: locals.profile?.full_name ?? '' };
};
