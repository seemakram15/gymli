<script>
	import { ChevronDown, Check, Search } from 'lucide-svelte';

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
	 *   searchable?: boolean,
	 *   searchPlaceholder?: string,
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
		searchable = false,
		searchPlaceholder = 'Search…',
		onchange = undefined
	} = $props();

	let open = $state(false);
	let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));
	let btnEl = $state(/** @type {HTMLButtonElement | null} */ (null));
	let searchEl = $state(/** @type {HTMLInputElement | null} */ (null));
	let menuPos = $state({ top: 0, left: 0, width: 0, openUp: false });
	let query = $state('');

	const selected = $derived(options.find((o) => o.value === value));
	const filteredOptions = $derived(
		searchable && query.trim()
			? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
			: options
	);

	function positionMenu() {
		if (!btnEl) return;
		const rect = btnEl.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const openUp = spaceBelow < 260 && rect.top > spaceBelow;
		menuPos = {
			top: openUp ? rect.top : rect.bottom,
			left: rect.left,
			width: rect.width,
			openUp
		};
	}

	function toggle() {
		if (disabled) return;
		if (!open) {
			positionMenu();
			query = '';
			if (searchable) queueMicrotask(() => searchEl?.focus());
		}
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
		const target = /** @type {Node} */ (e.target);
		if (!rootEl.contains(target) && !menuEl?.contains(target)) open = false;
	}

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') open = false;
	}

	function onScrollOrResize() {
		if (open) open = false;
	}

	let menuEl = $state(/** @type {HTMLUListElement | null} */ (null));

	$effect(() => {
		if (!open) return;
		// capture:true so scrolling inside a modal's scroll container (which doesn't bubble) still closes the menu
		window.addEventListener('scroll', onScrollOrResize, true);
		return () => window.removeEventListener('scroll', onScrollOrResize, true);
	});
</script>

<svelte:window onclick={onDocClick} onkeydown={onKey} onresize={onScrollOrResize} />

<div class="relative" bind:this={rootEl}>
	{#if name}
		<input type="hidden" {name} {value} {required} />
	{/if}

	<button
		type="button"
		{id}
		{disabled}
		bind:this={btnEl}
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
		<div
			bind:this={menuEl}
			class="fixed z-[60] max-h-72 flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg shadow-ink-900/10"
			style="top: {menuPos.top}px; left: {menuPos.left}px; width: {menuPos.width}px; {menuPos.openUp ? 'transform: translateY(-100%) translateY(-6px);' : 'margin-top: 6px;'}"
		>
			{#if searchable}
				<div class="p-2 border-b border-ink-100 shrink-0">
					<div class="relative">
						<Search size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
						<input
							bind:this={searchEl}
							type="text"
							bind:value={query}
							placeholder={searchPlaceholder}
							class="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-ink-200 focus:outline-none focus:border-ink-800"
							onclick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			{/if}
			<ul role="listbox" class="overflow-auto py-1.5">
				{#each filteredOptions as opt}
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
				{:else}
					<li class="px-3.5 py-3 text-sm text-ink-400 text-center">No matches</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
