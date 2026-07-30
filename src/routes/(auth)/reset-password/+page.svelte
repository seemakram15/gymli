<script>
	import { enhance } from '$app/forms';
	import { Lock, Eye, EyeOff } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);
	let showPass = $state(false);
	let showConfirm = $state(false);
</script>

<svelte:head>
	<title>Set New Password · GymLi</title>
</svelte:head>

<div class="rp-wrap">
	<div class="rp-card">
		<div class="rp-glow"></div>

		<div class="rp-icon">
			<Lock size={26} />
		</div>

		<h1 class="rp-title">Set a new password</h1>
		<p class="rp-sub">Choose a strong password for your GymLi account.</p>

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
			<div class="field-label">New password</div>
			<div class="input-group" style="margin-bottom:1rem">
				<span class="ig-icon"><Lock size={16} /></span>
				<input
					type={showPass ? 'text' : 'password'}
					name="password"
					placeholder="At least 8 characters"
					required
					minlength="8"
					autocomplete="new-password"
				/>
				<button type="button" class="ig-action" onclick={() => showPass = !showPass} aria-label="Toggle password">
					{#if showPass}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
				</button>
			</div>

			<div class="field-label">Confirm password</div>
			<div class="input-group">
				<span class="ig-icon"><Lock size={16} /></span>
				<input
					type={showConfirm ? 'text' : 'password'}
					name="confirm"
					placeholder="Repeat your password"
					required
					autocomplete="new-password"
				/>
				<button type="button" class="ig-action" onclick={() => showConfirm = !showConfirm} aria-label="Toggle confirm">
					{#if showConfirm}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
				</button>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{#if loading}
					<span class="btn-spinner"></span> Saving…
				{:else}
					Save new password
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
.rp-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 2rem 1rem;
}
.rp-card {
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
.rp-glow {
	position: absolute;
	top: -80px;
	left: 50%;
	transform: translateX(-50%);
	width: 280px;
	height: 180px;
	background: radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%);
	pointer-events: none;
}
.rp-icon {
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
.rp-title {
	font-size: 1.5rem;
	font-weight: 700;
	color: #111827;
	margin-bottom: 0.5rem;
}
.rp-sub {
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
	margin-top: 1.5rem;
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
</style>
