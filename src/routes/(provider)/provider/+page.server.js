import { createSupabaseAdminClient } from '$lib/server/supabase.js';

export const load = async () => {
	const admin = createSupabaseAdminClient();

	const [
		{ count: pendingRequests },
		{ count: totalAccounts },
		{ count: activeAccounts },
		{ count: revokedAccounts },
		{ data: recentRequests },
	] = await Promise.all([
		admin.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
		admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin'),
		admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin').eq('status', 'active'),
		admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin').in('status', ['suspended', 'inactive']),
		admin
			.from('subscription_requests')
			.select('id, plan, amount, status, created_at, profiles!subscription_requests_user_id_fkey(full_name), gyms(name)')
			.order('created_at', { ascending: false })
			.limit(8),
	]);

	return {
		stats: {
			pendingRequests: pendingRequests ?? 0,
			totalAccounts: totalAccounts ?? 0,
			activeAccounts: activeAccounts ?? 0,
			revokedAccounts: revokedAccounts ?? 0,
		},
		recentRequests: recentRequests ?? [],
	};
};
