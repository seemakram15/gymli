<script>
	import { enhance } from '$app/forms';
	import { ShieldOff, ShieldCheck } from 'lucide-svelte';
	import { formatDate, initials } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form } = $props();

	const planOptions = [
		{ value: 'starter', label: 'Starter' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'custom', label: 'Custom' },
	];

	const statusBadge = { active: 'badge-green', pending: 'badge-yellow', suspended: 'badge-red', inactive: 'badge-gray', frozen: 'badge-blue' };
	const avatarColors = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-500','from-orange-500 to-red-500','from-blue-500 to-cyan-500','from-pink-500 to-rose-500'];

	let confirmOpen = $state(false);
	let pendingAccount = $state(null);

	function askRevoke(account) {
		pendingAccount = account;
		confirmOpen = true;
	}
	function submitRevoke() {
		const formEl = document.getElementById(`status-form-${pendingAccount.id}`);
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}

	function usageText(u, limit) {
		return Number.isFinite(limit) ? `${u}/${limit}` : `${u}`;
	}

	function onPlanChange(id) {
		const formEl = document.getElementById(`plan-form-${id}`);
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
	}
</script>

<svelte:head><title>Gym Accounts — Service Provider</title></svelte:head>

<div class="p-5 lg:p-7 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Gym Accounts</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Owner</th>
					<th>Gym(s)</th>
					<th>Plan</th>
					<th>Usage (gyms / members / staff)</th>
					<th>Status</th>
					<th>Joined</th>
					<th class="text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.accounts as a, i}
					<tr>
						<td>
							<div class="flex items-center gap-2.5">
								<div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{initials(a.full_name)}
								</div>
								<div>
									<div class="font-medium text-gray-900">{a.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">{a.email}</div>
								</div>
							</div>
						</td>
						<td>{a.gyms.map((g) => g.name).join(', ') || '—'}</td>
						<td>
							<form id="plan-form-{a.id}" method="POST" action="?/changePlan" use:enhance class="inline-block w-32">
								<input type="hidden" name="id" value={a.id} />
								<Select name="plan" options={planOptions} value={a.plan} onchange={() => onPlanChange(a.id)} />
							</form>
						</td>
						<td class="text-xs text-gray-500">
							{usageText(a.usage.gyms, a.limits.gyms)} · {usageText(a.usage.members, a.limits.members)} · {usageText(a.usage.staff, a.limits.staff)}
						</td>
						<td><span class="{statusBadge[a.status] ?? 'badge-gray'} capitalize">{a.status}</span></td>
						<td class="text-gray-500">{formatDate(a.created_at)}</td>
						<td class="text-right">
							{#if a.status === 'suspended' || a.status === 'inactive'}
								<form id="status-form-{a.id}" method="POST" action="?/setStatus" use:enhance class="inline">
									<input type="hidden" name="id" value={a.id} />
									<input type="hidden" name="status" value="active" />
									<button type="submit" class="btn btn-sm btn-primary gap-1"><ShieldCheck size={13} /> Restore</button>
								</form>
							{:else}
								<button type="button" onclick={() => askRevoke(a)} class="btn btn-sm btn-secondary gap-1"><ShieldOff size={13} /> Revoke</button>
								<form id="status-form-{a.id}" method="POST" action="?/setStatus" use:enhance class="hidden">
									<input type="hidden" name="id" value={a.id} />
									<input type="hidden" name="status" value="suspended" />
								</form>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="7" class="text-center py-12 text-gray-400">No gym accounts yet</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<ConfirmDialog
	open={confirmOpen}
	title="Revoke access for {pendingAccount?.full_name}?"
	message="This immediately locks their whole team (managers, instructors, staff) out of the gym dashboard until access is restored."
	confirmLabel="Revoke access"
	danger
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitRevoke}
/>
