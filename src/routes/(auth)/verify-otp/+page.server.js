import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	verify: async ({ request, locals, url }) => {
		const data = await request.formData();
		const token = data.get('token');
		const email = data.get('email');
		const type = data.get('type') || 'signup';

		if (!token || token.length !== 6) {
			return fail(400, { error: 'Please enter the complete 6-digit code.' });
		}

		const { error } = await locals.supabase.auth.verifyOtp({
			email,
			token,
			type: type === 'recovery' ? 'recovery' : 'signup'
		});

		if (error) {
			return fail(400, { error: 'Invalid or expired code. Please try again.' });
		}

		if (type === 'recovery') {
			redirect(303, '/reset-password');
		}

		redirect(303, '/choose-plan');
	},

	resend: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email');
		const type = data.get('type') || 'signup';

		if (type === 'recovery') {
			const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
				redirectTo: undefined
			});
			if (error) return fail(400, { resendError: error.message });
		} else {
			const { error } = await locals.supabase.auth.resend({
				type: 'signup',
				email
			});
			if (error) return fail(400, { resendError: error.message });
		}

		return { resent: true };
	}
};
