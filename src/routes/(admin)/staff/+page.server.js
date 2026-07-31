import { fail } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope, isSuperadmin } from '$lib/server/rbac.js';
import { staffWelcomeEmail, sendEmail } from '$lib/server/email.js';
import { checkQuota, countStaffForOwner } from '$lib/server/plan.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const gymId = scopeGymId(locals);

	const [{ data: staff }, { data: gyms }] = await Promise.all([
		applyGymScope(
			locals.supabase
				.from('profiles')
				.select('id, full_name, phone_number, role, city, status, created_at, avatar_url, gym_id')
				.in('role', ['manager', 'instructor', 'staff']),
			gymId
		).order('full_name'),
		locals.supabase.from('gyms').select('id, name').eq('status', 'active'),
	]);
	return { staff: staff ?? [], gyms: gyms ?? [] };
};

async function uploadAvatar(supabase, userId, file) {
	if (!file?.size) return null;
	const ext = file.name.split('.').pop();
	const { data: uploaded } = await supabase.storage.from('avatars').upload(`${userId}/avatar.${ext}`, file, { upsert: true });
	if (!uploaded) return null;
	const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploaded.path);
	return publicUrl;
}

export const actions = {
	create: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const scopedGymId = scopeGymId(locals);
		const data = await request.formData();
		const email = data.get('email');
		const full_name = data.get('full_name');
		const phone_number = data.get('phone_number');
		const role = data.get('role');
		const gym_id = scopedGymId ?? (data.get('gym_id') || null);
		const password = Math.random().toString(36).slice(-10);

		if (!full_name || !email || !phone_number) {
			return fail(400, { error: 'Full name, email, and phone number are required.' });
		}

		const quotaError = await checkQuota(locals, 'staff', countStaffForOwner);
		if (quotaError) {
			return fail(403, { error: quotaError });
		}

		// Managers can create instructors/staff in their own gym, but not peer managers.
		if (!isSuperadmin(locals) && role === 'manager') {
			return fail(403, { error: 'Only a superadmin can add another manager.' });
		}

		const adminClient = createSupabaseAdminClient();
		const [{ data: authData, error: authError }, gymRes] = await Promise.all([
			adminClient.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: { full_name, role }
			}),
			gym_id ? locals.supabase.from('gyms').select('name').eq('id', gym_id).single() : Promise.resolve({ data: null }),
		]);

		if (authError) return fail(400, { error: authError.message });
		const gymName = gymRes?.data?.name ?? null;

		const avatarUrl = await uploadAvatar(locals.supabase, authData.user.id, data.get('avatar'));

		await locals.supabase.from('profiles').upsert({
			id: authData.user.id,
			full_name,
			phone_number,
			role,
			gym_id,
			city: data.get('city'),
			status: 'active',
			...(avatarUrl ? { avatar_url: avatarUrl } : {}),
		});

		const { subject, html } = staffWelcomeEmail({ full_name, email, password, role, gymName });
		await sendEmail(email, subject, html);

		return { success: true };
	},

	update: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');
		const role = data.get('role');
		const phone_number = data.get('phone_number');

		if (!phone_number) return fail(400, { error: 'Phone number is required.' });

		const { data: target } = await locals.supabase.from('profiles').select('gym_id, role').eq('id', id).single();
		requireGymAccess(locals, target?.gym_id);
		if (!isSuperadmin(locals) && (target?.role === 'manager' || role === 'manager')) {
			return fail(403, { error: 'Only a superadmin can manage manager accounts.' });
		}

		const avatarUrl = await uploadAvatar(locals.supabase, id, data.get('avatar'));

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				full_name: data.get('full_name'),
				phone_number,
				role,
				city: data.get('city'),
				status: data.get('status') || 'active',
				...(avatarUrl ? { avatar_url: avatarUrl } : {}),
			})
			.eq('id', id);

		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');

		const { data: target } = await locals.supabase.from('profiles').select('gym_id, role').eq('id', id).single();
		requireGymAccess(locals, target?.gym_id);
		if (!isSuperadmin(locals) && target?.role === 'manager') {
			return fail(403, { error: 'Only a superadmin can remove a manager.' });
		}

		const { error } = await locals.supabase.from('profiles').update({ status: 'inactive' }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
};
