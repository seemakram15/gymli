import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Cookie-based SSR client — respects RLS, tied to the logged-in user's session.
 * Use in load functions and form actions via event.locals.supabase.
 */
export function createSupabaseServerClient(event) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				cookies.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});
}

/**
 * Admin client — uses service role key, bypasses RLS entirely.
 * Only use server-side for operations that need to act across all users
 * (e.g. creating auth users, cross-tenant queries, storage management).
 * NEVER expose this client or its key to the browser.
 */
export function createSupabaseAdminClient() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
