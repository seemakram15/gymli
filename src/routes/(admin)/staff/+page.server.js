import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data: staff } = await locals.supabase
		.from('profiles')
		.select('id, full_name, phone_number, role, city, status, created_at')
		.in('role', ['manager', 'instructor', 'staff'])
		.order('full_name');
	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	return { staff: staff ?? [], gyms: gyms ?? [] };
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = Math.random().toString(36).slice(-10);

		const { data: authData, error: authError } = await locals.supabase.auth.signUp({
			email, password,
			options: { data: { full_name: data.get('full_name'), role: data.get('role') } }
		});

		if (authError) return fail(400, { error: authError.message });

		await locals.supabase.from('profiles').upsert({
			id: authData.user.id,
			full_name: data.get('full_name'),
			phone_number: data.get('phone_number'),
			role: data.get('role'),
			gym_id: data.get('gym_id') || null,
			city: data.get('city'),
			status: 'active',
		});

		return { success: true };
	},
};
