<script>
	import { invalidateAll } from '$app/navigation';
	import { KeyRound } from 'lucide-svelte';

	let { data } = $props();
	let remaining = $state(0);

	function updateRemaining() {
		if (!data.expiresAt) return;
		remaining = Math.max(0, Math.round((new Date(data.expiresAt) - new Date()) / 1000));
		if (remaining <= 0) invalidateAll();
	}

	$effect(() => {
		updateRemaining();
		const interval = setInterval(updateRemaining, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head><title>Check-in Code — GymLi</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-ink-50">
	<div class="card card-body text-center max-w-sm w-full space-y-5">
		<div class="w-14 h-14 mx-auto rounded-2xl bg-ink-900 text-volt-300 flex items-center justify-center">
			<KeyRound size={22} />
		</div>
		<div>
			<h1 class="font-display text-lg font-bold text-ink-900">Hi {data.fullName ?? 'there'}</h1>
			<p class="text-ink-500 text-sm mt-1">Show this code to the front desk to check in</p>
		</div>

		{#if data.code}
			<div class="text-5xl font-black tracking-[0.2em] text-ink-900 font-mono py-2">{data.code}</div>
			<p class="text-xs text-ink-400">Refreshes in {remaining}s</p>
		{:else}
			<p class="text-sm text-red-600">Could not generate a code right now. Try refreshing the page.</p>
		{/if}
	</div>
</div>
