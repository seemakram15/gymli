import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const password = data.get('password');
		const confirm = data.get('confirm');

		if (!password || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) return fail(400, { error: error.message });

		redirect(303, '/dashboard');
	}
};
