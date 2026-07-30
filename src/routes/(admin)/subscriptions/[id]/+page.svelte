<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Pencil, XCircle, RefreshCw } from 'lucide-svelte';
	import { formatPKR, formatDate, formatDateTime, paymentStatusBadge } from '$lib/utils/format.js';
	import { goBack } from '$lib/utils/nav.js';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let editOpen = $state(false);
	let cancelConfirmOpen = $state(false);
	let loading = $state(false);

	let editAmountDue = $state(data.subscription.amount_due);
	let editDiscount = $state(data.subscription.discount ?? 0);
	let editDueDate = $state(data.subscription.due_date ?? '');
	let editStatus = $state(data.subscription.status);

	const canManage = $derived(data.viewerRole === 'superadmin' || data.viewerRole === 'manager');
	const balance = $derived(Math.max(data.subscription.amount_due - data.subscription.amount_paid, 0));

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'cancelled', label: 'Cancelled' },
	];

	function openEdit() {
		editAmountDue = data.subscription.amount_due;
		editDiscount = data.subscription.discount ?? 0;
		editDueDate = data.subscription.due_date ?? '';
		editStatus = data.subscription.status;
		editOpen = true;
	}
</script>

<svelte:head><title>Subscription — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
	<button type="button" onclick={() => goBack(`/members/${data.subscription.profiles?.id}`)} class="text-sm text-ink-500 hover:text-ink-800">← Back</button>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="card card-body space-y-4">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-xl font-bold text-ink-900">{data.subscription.profiles?.full_name ?? 'Member'}</h1>
				<p class="text-ink-500 text-sm">{data.subscription.packages?.name ?? 'Plan'} — {data.subscription.gyms?.name ?? '—'}</p>
			</div>
			<span class="{paymentStatusBadge(data.subscription.payment_status)}">{data.subscription.payment_status}</span>
		</div>

		<div class="grid sm:grid-cols-2 gap-4 text-sm">
			<div><span class="text-ink-400">Start Date</span><div class="font-medium text-ink-900">{formatDate(data.subscription.start_date)}</div></div>
			<div><span class="text-ink-400">Due Date</span><div class="font-medium text-ink-900">{formatDate(data.subscription.due_date)}</div></div>
			<div><span class="text-ink-400">Amount Due</span><div class="font-medium text-ink-900">{formatPKR(data.subscription.amount_due)}</div></div>
			{#if data.subscription.discount > 0}
				<div><span class="text-ink-400">Discount Applied</span><div class="font-medium text-volt-700">-{formatPKR(data.subscription.discount)}</div></div>
			{/if}
			<div><span class="text-ink-400">Amount Paid</span><div class="font-medium text-green-600">{formatPKR(data.subscription.amount_paid)}</div></div>
			<div><span class="text-ink-400">Balance</span><div class="font-semibold {balance > 0 ? 'text-red-600' : 'text-green-600'}">{formatPKR(balance)}</div></div>
			<div><span class="text-ink-400">Status</span><div class="font-medium text-ink-900 capitalize">{data.subscription.status}</div></div>
		</div>

		{#if canManage}
			<div class="flex flex-wrap gap-2 pt-2 border-t border-ink-100">
				<button type="button" onclick={openEdit} class="btn btn-secondary btn-sm"><Pencil size={14} /> Edit</button>
				{#if data.subscription.status !== 'cancelled'}
					<button type="button" onclick={() => (cancelConfirmOpen = true)} class="btn btn-secondary btn-sm text-red-600"><XCircle size={14} /> Cancel Subscription</button>
				{/if}
				{#if data.subscription.payment_status === 'paid'}
					<form method="POST" action="?/renew" use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							await update();
							loading = false;
							if (result.type === 'success' && result.data?.newSubscriptionId) {
								goto(`/subscriptions/${result.data.newSubscriptionId}`);
							}
						};
					}}>
						<button type="submit" class="btn btn-primary btn-sm" disabled={loading}><RefreshCw size={14} /> {loading ? 'Renewing…' : 'Renew for Next Cycle'}</button>
					</form>
				{/if}
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="card-header"><h3 class="font-semibold text-ink-900">Payments on this Subscription</h3></div>
		<div class="table-wrapper !border-0 !rounded-none">
			<table>
				<thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Notes</th></tr></thead>
				<tbody>
					{#each data.payments as p}
						<tr>
							<td>{formatDateTime(p.paid_at)}</td>
							<td class="font-semibold text-green-600">{formatPKR(p.amount)}</td>
							<td class="capitalize">{p.method}</td>
							<td><span class="badge-{p.status === 'completed' ? 'green' : 'gray'}">{p.status}</span></td>
							<td class="text-ink-400">{p.notes ?? '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-center py-8 text-ink-400">No payments recorded yet</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<form id="cancel-sub-form" method="POST" action="?/cancel" use:enhance class="hidden"></form>
<ConfirmDialog
	open={cancelConfirmOpen}
	title="Cancel this subscription?"
	message="The member will no longer be billed under this subscription. This does not delete their payment history."
	confirmLabel="Cancel Subscription"
	oncancel={() => (cancelConfirmOpen = false)}
	onconfirm={() => {
		cancelConfirmOpen = false;
		const formEl = document.getElementById('cancel-sub-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
	}}
/>

<Modal open={editOpen} title="Edit Subscription" onclose={() => (editOpen = false)}>
	<form method="POST" action="?/update" use:enhance={() => {
		loading = true;
		return async ({ update }) => { await update(); loading = false; editOpen = false; };
	}} class="space-y-3">
		<div><label class="label">Amount Due (PKR) *</label><input name="amount_due" type="number" class="input" required min="0" bind:value={editAmountDue} /></div>
		<div><label class="label">Discount (PKR)</label><input name="discount" type="number" class="input" min="0" bind:value={editDiscount} /></div>
		<div><label class="label">Due Date</label><DatePicker name="due_date" bind:value={editDueDate} placeholder="Due date" /></div>
		<div>
			<label class="label">Status</label>
			<Select name="status" options={statusOptions} bind:value={editStatus} />
		</div>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (editOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
		</div>
	</form>
</Modal>
