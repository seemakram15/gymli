import { fail, redirect } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const full_name = data.get('full_name');
		const email = data.get('email');
		const phone = data.get('phone');
		const city = data.get('city');
		const password = data.get('password');
		const confirm_password = data.get('confirm_password');

		if (password !== confirm_password) {
			return fail(400, { error: 'Passwords do not match.', email, full_name, phone, city });
		}

		const { data: authData, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name, role: 'superadmin' }
			}
		});

		if (error) {
			return fail(400, { error: error.message, email, full_name, phone, city });
		}

		if (authData.user) {
			// signUp() doesn't grant a session until the email is verified (see
			// /verify-otp), so locals.supabase has no auth.uid() yet here — an
			// RLS-bound write would silently fail (blocked by the "own profile"
			// policy, auth.uid() = id evaluating against null). Use the admin
			// client, same as staff/member creation elsewhere, to bypass that.
			const admin = createSupabaseAdminClient();

			// Every account starts 'pending' — the (admin) shell is gated on
			// this until a subscription request is approved, so a fresh
			// signup can't touch gym data before paying for a plan.
			await admin.from('profiles').upsert({
				id: authData.user.id,
				full_name,
				phone_number: phone,
				role: 'superadmin',
				city,
				status: 'pending',
			});

			// The gym-name field was removed from signup (plan/payment comes
			// first) — give the first gym a sensible default name the owner
			// can rename later from Gym Locations.
			await admin.from('gyms').insert({
				owner_id: authData.user.id,
				name: `${full_name}'s Gym`,
				city,
				phone,
				status: 'active',
			});
		}

		redirect(303, `/verify-otp?email=${encodeURIComponent(email)}&type=signup`);
	}
};
