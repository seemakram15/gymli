<script>
	import { enhance } from '$app/forms';
	import { formatPKR } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let userId = $state('');
	let subId = $state('');
	let method = $state('cash');
	let gymId = $state('');

	const memberOptions = $derived([
		{ value: '', label: 'Select member' },
		...data.members.map((m) => ({ value: m.id, label: `${m.full_name}${m.phone_number ? ' — ' + m.phone_number : ''}` }))
	]);

	const subOptions = $derived([
		{ value: '', label: 'General payment (no subscription)' },
		...data.subscriptions
			.filter((s) => s.user_id === userId)
			.map((s) => ({
				value: s.id,
				label: `${s.packages?.name ?? 'Plan'} — Balance: ${formatPKR(s.amount_due - s.amount_paid)}`
			}))
	]);

	const methodOptions = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'card', label: 'Card' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'online', label: 'Online' }
	];

	const gymOptions = $derived([
		{ value: '', label: 'Select gym' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);

	$effect(() => {
		userId;
		subId = '';
	});
</script>

<svelte:head><title>Record Payment — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-lg mx-auto">
	<div class="mb-6">
		<a href="/payments" class="text-sm text-ink-500 hover:text-ink-800">← Back to Payments</a>
		<h1 class="page-title mt-2">Record Payment</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{form.error}</div>
	{/if}

	<div class="card card-body">
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => { await update(); loading = false; };
			}}
			class="space-y-4"
		>
			<div>
				<label class="label" for="user_id">Member *</label>
				<Select id="user_id" name="user_id" options={memberOptions} bind:value={userId} placeholder="Select member" required />
			</div>
			<div>
				<label class="label" for="subscription_id">Subscription</label>
				<Select id="subscription_id" name="subscription_id" options={subOptions} bind:value={subId} disabled={!userId} />
			</div>
			<div>
				<label class="label" for="amount">Amount (PKR) *</label>
				<input id="amount" name="amount" type="number" class="input" placeholder="5000" required min="1" />
			</div>
			<div>
				<label class="label" for="method">Payment Method *</label>
				<Select id="method" name="method" options={methodOptions} bind:value={method} required />
			</div>
			<div>
				<label class="label" for="gym_id">Gym</label>
				<Select id="gym_id" name="gym_id" options={gymOptions} bind:value={gymId} />
			</div>
			<div>
				<label class="label" for="notes">Notes</label>
				<input id="notes" name="notes" class="input" placeholder="Optional reference or notes" />
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<a href="/payments" class="btn btn-secondary flex-1 text-center">Cancel</a>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading || !userId}>
					{loading ? 'Recording…' : 'Record Payment'}
				</button>
			</div>
		</form>
	</div>
</div>
