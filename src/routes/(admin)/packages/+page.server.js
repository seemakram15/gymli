import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/rbac.js';

export const load = async ({ locals }) => {
	requireRole(locals, ['superadmin']);
	const [{ data: packages }, { data: cycles }, { data: services }, { data: activeSubs }] = await Promise.all([
		locals.supabase
			.from('packages')
			.select('*, cycles(name, interval_days), package_services(service_id, services(name))')
			.order('name'),
		locals.supabase.from('cycles').select('id, name, interval_days'),
		locals.supabase.from('services').select('id, name').eq('status', 'active'),
		locals.supabase.from('subscriptions').select('package_id').eq('status', 'active'),
	]);

	const countByPackage = {};
	for (const s of activeSubs ?? []) countByPackage[s.package_id] = (countByPackage[s.package_id] ?? 0) + 1;

	return {
		packages: (packages ?? []).map((p) => ({ ...p, memberCount: countByPackage[p.id] ?? 0 })),
		cycles: cycles ?? [],
		services: services ?? [],
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
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

	update: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		const id = data.get('id');
		const name = data.get('name');
		const cycle_id = data.get('cycle_id');
		const amount = Number(data.get('amount'));
		const description = data.get('description');
		const serviceIds = data.getAll('service_ids');

		if (!name || !cycle_id || !amount) return fail(400, { error: 'Name, cycle and amount are required.' });

		const { error } = await locals.supabase
			.from('packages')
			.update({ name, cycle_id, amount, description })
			.eq('id', id);
		if (error) return fail(400, { error: error.message });

		await locals.supabase.from('package_services').delete().eq('package_id', id);
		if (serviceIds.length) {
			await locals.supabase.from('package_services').insert(
				serviceIds.map(sid => ({ package_id: id, service_id: sid }))
			);
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		requireRole(locals, ['superadmin', 'manager']);
		const data = await request.formData();
		await locals.supabase.from('packages').update({ status: 'inactive' }).eq('id', data.get('id'));
		return { success: true };
	},
};
