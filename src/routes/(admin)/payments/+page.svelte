<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { TrendingUp, Calendar, ChevronLeft, ChevronRight, Pencil, Ban, Receipt, FileText, Search } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Select from '$lib/components/Select.svelte';
	import SortableTh from '$lib/components/SortableTh.svelte';

	let { data, form } = $props();

	const canManage = $derived(data.profile?.role === 'superadmin' || data.profile?.role === 'manager');

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

	let editingPayment = $state(null);
	let editMethod = $state('cash');
	let confirmOpen = $state(false);
	let pendingVoidId = $state('');

	const methodOptions = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'card', label: 'Card' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'online', label: 'Online' },
	];

	function setRange(r) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('range', r); params.set('page', '1');
		goto(`?${params}`);
	}

	function openEdit(p) {
		editingPayment = p;
		editMethod = p.method;
	}

	function askVoid(p) {
		pendingVoidId = p.id;
		confirmOpen = true;
	}

	function submitVoid() {
		const formEl = document.getElementById('void-payment-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}

	const totalPages = $derived(Math.ceil(data.total / data.perPage));

	function sortBy(column) {
		const params = new URLSearchParams($page.url.searchParams);
		const nextDir = data.sort === column && data.dir === 'asc' ? 'desc' : 'asc';
		params.set('sort', column);
		params.set('dir', nextDir);
		params.set('page', '1');
		goto(`?${params}`);
	}
</script>

<svelte:head><title>Payments — GymLi</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Payment Collections</h1>
		<a href="/payments/new" class="btn-primary btn">+ Record Payment</a>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

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

	<!-- Search + Range Filter -->
	<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
		<div class="relative flex-1 max-w-sm">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
			<input class="input pl-9" placeholder="Search by member name or phone…" bind:value={search} oninput={onSearch} />
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each [['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']] as [val, label]}
				<button
					onclick={() => setRange(val)}
					class="btn btn-sm {data.range === val ? 'btn-primary' : 'btn-secondary'}"
				>{label}</button>
			{/each}
		</div>
	</div>

	<!-- Table -->
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<SortableTh label="Member" active={data.sort === 'member'} dir={data.dir} onclick={() => sortBy('member')} />
					<SortableTh label="Amount" active={data.sort === 'amount'} dir={data.dir} onclick={() => sortBy('amount')} />
					<SortableTh label="Method" active={data.sort === 'method'} dir={data.dir} onclick={() => sortBy('method')} />
					<SortableTh label="Gym" active={data.sort === 'gym'} dir={data.dir} onclick={() => sortBy('gym')} />
					<SortableTh label="Date & Time" active={data.sort === 'paid_at'} dir={data.dir} onclick={() => sortBy('paid_at')} />
					<th>Notes</th>
					{#if canManage}<th class="text-right">Actions</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.payments as p}
					<tr onclick={() => goto(`/payments/${p.id}/receipt`)} class="cursor-pointer">
						<td>
							<div class="font-medium text-gray-900">{p.profiles?.full_name ?? '—'}</div>
							<div class="text-xs text-gray-400">{p.profiles?.phone_number ?? ''}</div>
						</td>
						<td class="font-semibold text-green-600">{formatPKR(p.amount)}</td>
						<td class="capitalize">{p.method}</td>
						<td>{p.gyms?.name ?? '—'}</td>
						<td class="text-gray-500">{formatDateTime(p.paid_at)}</td>
						<td class="text-gray-400">{p.notes ?? '—'}</td>
						{#if canManage}
							<td class="text-right">
								<div class="flex items-center gap-3 justify-end" onclick={(e) => e.stopPropagation()}>
									<a href="/payments/{p.id}/receipt" class="text-ink-400 hover:text-ink-800 transition-colors" aria-label="View receipt"><Receipt size={14} /></a>
									{#if p.receipt_url}
										<a href={p.receipt_url} target="_blank" rel="noreferrer" class="text-ink-400 hover:text-ink-800 transition-colors" aria-label="View uploaded receipt"><FileText size={14} /></a>
									{/if}
									<button type="button" onclick={() => openEdit(p)} class="text-ink-400 hover:text-ink-800 transition-colors" aria-label="Edit payment"><Pencil size={14} /></button>
									<button type="button" onclick={() => askVoid(p)} class="text-ink-400 hover:text-red-600 transition-colors" aria-label="Void payment"><Ban size={14} /></button>
								</div>
							</td>
						{/if}
					</tr>
				{:else}
					<tr><td colspan={canManage ? 7 : 6} class="text-center py-12 text-gray-400">No payments for this period</td></tr>
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

<form id="void-payment-form" method="POST" action="?/void" use:enhance class="hidden">
	<input type="hidden" name="id" value={pendingVoidId} />
</form>

<ConfirmDialog
	open={confirmOpen}
	title="Void this payment?"
	message="It will be marked as refunded and excluded from totals. This does not reverse any real-world transaction."
	confirmLabel="Void payment"
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitVoid}
/>

<Modal open={!!editingPayment} title="Edit Payment" onclose={() => (editingPayment = null)}>
	{#if editingPayment}
		<form method="POST" action="?/update" use:enhance={() => async ({ update }) => { await update(); editingPayment = null; }} class="space-y-3">
			<input type="hidden" name="id" value={editingPayment.id} />
			<div><label class="label">Amount (PKR) *</label><input name="amount" type="number" class="input" required min="1" value={editingPayment.amount ?? ''} /></div>
			<div>
				<label class="label">Method *</label>
				<Select name="method" options={methodOptions} bind:value={editMethod} required />
			</div>
			<div><label class="label">Notes</label><input name="notes" class="input" value={editingPayment.notes ?? ''} placeholder="Optional reference or notes" /></div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (editingPayment = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1">Save Changes</button>
			</div>
		</form>
	{/if}
</Modal>
