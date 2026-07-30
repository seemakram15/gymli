/**
 * Returns to the previous page in browser history when there is one to go
 * back to, otherwise falls back to a sensible default route. Used by
 * Cancel/Back links on create/edit forms so they return wherever the user
 * actually came from (e.g. dashboard) instead of a hardcoded list page.
 */
export function goBack(fallback = '/dashboard') {
	if (typeof window !== 'undefined' && window.history.length > 1) {
		window.history.back();
	} else {
		window.location.href = fallback;
	}
}
