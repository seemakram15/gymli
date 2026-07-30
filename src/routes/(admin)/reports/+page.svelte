<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Download, Search } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Select from '$lib/components/Select.svelte';
	import SortableTh from '$lib/components/SortableTh.svelte';

	let { data } = $props();
	let from = $state(data.from);
	let to = $state(data.to);
	let gymId = $state(data.gym_id ?? '');

	$effect(() => {
		from = data.from;
		to = data.to;
		gymId = data.gym_id ?? '';
	});

	const gymOptions = $derived([
		{ value: '', label: 'All Gyms' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);

	let search = $state('');
	const searchedPayments = $derived(
		search.trim()
			? data.payments.filter((p) => {
					const q = search.trim().toLowerCase();
					return (
						p.profiles?.full_name?.toLowerCase().includes(q) ||
						p.method?.toLowerCase().includes(q) ||
						String(p.amount).includes(q)
					);
				})
			: data.payments
	);

	let sortCol = $state('paid_at');
	let sortDir = $state('desc');
	function sortBy(col) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortCol = col; sortDir = 'asc'; }
	}
	const sortAccessors = {
		member: (p) => p.profiles?.full_name ?? '',
		amount: (p) => Number(p.amount),
		method: (p) => p.method ?? '',
		paid_at: (p) => p.paid_at ?? '',
	};
	const filteredPayments = $derived(
		[...searchedPayments].sort((a, b) => {
			const va = sortAccessors[sortCol](a);
			const vb = sortAccessors[sortCol](b);
			const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
			return sortDir === 'asc' ? cmp : -cmp;
		})
	);

	function applyFilter() {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('from', from);
		params.set('to', to);
		if (gymId) params.set('gym_id', gymId);
		else params.delete('gym_id');
		goto(`?${params}`);
	}

	function downloadCSV() {
		const rows = [
			['Member', 'Amount', 'Method', 'Date'],
			...filteredPayments.map((p) => [p.profiles?.full_name ?? '—', p.amount, p.method, p.paid_at])
		];
		const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
		const a = document.createElement('a');
		a.href = 'data:text/csv,' + encodeURIComponent(csv);
		a.download = `payments_${data.from}_${data.to}.csv`;
		a.click();
	}
</script>

<svelte:head><title>Reports — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Reports & Analytics</h1>
		<button onclick={downloadCSV} class="btn btn-secondary"><Download size={16} /> Export CSV</button>
	</div>

	<div class="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
		<div class="flex-1">
			<label class="label">From Date</label>
			<DatePicker bind:value={from} placeholder="From" />
		</div>
		<div class="flex-1">
			<label class="label">To Date</label>
			<DatePicker bind:value={to} placeholder="To" />
		</div>
		{#if data.gyms.length}
			<div class="flex-1">
				<label class="label">Gym Location</label>
				<Select options={gymOptions} bind:value={gymId} searchable searchPlaceholder="Search gyms…" />
			</div>
		{/if}
		<button onclick={applyFilter} class="btn btn-primary w-full sm:w-auto">Apply</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card p-5">
			<div class="text-sm text-ink-500 mb-1">Total Collected</div>
			<div class="text-2xl font-bold text-volt-700">{formatPKR(data.totalCollected)}</div>
			<div class="text-xs text-ink-400">{data.paymentCount} transactions</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-ink-500 mb-1">Overdue (All)</div>
			<div class="text-2xl font-bold text-red-600">{formatPKR(data.overdueAmt)}</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-ink-500 mb-1">Pending (All)</div>
			<div class="text-2xl font-bold text-amber-600">{formatPKR(data.pendingAmt)}</div>
		</div>
	</div>

	<div class="relative max-w-sm">
		<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
		<input class="input pl-9" placeholder="Search by member, amount, or method…" bind:value={search} />
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<SortableTh label="Member" active={sortCol === 'member'} dir={sortDir} onclick={() => sortBy('member')} />
					<SortableTh label="Amount" active={sortCol === 'amount'} dir={sortDir} onclick={() => sortBy('amount')} />
					<SortableTh label="Method" active={sortCol === 'method'} dir={sortDir} onclick={() => sortBy('method')} />
					<SortableTh label="Date & Time" active={sortCol === 'paid_at'} dir={sortDir} onclick={() => sortBy('paid_at')} />
				</tr>
			</thead>
			<tbody>
				{#each filteredPayments as p}
					<tr>
						<td class="font-medium">{p.profiles?.full_name ?? '—'}</td>
						<td class="text-volt-700 font-semibold">{formatPKR(p.amount)}</td>
						<td class="capitalize">{p.method}</td>
						<td class="text-ink-500">{formatDateTime(p.paid_at)}</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="text-center py-12 text-ink-400">{search.trim() ? 'No payments match your search.' : 'No payments in selected date range'}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
