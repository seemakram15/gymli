import { fail } from '@sveltejs/kit';
import { sendEmail, contactFormEmail } from '$lib/server/email.js';

const TEAM_EMAIL = 'seemakram15@gmail.com';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const phone = String(data.get('phone') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();

		if (!name || !email || !message) {
			return fail(400, { error: 'Name, email, and message are required.', name, email, phone, message });
		}

		const { subject, html } = contactFormEmail({ name, email, phone, message });
		const sent = await sendEmail(TEAM_EMAIL, subject, html, email);
		if (!sent) {
			return fail(500, {
				error: `Could not send your message right now. Please email us directly at ${TEAM_EMAIL}.`,
				name,
				email,
				phone,
				message,
			});
		}

		return { success: true };
	},
};
