import { fail } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

	const { data: attendance } = await locals.supabase
		.from('attendance')
		.select('*, profiles(full_name, avatar_url)')
		.gte('checked_in_at', date + 'T00:00:00')
		.lte('checked_in_at', date + 'T23:59:59')
		.order('checked_in_at', { ascending: false });

	const { data: members } = await locals.supabase
		.from('profiles')
		.select('id, full_name')
		.eq('role', 'member')
		.eq('status', 'active')
		.order('full_name');

	return { attendance: attendance ?? [], members: members ?? [], date };
};

export const actions = {
	checkIn: async ({ request, locals }) => {
		const data = await request.formData();
		const { error } = await locals.supabase.from('attendance').insert({
			user_id: data.get('user_id'),
			checked_in_at: new Date().toISOString(),
		});
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
};
