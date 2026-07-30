<script>
	import { enhance } from '$app/forms';
	import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-svelte';

	let showPass = $state(false);
	let loading  = $state(false);
	let { form } = $props();
</script>

<svelte:head><title>Sign In — GymLi</title></svelte:head>

<div class="mb-8">
	<h1 class="text-2xl font-extrabold text-gray-900 mb-1">Welcome back 👋</h1>
	<p class="text-gray-500 text-sm">Sign in to your GymLi account</p>
</div>

{#if form?.error}
	<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3.5 text-sm mb-6">
		<AlertCircle size={16} class="shrink-0 mt-0.5"/> {form.error}
	</div>
{/if}

<form method="POST" use:enhance={() => {
	loading = true;
	return async ({ update }) => { await update(); loading = false; };
}} class="space-y-5">

	<div>
		<label class="label" for="email">Email Address</label>
		<div class="input-group">
			<span class="ig-icon"><Mail size={16}/></span>
			<input id="email" name="email" type="email"
				placeholder="owner@mygym.com" required autocomplete="email"
				value={form?.email ?? ''} />
		</div>
	</div>

	<div>
		<div class="flex items-center justify-between mb-1.5">
			<label class="label !mb-0" for="password">Password</label>
			<a href="/forgot-password" class="text-xs text-brand-600 hover:text-brand-700 font-medium">Forgot password?</a>
		</div>
		<div class="input-group">
			<span class="ig-icon"><Lock size={16}/></span>
			<input id="password" name="password" type={showPass ? 'text' : 'password'}
				placeholder="••••••••" required autocomplete="current-password"/>
			<button type="button" class="ig-action" onclick={() => showPass = !showPass}
				aria-label={showPass ? 'Hide password' : 'Show password'}>
				{#if showPass}<EyeOff size={16}/>{:else}<Eye size={16}/>{/if}
			</button>
		</div>
	</div>

	<label class="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
		<input type="checkbox" name="remember"
			class="w-4 h-4 rounded border-gray-300 accent-brand-600"/>
		Keep me signed in
	</label>

	<button type="submit" disabled={loading}
		class="btn btn-primary w-full justify-center py-3 text-base"
		style="background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 4px 16px rgba(99,102,241,0.35);">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
			Signing in…
		{:else}
			Sign In <ArrowRight size={18}/>
		{/if}
	</button>
</form>

<div class="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
	Don't have an account?
	<a href="/register" class="text-brand-600 hover:text-brand-700 font-semibold ml-1">Create one free →</a>
</div>
