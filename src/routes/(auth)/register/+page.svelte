<script>
	import { enhance } from '$app/forms';
	import { Eye, EyeOff, User, Building2, Mail, Phone, MapPin, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-svelte';

	let showPass = $state(false);
	let loading  = $state(false);
	let { form } = $props();
</script>

<svelte:head><title>Create Account — GymLi</title></svelte:head>

<div class="mb-7">
	<h1 class="text-2xl font-extrabold text-gray-900 mb-1">Create your account 🏋️</h1>
	<p class="text-gray-500 text-sm">Start managing your gym for free — no card needed</p>
</div>

{#if form?.error}
	<div class="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3.5 text-sm mb-5">
		<AlertCircle size={16} class="shrink-0 mt-0.5"/> {form.error}
	</div>
{/if}
{#if form?.success}
	<div class="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl px-4 py-3.5 text-sm mb-5">
		<CheckCircle size={16} class="shrink-0 mt-0.5"/>
		Account created! Check your email to verify, then sign in.
	</div>
{/if}

<form method="POST" use:enhance={() => {
	loading = true;
	return async ({ update }) => { await update(); loading = false; };
}} class="space-y-4">

	<div class="grid sm:grid-cols-2 gap-4">
		<div>
			<label class="label" for="full_name">Your Name</label>
			<div class="input-group">
				<span class="ig-icon"><User size={15}/></span>
				<input id="full_name" name="full_name" type="text"
					placeholder="Muhammad Ali" required value={form?.full_name ?? ''}/>
			</div>
		</div>
		<div>
			<label class="label" for="gym_name">Gym Name</label>
			<div class="input-group">
				<span class="ig-icon"><Building2 size={15}/></span>
				<input id="gym_name" name="gym_name" type="text"
					placeholder="Power Zone Gym" required value={form?.gym_name ?? ''}/>
			</div>
		</div>
	</div>

	<div>
		<label class="label" for="email">Email Address</label>
		<div class="input-group">
			<span class="ig-icon"><Mail size={15}/></span>
			<input id="email" name="email" type="email"
				placeholder="owner@mygym.com" required autocomplete="email" value={form?.email ?? ''}/>
		</div>
	</div>

	<div class="grid sm:grid-cols-2 gap-4">
		<div>
			<label class="label" for="phone">Phone Number</label>
			<div class="input-group">
				<span class="ig-icon"><Phone size={15}/></span>
				<input id="phone" name="phone" type="tel"
					placeholder="+92 300 0000000" required value={form?.phone ?? ''}/>
			</div>
		</div>
		<div>
			<label class="label" for="city">City</label>
			<div class="input-group">
				<span class="ig-icon"><MapPin size={15}/></span>
				<input id="city" name="city" type="text"
					placeholder="Lahore" required value={form?.city ?? ''}/>
			</div>
		</div>
	</div>

	<div>
		<label class="label" for="password">Password</label>
		<div class="input-group">
			<span class="ig-icon"><Lock size={15}/></span>
			<input id="password" name="password" type={showPass ? 'text' : 'password'}
				placeholder="Min 8 characters" required minlength="8"/>
			<button type="button" class="ig-action" onclick={() => showPass = !showPass}
				aria-label={showPass ? 'Hide password' : 'Show password'}>
				{#if showPass}<EyeOff size={16}/>{:else}<Eye size={16}/>{/if}
			</button>
		</div>
	</div>

	<button type="submit" disabled={loading}
		class="btn btn-primary w-full justify-center py-3 text-base mt-1"
		style="background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 4px 16px rgba(99,102,241,0.35);">
		{#if loading}
			<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
			Creating account…
		{:else}
			Create Account <ArrowRight size={18}/>
		{/if}
	</button>

	<p class="text-xs text-gray-400 text-center">
		By signing up you agree to our Terms of Service and Privacy Policy.
	</p>
</form>

<div class="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
	Already have an account?
	<a href="/login" class="text-brand-600 hover:text-brand-700 font-semibold ml-1">Sign in →</a>
</div>
