import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email');

		if (!email) return fail(400, { error: 'Email is required.' });

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email);

		if (error) return fail(400, { error: error.message });

		redirect(303, `/verify-otp?email=${encodeURIComponent(email)}&type=recovery`);
	}
};
