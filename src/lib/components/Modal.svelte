<script>
	import { X } from 'lucide-svelte';

	/** @type {{
	 *   open?: boolean,
	 *   title?: string,
	 *   size?: 'sm' | 'md' | 'lg',
	 *   onclose?: () => void,
	 *   children?: import('svelte').Snippet
	 * }} */
	let {
		open = false,
		title = '',
		size = 'md',
		onclose = () => {},
		children
	} = $props();

	const maxW = $derived(
		size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
	);

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
		onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
	>
		<div class="modal-panel {maxW}">
			{#if title}
				<div class="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-ink-100 bg-white">
					<h3 class="font-display text-lg font-bold text-ink-900">{title}</h3>
					<button type="button" class="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" onclick={onclose} aria-label="Close">
						<X size={18} />
					</button>
				</div>
			{/if}
			<div class="p-5 sm:p-6">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
