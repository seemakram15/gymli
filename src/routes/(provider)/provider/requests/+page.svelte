<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { FileText, Check, X } from 'lucide-svelte';
	import { formatPKR, formatDateTime, initials } from '$lib/utils/format.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();

	const filters = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];
	function setFilter(status) {
		goto(`?status=${status}`);
	}

	let confirmOpen = $state(false);
	let pendingAction = $state(null); // { id, kind: 'approve'|'reject' }
	let rejectReason = $state('');
	const avatarColors = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-500','from-orange-500 to-red-500','from-blue-500 to-cyan-500','from-pink-500 to-rose-500'];

	function askApprove(id) {
		pendingAction = { id, kind: 'approve' };
		confirmOpen = true;
	}
	function askReject(id) {
		rejectReason = '';
		pendingAction = { id, kind: 'reject' };
		confirmOpen = true;
	}
	function submitAction() {
		const formEl = document.getElementById(`${pendingAction.kind}-form-${pendingAction.id}`);
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}

	const methodLabel = { bank_transfer: 'Bank Transfer', jazzcash: 'JazzCash' };
</script>

<svelte:head><title>Subscription Requests — Service Provider</title></svelte:head>

<div class="p-5 lg:p-7 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Subscription Requests</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="flex gap-2 flex-wrap">
		{#each filters as [val, label]}
			<button onclick={() => setFilter(val)} class="btn btn-sm {data.status === val ? 'btn-primary' : 'btn-secondary'}">{label}</button>
		{/each}
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Requester</th>
					<th>Gym</th>
					<th>Plan</th>
					<th>Amount</th>
					<th>Method</th>
					<th>Receipt</th>
					<th>Submitted</th>
					<th>Status</th>
					{#if data.status === 'pending'}<th class="text-right">Actions</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.requests as r, i}
					<tr>
						<td>
							<div class="flex items-center gap-2.5">
								<div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{initials(r.profiles?.full_name)}
								</div>
								<div class="font-medium text-gray-900">{r.profiles?.full_name ?? '—'}</div>
							</div>
						</td>
						<td>{r.gyms?.name ?? '—'}</td>
						<td class="capitalize">{r.plan}</td>
						<td class="font-semibold text-ink-900">{formatPKR(r.amount)}</td>
						<td>{methodLabel[r.payment_method] ?? r.payment_method}</td>
						<td>
							<a href={r.receipt_url} target="_blank" rel="noreferrer" class="text-ink-400 hover:text-ink-800 transition-colors inline-flex items-center gap-1 text-xs">
								<FileText size={13} /> View
							</a>
						</td>
						<td class="text-gray-500">{formatDateTime(r.created_at)}</td>
						<td>
							<span class="{r.status === 'pending' ? 'badge-yellow' : r.status === 'approved' ? 'badge-green' : 'badge-red'} capitalize">{r.status}</span>
						</td>
						{#if data.status === 'pending'}
							<td class="text-right">
								<div class="flex items-center gap-2 justify-end">
									<button type="button" onclick={() => askApprove(r.id)} class="btn btn-sm btn-primary gap-1"><Check size={13} /> Approve</button>
									<button type="button" onclick={() => askReject(r.id)} class="btn btn-sm btn-secondary gap-1"><X size={13} /> Reject</button>
								</div>
								<form id="approve-form-{r.id}" method="POST" action="?/approve" use:enhance class="hidden">
									<input type="hidden" name="id" value={r.id} />
								</form>
								<form id="reject-form-{r.id}" method="POST" action="?/reject" use:enhance class="hidden">
									<input type="hidden" name="id" value={r.id} />
									<input type="hidden" name="reason" value={rejectReason} />
								</form>
							</td>
						{/if}
					</tr>
				{:else}
					<tr><td colspan="9" class="text-center py-12 text-gray-400">No requests here</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if pendingAction?.kind === 'approve'}
	<ConfirmDialog
		open={confirmOpen}
		title="Approve this request?"
		message="The account's plan will be activated immediately and the owner will get an email that their access is granted."
		confirmLabel="Approve"
		oncancel={() => (confirmOpen = false)}
		onconfirm={submitAction}
	/>
{:else if pendingAction?.kind === 'reject'}
	<Modal open={confirmOpen} title="Reject this request?" onclose={() => (confirmOpen = false)}>
		<div class="space-y-3">
			<p class="text-sm text-ink-500">The requester will get an email that their payment couldn't be verified.</p>
			<div>
				<label class="label" for="reject-reason">Reason (optional, included in the email)</label>
				<textarea id="reject-reason" bind:value={rejectReason} class="input" rows="3" placeholder="e.g. Receipt amount doesn't match the plan price"></textarea>
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (confirmOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="button" onclick={submitAction} class="btn btn-danger flex-1">Reject request</button>
			</div>
		</div>
	</Modal>
{/if}
