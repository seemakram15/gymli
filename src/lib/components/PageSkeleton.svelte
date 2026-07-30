<script>
	import Skeleton from './Skeleton.svelte';

	/** @type {{ variant?: 'stats' | 'table' | 'cards' | 'form' | 'detail' }} */
	let { variant = 'table' } = $props();
</script>

<div class="p-4 lg:p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<Skeleton class="h-6 w-40" />
			<Skeleton class="h-3.5 w-56" />
		</div>
		<Skeleton class="h-9 w-32 rounded-xl" />
	</div>

	{#if variant === 'stats'}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Array(4) as _}
				<div class="rounded-2xl border border-ink-100 p-4 space-y-3">
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-7 w-24" />
				</div>
			{/each}
		</div>
		<div class="grid lg:grid-cols-2 gap-4">
			{#each Array(2) as _}
				<div class="rounded-2xl border border-ink-100 p-4 space-y-3">
					<Skeleton class="h-4 w-32 mb-2" />
					{#each Array(4) as __}
						<div class="flex items-center gap-3">
							<Skeleton class="h-9 w-9 rounded-full shrink-0" />
							<div class="flex-1 space-y-2">
								<Skeleton class="h-3.5 w-2/3" />
								<Skeleton class="h-3 w-1/3" />
							</div>
							<Skeleton class="h-3.5 w-12" />
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{:else if variant === 'table'}
		<div class="rounded-2xl border border-ink-100 overflow-hidden">
			<div class="p-4 border-b border-ink-100 flex gap-3">
				<Skeleton class="h-9 flex-1 max-w-xs rounded-xl" />
				<Skeleton class="h-9 w-28 rounded-xl" />
				<Skeleton class="h-9 w-28 rounded-xl" />
			</div>
			{#each Array(8) as _}
				<div class="flex items-center gap-4 px-4 py-3.5 border-b border-ink-50 last:border-0">
					<Skeleton class="h-9 w-9 rounded-full shrink-0" />
					<Skeleton class="h-3.5 w-36" />
					<Skeleton class="h-3.5 w-24 hidden sm:block" />
					<Skeleton class="h-3.5 w-20 hidden md:block" />
					<Skeleton class="h-6 w-16 rounded-full ml-auto" />
				</div>
			{/each}
		</div>
	{:else if variant === 'cards'}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(6) as _}
				<div class="rounded-2xl border border-ink-100 p-5 space-y-3">
					<Skeleton class="h-10 w-10 rounded-xl" />
					<Skeleton class="h-4 w-2/3" />
					<Skeleton class="h-3 w-1/2" />
					<Skeleton class="h-3 w-full" />
				</div>
			{/each}
		</div>
	{:else if variant === 'form'}
		<div class="max-w-2xl rounded-2xl border border-ink-100 p-6 space-y-5">
			{#each Array(5) as _}
				<div class="space-y-2">
					<Skeleton class="h-3 w-24" />
					<Skeleton class="h-10 w-full rounded-xl" />
				</div>
			{/each}
			<Skeleton class="h-10 w-32 rounded-xl" />
		</div>
	{:else if variant === 'detail'}
		<div class="grid lg:grid-cols-3 gap-6">
			<div class="lg:col-span-1 rounded-2xl border border-ink-100 p-6 space-y-4 text-center">
				<Skeleton class="h-20 w-20 rounded-full mx-auto" />
				<Skeleton class="h-4 w-32 mx-auto" />
				<Skeleton class="h-3 w-24 mx-auto" />
			</div>
			<div class="lg:col-span-2 space-y-4">
				{#each Array(3) as _}
					<div class="rounded-2xl border border-ink-100 p-4 space-y-3">
						<Skeleton class="h-4 w-28" />
						<Skeleton class="h-3.5 w-full" />
						<Skeleton class="h-3.5 w-4/5" />
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
