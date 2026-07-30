import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// gyms<->profiles has two FK paths (gyms.owner_id and profiles.gym_id), so the
	// embed target must be disambiguated or PostgREST errors with PGRST201 and
	// this silently returns no rows.
	const { data: gyms } = await locals.supabase
		.from('gyms')
		.select('*, profiles!gyms_owner_id_fkey(full_name)')
		.order('name');
	return { gyms: gyms ?? [] };
};

export const actions = {
	create: async ({ request, locals }) => {
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
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		await locals.supabase.from('gyms').update({ status: 'inactive' }).eq('id', data.get('id'));
		return { success: true };
	},
};
