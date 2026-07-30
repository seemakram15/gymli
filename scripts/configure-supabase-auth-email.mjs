import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run");

function stripEnvQuotes(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

async function loadDotEnv(relativePath) {
	try {
		const file = await readFile(path.join(repoRoot, relativePath), "utf8");
		for (const rawLine of file.split(/\r?\n/)) {
			const line = rawLine.trim();
			if (!line || line.startsWith("#")) continue;
			const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
			if (!match) continue;
			const [, key, value] = match;
			if (!process.env[key]) process.env[key] = stripEnvQuotes(value);
		}
	} catch {
		// optional
	}
}

function getEnv(name, fallback = "") {
	const raw = process.env[name];
	if (!raw) return fallback;
	return stripEnvQuotes(raw) || fallback;
}

function requireEnv(name) {
	const value = getEnv(name);
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}

function parseProjectRef() {
	const explicit = getEnv("SUPABASE_PROJECT_REF") || getEnv("PROJECT_ID");
	if (explicit) return explicit.replace(/\/+$/, "");

	const supabaseUrl = getEnv("PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
	const match = supabaseUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co(?:\/.*)?$/i);
	if (!match) {
		throw new Error(
			"Unable to infer project ref. Set PROJECT_ID or PUBLIC_SUPABASE_URL in .env"
		);
	}
	return match[1];
}

function resolveAccessToken() {
	const fromEnv = getEnv("SUPABASE_ACCESS_TOKEN");
	if (fromEnv) return fromEnv;

	try {
		const token = execFileSync(
			"security",
			["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
			{ encoding: "utf8" }
		).trim();
		if (token) return token;
	} catch {
		// fall through
	}

	throw new Error(
		"Missing SUPABASE_ACCESS_TOKEN. Set it in .env or run `supabase login`."
	);
}

function maskSecret(value) {
	if (!value) return "(missing)";
	if (value.length <= 6) return "*".repeat(value.length);
	return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

async function readTemplate(relativePath) {
	return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function main() {
	await loadDotEnv(".env");
	await loadDotEnv(".env.local");

	const projectRef = parseProjectRef();
	const siteUrl = getEnv("SITE_URL", "http://localhost:5173");

	const smtpHost = getEnv("SMTP_SERVER", "smtp-relay.brevo.com");
	const smtpPort = getEnv("PORT", "587");
	const smtpUser = getEnv("LOGIN") || getEnv("SUPABASE_AUTH_SMTP_USER");
	const smtpPass = getEnv("BRAVO_SMTP_KEY") || getEnv("SUPABASE_AUTH_SMTP_PASS");
	const smtpAdminEmail = getEnv("BRAVO_EMAIL") || getEnv("SUPABASE_AUTH_SMTP_ADMIN_EMAIL");
	const smtpSenderName = getEnv("SUPABASE_AUTH_SMTP_SENDER_NAME", "GymLi");
	const hasSmtpCredentials = Boolean(smtpUser && smtpPass && smtpAdminEmail);

	const otpExpirySeconds = Number.parseInt(getEnv("SUPABASE_AUTH_OTP_EXPIRY", "600"), 10);

	const confirmationTemplate = await readTemplate("supabase/templates/confirm-email.html");
	const recoveryTemplate = await readTemplate("supabase/templates/reset-password.html");
	const emailChangeTemplate = await readTemplate("supabase/templates/change-email.html");

	const payload = {
		external_email_enabled: true,
		mailer_autoconfirm: false,
		mailer_secure_email_change_enabled: false,
		smtp_sender_name: smtpSenderName,
		otp_expiry: Number.isFinite(otpExpirySeconds) ? otpExpirySeconds : 600,
		mailer_otp_length: 6,
		mailer_subjects_confirmation: "Your GymLi confirmation code",
		mailer_templates_confirmation_content: confirmationTemplate,
		mailer_subjects_recovery: "Your GymLi password reset code",
		mailer_templates_recovery_content: recoveryTemplate,
		mailer_subjects_email_change: "Your GymLi email-change code",
		mailer_templates_email_change_content: emailChangeTemplate,
		site_url: siteUrl,
		additional_redirect_urls: [
			`${siteUrl}`,
			`${siteUrl}/login`,
			`${siteUrl}/verify-otp`,
			`${siteUrl}/reset-password`,
			`http://localhost:5173`,
			`http://localhost:5173/login`,
			`http://localhost:5173/verify-otp`,
			`http://localhost:5173/reset-password`
		]
	};

	if (hasSmtpCredentials) {
		payload.smtp_admin_email = smtpAdminEmail;
		payload.smtp_host = smtpHost;
		payload.smtp_port = smtpPort;
		payload.smtp_user = smtpUser;
		payload.smtp_pass = smtpPass;
	}

	if (isDryRun) {
		console.log(
			JSON.stringify(
				{
					mode: "dry-run",
					projectRef,
					smtpMode: hasSmtpCredentials ? "update-smtp" : "templates-only",
					smtp: {
						host: smtpHost,
						port: smtpPort,
						user: smtpUser || "(missing)",
						pass: maskSecret(smtpPass),
						adminEmail: smtpAdminEmail || "(missing)",
						senderName: smtpSenderName
					},
					templates: {
						confirmationBytes: Buffer.byteLength(confirmationTemplate),
						recoveryBytes: Buffer.byteLength(recoveryTemplate),
						emailChangeBytes: Buffer.byteLength(emailChangeTemplate)
					},
					subjects: {
						confirmation: payload.mailer_subjects_confirmation,
						recovery: payload.mailer_subjects_recovery,
						emailChange: payload.mailer_subjects_email_change
					}
				},
				null,
				2
			)
		);
		return;
	}

	const accessToken = resolveAccessToken();

	const response = await fetch(
		`https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"User-Agent": "GymLiAuthEmailConfig/1.0"
			},
			body: JSON.stringify(payload)
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Supabase auth config update failed (${response.status}): ${body}`);
	}

	const result = await response.json();
	console.log(
		JSON.stringify(
			{
				updated: true,
				projectRef,
				smtpMode: hasSmtpCredentials ? "update-smtp" : "templates-only",
				smtpHost: hasSmtpCredentials ? smtpHost : "(unchanged)",
				smtpAdminEmail: hasSmtpCredentials ? smtpAdminEmail : "(unchanged)",
				smtpSenderName,
				otpExpirySeconds: result.otp_expiry ?? payload.otp_expiry,
				confirmationSubject: result.mailer_subjects_confirmation,
				recoverySubject: result.mailer_subjects_recovery,
				emailChangeSubject: result.mailer_subjects_email_change,
				confirmationTemplateBytes: Buffer.byteLength(
					result.mailer_templates_confirmation_content || confirmationTemplate
				)
			},
			null,
			2
		)
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
