<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { ShieldCheck, RotateCcw, ArrowLeft, AlertCircle, Check } from 'lucide-svelte';

	let { form } = $props();

	const email = $derived($page.url.searchParams.get('email') || '');
	const type  = $derived($page.url.searchParams.get('type') || 'signup');
	const isRecovery = $derived(type === 'recovery');

	let digits        = $state(['', '', '', '', '', '']);
	let inputs        = $state([]);
	let phase         = $state('enter'); // enter | verifying | success
	let countdown     = $state(600);
	let resendCooldown = $state(0);
	let resending     = $state(false);

	const token    = $derived(digits.join(''));
	const allFilled = $derived(token.length === 6);

	$effect(() => {
		const t = setInterval(() => { if (countdown > 0) countdown--; }, 1000);
		return () => clearInterval(t);
	});

	$effect(() => {
		if (resendCooldown <= 0) return;
		const t = setInterval(() => { resendCooldown = Math.max(0, resendCooldown - 1); }, 1000);
		return () => clearInterval(t);
	});

	const mins = $derived(Math.floor(countdown / 60));
	const secs = $derived(countdown % 60);
	const countdownStr = $derived(`${mins}:${secs.toString().padStart(2, '0')}`);
	const isUrgent = $derived(countdown <= 60 && countdown > 0);
	const isExpired = $derived(countdown === 0);

	function onInput(i, e) {
		const val = e.target.value.replace(/\D/g, '').slice(-1);
		digits[i] = val;
		if (val && i < 5) inputs[i + 1]?.focus();
		if (digits.every(d => d !== '')) submitOtp();
	}

	function onKeydown(i, e) {
		if (e.key === 'Backspace' && !digits[i] && i > 0) inputs[i - 1]?.focus();
		if (e.key === 'ArrowLeft'  && i > 0) inputs[i - 1]?.focus();
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
</script>

<svelte:head>
	<title>{isRecovery ? 'Reset Password' : 'Verify Email'} — GymLi</title>
</svelte:head>

{#if phase === 'success'}
	<!-- ── Success state ── -->
	<div class="flex flex-col items-center text-center py-4">
		<div class="w-16 h-16 rounded-2xl bg-volt-400 text-ink-950 flex items-center justify-center mb-5 shadow-lg" style="animation: check-in .4s cubic-bezier(.34,1.56,.64,1) both">
			<Check size={32} strokeWidth={2.5} />
		</div>
		<h1 class="font-display text-2xl font-extrabold text-ink-900 mb-2">Verified!</h1>
		<p class="text-ink-500 text-sm leading-relaxed">
			{isRecovery ? 'Opening password reset…' : 'You\'re verified. Taking you to your dashboard…'}
		</p>
	</div>
{:else}
	<!-- ── Header ── -->
	<div class="mb-6">
		<div class="flex items-center gap-3 mb-1">
			<span class="w-9 h-9 rounded-xl bg-ink-900 text-volt-300 flex items-center justify-center shrink-0">
				<ShieldCheck size={18} />
			</span>
			<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
				{isRecovery ? 'Enter reset code' : 'Verify your email'}
			</h1>
		</div>
		<p class="text-ink-500 text-sm mt-1 leading-relaxed pl-12">
			A 6-digit code was sent to <strong class="text-ink-700">{email}</strong>
		</p>
	</div>

	<!-- ── Countdown (centred, bold) ── -->
	<div class="flex flex-col items-center mb-6 py-4 border-y border-ink-100">
		<span class="text-xs text-ink-400 uppercase tracking-widest font-semibold mb-1">Code expires in</span>
		<span class="font-display text-4xl font-extrabold tabular-nums {isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-ink-900'}">
			{countdownStr}
		</span>
		{#if isExpired}
			<span class="text-xs text-red-500 mt-1 font-medium">Code expired — please resend</span>
		{/if}
	</div>

	<!-- ── Error / success banners ── -->
	{#if form?.error}
		<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-5">
			<AlertCircle size={16} class="shrink-0 mt-0.5" /> {form.error}
		</div>
	{/if}
	{#if form?.resent}
		<div class="flex items-center gap-2 bg-volt-50 border border-volt-200 text-volt-800 rounded-xl px-4 py-3.5 text-sm mb-5">
			<Check size={15} class="shrink-0" /> New code sent to {email}
		</div>
	{/if}
	{#if form?.resendError}
		<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-5">
			<AlertCircle size={16} class="shrink-0 mt-0.5" /> {form.resendError}
		</div>
	{/if}

	<!-- ── OTP boxes ── -->
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
		<input type="hidden" name="type"  value={type} />

		<div class="flex gap-2 sm:gap-3 justify-center mb-6" onpaste={onPaste}>
			{#each digits as digit, i}
				<div class="otp-slot" class:filled={digit !== ''}>
					<input
						bind:this={inputs[i]}
						type="text"
						inputmode="numeric"
						maxlength="1"
						autocomplete="one-time-code"
						value={digit}
						oninput={(e) => onInput(i, e)}
						onkeydown={(e) => onKeydown(i, e)}
						disabled={phase === 'verifying' || isExpired}
						aria-label="Digit {i + 1}"
					/>
				</div>
			{/each}
		</div>

		{#if phase === 'verifying'}
			<button type="button" disabled class="btn btn-primary w-full justify-center py-3 text-base">
				<span class="w-4 h-4 border-2 border-volt-400/30 border-t-volt-300 rounded-full animate-spin"></span>
				Verifying…
			</button>
		{:else}
			<button type="submit" disabled={!allFilled || isExpired} class="btn btn-primary w-full justify-center py-3 text-base">
				{isRecovery ? 'Verify & Reset Password' : 'Verify Email'}
			</button>
		{/if}
	</form>

	<!-- ── Resend + back links ── -->
	<form method="POST" action="?/resend" use:enhance={() => {
		resending = true;
		return async ({ update }) => {
			resending = false;
			resendCooldown = 60;
			countdown = 600;
			await update();
		};
	}} class="mt-5 flex items-center justify-center gap-4 text-sm">
		<input type="hidden" name="email" value={email} />
		<input type="hidden" name="type"  value={type} />
		{#if resendCooldown > 0}
			<span class="text-ink-400">Resend in {resendCooldown}s</span>
		{:else}
			<button type="submit" disabled={resending} class="inline-flex items-center gap-1.5 text-ink-700 font-semibold hover:text-ink-900 transition-colors disabled:opacity-50">
				<RotateCcw size={13} /> {resending ? 'Sending…' : 'Resend code'}
			</button>
		{/if}
		<span class="text-ink-200">|</span>
		<a href={isRecovery ? '/forgot-password' : '/register'} class="inline-flex items-center gap-1 text-ink-500 hover:text-ink-700 transition-colors">
			<ArrowLeft size={13} /> {isRecovery ? 'Try another email' : 'Use another email'}
		</a>
	</form>

	<div class="mt-6 pt-5 border-t border-ink-100 text-center text-sm text-ink-500">
		<a href="/login" class="text-ink-900 hover:text-volt-700 font-semibold">← Back to sign in</a>
	</div>
{/if}

<style>
/* OTP box: matches the input-group design language */
.otp-slot {
	flex: 1;
	min-width: 0;
	max-width: 3.25rem;
	height: 3.5rem;
}
.otp-slot input {
	width: 100%;
	height: 100%;
	border: 1.5px solid #e8e8e4; /* ink-100 */
	border-radius: 0.75rem;
	background: #f4f4f2; /* ink-50 */
	text-align: center;
	font-size: 1.5rem;
	font-weight: 800;
	color: #11110f; /* ink-900 */
	outline: none;
	caret-color: transparent;
	transition: border-color .15s, box-shadow .15s, background .15s;
	font-family: var(--font-family-display, 'Syne', sans-serif);
}
.otp-slot input:focus {
	border-color: #11110f; /* ink-900 */
	background: #fff;
	box-shadow: 0 0 0 3px rgba(180, 239, 42, 0.3); /* volt glow */
}
.otp-slot.filled input {
	border-color: #11110f;
	background: #fff;
}
.otp-slot input:disabled {
	opacity: 0.45;
	cursor: not-allowed;
}
@keyframes check-in {
	from { opacity: 0; transform: scale(0.7); }
	to   { opacity: 1; transform: scale(1); }
}
</style>
