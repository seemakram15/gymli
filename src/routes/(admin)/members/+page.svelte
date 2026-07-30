<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Search, Plus, Eye, ChevronLeft, ChevronRight, Phone, CreditCard } from 'lucide-svelte';
	import { formatDate, initials, memberStatusBadge } from '$lib/utils/format.js';

	let { data } = $props();
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

	function setStatus(s) {
		const params = new URLSearchParams($page.url.searchParams);
		if (s) params.set('status', s); else params.delete('status');
		params.set('page', '1');
		goto(`?${params}`);
	}

	function gotoPage(p) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(p));
		goto(`?${params}`);
	}

	const totalPages = $derived(Math.ceil(data.total / data.perPage));
</script>

<svelte:head><title>Members — GymLi</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Members</h1>
			<p class="text-gray-500 text-sm">{data.total} total members</p>
		</div>
		<a href="/members/new" class="btn-primary btn"><Plus size={16} /> Add Member</a>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-3">
		<div class="relative flex-1 max-w-sm">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
			<input
				class="input pl-9"
				placeholder="Search by name, phone, CNIC…"
				bind:value={search}
				oninput={onSearch}
			/>
		</div>
		<div class="flex gap-2">
			{#each [['', 'All'], ['active', 'Active'], ['inactive', 'Inactive'], ['suspended', 'Suspended']] as [val, label]}
				<button
					onclick={() => setStatus(val)}
					class="btn btn-sm {(data.status ?? '') === val ? 'btn-primary' : 'btn-secondary'}"
				>{label}</button>
			{/each}
		</div>
	</div>

	<!-- Table -->
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Member</th>
					<th>CNIC</th>
					<th>Phone</th>
					<th>City</th>
					<th>Status</th>
					<th>Joined</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if data.members.length === 0}
					<tr>
						<td colspan="7" class="text-center py-12 text-gray-400">
							{data.search ? 'No members found matching your search.' : 'No members yet. Add your first member!'}
						</td>
					</tr>
				{:else}
					{#each data.members as m}
						<tr>
							<td>
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
										{initials(m.full_name)}
									</div>
									<div>
										<div class="font-medium text-gray-900">{m.full_name ?? '—'}</div>
										<div class="text-xs text-gray-400">{m.id.slice(0, 8)}…</div>
									</div>
								</div>
							</td>
							<td class="font-mono text-xs">{m.cnic_number ?? '—'}</td>
							<td>
								{#if m.phone_number}
									<a href="tel:{m.phone_number}" class="flex items-center gap-1 text-brand-600 hover:text-brand-700">
										<Phone size={13} />{m.phone_number}
									</a>
								{:else}—{/if}
							</td>
							<td>{m.city ?? '—'}</td>
							<td>
								<span class="{memberStatusBadge(m.status ?? 'active')}">
									{m.status ?? 'active'}
								</span>
							</td>
							<td class="text-gray-500">{formatDate(m.created_at)}</td>
							<td class="text-right">
								<a href="/members/{m.id}" class="btn-ghost btn btn-sm inline-flex">
									<Eye size={14} /> View
								</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-500">
				Showing {(data.page - 1) * data.perPage + 1}–{Math.min(data.page * data.perPage, data.total)} of {data.total}
			</span>
			<div class="flex gap-2">
				<button onclick={() => gotoPage(data.page - 1)} disabled={data.page === 1} class="btn-secondary btn btn-sm">
					<ChevronLeft size={14} />
				</button>
				<span class="btn btn-sm btn-secondary cursor-default">{data.page} / {totalPages}</span>
				<button onclick={() => gotoPage(data.page + 1)} disabled={data.page >= totalPages} class="btn-secondary btn btn-sm">
					<ChevronRight size={14} />
				</button>
			</div>
		</div>
	{/if}
</div>
