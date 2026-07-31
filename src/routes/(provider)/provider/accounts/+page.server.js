import { fail } from '@sveltejs/kit';
import { createSupabaseAdminClient } from '$lib/server/supabase.js';
import { PLAN_LIMITS, countGymsForOwner, countMembersForOwner, countStaffForOwner } from '$lib/server/plan.js';

export const load = async () => {
	const admin = createSupabaseAdminClient();

	const { data: owners } = await admin
		.from('profiles')
		.select('id, full_name, phone_number, city, plan, status, created_at')
		.eq('role', 'superadmin')
		.order('created_at', { ascending: false });

	const accounts = await Promise.all(
		(owners ?? []).map(async (owner) => {
			const { data: authUser } = await admin.auth.admin.getUserById(owner.id);
			const { data: gyms } = await admin.from('gyms').select('id, name').eq('owner_id', owner.id);
			const [gymsUsed, membersUsed, staffUsed] = await Promise.all([
				countGymsForOwner(admin, owner.id),
				countMembersForOwner(admin, owner.id),
				countStaffForOwner(admin, owner.id),
			]);
			return {
				...owner,
				email: authUser?.user?.email ?? '',
				gyms: gyms ?? [],
				usage: { gyms: gymsUsed, members: membersUsed, staff: staffUsed },
				limits: PLAN_LIMITS[owner.plan] ?? PLAN_LIMITS.starter,
			};
		})
	);

	return { accounts };
};

export const actions = {
	setStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const status = data.get('status');

		if (!['active', 'suspended'].includes(status)) {
			return fail(400, { error: 'Invalid status.' });
		}

		const admin = createSupabaseAdminClient();
		const { error } = await admin.from('profiles').update({ status }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	changePlan: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const plan = data.get('plan');

		if (!Object.keys(PLAN_LIMITS).includes(plan)) {
			return fail(400, { error: 'Invalid plan.' });
		}

		const admin = createSupabaseAdminClient();
		const { error } = await admin.from('profiles').update({ plan }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
};
