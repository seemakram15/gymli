/**
 * Every gym-owning superadmin is one billing account. The plan lives on
 * their own profile row and caps usage across every gym they own — a
 * manager/instructor/staff account inherits the limits of the gym owner
 * they belong to.
 */
export const PLAN_LIMITS = {
	starter: { label: 'Starter', gyms: 1, members: 20, staff: 5 },
	pro: { label: 'Pro', gyms: 3, members: Infinity, staff: 10 },
	custom: { label: 'Custom', gyms: Infinity, members: Infinity, staff: Infinity },
};

/**
 * Resolves the billing account (owner id + plan limits + access status) for
 * the caller, regardless of whether they're the superadmin/owner themselves
 * or a manager/instructor/staff member scoped to one of that owner's gyms.
 * `status` drives the (admin) access gate — 'active' has full access,
 * anything else (pending/suspended/inactive/frozen) does not.
 */
export async function getAccountPlan(locals) {
	const supabase = locals.supabase;
	let ownerId = locals.user?.id ?? null;

	if (locals.profile?.role !== 'superadmin') {
		const gymId = locals.profile?.gym_id;
		if (!gymId) return { ownerId: null, plan: 'starter', status: 'active', limits: PLAN_LIMITS.starter };
		const { data: gym } = await supabase.from('gyms').select('owner_id').eq('id', gymId).single();
		ownerId = gym?.owner_id ?? null;
	}

	if (!ownerId) return { ownerId: null, plan: 'starter', status: 'active', limits: PLAN_LIMITS.starter };

	const { data: owner } = await supabase.from('profiles').select('plan, status').eq('id', ownerId).single();
	const plan = owner?.plan ?? 'starter';
	return { ownerId, plan, status: owner?.status ?? 'active', limits: PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter };
}

async function ownedGymIds(supabase, ownerId) {
	const { data } = await supabase.from('gyms').select('id').eq('owner_id', ownerId).neq('status', 'inactive');
	return (data ?? []).map((g) => g.id);
}

export async function countGymsForOwner(supabase, ownerId) {
	const { count } = await supabase
		.from('gyms')
		.select('*', { count: 'exact', head: true })
		.eq('owner_id', ownerId)
		.neq('status', 'inactive');
	return count ?? 0;
}

export async function countMembersForOwner(supabase, ownerId) {
	const gymIds = await ownedGymIds(supabase, ownerId);
	if (!gymIds.length) return 0;
	const { count } = await supabase
		.from('profiles')
		.select('*', { count: 'exact', head: true })
		.eq('role', 'member')
		.in('gym_id', gymIds);
	return count ?? 0;
}

export async function countStaffForOwner(supabase, ownerId) {
	const gymIds = await ownedGymIds(supabase, ownerId);
	if (!gymIds.length) return 0;
	const { count } = await supabase
		.from('profiles')
		.select('*', { count: 'exact', head: true })
		.in('role', ['manager', 'instructor', 'staff'])
		.in('gym_id', gymIds);
	return count ?? 0;
}

const QUOTA_LABEL = { gyms: 'gym locations', members: 'members', staff: 'staff accounts' };

/**
 * Throws a SvelteKit `fail`-friendly error object shape via return value
 * (never null) when the account is at or over its plan limit for `resource`;
 * returns null when there's room to create one more.
 * @param {'gyms'|'members'|'staff'} resource
 */
export async function checkQuota(locals, resource, countFn) {
	const { ownerId, plan, limits } = await getAccountPlan(locals);
	const limit = limits[resource];
	if (!Number.isFinite(limit)) return null;
	if (!ownerId) return null;

	const current = await countFn(locals.supabase, ownerId);
	if (current < limit) return null;

	return `You've reached the ${limits.label} plan limit of ${limit} ${QUOTA_LABEL[resource]}. Upgrade your plan to add more — contact us at seemakram15@gmail.com or visit /contact.`;
}
