import { createSupabaseServerClient } from '$lib/server/supabase';

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
			const {
				data: { session }
			} = await supabase.auth.getSession();
			event.locals.session = session;
			event.locals.user = user;

			const { data: profile } = await supabase
				.from('profiles')
				.select('role, full_name, gym_id')
				.eq('id', user.id)
				.single();
			event.locals.profile = profile;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
