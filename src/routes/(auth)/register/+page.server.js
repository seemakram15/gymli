import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const full_name = data.get('full_name');
		const gym_name = data.get('gym_name');
		const email = data.get('email');
		const phone = data.get('phone');
		const city = data.get('city');
		const password = data.get('password');

		const { data: authData, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name, role: 'superadmin' }
			}
		});

		if (error) {
			return fail(400, { error: error.message, email, full_name, gym_name, phone, city });
		}

		if (authData.user) {
			// Create profile
			await locals.supabase.from('profiles').upsert({
				id: authData.user.id,
				full_name,
				phone_number: phone,
				role: 'superadmin',
				city,
			});

			// Create the first gym
			await locals.supabase.from('gyms').insert({
				owner_id: authData.user.id,
				name: gym_name,
				city,
				phone,
				status: 'active',
			});
		}

		redirect(303, `/verify-otp?email=${encodeURIComponent(email)}&type=signup`);
	}
};
