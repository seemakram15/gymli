<script>
	import { enhance } from '$app/forms';
	import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-svelte';

	let showPass = $state(false);
	let loading = $state(false);
	let { form } = $props();
</script>

<svelte:head><title>Sign In — GymLi</title></svelte:head>

<div class="mb-7">
	<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Welcome back</h1>
	<p class="text-ink-500 text-sm mt-1.5">Sign in to your GymLi dashboard</p>
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
			await update();
			loading = false;
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

	<div>
		<div class="flex items-center justify-between mb-1.5">
			<label class="label !mb-0" for="password">Password</label>
			<a href="/forgot-password" class="text-xs text-brand-600 hover:underline font-medium">Forgot password?</a>
		</div>
		<div class="input-group">
			<span class="ig-icon"><Lock size={16} /></span>
			<input
				id="password"
				name="password"
				type={showPass ? 'text' : 'password'}
				placeholder="••••••••"
				required
				autocomplete="current-password"
			/>
			<button
				type="button"
				class="ig-action"
				onclick={() => (showPass = !showPass)}
				aria-label={showPass ? 'Hide password' : 'Show password'}
			>
				{#if showPass}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
			</button>
		</div>
	</div>

	<label class="flex items-center gap-2.5 text-sm text-ink-600 cursor-pointer select-none">
		<input type="checkbox" name="remember" class="w-4 h-4 rounded border-ink-300 accent-ink-900" />
		Keep me signed in
	</label>

	<button type="submit" disabled={loading} class="btn btn-primary w-full justify-center py-3 text-base">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-volt-300 rounded-full animate-spin"></span>
			Signing in…
		{:else}
			Sign in <ArrowRight size={18} />
		{/if}
	</button>
</form>

<div class="mt-8 pt-6 border-t border-ink-100 text-center text-sm text-ink-500">
	Don't have an account?
	<a href="/register" class="text-ink-900 hover:text-volt-700 font-semibold ml-1">Create one free →</a>
</div>
