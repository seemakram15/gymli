<script>
	import { enhance } from '$app/forms';
	import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-svelte';

	let { form } = $props();
	let loading    = $state(false);
	let showPass   = $state(false);
	let showConfirm = $state(false);
</script>

<svelte:head>
	<title>Set New Password — GymLi</title>
</svelte:head>

<div class="mb-7">
	<div class="flex items-center gap-3 mb-1">
		<span class="w-9 h-9 rounded-xl bg-ink-900 text-volt-300 flex items-center justify-center shrink-0">
			<ShieldCheck size={18} />
		</span>
		<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Set new password</h1>
	</div>
	<p class="text-ink-500 text-sm mt-1.5 pl-12">Choose a strong password for your GymLi account.</p>
</div>

{#if form?.error}
	<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-5">
		<AlertCircle size={16} class="shrink-0 mt-0.5" /> {form.error}
	</div>
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
	class="space-y-5"
>
	<div>
		<label class="label" for="password">New password</label>
		<div class="input-group">
			<span class="ig-icon"><Lock size={16} /></span>
			<input
				id="password"
				name="password"
				type={showPass ? 'text' : 'password'}
				placeholder="At least 8 characters"
				required
				minlength="8"
				autocomplete="new-password"
			/>
			<button type="button" class="ig-action" onclick={() => showPass = !showPass} aria-label="Toggle password">
				{#if showPass}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
			</button>
		</div>
	</div>

	<div>
		<label class="label" for="confirm">Confirm password</label>
		<div class="input-group">
			<span class="ig-icon"><Lock size={16} /></span>
			<input
				id="confirm"
				name="confirm"
				type={showConfirm ? 'text' : 'password'}
				placeholder="Repeat your password"
				required
				autocomplete="new-password"
			/>
			<button type="button" class="ig-action" onclick={() => showConfirm = !showConfirm} aria-label="Toggle confirm">
				{#if showConfirm}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
			</button>
		</div>
	</div>

	<button type="submit" disabled={loading} class="btn btn-primary w-full justify-center py-3 text-base">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-volt-300 rounded-full animate-spin"></span>
			Saving…
		{:else}
			Save new password
		{/if}
	</button>
</form>
