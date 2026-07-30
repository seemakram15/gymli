import { fail, redirect } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { requireRole, scopeGymId } from '$lib/server/rbac.js';
import { createSubscription } from '$lib/server/billing.js';
import { memberWelcomeEmail, subscriptionConfirmationEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const gymId = scopeGymId(locals);
	let gymsQuery = locals.supabase.from('gyms').select('id, name, city').eq('status', 'active');
	if (gymId) gymsQuery = gymsQuery.eq('id', gymId);
	const { data: gyms } = await gymsQuery;
	const { data: packages } = await locals.supabase.from('packages').select('id, name, amount, cycle_id, cycles(name, interval_days)').eq('status', 'active');
	return { gyms: gyms ?? [], packages: packages ?? [] };
};

export const actions = {
	default: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const scopedGymId = scopeGymId(locals);
		const formData = await request.formData();

		const email = formData.get('email');
		const password = formData.get('password') || Math.random().toString(36).slice(-10);
		const registration_code = String(formData.get('registration_code') ?? '').trim();
		const full_name = formData.get('full_name');
		const phone_number = formData.get('phone_number');
		const cnic_number = formData.get('cnic_number');
		const gender = formData.get('gender');
		const date_of_birth = formData.get('date_of_birth') || null;
		const address = formData.get('address');
		const city = formData.get('city');
		const emergency_contact_name = formData.get('emergency_contact_name');
		const emergency_contact_phone = formData.get('emergency_contact_phone');
		const medical_notes = formData.get('medical_notes');
		// Managers can only enroll members into their own gym, regardless of
		// what the form submits.
		const gym_id = scopedGymId ?? (formData.get('gym_id') || null);
		const package_id = formData.get('package_id') || null;
		const start_date = formData.get('start_date') || null;
		const amount_due = formData.get('amount_due');
		const discount = formData.get('discount') || 0;

		if (!full_name || !phone_number || !email) {
			return fail(400, { error: 'Full name, email, and phone number are required.' });
		}
		if (!registration_code) return fail(400, { error: 'Registration code is required.' });
		if (!gym_id) return fail(400, { error: 'Gym location is required.' });
		if (!package_id) return fail(400, { error: 'Membership plan is required.' });
		if (!start_date) return fail(400, { error: 'Membership start date is required.' });
		if (!amount_due) return fail(400, { error: 'Fee amount is required.' });

		// Checked up front, before the auth user is created, so a duplicate code
		// fails fast instead of leaving behind an orphaned auth account.
		const { data: existingCode } = await locals.supabase
			.from('profiles')
			.select('id')
			.eq('registration_code', registration_code)
			.maybeSingle();
		if (existingCode) return fail(400, { error: `Registration code "${registration_code}" is already in use by another member.` });

		// Create auth user via admin client (service role bypasses email confirmation)
		const adminClient = createSupabaseAdminClient();
		const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (authError) {
			return fail(400, { error: authError.message });
		}

		const userId = authData?.user?.id;
		if (!userId) return fail(500, { error: 'Failed to create user account.' });

		// Upsert profile
		const { error: profileError } = await locals.supabase.from('profiles').upsert({
			id: userId,
			full_name,
			phone_number,
			cnic_number,
			gender,
			date_of_birth,
			address,
			city,
			emergency_contact_name,
			emergency_contact_phone,
			medical_notes,
			gym_id,
			registration_code,
			role: 'member',
			status: 'active',
		});
		if (profileError) {
			// Auth user already exists at this point — remove it so a failed
			// enrollment doesn't leave behind a login with no profile.
			await adminClient.auth.admin.deleteUser(userId);
			const message = profileError.code === '23505'
				? `Registration code "${registration_code}" is already in use by another member.`
				: 'Could not save the member profile. Please try again.';
			return fail(400, { error: message });
		}

		// Upload avatar + CNIC front/back concurrently (each is a separate network
		// round-trip to Storage; running them in sequence made real phone photos
		// take 15-30s+ with no feedback, which read as the form being "stuck").
		const avatarFile = formData.get('avatar');
		const cnicFront = formData.get('cnic_front');
		const cnicBack = formData.get('cnic_back');

		async function uploadTo(bucket, path, file) {
			if (!file?.size) return null;
			const ext = file.name.split('.').pop();
			const { data: uploaded } = await locals.supabase.storage
				.from(bucket)
				.upload(`${path}.${ext}`, file, { upsert: true });
			if (!uploaded) return null;
			const { data: { publicUrl } } = locals.supabase.storage.from(bucket).getPublicUrl(uploaded.path);
			return publicUrl;
		}

		const [avatarUrl, cnicFrontUrl, cnicBackUrl] = await Promise.all([
			uploadTo('avatars', `${userId}/avatar`, avatarFile),
			uploadTo('cnic', `${userId}/front`, cnicFront),
			uploadTo('cnic', `${userId}/back`, cnicBack),
		]);

		const urlUpdates = {};
		if (avatarUrl) urlUpdates.avatar_url = avatarUrl;
		if (cnicFrontUrl) urlUpdates.cnic_front_url = cnicFrontUrl;
		if (cnicBackUrl) urlUpdates.cnic_back_url = cnicBackUrl;
		if (Object.keys(urlUpdates).length) {
			await locals.supabase.from('profiles').update(urlUpdates).eq('id', userId);
		}

		// Create subscription if a package was selected during enrollment
		let subResult = null;
		if (package_id) {
			subResult = await createSubscription(locals.supabase, { user_id: userId, package_id, gym_id, start_date, amount_due, discount });
		}

		// Send welcome (+ subscription confirmation, if enrolled with a plan) email.
		// Wrapped so a Brevo failure never blocks account creation from succeeding.
		if (email) {
			const gymName = gym_id
				? (await locals.supabase.from('gyms').select('name').eq('id', gym_id).single()).data?.name
				: null;
			const welcome = memberWelcomeEmail({ full_name, email, password, gymName, planName: subResult?.pkg?.name, registrationCode: registration_code });
			const emailSends = [sendEmail(email, welcome.subject, welcome.html)];
			if (subResult?.subscription && subResult?.pkg) {
				const confirmation = subscriptionConfirmationEmail({
					full_name,
					planName: subResult.pkg.name,
					amount: subResult.subscription.amount_due,
					startDate: subResult.subscription.start_date,
					dueDate: subResult.subscription.due_date,
					gymName,
				});
				emailSends.push(sendEmail(email, confirmation.subject, confirmation.html));
			}
			await Promise.all(emailSends);
		}

		redirect(303, `/members/${userId}`);
	}
};
