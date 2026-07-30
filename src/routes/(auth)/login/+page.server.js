import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.supabase) {
			return fail(503, {
				error:
					'Server is missing Supabase environment variables. Add them in Vercel → Settings → Environment Variables.'
			});
		}

		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const { data: signInData, error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { error: error.message, email });
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', signInData.user.id)
			.single();

		redirect(303, profile?.role === 'member' ? '/my-checkin' : '/dashboard');
	}
};
