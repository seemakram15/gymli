import { requireRole, scopeGymId, applyGymScope } from '$lib/server/rbac.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const gymId = scopeGymId(locals);
	const supabase = locals.supabase;
	const today = new Date().toISOString().split('T')[0];
	const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
	const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

	const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

	const [
		{ count: totalMembers },
		{ count: activeSubscriptions },
		{ count: overdueCount },
		{ data: collectionData },
		{ data: overdueMembers },
		{ data: dueSoonMembers },
		{ data: recentPayments },
		{ data: recentMembers },
		{ count: attendanceToday },
		{ count: attendanceWeek },
		{ count: newMembers30d },
		{ count: cancelledSubs30d },
	] = await Promise.all([
		applyGymScope(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'), gymId),
		applyGymScope(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'), gymId),
		applyGymScope(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'), gymId),
		applyGymScope(supabase.from('payments').select('amount, paid_at').eq('status', 'completed'), gymId),
		applyGymScope(
			supabase.from('subscriptions')
				.select('id, due_date, amount_due, amount_paid, profiles(full_name, phone_number)')
				.eq('payment_status', 'overdue'),
			gymId
		).order('due_date').limit(5),
		applyGymScope(
			supabase.from('subscriptions')
				.select('id, due_date, amount_due, profiles(full_name, phone_number)')
				.eq('payment_status', 'pending')
				.gte('due_date', today)
				.lte('due_date', new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]),
			gymId
		).order('due_date').limit(5),
		applyGymScope(
			supabase.from('payments')
				.select('id, amount, method, paid_at, profiles(full_name)')
				.eq('status', 'completed'),
			gymId
		).order('paid_at', { ascending: false }).limit(5),
		applyGymScope(
			supabase.from('profiles')
				.select('id, full_name, created_at, role')
				.eq('role', 'member'),
			gymId
		).order('created_at', { ascending: false }).limit(5),
		applyGymScope(supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', today + 'T00:00:00'), gymId),
		applyGymScope(supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('checked_in_at', weekStart + 'T00:00:00'), gymId),
		applyGymScope(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').gte('created_at', monthAgo), gymId),
		applyGymScope(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled').gte('updated_at', monthAgo), gymId),
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
			attendanceToday: attendanceToday ?? 0,
			attendanceWeek: attendanceWeek ?? 0,
			newMembers30d: newMembers30d ?? 0,
			cancelledSubs30d: cancelledSubs30d ?? 0,
		},
		overdueMembers: overdueMembers ?? [],
		dueSoonMembers: dueSoonMembers ?? [],
		recentPayments: recentPayments ?? [],
		recentMembers: recentMembers ?? [],
	};
};
