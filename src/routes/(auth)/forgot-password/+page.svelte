<script>
	import { enhance } from '$app/forms';
	import { Mail, ArrowLeft, AlertCircle, KeyRound } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password — GymLi</title>
</svelte:head>

<div class="mb-7">
	<div class="flex items-center gap-3 mb-1">
		<span class="w-9 h-9 rounded-xl bg-ink-900 text-volt-300 flex items-center justify-center shrink-0">
			<KeyRound size={18} />
		</span>
		<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Forgot password?</h1>
	</div>
	<p class="text-ink-500 text-sm mt-1.5 pl-12">Enter your email and we'll send a 6-digit reset code.</p>
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
		<label class="label" for="email">Email address</label>
		<div class="input-group">
			<span class="ig-icon"><Mail size={16} /></span>
			<input
				id="email"
				name="email"
				type="email"
				placeholder="owner@mygym.com"
				required
				autocomplete="email"
				value={form?.email ?? ''}
			/>
		</div>
	</div>

	<button type="submit" disabled={loading} class="btn btn-primary w-full justify-center py-3 text-base">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-volt-300 rounded-full animate-spin"></span>
			Sending code…
		{:else}
			Send reset code
		{/if}
	</button>
</form>

<div class="mt-8 pt-6 border-t border-ink-100 text-center text-sm text-ink-500">
	<a href="/login" class="inline-flex items-center gap-1 text-ink-900 hover:text-volt-700 font-semibold">
		<ArrowLeft size={14} /> Back to sign in
	</a>
</div>
