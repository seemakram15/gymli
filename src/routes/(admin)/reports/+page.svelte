<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Download, Banknote, CreditCard, Landmark, Globe, Wallet } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Select from '$lib/components/Select.svelte';

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

	const methodMeta = {
		cash: { label: 'Cash', icon: Banknote, color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
		card: { label: 'Card', icon: CreditCard, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
		bank_transfer: { label: 'Bank Transfer', icon: Landmark, color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
		online: { label: 'Online', icon: Globe, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
	};
	function methodInfo(method) {
		return methodMeta[method] ?? { label: method, icon: Wallet, color: 'bg-ink-400', text: 'text-ink-700', bg: 'bg-ink-50' };
	}

	const methodBreakdown = $derived(
		Object.entries(data.byMethod)
			.map(([method, amount]) => ({ method, amount, pct: data.totalCollected ? (Number(amount) / data.totalCollected) * 100 : 0 }))
			.sort((a, b) => b.amount - a.amount)
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
			...data.payments.map((p) => [p.profiles?.full_name ?? '—', p.amount, p.method, p.paid_at])
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

	{#if methodBreakdown.length}
		<div class="card card-body">
			<h3 class="font-semibold text-ink-900 mb-4">Collections by Payment Method</h3>
			<div class="space-y-4">
				{#each methodBreakdown as { method, amount, pct }}
					{@const info = methodInfo(method)}
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 rounded-xl {info.bg} {info.text} flex items-center justify-center shrink-0">
							<info.icon size={18} />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline justify-between gap-2 mb-1.5">
								<span class="font-medium text-ink-900 text-sm">{info.label}</span>
								<span class="text-sm text-ink-500 shrink-0">{formatPKR(amount)} <span class="text-ink-400">({pct.toFixed(0)}%)</span></span>
							</div>
							<div class="h-2 rounded-full bg-ink-100 overflow-hidden">
								<div class="h-full rounded-full {info.color}" style="width: {pct}%"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between">
				<span class="text-sm text-ink-500">Total Collected</span>
				<span class="font-bold text-ink-900">{formatPKR(data.totalCollected)}</span>
			</div>
		</div>
	{/if}

	<div class="table-wrapper">
		<table>
			<thead>
				<tr><th>Member</th><th>Amount</th><th>Method</th><th>Date & Time</th></tr>
			</thead>
			<tbody>
				{#each data.payments as p}
					<tr>
						<td class="font-medium">{p.profiles?.full_name ?? '—'}</td>
						<td class="text-volt-700 font-semibold">{formatPKR(p.amount)}</td>
						<td class="capitalize">{p.method}</td>
						<td class="text-ink-500">{formatDateTime(p.paid_at)}</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="text-center py-12 text-ink-400">No payments in selected date range</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
