import { fail } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const gymId = scopeGymId(locals);
	const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

	const [{ data: attendance }, { data: members }] = await Promise.all([
		applyGymScope(
			locals.supabase
				.from('attendance')
				.select('*, profiles(full_name, avatar_url)')
				.gte('checked_in_at', date + 'T00:00:00')
				.lte('checked_in_at', date + 'T23:59:59'),
			gymId
		).order('checked_in_at', { ascending: false }),
		applyGymScope(
			locals.supabase
				.from('profiles')
				.select('id, full_name, gym_id')
				.eq('role', 'member')
				.eq('status', 'active'),
			gymId
		).order('full_name'),
	]);

	return { attendance: attendance ?? [], members: members ?? [], date };
};

export const actions = {
	checkIn: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
		const data = await request.formData();
		const user_id = data.get('user_id');
		const { data: member } = await locals.supabase.from('profiles').select('gym_id').eq('id', user_id).single();
		requireGymAccess(locals, member?.gym_id);

		const { error } = await locals.supabase.from('attendance').insert({
			user_id,
			gym_id: member?.gym_id ?? null,
			checked_in_at: new Date().toISOString(),
		});
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	checkOut: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
		const data = await request.formData();
		const { error } = await locals.supabase
			.from('attendance')
			.update({ checked_out_at: new Date().toISOString() })
			.eq('id', data.get('id'));
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
};
