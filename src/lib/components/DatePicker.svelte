<script>
	import { ChevronLeft, ChevronRight, Calendar } from 'lucide-svelte';

	/** @type {{
	 *   name?: string,
	 *   id?: string,
	 *   value?: string,
	 *   required?: boolean,
	 *   disabled?: boolean,
	 *   placeholder?: string,
	 *   onchange?: (value: string) => void
	 * }} */
	let {
		name = '',
		id = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		placeholder = 'Pick a date',
		onchange = undefined
	} = $props();

	let open = $state(false);
	let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let view = $state(new Date(today.getFullYear(), today.getMonth(), 1));

	$effect(() => {
		if (value) {
			const d = parseISO(value);
			if (d) view = new Date(d.getFullYear(), d.getMonth(), 1);
		}
	});

	const monthLabel = $derived(
		view.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
	);

	const days = $derived(buildCalendar(view));

	const displayLabel = $derived.by(() => {
		if (!value) return '';
		const d = parseISO(value);
		if (!d) return value;
		return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
	});

	/** @param {string} str */
	function parseISO(str) {
		if (!str) return null;
		const [y, m, d] = str.split('-').map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}

	/** @param {Date} d */
	function toISO(d) {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	/** @param {Date} monthDate */
	function buildCalendar(monthDate) {
		const year = monthDate.getFullYear();
		const month = monthDate.getMonth();
		const first = new Date(year, month, 1);
		const startPad = first.getDay(); // Sun=0
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		/** @type {{ date: Date, inMonth: boolean, iso: string }[]} */
		const cells = [];
		for (let i = 0; i < startPad; i++) {
			const d = new Date(year, month, -startPad + i + 1);
			cells.push({ date: d, inMonth: false, iso: toISO(d) });
		}
		for (let day = 1; day <= daysInMonth; day++) {
			const d = new Date(year, month, day);
			cells.push({ date: d, inMonth: true, iso: toISO(d) });
		}
		while (cells.length % 7 !== 0) {
			const last = cells[cells.length - 1].date;
			const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
			cells.push({ date: d, inMonth: false, iso: toISO(d) });
		}
		return cells;
	}

	function prevMonth() {
		view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
	}
	function nextMonth() {
		view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
	}

	/** @param {string} iso */
	function pick(iso) {
		value = iso;
		open = false;
		onchange?.(iso);
	}

	function toggle() {
		if (disabled) return;
		open = !open;
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

	const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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
		class="input flex items-center justify-between gap-2 text-left cursor-pointer
			{disabled ? 'opacity-50 cursor-not-allowed' : ''}
			{open ? 'border-ink-800' : ''}"
		style={open ? 'box-shadow: 0 0 0 3px rgba(180, 239, 42, 0.25)' : ''}
	>
		<span class={value ? 'text-ink-900' : 'text-ink-400'}>
			{value ? displayLabel : placeholder}
		</span>
		<Calendar size={16} class="text-ink-400 shrink-0" />
	</button>

	{#if open}
		<div class="absolute z-40 mt-1.5 w-[min(100vw-2rem,20rem)] rounded-2xl border border-ink-200 bg-white p-3 shadow-xl shadow-ink-900/10">
			<div class="flex items-center justify-between mb-3 px-1">
				<button type="button" class="p-1.5 rounded-lg hover:bg-ink-50 text-ink-600" onclick={prevMonth} aria-label="Previous month">
					<ChevronLeft size={16} />
				</button>
				<div class="font-display text-sm font-bold text-ink-900">{monthLabel}</div>
				<button type="button" class="p-1.5 rounded-lg hover:bg-ink-50 text-ink-600" onclick={nextMonth} aria-label="Next month">
					<ChevronRight size={16} />
				</button>
			</div>

			<div class="grid grid-cols-7 gap-0.5 mb-1">
				{#each weekdays as w}
					<div class="text-center text-[10px] font-semibold uppercase tracking-wider text-ink-400 py-1">{w}</div>
				{/each}
			</div>

			<div class="grid grid-cols-7 gap-0.5">
				{#each days as cell}
					{@const isSelected = cell.iso === value}
					{@const isToday = cell.iso === toISO(today)}
					<button
						type="button"
						onclick={() => pick(cell.iso)}
						class="aspect-square rounded-lg text-sm font-medium transition-colors
							{!cell.inMonth ? 'text-ink-300' : 'text-ink-800'}
							{isSelected ? 'bg-ink-900 text-volt-300' : isToday ? 'bg-volt-100 text-ink-900' : 'hover:bg-ink-50'}"
					>
						{cell.date.getDate()}
					</button>
				{/each}
			</div>

			<div class="flex justify-between mt-3 pt-2 border-t border-ink-100">
				<button type="button" class="text-xs font-semibold text-ink-500 hover:text-ink-800 px-2 py-1"
					onclick={() => { value = ''; open = false; onchange?.(''); }}>Clear</button>
				<button type="button" class="text-xs font-semibold text-volt-700 hover:text-volt-800 px-2 py-1"
					onclick={() => pick(toISO(today))}>Today</button>
			</div>
		</div>
	{/if}
</div>
