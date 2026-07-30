import { requireRole, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager']);
	const scopedGymId = scopeGymId(locals);
	const from = url.searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
	const to = url.searchParams.get('to') ?? new Date().toISOString().split('T')[0];
	const gym_id = scopedGymId ?? (url.searchParams.get('gym_id') ?? '');

	let pQuery = locals.supabase.from('payments').select('amount, method, paid_at, gym_id, profiles(full_name)').eq('status', 'completed').gte('paid_at', from).lte('paid_at', to + 'T23:59:59');
	if (gym_id) pQuery = pQuery.eq('gym_id', gym_id);

	let sQuery = locals.supabase.from('subscriptions').select('payment_status, amount_due, amount_paid, packages(name)');
	if (gym_id) sQuery = sQuery.eq('gym_id', gym_id);

	let gymsQuery = locals.supabase.from('gyms').select('id, name').eq('status', 'active');
	if (scopedGymId) gymsQuery = gymsQuery.eq('id', scopedGymId);

	const [{ data: payments }, { data: subscriptions }, { data: gyms }, { data: topMembers }] = await Promise.all([
		pQuery,
		sQuery,
		gymsQuery,
		applyGymScope(
			locals.supabase.from('payments').select('amount, profiles(full_name)').eq('status', 'completed').order('amount', { ascending: false }).limit(10),
			scopedGymId
		),
	]);

	const all = payments ?? [];
	const byMethod = {};
	for (const p of all) {
		byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
	}

	const subs = subscriptions ?? [];
	const overdueAmt = subs.filter(s => s.payment_status === 'overdue').reduce((sum, s) => sum + Number(s.amount_due) - Number(s.amount_paid), 0);
	const pendingAmt = subs.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + Number(s.amount_due) - Number(s.amount_paid), 0);

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
