export const load = async ({ locals, url }) => {
	const search = url.searchParams.get('search') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const gym_id = url.searchParams.get('gym_id') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 20;

	let query = locals.supabase
		.from('profiles')
		.select('id, full_name, phone_number, cnic_number, city, role, status, created_at, avatar_url, gym_id', { count: 'exact' })
		.eq('role', 'member')
		.order('full_name');

	if (search) {
		query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,cnic_number.ilike.%${search}%`);
	}
	if (status) query = query.eq('status', status);
	if (gym_id) query = query.eq('gym_id', gym_id);

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: members, count, error } = await query;

	return {
		members: members ?? [],
		total: count ?? 0,
		page,
		perPage,
		search,
		status,
	};
};
