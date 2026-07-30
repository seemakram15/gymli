<script>
	import { goto } from '$app/navigation';
	import { Package, Users } from 'lucide-svelte';
	import { initials, formatDate, formatPKR, memberStatusBadge, paymentStatusBadge } from '$lib/utils/format.js';
	import { goBack } from '$lib/utils/nav.js';
	import SortableTh from '$lib/components/SortableTh.svelte';

	let { data } = $props();

	let sortCol = $state('full_name');
	let sortDir = $state('asc');
	function sortBy(col) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortCol = col; sortDir = 'asc'; }
	}
	const sortAccessors = {
		full_name: (m) => m.profiles?.full_name ?? '',
		status: (m) => m.profiles?.status ?? '',
		due_date: (m) => m.due_date ?? '',
		balance: (m) => m.amount_due - m.amount_paid,
		payment_status: (m) => m.payment_status ?? '',
	};
	const sortedMembers = $derived(
		[...data.members].sort((a, b) => {
			const va = sortAccessors[sortCol](a);
			const vb = sortAccessors[sortCol](b);
			const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
			return sortDir === 'asc' ? cmp : -cmp;
		})
	);
</script>

<svelte:head><title>{data.pkg.name} — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div>
		<button type="button" onclick={() => goBack('/packages')} class="text-sm text-ink-500 hover:text-ink-800">← Back to Membership Plans</button>
	</div>

	<div class="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
		<div class="w-14 h-14 rounded-2xl bg-ink-900 text-volt-300 flex items-center justify-center shrink-0">
			<Package size={26} />
		</div>
		<div class="flex-1 min-w-0">
			<h1 class="font-display font-bold text-ink-900 text-2xl truncate">{data.pkg.name}</h1>
			<div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-ink-500">
				<span class="font-semibold text-ink-900">{formatPKR(data.pkg.amount)}</span>
				<span>per {data.pkg.cycles?.name ?? 'cycle'}</span>
			</div>
			{#if data.pkg.package_services?.length}
				<div class="flex flex-wrap gap-1.5 mt-2">
					{#each data.pkg.package_services as ps}
						<span class="badge-green text-xs">{ps.services?.name}</span>
					{/each}
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2 bg-ink-50 rounded-xl px-4 py-2.5 shrink-0">
			<Users size={16} class="text-ink-400" />
			<span class="font-semibold text-ink-900">{data.members.length}</span>
			<span class="text-sm text-ink-500">members on this plan</span>
		</div>
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<SortableTh label="Member" active={sortCol === 'full_name'} dir={sortDir} onclick={() => sortBy('full_name')} />
					<SortableTh label="Status" active={sortCol === 'status'} dir={sortDir} onclick={() => sortBy('status')} />
					<SortableTh label="Due Date" active={sortCol === 'due_date'} dir={sortDir} onclick={() => sortBy('due_date')} />
					<SortableTh label="Balance" active={sortCol === 'balance'} dir={sortDir} onclick={() => sortBy('balance')} />
					<SortableTh label="Payment Status" active={sortCol === 'payment_status'} dir={sortDir} onclick={() => sortBy('payment_status')} />
				</tr>
			</thead>
			<tbody>
				{#each sortedMembers as m}
					<tr onclick={() => goto(`/members/${m.profiles.id}`)} class="cursor-pointer">
						<td>
							<div class="flex items-center gap-3">
								{#if m.profiles.avatar_url}
									<img src={m.profiles.avatar_url} alt={m.profiles.full_name} class="w-8 h-8 rounded-lg object-cover shrink-0" />
								{:else}
									<div class="w-8 h-8 bg-ink-900 text-volt-300 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{initials(m.profiles.full_name)}</div>
								{/if}
								<div>
									<div class="font-medium text-ink-900">{m.profiles.full_name}</div>
									<div class="text-xs text-ink-400">{m.profiles.phone_number ?? ''}</div>
								</div>
							</div>
						</td>
						<td><span class="{memberStatusBadge(m.profiles.status)}">{m.profiles.status}</span></td>
						<td>{formatDate(m.due_date)}</td>
						<td class="{(m.amount_due - m.amount_paid) > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">{formatPKR(m.amount_due - m.amount_paid)}</td>
						<td><span class="{paymentStatusBadge(m.payment_status)}">{m.payment_status}</span></td>
					</tr>
				{:else}
					<tr><td colspan="5" class="text-center py-12 text-ink-400">No members on this plan yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
