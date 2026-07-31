import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { getAccountPlan } from '$lib/server/plan.js';

export const handle = async ({ event, resolve }) => {
	const supabase = createSupabaseServerClient(event);
	event.locals.supabase = supabase;
	event.locals.session = null;
	event.locals.user = null;
	event.locals.profile = null;

	if (supabase) {
		// getSession() trusts the cookie's JWT as-is without contacting Supabase Auth,
		// so it must never be used to identify the caller for authz-sensitive queries.
		// getUser() re-verifies the token against the Auth server first.
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (user && !userError) {
			event.locals.user = user;

			const { data: profile } = await supabase
				.from('profiles')
				.select('id, full_name, role, phone_number, city, avatar_url, gym_id, status, plan')
				.eq('id', user.id)
				.single();
			event.locals.profile = profile;

			// A pending account (awaiting service-provider review) can browse
			// the gym-admin shell to see the menu, but every mutating request
			// (form actions: create/update/delete) is blocked here so there's
			// a single enforcement point instead of a guard duplicated across
			// every actions handler. GET requests pass through untouched — the
			// (admin) layout swaps the page content for a review-status
			// message instead of rendering real CRUD forms/data.
			if (event.request.method !== 'GET' && event.route.id?.startsWith('/(admin)')) {
				const { status } = await getAccountPlan(event.locals);
				if (status === 'pending') {
					redirect(303, event.url.pathname);
				}
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
