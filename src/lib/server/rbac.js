import { error } from '@sveltejs/kit';

export function isSuperadmin(locals) {
	return locals.profile?.role === 'superadmin';
}

export function requireRole(locals, allowedRoles) {
	const role = locals.profile?.role;
	if (!role || !allowedRoles.includes(role)) {
		error(403, 'You do not have permission to perform this action.');
	}
	return role;
}

/**
 * null = superadmin (no filter, sees everything across all gyms).
 * Otherwise returns the gym_id every query/mutation for this caller must be locked to.
 */
export function scopeGymId(locals) {
	if (isSuperadmin(locals)) return null;
	const gymId = locals.profile?.gym_id;
	if (!gymId) error(403, 'Your account is not assigned to a gym. Contact your administrator.');
	return gymId;
}

export function applyGymScope(query, gymId) {
	return gymId ? query.eq('gym_id', gymId) : query;
}

export function requireGymAccess(locals, targetGymId) {
	if (isSuperadmin(locals)) return;
	if (locals.profile?.gym_id !== targetGymId) {
		error(403, 'This record belongs to a different gym.');
	}
}
