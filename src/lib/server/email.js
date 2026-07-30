import { env } from '$env/dynamic/private';
import { formatPKR, formatDate } from '$lib/utils/format.js';

const LOGO_URL = 'https://gymli-bay.vercel.app/images/logo-email.png';
const BRAND_GREEN = '#597f06';
const BRAND_GREEN_LIGHT = '#76a802';
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * Sends via Brevo's transactional email HTTP API. Never throws — a Brevo
 * outage or misconfiguration must not fail the CRUD action that triggered it.
 */
export async function sendEmail(to, subject, html) {
	if (!env.BRAVO_API_KEY || !env.BRAVO_EMAIL) {
		console.warn('[email] BRAVO_API_KEY/BRAVO_EMAIL not set — skipping send to', to);
		return false;
	}
	try {
		const res = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'api-key': env.BRAVO_API_KEY,
				'content-type': 'application/json',
				accept: 'application/json',
			},
			body: JSON.stringify({
				sender: { name: 'GymLi', email: env.BRAVO_EMAIL },
				to: [{ email: to }],
				subject,
				htmlContent: html,
			}),
		});
		if (!res.ok) {
			console.error('[email] send failed', res.status, await res.text().catch(() => ''));
			return false;
		}
		return true;
	} catch (err) {
		console.error('[email] send threw', err);
		return false;
	}
}

/**
 * Shared brand shell replicating the Supabase auth email design system
 * (supabase/templates/*.html): 680px table-based layout, brand bar with
 * logo + Yellowtail wordmark, a hero icon/pill/headline block, and a
 * matching footer.
 */
function shell({ pillLabel, pillColor = { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }, icon, headline, description, bodyHtml }) {
	return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f6;font-family:${FONT}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f6"><tr><td align="center" style="padding:40px 16px 48px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px">

  <tr><td style="padding:0 8px 20px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td><table cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="32" height="32" style="vertical-align:middle"><img src="${LOGO_URL}" width="32" height="32" alt="GymLi" style="display:block;border-radius:8px"/></td>
        <td style="padding-left:8px;font-size:28px;font-weight:400;line-height:1;color:#18181b;font-family:'Yellowtail',cursive">Gym<span style="color:${BRAND_GREEN}">Li</span></td>
      </tr></table></td>
      <td align="right"><span style="display:inline-block;background:${pillColor.bg};border:1px solid ${pillColor.border};color:${pillColor.text};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:20px;font-family:${FONT}">${pillLabel}</span></td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#ffffff;padding:48px 56px 36px;text-align:center;border-bottom:1px solid #f4f4f5">
        <div style="display:inline-block;width:64px;height:64px;background:${pillColor.bg};border:1px solid ${pillColor.border};border-radius:18px;font-size:28px;line-height:64px;text-align:center;margin-bottom:20px">${icon}</div>
        <br/>
        <span style="display:block;color:#18181b;font-size:28px;font-weight:800;line-height:1.25;letter-spacing:-0.02em;font-family:${FONT};margin-bottom:12px">${headline}</span>
        <span style="display:block;color:#71717a;font-size:15px;line-height:1.65;font-family:${FONT}">${description}</span>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:36px 56px 44px">
      ${bodyHtml}
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:28px 0 0;text-align:center">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px"><tr>
      <td width="24" height="24" style="vertical-align:middle"><img src="${LOGO_URL}" width="24" height="24" alt="GymLi" style="display:block;border-radius:6px"/></td>
      <td style="padding-left:6px;font-size:20px;font-weight:400;line-height:1;color:#a1a1aa;font-family:'Yellowtail',cursive">Gym<span style="color:${BRAND_GREEN_LIGHT}">Li</span></td>
    </tr></table>
    <p style="font-size:12px;color:#b4b4b8;line-height:1.7;font-family:${FONT};margin:0">Gym management made simple — members, fees, attendance &amp; staff in one place.</p>
  </td></tr>

</table></td></tr></table></body></html>`;
}

/** Renders [label, value] pairs as a bordered 2-column data table. */
function dataTable(rows) {
	return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #f0f0f1;border-radius:14px;overflow:hidden;margin-bottom:24px">
    ${rows
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(
				([label, value], i) => `
      <tr>
        <td style="padding:14px 20px;font-size:13px;color:#71717a;font-family:${FONT};width:45%;${i > 0 ? 'border-top:1px solid #f0f0f1' : ''}">${label}</td>
        <td style="padding:14px 20px;font-size:14px;color:#18181b;font-weight:600;text-align:right;font-family:${FONT};${i > 0 ? 'border-top:1px solid #f0f0f1' : ''}">${value}</td>
      </tr>`
			)
			.join('')}
  </table>`;
}

/** Renders a credential (temporary password) with the same emphasis as the OTP box in the auth email templates. */
function credentialBox(password) {
	return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px"><tr>
    <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;padding:28px;text-align:center">
      <span style="display:block;font-size:11px;font-weight:700;color:#15803d;letter-spacing:0.14em;text-transform:uppercase;font-family:${FONT};margin-bottom:14px">Your Temporary Password</span>
      <div style="display:inline-block;background:#ffffff;border:2px solid #bbf7d0;border-radius:14px;padding:14px 28px">
        <span style="font-size:24px;font-weight:900;color:${BRAND_GREEN};letter-spacing:0.1em;font-family:'Courier New',Courier,monospace;line-height:1">${password}</span>
      </div>
      <span style="display:block;margin-top:14px;font-size:12px;color:#166534;font-family:${FONT}">Please change this after your first login</span>
    </td>
  </tr></table>`;
}

export function staffWelcomeEmail({ full_name, email, password, role, gymName }) {
	const subject = 'Welcome to GymLi — your staff account is ready';
	const html = shell({
		pillLabel: 'Welcome',
		icon: '👋',
		headline: 'Your staff account is ready',
		description: `Hi ${full_name}, an account has been created for you on GymLi.`,
		bodyHtml: `
			${dataTable([
				['Full Name', full_name],
				['Role', role],
				['Gym', gymName],
				['Login Email', email],
			])}
			${credentialBox(password)}
		`,
	});
	return { subject, html };
}

export function memberWelcomeEmail({ full_name, email, password, gymName, planName }) {
	const subject = 'Welcome to GymLi — your membership account is ready';
	const html = shell({
		pillLabel: 'Welcome',
		icon: '🏋️',
		headline: 'Your membership account is ready',
		description: `Hi ${full_name}, welcome to ${gymName ?? 'GymLi'}!`,
		bodyHtml: `
			${dataTable([
				['Full Name', full_name],
				['Gym', gymName],
				['Plan', planName],
				['Login Email', email],
			])}
			${credentialBox(password)}
		`,
	});
	return { subject, html };
}

export function paymentReceiptEmail({ full_name, amount, method, paid_at, planName, gymName, totalPaid, amountDue }) {
	const subject = `Payment received — ${formatPKR(amount)}`;
	const balance = amountDue !== undefined && totalPaid !== undefined ? Math.max(Number(amountDue) - Number(totalPaid), 0) : undefined;
	const html = shell({
		pillLabel: 'Payment Received',
		icon: '🧾',
		headline: 'Payment confirmed',
		description: `Hi ${full_name}, we've recorded your payment. Here's your receipt.`,
		bodyHtml: dataTable([
			['Amount Paid', formatPKR(amount)],
			['Method', method],
			['Date', formatDate(paid_at)],
			['Plan', planName],
			['Gym', gymName],
			['Total Paid to Date', totalPaid !== undefined ? formatPKR(totalPaid) : undefined],
			['Balance Due', balance !== undefined ? formatPKR(balance) : undefined],
		]),
	});
	return { subject, html };
}

export function subscriptionConfirmationEmail({ full_name, planName, amount, startDate, dueDate, gymName }) {
	const subject = `Your ${planName ?? 'membership'} subscription is confirmed`;
	const html = shell({
		pillLabel: 'Subscription Active',
		icon: '📅',
		headline: 'Your subscription is confirmed',
		description: `Hi ${full_name}, your membership subscription is now active.`,
		bodyHtml: dataTable([
			['Plan', planName],
			['Amount', formatPKR(amount)],
			['Start Date', formatDate(startDate)],
			['Due Date', formatDate(dueDate)],
			['Gym', gymName],
		]),
	});
	return { subject, html };
}
