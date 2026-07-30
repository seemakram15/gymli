<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Search, Plus, Eye, ChevronLeft, ChevronRight, Phone, CreditCard, Mail, Download } from 'lucide-svelte';
	import { formatDate, initials, memberStatusBadge } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();
	let search = $state(data.search ?? '');
	let debounce;

	const canMessage = $derived(data.profile?.role === 'superadmin' || data.profile?.role === 'manager');
	let messagingMember = $state(null);
	let messageText = $state('');
	let bulkOpen = $state(false);
	let bulkMessageText = $state('');
	let messageLoading = $state(false);

	const overdueMembers = $derived(data.members.filter((m) => m.isOverdue));

	function downloadCSV() {
		const rows = [
			['Name', 'CNIC', 'Phone', 'City', 'Status', 'Overdue', 'Joined'],
			...data.members.map((m) => [
				m.full_name ?? '—',
				m.cnic_number ?? '',
				m.phone_number ?? '',
				m.city ?? '',
				m.status ?? 'active',
				m.isOverdue ? 'yes' : 'no',
				m.created_at,
			]),
		];
		const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
		const link = document.createElement('a');
		link.href = 'data:text/csv,' + encodeURIComponent(csv);
		link.download = 'members.csv';
		link.click();
	}

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
		<div class="flex gap-2">
			<button onclick={downloadCSV} class="btn btn-secondary"><Download size={16} /> Export CSV</button>
			<a href="/members/new" class="btn-primary btn"><Plus size={16} /> Add Member</a>
		</div>
	</div>

	{#if form?.bulkSuccess}
		<div class="bg-volt-50 border border-volt-200 text-ink-800 rounded-xl px-4 py-3 text-sm">Message sent to {form.bulkSentCount} member{form.bulkSentCount === 1 ? '' : 's'}.</div>
	{/if}
	{#if form?.messageSuccess}
		<div class="bg-volt-50 border border-volt-200 text-ink-800 rounded-xl px-4 py-3 text-sm">Message sent.</div>
	{/if}

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-3 sm:items-center">
		<div class="relative flex-1 max-w-sm">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
			<input
				class="input pl-9"
				placeholder="Search by name, phone, CNIC…"
				bind:value={search}
				oninput={onSearch}
			/>
		</div>
		<div class="flex gap-2 flex-wrap">
			{#each [['', 'All'], ['active', 'Active'], ['inactive', 'Inactive'], ['suspended', 'Suspended'], ['overdue', 'Overdue']] as [val, label]}
				<button
					onclick={() => setStatus(val)}
					class="btn btn-sm {(data.status ?? '') === val ? 'btn-primary' : 'btn-secondary'}"
				>{label}</button>
			{/each}
		</div>
		{#if canMessage && overdueMembers.length}
			<button onclick={() => { bulkMessageText = ''; bulkOpen = true; }} class="btn btn-sm btn-secondary text-red-600">
				<Mail size={14} /> Message all overdue ({overdueMembers.length})
			</button>
		{/if}
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
						<tr onclick={() => goto(`/members/${m.id}`)} class="cursor-pointer">
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
									<a href="tel:{m.phone_number}" onclick={(e) => e.stopPropagation()} class="flex items-center gap-1 text-brand-600 hover:text-brand-700">
										<Phone size={13} />{m.phone_number}
									</a>
								{:else}—{/if}
							</td>
							<td>{m.city ?? '—'}</td>
							<td>
								<div class="flex items-center gap-1.5">
									<span class="{memberStatusBadge(m.status ?? 'active')}">
										{m.status ?? 'active'}
									</span>
									{#if m.isOverdue}<span class="badge-red">Overdue</span>{/if}
								</div>
							</td>
							<td class="text-gray-500">{formatDate(m.created_at)}</td>
							<td class="text-right">
								<div class="flex items-center justify-end gap-2">
									{#if canMessage}
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); messageText = ''; messagingMember = m; }}
											class="btn-ghost btn btn-sm inline-flex"
										>
											<Mail size={14} />
										</button>
									{/if}
									<a href="/members/{m.id}" onclick={(e) => e.stopPropagation()} class="btn-ghost btn btn-sm inline-flex">
										<Eye size={14} /> View
									</a>
								</div>
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

<Modal open={!!messagingMember} title="Message {messagingMember?.full_name ?? ''}" onclose={() => (messagingMember = null)}>
	{#if messagingMember}
		<form
			method="POST"
			action="?/sendMessage"
			use:enhance={() => {
				messageLoading = true;
				return async ({ update }) => { await update(); messageLoading = false; messagingMember = null; };
			}}
			class="space-y-3"
		>
			<input type="hidden" name="user_id" value={messagingMember.id} />
			{#if form?.messageError}<div class="bg-red-50 text-red-700 rounded-xl px-3 py-2 text-sm">{form.messageError}</div>{/if}
			<div>
				<label class="label" for="message">Message</label>
				<textarea id="message" name="message" class="input" rows="4" required placeholder="Write a message to this member…" bind:value={messageText}></textarea>
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (messagingMember = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={messageLoading}>{messageLoading ? 'Sending…' : 'Send Message'}</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={bulkOpen} title="Message all overdue members" onclose={() => (bulkOpen = false)}>
	<form
		method="POST"
		action="?/sendBulkMessage"
		use:enhance={() => {
			messageLoading = true;
			return async ({ update }) => { await update(); messageLoading = false; bulkOpen = false; };
		}}
		class="space-y-3"
	>
		{#each overdueMembers as m}<input type="hidden" name="user_ids" value={m.id} />{/each}
		{#if form?.bulkError}<div class="bg-red-50 text-red-700 rounded-xl px-3 py-2 text-sm">{form.bulkError}</div>{/if}
		<p class="text-sm text-ink-500">This will email {overdueMembers.length} member{overdueMembers.length === 1 ? '' : 's'} currently shown as overdue.</p>
		<div>
			<label class="label" for="bulk_message">Message</label>
			<textarea id="bulk_message" name="message" class="input" rows="4" required placeholder="Write a message to all overdue members…" bind:value={bulkMessageText}></textarea>
		</div>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (bulkOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={messageLoading}>{messageLoading ? 'Sending…' : 'Send to All'}</button>
		</div>
	</form>
</Modal>
