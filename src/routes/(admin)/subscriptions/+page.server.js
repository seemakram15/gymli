export const load = async ({ locals, url }) => {
	const status = url.searchParams.get('status') ?? '';
	const search = url.searchParams.get('search') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 20;

	let query = locals.supabase
		.from('subscriptions')
		.select('*, profiles(full_name, phone_number), packages(name, amount), gyms(name)', { count: 'exact' })
		.order('due_date');

	if (status) query = query.eq('payment_status', status);
	if (search) {
		// Join-filtered search needs separate query
	}

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: subscriptions, count } = await query;

	const { data: overdueCount } = await locals.supabase
		.from('subscriptions')
		.select('*', { count: 'exact', head: true })
		.eq('payment_status', 'overdue');

	return {
		subscriptions: subscriptions ?? [],
		total: count ?? 0,
		page, perPage,
		status, search,
	};
};
