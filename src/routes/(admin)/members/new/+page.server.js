import { fail, redirect } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';

export const load = async ({ locals }) => {
	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	const { data: packages } = await locals.supabase.from('packages').select('id, name, amount, cycle_id, cycles(name, interval_days)').eq('status', 'active');
	return { gyms: gyms ?? [], packages: packages ?? [] };
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const email = formData.get('email');
		const password = formData.get('password') || Math.random().toString(36).slice(-10);
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
		const gym_id = formData.get('gym_id') || null;
		const package_id = formData.get('package_id') || null;
		const start_date = formData.get('start_date') || new Date().toISOString().split('T')[0];
		const amount_due = formData.get('amount_due') || 0;

		if (!full_name || !phone_number) {
			return fail(400, { error: 'Full name and phone number are required.' });
		}

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
		await locals.supabase.from('profiles').upsert({
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
			role: 'member',
			status: 'active',
		});

		// Handle avatar upload
		const avatarFile = formData.get('avatar');
		if (avatarFile?.size > 0) {
			const ext = avatarFile.name.split('.').pop();
			const { data: uploaded } = await locals.supabase.storage
				.from('avatars')
				.upload(`${userId}/avatar.${ext}`, avatarFile, { upsert: true });
			if (uploaded) {
				const { data: { publicUrl } } = locals.supabase.storage.from('avatars').getPublicUrl(uploaded.path);
				await locals.supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
			}
		}

		// Handle CNIC front image
		const cnicFront = formData.get('cnic_front');
		if (cnicFront?.size > 0) {
			const ext = cnicFront.name.split('.').pop();
			const { data: up } = await locals.supabase.storage.from('cnic').upload(`${userId}/front.${ext}`, cnicFront, { upsert: true });
			if (up) {
				const { data: { publicUrl } } = locals.supabase.storage.from('cnic').getPublicUrl(up.path);
				await locals.supabase.from('profiles').update({ cnic_front_url: publicUrl }).eq('id', userId);
			}
		}

		// Handle CNIC back image
		const cnicBack = formData.get('cnic_back');
		if (cnicBack?.size > 0) {
			const ext = cnicBack.name.split('.').pop();
			const { data: up } = await locals.supabase.storage.from('cnic').upload(`${userId}/back.${ext}`, cnicBack, { upsert: true });
			if (up) {
				const { data: { publicUrl } } = locals.supabase.storage.from('cnic').getPublicUrl(up.path);
				await locals.supabase.from('profiles').update({ cnic_back_url: publicUrl }).eq('id', userId);
			}
		}

		// Create subscription if package selected
		if (package_id) {
			const { data: pkg } = await locals.supabase.from('packages').select('*, cycles(interval_days)').eq('id', package_id).single();
			const dueDate = new Date(start_date);
			if (pkg?.cycles?.interval_days) dueDate.setDate(dueDate.getDate() + pkg.cycles.interval_days);

			await locals.supabase.from('subscriptions').insert({
				user_id: userId,
				package_id,
				gym_id,
				start_date,
				due_date: dueDate.toISOString().split('T')[0],
				amount_due: amount_due || pkg?.amount || 0,
				amount_paid: 0,
				payment_status: 'pending',
				status: 'active',
			});
		}

		redirect(303, `/members/${userId}`);
	}
};
