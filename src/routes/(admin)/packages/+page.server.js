import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data: packages } = await locals.supabase
		.from('packages')
		.select('*, cycles(name, interval_days), package_services(services(name))')
		.order('name');
	const { data: cycles } = await locals.supabase.from('cycles').select('id, name, interval_days');
	const { data: services } = await locals.supabase.from('services').select('id, name').eq('status', 'active');
	return { packages: packages ?? [], cycles: cycles ?? [], services: services ?? [] };
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name');
		const cycle_id = data.get('cycle_id');
		const amount = Number(data.get('amount'));
		const description = data.get('description');
		const serviceIds = data.getAll('service_ids');

		if (!name || !cycle_id || !amount) return fail(400, { error: 'Name, cycle and amount are required.' });

		const { data: pkg, error } = await locals.supabase
			.from('packages')
			.insert({ name, cycle_id, amount, description, status: 'active' })
			.select().single();

		if (error) return fail(400, { error: error.message });

		if (serviceIds.length) {
			await locals.supabase.from('package_services').insert(
				serviceIds.map(sid => ({ package_id: pkg.id, service_id: sid }))
			);
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		await locals.supabase.from('packages').update({ status: 'inactive' }).eq('id', data.get('id'));
		return { success: true };
	},
};
