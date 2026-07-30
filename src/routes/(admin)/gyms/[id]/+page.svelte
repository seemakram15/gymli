<script>
	import { goto } from '$app/navigation';
	import { Building2, MapPin, Phone, Mail, Users } from 'lucide-svelte';
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
		full_name: (m) => m.full_name ?? '',
		status: (m) => m.status ?? '',
		plan: (m) => m.subscription?.packages?.name ?? '',
		due_date: (m) => m.subscription?.due_date ?? '',
		balance: (m) => (m.subscription ? m.subscription.amount_due - m.subscription.amount_paid : 0),
		payment_status: (m) => m.subscription?.payment_status ?? '',
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

<svelte:head><title>{data.gym.name} — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div>
		<button type="button" onclick={() => goBack('/gyms')} class="text-sm text-ink-500 hover:text-ink-800">← Back to Gym Locations</button>
	</div>

	<div class="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
		<div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style="background: linear-gradient(135deg, var(--color-volt-400), var(--color-volt-500));">
			<Building2 size={26} class="text-ink-950" />
		</div>
		<div class="flex-1 min-w-0">
			<h1 class="font-display font-bold text-ink-900 text-2xl truncate">{data.gym.name}</h1>
			<div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-ink-500">
				<div class="flex items-center gap-1.5"><MapPin size={13} class="text-ink-300" />{data.gym.city}{data.gym.address ? ` — ${data.gym.address}` : ''}</div>
				{#if data.gym.phone}<div class="flex items-center gap-1.5"><Phone size={13} class="text-ink-300" />{data.gym.phone}</div>{/if}
				{#if data.gym.email}<div class="flex items-center gap-1.5"><Mail size={13} class="text-ink-300" />{data.gym.email}</div>{/if}
			</div>
		</div>
		<div class="flex items-center gap-2 bg-ink-50 rounded-xl px-4 py-2.5 shrink-0">
			<Users size={16} class="text-ink-400" />
			<span class="font-semibold text-ink-900">{data.members.length}</span>
			<span class="text-sm text-ink-500">members</span>
		</div>
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<SortableTh label="Member" active={sortCol === 'full_name'} dir={sortDir} onclick={() => sortBy('full_name')} />
					<SortableTh label="Status" active={sortCol === 'status'} dir={sortDir} onclick={() => sortBy('status')} />
					<SortableTh label="Plan" active={sortCol === 'plan'} dir={sortDir} onclick={() => sortBy('plan')} />
					<SortableTh label="Due Date" active={sortCol === 'due_date'} dir={sortDir} onclick={() => sortBy('due_date')} />
					<SortableTh label="Balance" active={sortCol === 'balance'} dir={sortDir} onclick={() => sortBy('balance')} />
					<SortableTh label="Payment Status" active={sortCol === 'payment_status'} dir={sortDir} onclick={() => sortBy('payment_status')} />
				</tr>
			</thead>
			<tbody>
				{#each sortedMembers as m}
					<tr onclick={() => goto(`/members/${m.id}`)} class="cursor-pointer">
						<td>
							<div class="flex items-center gap-3">
								{#if m.avatar_url}
									<img src={m.avatar_url} alt={m.full_name} class="w-8 h-8 rounded-lg object-cover shrink-0" />
								{:else}
									<div class="w-8 h-8 bg-ink-900 text-volt-300 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{initials(m.full_name)}</div>
								{/if}
								<div>
									<div class="font-medium text-ink-900">{m.full_name}</div>
									<div class="text-xs text-ink-400">{m.phone_number ?? ''}</div>
								</div>
							</div>
						</td>
						<td><span class="{memberStatusBadge(m.status)}">{m.status}</span></td>
						<td>{m.subscription?.packages?.name ?? '—'}</td>
						<td>{formatDate(m.subscription?.due_date)}</td>
						<td class="{(m.subscription ? m.subscription.amount_due - m.subscription.amount_paid : 0) > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">
							{m.subscription ? formatPKR(m.subscription.amount_due - m.subscription.amount_paid) : '—'}
						</td>
						<td>{#if m.subscription}<span class="{paymentStatusBadge(m.subscription.payment_status)}">{m.subscription.payment_status}</span>{:else}—{/if}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="text-center py-12 text-ink-400">No members at this gym yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
