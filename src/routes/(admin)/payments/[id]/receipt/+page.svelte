<script>
	import { Printer } from 'lucide-svelte';
	import { formatPKR, formatDateTime } from '$lib/utils/format.js';
	import { goBack } from '$lib/utils/nav.js';

	let { data } = $props();
	const p = data.payment;
</script>

<svelte:head><title>Receipt — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-lg mx-auto space-y-4">
	<div class="flex items-center justify-between print:hidden">
		<button type="button" onclick={() => goBack('/payments')} class="text-sm text-ink-500 hover:text-ink-800">← Back to Payments</button>
		<button onclick={() => window.print()} class="btn btn-primary"><Printer size={16} /> Print / Save as PDF</button>
	</div>

	<div class="card card-body space-y-6" id="receipt">
		<div class="text-center border-b border-ink-100 pb-4">
			<div class="font-display text-2xl font-bold text-ink-900">Gym<span class="text-volt-600">Li</span></div>
			<p class="text-ink-500 text-sm mt-1">{p.gyms?.name ?? 'Payment Receipt'}</p>
		</div>

		<div class="text-center">
			<p class="text-xs uppercase tracking-wide text-ink-400">Amount Paid</p>
			<p class="text-3xl font-black text-ink-900 mt-1">{formatPKR(p.amount)}</p>
		</div>

		<div class="grid grid-cols-2 gap-4 text-sm">
			<div><span class="text-ink-400">Member</span><div class="font-medium text-ink-900">{p.profiles?.full_name ?? '—'}</div></div>
			<div><span class="text-ink-400">Phone</span><div class="font-medium text-ink-900">{p.profiles?.phone_number ?? '—'}</div></div>
			<div><span class="text-ink-400">Method</span><div class="font-medium text-ink-900 capitalize">{p.method}</div></div>
			<div><span class="text-ink-400">Date</span><div class="font-medium text-ink-900">{formatDateTime(p.paid_at)}</div></div>
			<div><span class="text-ink-400">Plan</span><div class="font-medium text-ink-900">{p.subscriptions?.packages?.name ?? '—'}</div></div>
			<div><span class="text-ink-400">Status</span><div class="font-medium text-ink-900 capitalize">{p.status}</div></div>
			{#if p.notes}
				<div class="col-span-2"><span class="text-ink-400">Notes</span><div class="font-medium text-ink-900">{p.notes}</div></div>
			{/if}
		</div>

		{#if p.receipt_url}
			<div class="border-t border-ink-100 pt-4 print:hidden">
				<p class="text-xs uppercase tracking-wide text-ink-400 mb-2 text-center">Uploaded Receipt</p>
				<a href={p.receipt_url} target="_blank" rel="noreferrer">
					<img src={p.receipt_url} alt="Uploaded receipt" class="w-full rounded-lg border border-ink-100" />
				</a>
			</div>
		{/if}

		<div class="text-center text-xs text-ink-400 border-t border-ink-100 pt-4">Receipt ID: {p.id}</div>
	</div>
</div>

<style>
	@media print {
		:global(body) * { visibility: hidden; }
		#receipt, #receipt * { visibility: visible; }
		#receipt { position: absolute; top: 0; left: 0; width: 100%; border: none !important; box-shadow: none !important; }
	}
</style>
