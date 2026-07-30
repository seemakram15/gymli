import { fail, redirect, error } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const user_id = url.searchParams.get('user_id') ?? '';

	const { data: members } = await locals.supabase
		.from('profiles')
		.select('id, full_name, phone_number')
		.eq('role', 'member')
		.order('full_name');

	let member = null;
	if (user_id) {
		const { data } = await locals.supabase.from('profiles').select('id, full_name, gym_id').eq('id', user_id).single();
		if (!data) error(404, 'Member not found');
		member = data;
	}

	const { data: packages } = await locals.supabase
		.from('packages')
		.select('id, name, amount, cycle_id, cycles(name, interval_days)')
		.eq('status', 'active');

	const { data: gyms } = await locals.supabase.from('gyms').select('id, name').eq('status', 'active');

	return {
		user_id,
		member,
		members: members ?? [],
		packages: packages ?? [],
		gyms: gyms ?? [],
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const user_id = data.get('user_id');
		const package_id = data.get('package_id');
		const gym_id = data.get('gym_id') || null;
		const start_date = data.get('start_date') || new Date().toISOString().split('T')[0];
		const amount_due = data.get('amount_due');

		if (!user_id) return fail(400, { error: 'Select a member.' });
		if (!package_id) return fail(400, { error: 'Select a membership plan.' });

		const { data: pkg, error: pkgError } = await locals.supabase
			.from('packages')
			.select('*, cycles(interval_days)')
			.eq('id', package_id)
			.single();
		if (pkgError || !pkg) return fail(400, { error: 'Selected plan could not be found.' });

		const dueDate = new Date(start_date);
		if (pkg.cycles?.interval_days) dueDate.setDate(dueDate.getDate() + pkg.cycles.interval_days);

		const { error: err } = await locals.supabase.from('subscriptions').insert({
			user_id,
			package_id,
			gym_id,
			start_date,
			due_date: dueDate.toISOString().split('T')[0],
			amount_due: amount_due || pkg.amount || 0,
			amount_paid: 0,
			payment_status: 'pending',
			status: 'active',
		});

		if (err) return fail(400, { error: err.message });

		redirect(303, `/members/${user_id}`);
	}
};
