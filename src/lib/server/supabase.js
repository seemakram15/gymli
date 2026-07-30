import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

function requireEnv(value, name) {
	if (!value) {
		throw new Error(
			`Missing ${name}. Set it in Vercel → Project Settings → Environment Variables (and locally in .env).`
		);
	}
	return value;
}

/**
 * Cookie-based SSR client — respects RLS, tied to the logged-in user's session.
 * Use in load functions and form actions via event.locals.supabase.
 */
export function createSupabaseServerClient(event) {
	const url = requireEnv(publicEnv.PUBLIC_SUPABASE_URL, 'PUBLIC_SUPABASE_URL');
	const anonKey = requireEnv(publicEnv.PUBLIC_SUPABASE_ANON_KEY, 'PUBLIC_SUPABASE_ANON_KEY');

	return createServerClient(url, anonKey, {
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
	const url = requireEnv(publicEnv.PUBLIC_SUPABASE_URL, 'PUBLIC_SUPABASE_URL');
	const serviceKey = requireEnv(privateEnv.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');

	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
