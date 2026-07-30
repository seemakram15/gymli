<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Download } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';

	let { data } = $props();
	let from = $state(data.from);
	let to = $state(data.to);

	function applyFilter() {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('from', from);
		params.set('to', to);
		goto(`?${params}`);
	}

	function downloadCSV() {
		const rows = [
			['Member', 'Amount', 'Method', 'Date'],
			...data.payments.map(p => [p.profiles?.full_name ?? '—', p.amount, p.method, p.paid_at]),
		];
		const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
		const a = document.createElement('a');
		a.href = 'data:text/csv,' + encodeURIComponent(csv);
		a.download = `payments_${data.from}_${data.to}.csv`;
		a.click();
	}
</script>

<svelte:head><title>Reports — GymLi</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Reports & Analytics</h1>
		<button onclick={downloadCSV} class="btn-secondary btn"><Download size={16} /> Export CSV</button>
	</div>

	<!-- Date Filter -->
	<div class="card p-4 flex flex-col sm:flex-row gap-3 items-end">
		<div>
			<label class="label">From Date</label>
			<input type="date" class="input" bind:value={from} />
		</div>
		<div>
			<label class="label">To Date</label>
			<input type="date" class="input" bind:value={to} />
		</div>
		{#if data.gyms.length}
			<div>
				<label class="label">Gym Location</label>
				<select class="input" onchange={e => { const p = new URLSearchParams($page.url.searchParams); if (e.target.value) p.set('gym_id', e.target.value); else p.delete('gym_id'); goto(`?${p}`); }}>
					<option value="">All Gyms</option>
					{#each data.gyms as g}<option value={g.id} selected={data.gym_id === g.id}>{g.name}</option>{/each}
				</select>
			</div>
		{/if}
		<button onclick={applyFilter} class="btn-primary btn">Apply</button>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card p-5">
			<div class="text-sm text-gray-500 mb-1">Total Collected</div>
			<div class="text-2xl font-bold text-green-600">{formatPKR(data.totalCollected)}</div>
			<div class="text-xs text-gray-400">{data.paymentCount} transactions</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-gray-500 mb-1">Overdue (All)</div>
			<div class="text-2xl font-bold text-red-600">{formatPKR(data.overdueAmt)}</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-gray-500 mb-1">Pending (All)</div>
			<div class="text-2xl font-bold text-yellow-600">{formatPKR(data.pendingAmt)}</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-gray-500 mb-1">Collection by Cash</div>
			<div class="text-2xl font-bold text-blue-600">{formatPKR(data.byMethod['cash'] ?? 0)}</div>
		</div>
	</div>

	<!-- By Method -->
	{#if Object.keys(data.byMethod).length}
		<div class="card card-body">
			<h3 class="font-semibold text-gray-900 mb-4">Collections by Payment Method</h3>
			<div class="flex flex-wrap gap-4">
				{#each Object.entries(data.byMethod) as [method, amount]}
					<div class="bg-gray-50 rounded-lg p-4 min-w-[150px]">
						<div class="text-sm text-gray-500 capitalize">{method}</div>
						<div class="text-xl font-bold text-gray-900">{formatPKR(amount)}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Payment List -->
	<div class="table-wrapper">
		<table>
			<thead>
				<tr><th>Member</th><th>Amount</th><th>Method</th><th>Date & Time</th></tr>
			</thead>
			<tbody>
				{#each data.payments as p}
					<tr>
						<td class="font-medium">{p.profiles?.full_name ?? '—'}</td>
						<td class="text-green-600 font-semibold">{formatPKR(p.amount)}</td>
						<td class="capitalize">{p.method}</td>
						<td class="text-gray-500">{formatDateTime(p.paid_at)}</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="text-center py-12 text-gray-400">No payments in selected date range</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
