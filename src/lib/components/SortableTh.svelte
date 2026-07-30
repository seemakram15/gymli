<script>
	import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';

	/** @type {{ label: string, active?: boolean, dir?: 'asc' | 'desc', onclick: () => void, class?: string }} */
	let { label, active = false, dir = 'asc', onclick, class: className = '' } = $props();
</script>

<th class={className}>
	<button type="button" {onclick} class="flex items-center gap-1 font-inherit text-inherit hover:text-ink-900 transition-colors">
		{label}
		{#if active}
			{#if dir === 'asc'}<ChevronUp size={13} />{:else}<ChevronDown size={13} />{/if}
		{:else}
			<ChevronsUpDown size={13} class="text-ink-300" />
		{/if}
	</button>
</th>
