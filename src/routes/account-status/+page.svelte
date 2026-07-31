<script>
	import { Clock, ShieldAlert, PartyPopper, LogOut, ArrowRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase.js';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();
	const supabase = createClient();

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}

	const revoked = $derived(['suspended', 'inactive', 'frozen'].includes(data.status));
</script>

<svelte:head><title>Account Status — GymLi</title></svelte:head>

<div class="min-h-screen bg-ink-950 flex flex-col">
	<nav class="px-4 sm:px-6 py-4 sm:py-5">
		<div class="max-w-2xl mx-auto flex items-center justify-between">
			<Logo theme="dark" iconClass="w-8 h-8 sm:w-9 sm:h-9" textClass="text-2xl sm:text-3xl" />
			<button onclick={signOut} class="btn btn-sm text-white/85 hover:text-white hover:bg-white/10 gap-1.5">
				<LogOut size={14} /> Sign out
			</button>
		</div>
	</nav>

	<div class="flex-1 flex items-center justify-center px-4 py-10">
		<div class="w-full max-w-md bg-white rounded-2xl border border-ink-100 p-8 sm:p-10 text-center shadow-2xl">

			{#if !data.isOwner}
				<div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
					<Clock size={22} />
				</div>
				<h1 class="font-display text-xl font-bold text-ink-900">Access not yet active</h1>
				<p class="mt-2 text-sm text-ink-500">
					Your gym owner's GymLi account isn't active right now. Please check with them — they may need to complete or renew their subscription.
				</p>
			{:else if revoked}
				<div class="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
					<ShieldAlert size={22} />
				</div>
				<h1 class="font-display text-xl font-bold text-ink-900">Access revoked</h1>
				<p class="mt-2 text-sm text-ink-500">Your GymLi account access has been paused. Contact us if you believe this is a mistake.</p>
				<a href="/contact" class="btn btn-primary mt-6 gap-2">Contact us <ArrowRight size={16} /></a>
			{:else if data.latestRequest?.status === 'pending'}
				<div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
					<Clock size={22} />
				</div>
				<h1 class="font-display text-xl font-bold text-ink-900">Your request is under review</h1>
				<p class="mt-2 text-sm text-ink-500">
					We've received your <span class="font-semibold capitalize">{data.latestRequest.plan}</span> plan request and receipt. You'll get an email as soon as it's verified.
				</p>
			{:else if data.latestRequest?.status === 'rejected'}
				<div class="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
					<ShieldAlert size={22} />
				</div>
				<h1 class="font-display text-xl font-bold text-ink-900">Your last request wasn't approved</h1>
				<p class="mt-2 text-sm text-ink-500">We couldn't verify your last payment. Please submit a new request with a valid receipt.</p>
				<a href="/choose-plan" class="btn btn-primary mt-6 gap-2">Choose a plan <ArrowRight size={16} /></a>
			{:else}
				<div class="w-14 h-14 rounded-2xl bg-volt-100 text-volt-800 flex items-center justify-center mx-auto mb-4">
					<PartyPopper size={22} />
				</div>
				<h1 class="font-display text-xl font-bold text-ink-900">Let's get you set up</h1>
				<p class="mt-2 text-sm text-ink-500">Choose a plan to activate your GymLi account.</p>
				<a href="/choose-plan" class="btn btn-primary mt-6 gap-2">Choose a plan <ArrowRight size={16} /></a>
			{/if}
		</div>
	</div>
</div>
