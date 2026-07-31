import { fail } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId } from '$lib/server/rbac.js';
import { checkQuota, countGymsForOwner } from '$lib/server/plan.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const gymId = scopeGymId(locals);

	// gyms<->profiles has two FK paths (gyms.owner_id and profiles.gym_id), so the
	// embed target must be disambiguated or PostgREST errors with PGRST201 and
	// this silently returns no rows.
	let query = locals.supabase
		.from('gyms')
		.select('*, profiles!gyms_owner_id_fkey(full_name)')
		.order('name');
	if (gymId) query = query.eq('id', gymId);
	const { data: gyms } = await query;
	return { gyms: gyms ?? [] };
};

export const actions = {
	create: async ({ request, locals }) => {
		requireRole(locals, ['superadmin']);

		const quotaError = await checkQuota(locals, 'gyms', countGymsForOwner);
		if (quotaError) return fail(403, { error: quotaError });

		const data = await request.formData();
		const { error } = await locals.supabase.from('gyms').insert({
			owner_id: locals.user.id,
			name: data.get('name'),
			address: data.get('address'),
			city: data.get('city'),
			phone: data.get('phone'),
			email: data.get('email'),
			description: data.get('description'),
			status: 'active',
		});
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
	update: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');
		requireGymAccess(locals, id);
		const { error } = await locals.supabase
			.from('gyms')
			.update({
				name: data.get('name'),
				address: data.get('address'),
				city: data.get('city'),
				phone: data.get('phone'),
				email: data.get('email'),
				description: data.get('description'),
			})
			.eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		requireRole(locals, ['superadmin']);
		const data = await request.formData();
		await locals.supabase.from('gyms').update({ status: 'inactive' }).eq('id', data.get('id'));
		return { success: true };
	},
};
