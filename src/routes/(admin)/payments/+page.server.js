export const load = async ({ locals, url }) => {
	const gym_id = url.searchParams.get('gym_id') ?? '';
	const method = url.searchParams.get('method') ?? '';
	const range = url.searchParams.get('range') ?? 'month';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 25;

	const now = new Date();
	let fromDate;
	if (range === 'today') fromDate = new Date().toISOString().split('T')[0];
	else if (range === 'week') fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
	else if (range === 'month') fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

	let query = locals.supabase
		.from('payments')
		.select('*, profiles(full_name, phone_number), gyms(name)', { count: 'exact' })
		.eq('status', 'completed')
		.order('paid_at', { ascending: false });

	if (fromDate) query = query.gte('paid_at', fromDate);
	if (gym_id) query = query.eq('gym_id', gym_id);
	if (method) query = query.eq('method', method);

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: payments, count } = await query;

	// Summary
	const { data: allPayments } = await locals.supabase
		.from('payments')
		.select('amount, paid_at, method, gym_id')
		.eq('status', 'completed');

	const today = new Date().toISOString().split('T')[0];
	const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
	const all = allPayments ?? [];

	return {
		payments: payments ?? [],
		total: count ?? 0,
		page,
		perPage,
		range,
		summary: {
			today: all.filter(p => p.paid_at >= today).reduce((s, p) => s + Number(p.amount), 0),
			week:  all.filter(p => p.paid_at >= weekStart).reduce((s, p) => s + Number(p.amount), 0),
			month: all.filter(p => p.paid_at >= monthStart).reduce((s, p) => s + Number(p.amount), 0),
			total: all.reduce((s, p) => s + Number(p.amount), 0),
		},
	};
};
