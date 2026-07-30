import { requireRole, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 20;

	const sortColumnMap = {
		member: { column: 'full_name', foreignTable: 'profiles' },
		plan: { column: 'name', foreignTable: 'packages' },
		gym: { column: 'name', foreignTable: 'gyms' },
		due_date: { column: 'due_date' },
		amount_due: { column: 'amount_due' },
		amount_paid: { column: 'amount_paid' },
		status: { column: 'payment_status' },
	};
	const sort = sortColumnMap[url.searchParams.get('sort')] ? url.searchParams.get('sort') : 'due_date';
	const dir = url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc';

	let query = applyGymScope(
		locals.supabase
			.from('subscriptions')
			.select('*, profiles!inner(full_name, phone_number), packages(name, amount), gyms(name)', { count: 'exact' }),
		scopeGymId(locals)
	).order(sortColumnMap[sort].column, { ascending: dir === 'asc', foreignTable: sortColumnMap[sort].foreignTable });

	if (status) query = query.eq('payment_status', status);
	if (search) {
		query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`, { foreignTable: 'profiles' });
	}

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: subscriptions, count } = await query;

	return {
		subscriptions: subscriptions ?? [],
		total: count ?? 0,
		page, perPage,
		status, search,
		sort, dir,
	};
};
