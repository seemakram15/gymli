export const load = async ({ locals, url }) => {
	const from = url.searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
	const to = url.searchParams.get('to') ?? new Date().toISOString().split('T')[0];
	const gym_id = url.searchParams.get('gym_id') ?? '';

	let pQuery = locals.supabase.from('payments').select('amount, method, paid_at, gym_id, profiles(full_name)').eq('status', 'completed').gte('paid_at', from).lte('paid_at', to + 'T23:59:59');
	if (gym_id) pQuery = pQuery.eq('gym_id', gym_id);
	const { data: payments } = await pQuery;

	let sQuery = locals.supabase.from('subscriptions').select('payment_status, amount_due, amount_paid, packages(name)');
	if (gym_id) sQuery = sQuery.eq('gym_id', gym_id);
	const { data: subscriptions } = await sQuery;

	const all = payments ?? [];
	const byMethod = {};
	for (const p of all) {
		byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
	}

	const subs = subscriptions ?? [];
	const overdueAmt = subs.filter(s => s.payment_status === 'overdue').reduce((sum, s) => sum + Number(s.amount_due) - Number(s.amount_paid), 0);
	const pendingAmt = subs.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + Number(s.amount_due) - Number(s.amount_paid), 0);

	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	const { data: topMembers } = await locals.supabase.from('payments').select('amount, profiles(full_name)').eq('status', 'completed').order('amount', { ascending: false }).limit(10);

	return {
		from, to, gym_id,
		totalCollected: all.reduce((s, p) => s + Number(p.amount), 0),
		byMethod,
		overdueAmt,
		pendingAmt,
		paymentCount: all.length,
		payments: all,
		gyms: gyms ?? [],
		topMembers: topMembers ?? [],
	};
};
