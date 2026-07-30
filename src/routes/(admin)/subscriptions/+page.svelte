<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Plus, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { formatPKR, formatDate, paymentStatusBadge, memberStatusBadge } from '$lib/utils/format.js';

	let { data } = $props();
	const totalPages = $derived(Math.ceil(data.total / data.perPage));

	function setFilter(key, val) {
		const params = new URLSearchParams($page.url.searchParams);
		if (val) params.set(key, val); else params.delete(key);
		params.set('page', '1');
		goto(`?${params}`);
	}
</script>

<svelte:head><title>Subscriptions — GymLi</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Subscriptions</h1>
			<p class="text-gray-500 text-sm">{data.total} total</p>
		</div>
		<a href="/subscriptions/new" class="btn-primary btn"><Plus size={16} /> New Subscription</a>
	</div>

	<!-- Status filter -->
	<div class="flex gap-2 flex-wrap">
		{#each [['','All'],['active','Active'],['paid','Paid'],['pending','Pending'],['overdue','Overdue']] as [val, label]}
			<button onclick={() => setFilter('status', val)}
				class="btn btn-sm {(data.status ?? '') === val ? 'btn-primary' : 'btn-secondary'}">{label}</button>
		{/each}
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Member</th>
					<th>Plan</th>
					<th>Gym</th>
					<th>Due Date</th>
					<th>Amount Due</th>
					<th>Amount Paid</th>
					<th>Balance</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each data.subscriptions as sub}
					<tr onclick={() => goto(`/subscriptions/${sub.id}`)} class="cursor-pointer">
						<td>
							<div class="font-medium text-gray-900">{sub.profiles?.full_name ?? '—'}</div>
							<div class="text-xs text-gray-400">{sub.profiles?.phone_number ?? ''}</div>
						</td>
						<td>{sub.packages?.name ?? '—'}</td>
						<td>{sub.gyms?.name ?? '—'}</td>
						<td class="{sub.payment_status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}">{formatDate(sub.due_date)}</td>
						<td>{formatPKR(sub.amount_due)}</td>
						<td class="text-green-600">{formatPKR(sub.amount_paid)}</td>
						<td class="{sub.amount_due - sub.amount_paid > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">
							{formatPKR(sub.amount_due - sub.amount_paid)}
						</td>
						<td><span class="{paymentStatusBadge(sub.payment_status)}">{sub.payment_status}</span></td>
					</tr>
				{:else}
					<tr><td colspan="8" class="text-center py-12 text-gray-400">No subscriptions found</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-500">{data.total} records</span>
			<div class="flex gap-2">
				<button onclick={() => setFilter('page', String(data.page - 1))} disabled={data.page === 1} class="btn-secondary btn btn-sm"><ChevronLeft size={14}/></button>
				<span class="btn btn-sm btn-secondary cursor-default">{data.page}/{totalPages}</span>
				<button onclick={() => setFilter('page', String(data.page + 1))} disabled={data.page >= totalPages} class="btn-secondary btn btn-sm"><ChevronRight size={14}/></button>
			</div>
		</div>
	{/if}
</div>
