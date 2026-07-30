<script>
	import { ChevronDown, Check } from 'lucide-svelte';

	/**
	 * @typedef {{ value: string, label: string }} Option
	 */

	/** @type {{
	 *   name?: string,
	 *   id?: string,
	 *   options: Option[],
	 *   value?: string,
	 *   placeholder?: string,
	 *   required?: boolean,
	 *   disabled?: boolean,
	 *   onchange?: (value: string) => void
	 * }} */
	let {
		name = '',
		id = '',
		options = [],
		value = $bindable(''),
		placeholder = 'Select…',
		required = false,
		disabled = false,
		onchange = undefined
	} = $props();

	let open = $state(false);
	let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));

	const selected = $derived(options.find((o) => o.value === value));

	function toggle() {
		if (disabled) return;
		open = !open;
	}

	/** @param {Option} opt */
	function pick(opt) {
		value = opt.value;
		open = false;
		onchange?.(opt.value);
	}

	/** @param {MouseEvent} e */
	function onDocClick(e) {
		if (!open || !rootEl) return;
		if (!rootEl.contains(/** @type {Node} */ (e.target))) open = false;
	}

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onDocClick} onkeydown={onKey} />

<div class="relative" bind:this={rootEl}>
	{#if name}
		<input type="hidden" {name} {value} {required} />
	{/if}

	<button
		type="button"
		{id}
		{disabled}
		onclick={toggle}
		aria-haspopup="listbox"
		aria-expanded={open}
		class="input flex items-center justify-between gap-2 text-left cursor-pointer
			{disabled ? 'opacity-50 cursor-not-allowed' : ''}
			{open ? 'border-ink-800' : ''}"
		style={open ? 'box-shadow: 0 0 0 3px rgba(180, 239, 42, 0.25)' : ''}
	>
		<span class={selected ? 'text-ink-900' : 'text-ink-400'}>
			{selected?.label ?? placeholder}
		</span>
		<ChevronDown size={16} class="text-ink-400 shrink-0 transition-transform {open ? 'rotate-180' : ''}" />
	</button>

	{#if open}
		<ul
			role="listbox"
			class="absolute z-40 mt-1.5 w-full max-h-60 overflow-auto rounded-xl border border-ink-200 bg-white py-1.5 shadow-lg shadow-ink-900/10"
		>
			{#each options as opt}
				<li role="option" aria-selected={opt.value === value}>
					<button
						type="button"
						class="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors
							{opt.value === value ? 'bg-volt-50 text-ink-900 font-semibold' : 'text-ink-700 hover:bg-ink-50'}"
						onclick={() => pick(opt)}
					>
						{opt.label}
						{#if opt.value === value}<Check size={14} class="text-volt-700" />{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
