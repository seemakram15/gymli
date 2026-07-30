import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

function getPublicConfig() {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const anonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anonKey) return null;
	return { url, anonKey };
}

/**
 * Cookie-based SSR client — respects RLS, tied to the logged-in user's session.
 * Returns null when public Supabase env vars are missing (so marketing pages
 * can still render instead of hard-500ing the whole app).
 */
export function createSupabaseServerClient(event) {
	const config = getPublicConfig();
	if (!config) return null;

	return createServerClient(config.url, config.anonKey, {
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
	const config = getPublicConfig();
	const serviceKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

	if (!config || !serviceKey) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY. Set them in Vercel → Project Settings → Environment Variables.'
		);
	}

	return createClient(config.url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
