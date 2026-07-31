<script>
	import { enhance } from '$app/forms';
	import {
		Eye, EyeOff, User, Mail, Phone, MapPin, Lock,
		ArrowRight, AlertCircle, CheckCircle
	} from 'lucide-svelte';

	let showPass = $state(false);
	let loading = $state(false);
	let { form } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	const passwordMismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);
</script>

<svelte:head><title>Create Account — GymLi</title></svelte:head>

<div class="mb-6">
	<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Create your account</h1>
	<p class="text-ink-500 text-sm mt-1.5">Start managing your gym — free, no card needed</p>
</div>

{#if form?.error}
	<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-5">
		<AlertCircle size={16} class="shrink-0 mt-0.5" /> {form.error}
	</div>
{/if}
{#if form?.success}
	<div class="flex items-start gap-3 bg-volt-50 border border-volt-200 text-volt-800 rounded-xl px-4 py-3.5 text-sm mb-5">
		<CheckCircle size={16} class="shrink-0 mt-0.5" />
		Account created! Check your email to verify, then sign in.
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
	class="space-y-4"
>
	<div>
		<label class="label" for="full_name">Your name</label>
		<div class="input-group">
			<span class="ig-icon"><User size={15} /></span>
			<input id="full_name" name="full_name" type="text" placeholder="Muhammad Ali" required value={form?.full_name ?? ''} />
		</div>
	</div>

	<div>
		<label class="label" for="email">Email address</label>
		<div class="input-group">
			<span class="ig-icon"><Mail size={15} /></span>
			<input id="email" name="email" type="email" placeholder="owner@mygym.com" required autocomplete="email" value={form?.email ?? ''} />
		</div>
	</div>

	<div class="grid sm:grid-cols-2 gap-4">
		<div>
			<label class="label" for="phone">Phone number</label>
			<div class="input-group">
				<span class="ig-icon"><Phone size={15} /></span>
				<input id="phone" name="phone" type="tel" placeholder="+92 300 0000000" required value={form?.phone ?? ''} />
			</div>
		</div>
		<div>
			<label class="label" for="city">City</label>
			<div class="input-group">
				<span class="ig-icon"><MapPin size={15} /></span>
				<input id="city" name="city" type="text" placeholder="Lahore" required value={form?.city ?? ''} />
			</div>
		</div>
	</div>

	<div class="grid sm:grid-cols-2 gap-4">
		<div>
			<label class="label" for="password">Password</label>
			<div class="input-group">
				<span class="ig-icon"><Lock size={15} /></span>
				<input
					id="password"
					name="password"
					type={showPass ? 'text' : 'password'}
					placeholder="Min 8 characters"
					required
					minlength="8"
					autocomplete="new-password"
					bind:value={password}
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
		<div>
			<label class="label" for="confirm_password">Confirm password</label>
			<div class="input-group">
				<span class="ig-icon"><Lock size={15} /></span>
				<input
					id="confirm_password"
					name="confirm_password"
					type={showPass ? 'text' : 'password'}
					placeholder="Re-enter password"
					required
					minlength="8"
					autocomplete="new-password"
					bind:value={confirmPassword}
				/>
			</div>
		</div>
	</div>
	{#if passwordMismatch}
		<p class="text-xs text-red-600 -mt-2">Passwords do not match.</p>
	{/if}

	<button type="submit" disabled={loading || passwordMismatch} class="btn btn-primary w-full justify-center py-3 text-base mt-1">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-volt-300 rounded-full animate-spin"></span>
			Creating account…
		{:else}
			Create account <ArrowRight size={18} />
		{/if}
	</button>

	<p class="text-xs text-ink-400 text-center">
		By signing up you agree to our Terms of Service and Privacy Policy.
	</p>
</form>

<div class="mt-6 pt-6 border-t border-ink-100 text-center text-sm text-ink-500">
	Already have an account?
	<a href="/login" class="text-ink-900 hover:text-volt-700 font-semibold ml-1">Sign in →</a>
</div>
