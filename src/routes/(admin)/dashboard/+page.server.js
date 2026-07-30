export const load = async ({ locals }) => {
	const supabase = locals.supabase;
	const today = new Date().toISOString().split('T')[0];
	const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
	const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

	const [
		{ count: totalMembers },
		{ count: activeSubscriptions },
		{ count: overdueCount },
		{ data: collectionData },
		{ data: overdueMembers },
		{ data: dueSoonMembers },
		{ data: recentPayments },
		{ data: recentMembers },
	] = await Promise.all([
		supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
		supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
		supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'),
		supabase.from('payments').select('amount, paid_at').eq('status', 'completed'),
		supabase.from('subscriptions')
			.select('id, due_date, amount_due, amount_paid, profiles(full_name, phone_number)')
			.eq('payment_status', 'overdue')
			.order('due_date')
			.limit(5),
		supabase.from('subscriptions')
			.select('id, due_date, amount_due, profiles(full_name, phone_number)')
			.eq('payment_status', 'pending')
			.gte('due_date', today)
			.lte('due_date', new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0])
			.order('due_date')
			.limit(5),
		supabase.from('payments')
			.select('id, amount, method, paid_at, profiles(full_name)')
			.eq('status', 'completed')
			.order('paid_at', { ascending: false })
			.limit(5),
		supabase.from('profiles')
			.select('id, full_name, created_at, role')
			.eq('role', 'member')
			.order('created_at', { ascending: false })
			.limit(5),
	]);

	const payments = collectionData ?? [];
	const collectionToday  = payments.filter(p => p.paid_at?.startsWith(today)).reduce((s, p) => s + Number(p.amount), 0);
	const collectionWeek   = payments.filter(p => p.paid_at >= weekStart).reduce((s, p) => s + Number(p.amount), 0);
	const collectionMonth  = payments.filter(p => p.paid_at >= monthStart).reduce((s, p) => s + Number(p.amount), 0);
	const collectionTotal  = payments.reduce((s, p) => s + Number(p.amount), 0);

	return {
		stats: {
			totalMembers: totalMembers ?? 0,
			activeSubscriptions: activeSubscriptions ?? 0,
			overdueCount: overdueCount ?? 0,
			collectionToday,
			collectionWeek,
			collectionMonth,
			collectionTotal,
		},
		overdueMembers: overdueMembers ?? [],
		dueSoonMembers: dueSoonMembers ?? [],
		recentPayments: recentPayments ?? [],
		recentMembers: recentMembers ?? [],
	};
};
