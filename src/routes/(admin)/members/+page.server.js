import { fail } from '@sveltejs/kit';
import { requireRole, requireGymAccess, scopeGymId, applyGymScope } from '$lib/server/rbac.js';
import { manualMessageEmail, sendEmail } from '$lib/server/email.js';

export const load = async ({ locals, url }) => {
	requireRole(locals, ['superadmin', 'manager', 'instructor', 'staff']);
	const search = url.searchParams.get('search') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const gym_id = url.searchParams.get('gym_id') ?? '';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const perPage = 20;

	const scopedGymId = scopeGymId(locals);

	// Overdue isn't a real profiles.status value — it's derived from
	// subscriptions — so it needs its own lookup, used both to filter (when
	// requested) and to badge every row regardless of the active filter.
	const { data: overdueSubs } = await applyGymScope(
		locals.supabase.from('subscriptions').select('user_id').eq('payment_status', 'overdue'),
		scopedGymId
	);
	const overdueIds = new Set((overdueSubs ?? []).map((s) => s.user_id));

	let query = applyGymScope(
		locals.supabase
			.from('profiles')
			.select('id, full_name, phone_number, cnic_number, city, role, status, created_at, avatar_url, gym_id', { count: 'exact' })
			.eq('role', 'member'),
		scopedGymId
	).order('full_name');

	if (search) {
		query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,cnic_number.ilike.%${search}%`);
	}
	if (status === 'overdue') {
		query = query.in('id', overdueIds.size ? Array.from(overdueIds) : ['00000000-0000-0000-0000-000000000000']);
	} else if (status) {
		query = query.eq('status', status);
	}
	// Non-superadmins are locked to their own gym via applyGymScope above;
	// only superadmin gets to further filter by an arbitrary ?gym_id= param.
	if (gym_id && !scopedGymId) query = query.eq('gym_id', gym_id);

	query = query.range((page - 1) * perPage, page * perPage - 1);

	const { data: members, count, error } = await query;

	return {
		members: (members ?? []).map((m) => ({ ...m, isOverdue: overdueIds.has(m.id) })),
		total: count ?? 0,
		page,
		perPage,
		search,
		status,
	};
};

export const actions = {
	sendMessage: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const user_id = data.get('user_id');
		const message = String(data.get('message') ?? '').trim();
		if (!message) return fail(400, { messageError: 'Enter a message.' });

		const { data: member } = await locals.supabase.from('profiles').select('full_name, gym_id').eq('id', user_id).single();
		if (!member) return fail(400, { messageError: 'Member not found.' });
		requireGymAccess(locals, member.gym_id);

		const [{ data: email }, { data: gym }] = await Promise.all([
			locals.supabase.rpc('get_auth_email', { uid: user_id }),
			member.gym_id ? locals.supabase.from('gyms').select('name').eq('id', member.gym_id).single() : Promise.resolve({ data: null }),
		]);
		if (!email) return fail(400, { messageError: 'This member has no login email on file.' });

		const { subject, html } = manualMessageEmail({ full_name: member.full_name, message, gymName: gym?.name });
		await sendEmail(email, subject, html);
		return { messageSuccess: true };
	},

	sendBulkMessage: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const message = String(data.get('message') ?? '').trim();
		const userIds = data.getAll('user_ids');
		if (!message) return fail(400, { bulkError: 'Enter a message.' });
		if (!userIds.length) return fail(400, { bulkError: 'No members to message.' });

		const scopedGymId = scopeGymId(locals);
		let membersQuery = locals.supabase.from('profiles').select('id, full_name, gym_id').in('id', userIds);
		if (scopedGymId) membersQuery = membersQuery.eq('gym_id', scopedGymId);
		const { data: members } = await membersQuery;
		const gymIds = [...new Set((members ?? []).map((m) => m.gym_id).filter(Boolean))];
		const { data: gyms } = gymIds.length ? await locals.supabase.from('gyms').select('id, name').in('id', gymIds) : { data: [] };
		const gymNameById = Object.fromEntries((gyms ?? []).map((g) => [g.id, g.name]));

		let sent = 0;
		await Promise.all(
			(members ?? []).map(async (m) => {
				const { data: email } = await locals.supabase.rpc('get_auth_email', { uid: m.id });
				if (!email) return;
				const { subject, html } = manualMessageEmail({ full_name: m.full_name, message, gymName: gymNameById[m.gym_id] });
				if (await sendEmail(email, subject, html)) sent += 1;
			})
		);
		return { bulkSuccess: true, bulkSentCount: sent };
	},
};
