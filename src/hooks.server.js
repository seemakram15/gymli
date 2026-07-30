import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle = async ({ event, resolve }) => {
	const supabase = createSupabaseServerClient(event);
	event.locals.supabase = supabase;
	event.locals.session = null;
	event.locals.profile = null;

	if (supabase) {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		event.locals.session = session;

		if (session) {
			const { data: profile } = await supabase
				.from('profiles')
				.select('role, full_name, gym_id')
				.eq('id', session.user.id)
				.single();
			event.locals.profile = profile;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
