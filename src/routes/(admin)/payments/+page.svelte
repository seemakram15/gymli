<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';

	let { data } = $props();

	function setRange(r) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('range', r); params.set('page', '1');
		goto(`?${params}`);
	}

	const totalPages = $derived(Math.ceil(data.total / data.perPage));
</script>

<svelte:head><title>Payments — GymLi</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Payment Collections</h1>
		<a href="/payments/new" class="btn-primary btn">+ Record Payment</a>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each [
			['Today', data.summary.today, 'text-blue-600', 'bg-blue-50'],
			['This Week', data.summary.week, 'text-green-600', 'bg-green-50'],
			['This Month', data.summary.month, 'text-purple-600', 'bg-purple-50'],
			['All Time', data.summary.total, 'text-gray-900', 'bg-gray-50'],
		] as [label, value, textCls, bgCls]}
			<div class="card p-5">
				<div class="text-sm text-gray-500 mb-1">{label}</div>
				<div class="text-2xl font-bold {textCls}">{formatPKR(value)}</div>
			</div>
		{/each}
	</div>

	<!-- Range Filter -->
	<div class="flex gap-2">
		{#each [['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']] as [val, label]}
			<button
				onclick={() => setRange(val)}
				class="btn btn-sm {data.range === val ? 'btn-primary' : 'btn-secondary'}"
			>{label}</button>
		{/each}
	</div>

	<!-- Table -->
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Member</th>
					<th>Amount</th>
					<th>Method</th>
					<th>Gym</th>
					<th>Date & Time</th>
					<th>Notes</th>
				</tr>
			</thead>
			<tbody>
				{#each data.payments as p}
					<tr>
						<td>
							<div class="font-medium text-gray-900">{p.profiles?.full_name ?? '—'}</div>
							<div class="text-xs text-gray-400">{p.profiles?.phone_number ?? ''}</div>
						</td>
						<td class="font-semibold text-green-600">{formatPKR(p.amount)}</td>
						<td class="capitalize">{p.method}</td>
						<td>{p.gyms?.name ?? '—'}</td>
						<td class="text-gray-500">{formatDateTime(p.paid_at)}</td>
						<td class="text-gray-400">{p.notes ?? '—'}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="text-center py-12 text-gray-400">No payments for this period</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-500">{data.total} total records</span>
			<div class="flex gap-2">
				<button onclick={() => { const p = new URLSearchParams($page.url.searchParams); p.set('page', String(data.page-1)); goto(`?${p}`); }} disabled={data.page === 1} class="btn-secondary btn btn-sm"><ChevronLeft size={14} /></button>
				<span class="btn btn-sm btn-secondary cursor-default">{data.page}/{totalPages}</span>
				<button onclick={() => { const p = new URLSearchParams($page.url.searchParams); p.set('page', String(data.page+1)); goto(`?${p}`); }} disabled={data.page >= totalPages} class="btn-secondary btn btn-sm"><ChevronRight size={14} /></button>
			</div>
		</div>
	{/if}
</div>
