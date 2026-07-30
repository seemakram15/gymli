<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-svelte';
	import { formatPKR, formatDate, paymentStatusBadge, memberStatusBadge } from '$lib/utils/format.js';
	import SortableTh from '$lib/components/SortableTh.svelte';

	let { data } = $props();
	const totalPages = $derived(Math.ceil(data.total / data.perPage));

	let search = $state(data.search ?? '');
	let debounce;
	function onSearch() {
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			const params = new URLSearchParams($page.url.searchParams);
			params.set('search', search);
			params.set('page', '1');
			goto(`?${params}`, { replaceState: true });
		}, 300);
	}

	function setFilter(key, val) {
		const params = new URLSearchParams($page.url.searchParams);
		if (val) params.set(key, val); else params.delete(key);
		params.set('page', '1');
		goto(`?${params}`);
	}

	function sortBy(column) {
		const params = new URLSearchParams($page.url.searchParams);
		const nextDir = data.sort === column && data.dir === 'asc' ? 'desc' : 'asc';
		params.set('sort', column);
		params.set('dir', nextDir);
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

	<!-- Search + Status filter -->
	<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
		<div class="relative flex-1 max-w-sm">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
			<input class="input pl-9" placeholder="Search by member name or phone…" bind:value={search} oninput={onSearch} />
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each [['','All'],['active','Active'],['paid','Paid'],['pending','Pending'],['overdue','Overdue']] as [val, label]}
				<button onclick={() => setFilter('status', val)}
					class="btn btn-sm {(data.status ?? '') === val ? 'btn-primary' : 'btn-secondary'}">{label}</button>
			{/each}
		</div>
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<SortableTh label="Member" active={data.sort === 'member'} dir={data.dir} onclick={() => sortBy('member')} />
					<SortableTh label="Plan" active={data.sort === 'plan'} dir={data.dir} onclick={() => sortBy('plan')} />
					<SortableTh label="Gym" active={data.sort === 'gym'} dir={data.dir} onclick={() => sortBy('gym')} />
					<SortableTh label="Due Date" active={data.sort === 'due_date'} dir={data.dir} onclick={() => sortBy('due_date')} />
					<SortableTh label="Amount Due" active={data.sort === 'amount_due'} dir={data.dir} onclick={() => sortBy('amount_due')} />
					<SortableTh label="Amount Paid" active={data.sort === 'amount_paid'} dir={data.dir} onclick={() => sortBy('amount_paid')} />
					<th>Balance</th>
					<SortableTh label="Status" active={data.sort === 'status'} dir={data.dir} onclick={() => sortBy('status')} />
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
