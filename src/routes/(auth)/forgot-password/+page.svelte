<script>
	import { enhance } from '$app/forms';
	import { Mail, ArrowLeft, KeyRound } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password · GymLi</title>
</svelte:head>

<div class="fp-wrap">
	<div class="fp-card">
		<div class="fp-glow"></div>

		<div class="fp-icon">
			<KeyRound size={26} />
		</div>

		<h1 class="fp-title">Forgot your password?</h1>
		<p class="fp-sub">
			Enter your email and we'll send a 6-digit reset code to your inbox.
		</p>

		{#if form?.error}
			<div class="error-box">{form.error}</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="field-label">Email address</div>
			<div class="input-group">
				<span class="ig-icon"><Mail size={16} /></span>
				<input
					type="email"
					name="email"
					placeholder="owner@mygym.com"
					required
					autocomplete="email"
					value={form?.email ?? ''}
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{#if loading}
					<span class="btn-spinner"></span> Sending code…
				{:else}
					Send reset code
				{/if}
			</button>
		</form>

		<div class="back-row">
			<a href="/login" class="back-link">
				<ArrowLeft size={14} />
				Back to sign in
			</a>
		</div>
	</div>
</div>

<style>
.fp-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 2rem 1rem;
}
.fp-card {
	position: relative;
	background: #fff;
	border-radius: 1.35rem;
	border: 1px solid #e5e7eb;
	box-shadow: 0 4px 32px rgba(79,70,229,0.08);
	padding: 2.5rem 2rem;
	width: 100%;
	max-width: 420px;
	overflow: hidden;
}
.fp-glow {
	position: absolute;
	top: -80px;
	left: 50%;
	transform: translateX(-50%);
	width: 280px;
	height: 180px;
	background: radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%);
	pointer-events: none;
}
.fp-icon {
	width: 52px;
	height: 52px;
	background: linear-gradient(135deg, #eef2ff, #e0e7ff);
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #4f46e5;
	margin-bottom: 1.25rem;
}
.fp-title {
	font-size: 1.5rem;
	font-weight: 700;
	color: #111827;
	margin-bottom: 0.5rem;
}
.fp-sub {
	color: #6b7280;
	font-size: 0.9rem;
	line-height: 1.6;
	margin-bottom: 1.75rem;
}
.error-box {
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 10px;
	padding: 0.75rem 1rem;
	color: #b91c1c;
	font-size: 0.875rem;
	margin-bottom: 1.25rem;
}
.field-label {
	font-size: 0.8rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.4rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}
.submit-btn {
	width: 100%;
	background: linear-gradient(135deg, #4f46e5, #7c3aed);
	color: #fff;
	border: none;
	border-radius: 0.875rem;
	padding: 0.875rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	margin-top: 1.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	transition: opacity 0.2s;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner {
	width: 16px;
	height: 16px;
	border: 2px solid rgba(255,255,255,0.3);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.back-row {
	text-align: center;
	margin-top: 1.5rem;
}
.back-link {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	color: #6b7280;
	text-decoration: none;
	font-size: 0.875rem;
}
.back-link:hover { color: #374151; }
</style>
