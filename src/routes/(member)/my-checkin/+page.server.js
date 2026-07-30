const CODE_TTL_SECONDS = 30;

function generateCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

export const load = async ({ locals }) => {
	const supabase = locals.supabase;
	const userId = locals.user.id;

	const { data: profile } = await supabase
		.from('profiles')
		.select('full_name, checkin_code, checkin_code_expires_at')
		.eq('id', userId)
		.single();

	const now = new Date();
	const currentExpiry = profile?.checkin_code_expires_at ? new Date(profile.checkin_code_expires_at) : null;

	if (profile?.checkin_code && currentExpiry && currentExpiry > now) {
		return { code: profile.checkin_code, expiresAt: currentExpiry.toISOString(), fullName: profile.full_name };
	}

	// Rotating codes are unique gym-wide (see idx_profiles_checkin_code), so a
	// fresh random 6-digit code can collide; retry a few times before giving up.
	for (let attempt = 0; attempt < 5; attempt++) {
		const code = generateCode();
		const expiresAt = new Date(now.getTime() + CODE_TTL_SECONDS * 1000);
		const { error } = await supabase
			.from('profiles')
			.update({ checkin_code: code, checkin_code_expires_at: expiresAt.toISOString() })
			.eq('id', userId);
		if (!error) return { code, expiresAt: expiresAt.toISOString(), fullName: profile?.full_name };
	}

	return { code: null, expiresAt: null, fullName: profile?.full_name };
};
