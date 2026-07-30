import { fail } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor']);
	const scopedGymId = scopeGymId(locals);
	const gym_id = url.searchParams.get('gym_id') ?? '';
	const method = url.searchParams.get('method') ?? '';
	const range = url.searchParams.get('range') ?? 'month';
	const search = url.searchParams.get('search') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 25;

	const sortColumnMap = {
		member: { column: 'full_name', foreignTable: 'profiles' },
		amount: { column: 'amount' },
		method: { column: 'method' },
		gym: { column: 'name', foreignTable: 'gyms' },
		paid_at: { column: 'paid_at' },
	};
	const sort = sortColumnMap[url.searchParams.get('sort')] ? url.searchParams.get('sort') : 'paid_at';
	const dir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

	const now = new Date();
	let fromDate;
	if (range === 'today') fromDate = new Date().toISOString().split('T')[0];
	else if (range === 'week') fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
	else if (range === 'month') fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

	let query = applyGymScope(
		locals.supabase
			.from('payments')
			.select('*, profiles!inner(full_name, phone_number), gyms(name)', { count: 'exact' })
			.eq('status', 'completed'),
		scopedGymId
	).order(sortColumnMap[sort].column, { ascending: dir === 'asc', foreignTable: sortColumnMap[sort].foreignTable });

	if (fromDate) query = query.gte('paid_at', fromDate);
	if (gym_id && !scopedGymId) query = query.eq('gym_id', gym_id);
	if (method) query = query.eq('method', method);
	if (search) query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`, { foreignTable: 'profiles' });

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const [{ data: payments, count }, { data: allPayments }] = await Promise.all([
		query,
		// Summary
		applyGymScope(
			locals.supabase
				.from('payments')
				.select('amount, paid_at, method, gym_id')
				.eq('status', 'completed'),
			scopedGymId
		),
	]);

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
		search,
		sort,
		dir,
		summary: {
			today: all.filter(p => p.paid_at >= today).reduce((s, p) => s + Number(p.amount), 0),
			week:  all.filter(p => p.paid_at >= weekStart).reduce((s, p) => s + Number(p.amount), 0),
			month: all.filter(p => p.paid_at >= monthStart).reduce((s, p) => s + Number(p.amount), 0),
			total: all.reduce((s, p) => s + Number(p.amount), 0),
		},
	};
};

async function recalcSubscriptionBalance(supabase, subscription_id) {
	if (!subscription_id) return;
	const { data: sub } = await supabase.from('subscriptions').select('amount_due').eq('id', subscription_id).single();
	const { data: payments } = await supabase.from('payments').select('amount').eq('subscription_id', subscription_id).eq('status', 'completed');
	const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
	await supabase.from('subscriptions').update({
		amount_paid: totalPaid,
		payment_status: totalPaid >= (sub?.amount_due ?? 0) ? 'paid' : 'pending',
	}).eq('id', subscription_id);
}

export const actions = {
	update: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');

		const { data: target } = await locals.supabase.from('payments').select('gym_id, subscription_id').eq('id', id).single();
		requireGymAccess(locals, target?.gym_id);

		const { error } = await locals.supabase
			.from('payments')
			.update({
				amount: Number(data.get('amount')),
				method: data.get('method'),
				notes: data.get('notes') || null,
			})
			.eq('id', id);
		if (error) return fail(400, { error: error.message });

		await recalcSubscriptionBalance(locals.supabase, target?.subscription_id);
		return { success: true };
	},

	void: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');

		const { data: target } = await locals.supabase.from('payments').select('gym_id, subscription_id').eq('id', id).single();
		requireGymAccess(locals, target?.gym_id);

		const { error } = await locals.supabase.from('payments').update({ status: 'refunded' }).eq('id', id);
		if (error) return fail(400, { error: error.message });

		await recalcSubscriptionBalance(locals.supabase, target?.subscription_id);
		return { success: true };
	},
};
