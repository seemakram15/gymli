<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { ShieldCheck, RotateCcw, ArrowLeft, Check } from 'lucide-svelte';

	let { form } = $props();

	const email = $derived($page.url.searchParams.get('email') || '');
	const type = $derived($page.url.searchParams.get('type') || 'signup');
	const isRecovery = $derived(type === 'recovery');

	let digits = $state(['', '', '', '', '', '']);
	let inputs = $state([]);
	let phase = $state('enter'); // enter | verifying | success
	let countdown = $state(600);
	let resendCooldown = $state(0);
	let resending = $state(false);

	const token = $derived(digits.join(''));
	const allFilled = $derived(token.length === 6);

	// Countdown timer
	$effect(() => {
		const t = setInterval(() => {
			if (countdown > 0) countdown--;
		}, 1000);
		return () => clearInterval(t);
	});

	// Resend cooldown
	$effect(() => {
		if (resendCooldown <= 0) return;
		const t = setInterval(() => {
			resendCooldown--;
			if (resendCooldown <= 0) clearInterval(t);
		}, 1000);
		return () => clearInterval(t);
	});

	const countdownDisplay = $derived(() => {
		const m = Math.floor(countdown / 60);
		const s = countdown % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	});

	function onInput(i, e) {
		const val = e.target.value.replace(/\D/g, '').slice(-1);
		digits[i] = val;
		if (val && i < 5) inputs[i + 1]?.focus();
		if (allFilled) submitOtp();
	}

	function onKeydown(i, e) {
		if (e.key === 'Backspace' && !digits[i] && i > 0) {
			inputs[i - 1]?.focus();
		}
		if (e.key === 'ArrowLeft' && i > 0) inputs[i - 1]?.focus();
		if (e.key === 'ArrowRight' && i < 5) inputs[i + 1]?.focus();
	}

	function onPaste(e) {
		const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		if (pasted.length === 6) {
			digits = pasted.split('');
			inputs[5]?.focus();
			setTimeout(() => submitOtp(), 50);
		}
		e.preventDefault();
	}

	let verifyForm;
	function submitOtp() {
		if (!allFilled || phase !== 'enter') return;
		phase = 'verifying';
		setTimeout(() => verifyForm?.requestSubmit(), 100);
	}

	function handleVerifyResult(result) {
		if (result?.type === 'redirect') {
			phase = 'success';
			// Let the redirect happen after success animation
			setTimeout(() => {
				window.location.href = isRecovery ? '/reset-password' : '/dashboard';
			}, 700);
		} else {
			phase = 'enter';
		}
	}
</script>

<svelte:head>
	<title>{isRecovery ? 'Reset Password' : 'Verify Email'} · GymLi</title>
</svelte:head>

<div class="verify-wrap">
	{#if phase === 'success'}
		<!-- Success State -->
		<div class="success-card">
			<div class="success-glow"></div>
			<div class="check-badge">
				<Check size={42} strokeWidth={2.75} />
			</div>
			<h2 class="success-title">Verified successfully</h2>
			<p class="success-sub">
				{isRecovery ? 'Opening password reset…' : 'You\'re signed in. Opening your dashboard…'}
			</p>
		</div>
	{:else}
		<!-- OTP Entry State -->
		<div class="otp-card">
			<div class="card-glow"></div>

			<div class="card-header">
				<div class="icon-wrap">
					<ShieldCheck size={28} />
				</div>
				<div>
					<h1 class="card-title">
						{isRecovery ? 'Enter your reset code' : 'Let\'s verify your email'}
					</h1>
					<p class="card-sub">
						A 6-digit code was sent to <strong>{email}</strong>.
						It expires in&nbsp;<span class="countdown" class:urgent={countdown <= 60}>{countdownDisplay()}</span>
					</p>
				</div>
			</div>

			{#if form?.error}
				<div class="error-box">{form.error}</div>
			{/if}
			{#if form?.resent}
				<div class="success-box">A new code has been sent to {email}.</div>
			{/if}
			{#if form?.resendError}
				<div class="error-box">{form.resendError}</div>
			{/if}

			<!-- 6-box OTP input -->
			<form
				bind:this={verifyForm}
				method="POST"
				action="?/verify"
				use:enhance={({ cancel }) => {
					if (!allFilled) { cancel(); return; }
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							phase = 'success';
							setTimeout(() => {
								window.location.href = isRecovery ? '/reset-password' : '/dashboard';
							}, 700);
						} else {
							phase = 'enter';
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="token" value={token} />
				<input type="hidden" name="email" value={email} />
				<input type="hidden" name="type" value={type} />

				<div class="otp-row" onpaste={onPaste}>
					{#each digits as digit, i}
						<div class="otp-slot" class:filled={digit !== ''} class:focused={false}>
							<input
								bind:this={inputs[i]}
								type="text"
								inputmode="numeric"
								maxlength="1"
								autocomplete="one-time-code"
								value={digit}
								oninput={(e) => onInput(i, e)}
								onkeydown={(e) => onKeydown(i, e)}
								disabled={phase === 'verifying'}
								aria-label={`Digit ${i + 1}`}
							/>
						</div>
					{/each}
				</div>

				{#if phase === 'verifying'}
					<div class="verifying-row">
						<span class="spinner"></span>
						<span>Verifying code…</span>
					</div>
				{:else}
					<button type="submit" class="verify-btn" disabled={!allFilled}>
						{isRecovery ? 'Verify & Reset Password' : 'Verify Email'}
					</button>
				{/if}
			</form>

			<!-- Resend -->
			<form method="POST" action="?/resend" use:enhance={() => {
				resending = true;
				return async ({ update }) => {
					resending = false;
					resendCooldown = 60;
					await update();
				};
			}}>
				<input type="hidden" name="email" value={email} />
				<input type="hidden" name="type" value={type} />
				<div class="resend-row">
					{#if resendCooldown > 0}
						<span class="resend-wait">Resend in {resendCooldown}s</span>
					{:else}
						<button type="submit" class="resend-btn" disabled={resending}>
							<RotateCcw size={14} />
							{resending ? 'Sending…' : 'Resend code'}
						</button>
					{/if}
					<span class="sep">·</span>
					<a href={isRecovery ? '/forgot-password' : '/register'} class="back-link">
						<ArrowLeft size={13} />
						{isRecovery ? 'Try another email' : 'Use another email'}
					</a>
				</div>
			</form>

			<div class="back-to-login">
				<a href="/login">Back to sign in</a>
			</div>
		</div>
	{/if}
</div>

<style>
.verify-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 2rem 1rem;
}

/* OTP Card */
.otp-card {
	position: relative;
	background: #fff;
	border-radius: 1.35rem;
	border: 1px solid #e5e7eb;
	box-shadow: 0 4px 32px rgba(79,70,229,0.08);
	padding: 2.5rem 2rem;
	width: 100%;
	max-width: 460px;
	overflow: hidden;
}
.card-glow {
	position: absolute;
	top: -80px;
	left: 50%;
	transform: translateX(-50%);
	width: 300px;
	height: 200px;
	background: radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%);
	pointer-events: none;
}
.card-header {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	margin-bottom: 1.75rem;
}
.icon-wrap {
	flex-shrink: 0;
	width: 52px;
	height: 52px;
	background: linear-gradient(135deg, #eef2ff, #e0e7ff);
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #4f46e5;
}
.card-title {
	font-size: 1.35rem;
	font-weight: 700;
	color: #111827;
	margin-bottom: 0.35rem;
	line-height: 1.3;
}
.card-sub {
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.55;
}
.countdown {
	font-weight: 700;
	color: #4f46e5;
	font-variant-numeric: tabular-nums;
}
.countdown.urgent { color: #dc2626; }

/* Error / success banners */
.error-box {
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 10px;
	padding: 0.75rem 1rem;
	color: #b91c1c;
	font-size: 0.875rem;
	margin-bottom: 1.25rem;
}
.success-box {
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 10px;
	padding: 0.75rem 1rem;
	color: #15803d;
	font-size: 0.875rem;
	margin-bottom: 1.25rem;
}

/* OTP boxes */
.otp-row {
	display: flex;
	gap: 0.625rem;
	justify-content: center;
	margin-bottom: 1.75rem;
}
.otp-slot {
	position: relative;
	width: 3.15rem;
	height: 3.15rem;
	border-radius: 0.95rem;
	background: conic-gradient(from 0deg, #6366f1, #8b5cf6, #6366f1);
	padding: 2px;
	transition: transform 0.15s;
}
.otp-slot:not(.filled) {
	background: #e5e7eb;
}
.otp-slot.filled {
	animation: slot-pop 0.35s ease-out both;
}
@keyframes slot-pop {
	0% { transform: scale(0.86); }
	60% { transform: scale(1.08); }
	100% { transform: scale(1); }
}
.otp-slot input {
	width: 100%;
	height: 100%;
	background: #fff;
	border: none;
	border-radius: 0.82rem;
	text-align: center;
	font-size: 1.45rem;
	font-weight: 700;
	color: #4f46e5;
	outline: none;
	caret-color: transparent;
	cursor: pointer;
}
.otp-slot input:focus {
	background: #fafafa;
}
.otp-slot input:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* Verifying */
.verifying-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.625rem;
	color: #6b7280;
	font-size: 0.9rem;
	padding: 0.75rem 0;
	margin-bottom: 1rem;
}
.spinner {
	width: 18px;
	height: 18px;
	border: 2.5px solid #e5e7eb;
	border-top-color: #4f46e5;
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Verify button */
.verify-btn {
	width: 100%;
	background: linear-gradient(135deg, #4f46e5, #7c3aed);
	color: #fff;
	border: none;
	border-radius: 0.875rem;
	padding: 0.875rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: opacity 0.2s, transform 0.15s;
	margin-bottom: 1.25rem;
}
.verify-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
	transform: none;
}
.verify-btn:not(:disabled):hover {
	opacity: 0.92;
	transform: translateY(-1px);
}

/* Resend row */
.resend-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	font-size: 0.85rem;
	margin-bottom: 1rem;
}
.resend-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	background: none;
	border: none;
	color: #4f46e5;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	padding: 0;
}
.resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.resend-wait { color: #9ca3af; font-size: 0.85rem; }
.sep { color: #d1d5db; }
.back-link {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	color: #6b7280;
	text-decoration: none;
	font-size: 0.85rem;
}
.back-link:hover { color: #374151; }
.back-to-login {
	text-align: center;
	font-size: 0.85rem;
}
.back-to-login a {
	color: #9ca3af;
	text-decoration: none;
}
.back-to-login a:hover { color: #6b7280; }

/* Success card */
.success-card {
	position: relative;
	background: #fff;
	border-radius: 1.35rem;
	border: 1px solid #e5e7eb;
	box-shadow: 0 4px 32px rgba(79,70,229,0.12);
	padding: 3rem 2rem;
	width: 100%;
	max-width: 420px;
	text-align: center;
	overflow: hidden;
	animation: success-in 0.35s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes success-in {
	from { opacity: 0; transform: scale(0.92); }
	to { opacity: 1; transform: scale(1); }
}
.success-glow {
	position: absolute;
	inset: 0;
	background: radial-gradient(50% 45% at 50% 48%, rgba(99,102,241,0.18) 22%, transparent 70%);
	pointer-events: none;
}
.check-badge {
	width: 5.25rem;
	height: 5.25rem;
	background: #fff;
	border-radius: 1.5rem;
	border: 1px solid #e0e7ff;
	box-shadow: 0 0 0 8px rgba(99,102,241,0.1), 0 8px 24px rgba(79,70,229,0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #4f46e5;
	margin: 0 auto 1.5rem;
	animation: check-spring 0.4s 0.12s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes check-spring {
	from { opacity: 0; transform: scale(0.7); }
	to { opacity: 1; transform: scale(1); }
}
.success-title {
	font-size: 1.75rem;
	font-weight: 700;
	color: #111827;
	margin-bottom: 0.625rem;
}
.success-sub {
	color: #6b7280;
	font-size: 0.95rem;
	line-height: 1.6;
}

@media (max-width: 480px) {
	.otp-card, .success-card { padding: 1.75rem 1.25rem; border-radius: 1.1rem; }
	.otp-slot { width: 2.75rem; height: 2.75rem; }
	.otp-slot input { font-size: 1.25rem; }
	.card-title { font-size: 1.15rem; }
}

@media (prefers-reduced-motion: reduce) {
	.otp-slot, .otp-slot.filled, .success-card, .check-badge { animation: none; }
	.otp-slot { background: #e5e7eb; }
	.otp-slot.filled { background: #4f46e5; }
}
</style>
