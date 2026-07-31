import { redirect } from '@sveltejs/kit';
import { requireRole } from '$lib/server/rbac.js';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	requireRole(locals, ['service_provider']);
	return { user: locals.user, profile: locals.profile };
};
