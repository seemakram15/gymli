import { requireRole, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 20;

	let query = applyGymScope(
		locals.supabase
			.from('subscriptions')
			.select('*, profiles(full_name, phone_number), packages(name, amount), gyms(name)', { count: 'exact' }),
		scopeGymId(locals)
	).order('due_date');

	if (status) query = query.eq('payment_status', status);
	if (search) {
		// Join-filtered search needs separate query
	}

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: subscriptions, count } = await query;

	return {
		subscriptions: subscriptions ?? [],
		total: count ?? 0,
		page, perPage,
		status, search,
	};
};
