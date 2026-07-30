<script>
	import { enhance } from '$app/forms';
	import { Upload, FileText } from 'lucide-svelte';
	import { formatPKR } from '$lib/utils/format.js';
	import { goBack } from '$lib/utils/nav.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let userId = $state('');
	let subId = $state('');
	let method = $state('cash');
	let gymId = $state('');
	let paidAt = $state(new Date().toISOString().split('T')[0]);
	let amount = $state('');

	/** @type {FileList | undefined} */
	let receiptFiles = $state();
	const receiptFile = $derived(receiptFiles?.[0]);
	const receiptIsImage = $derived(
		!!receiptFile && (receiptFile.type ? receiptFile.type.startsWith('image/') : /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(receiptFile.name))
	);
	const receiptPreview = $derived(receiptFile && receiptIsImage ? URL.createObjectURL(receiptFile) : '');

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

	const selectedSubscription = $derived(data.subscriptions.find((s) => s.id === subId));
	const selectedBalance = $derived(selectedSubscription ? Number(selectedSubscription.amount_due) - Number(selectedSubscription.amount_paid) : null);

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

	let clientError = $state('');

	function validate() {
		const missing = [];
		if (!userId) missing.push('Member');
		if (!gymId) missing.push('Gym');
		return missing;
	}

	function overpaymentError() {
		if (selectedBalance == null) return '';
		if (Number(amount) > selectedBalance) {
			return `This payment (PKR ${amount}) is more than the remaining balance of ${formatPKR(selectedBalance)} on this subscription. Reduce the amount or select a different subscription.`;
		}
		return '';
	}
</script>

<svelte:head><title>Record Payment — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-3xl mx-auto">
	<div class="mb-6">
		<button type="button" onclick={() => goBack('/payments')} class="text-sm text-ink-500 hover:text-ink-800">← Back to Payments</button>
		<h1 class="page-title mt-2">Record Payment</h1>
	</div>

	{#if clientError || form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{clientError || form?.error}</div>
	{/if}

	<div class="card card-body">
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={({ cancel }) => {
				clientError = '';
				const missing = validate();
				if (missing.length) {
					cancel();
					clientError = `Please complete the following required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`;
					window.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}
				const overpayError = overpaymentError();
				if (overpayError) {
					cancel();
					clientError = overpayError;
					window.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}
				loading = true;
				return async ({ update }) => { await update(); loading = false; };
			}}
			class="space-y-3.5"
		>
			<div>
				<label class="label" for="receipt">Receipt (optional)</label>
				<label
					for="receipt"
					class="flex items-center gap-3 border-2 border-dashed border-ink-200 rounded-xl px-4 py-2.5 hover:border-ink-400 transition-colors cursor-pointer"
				>
					{#if receiptFile}
						<FileText size={18} class="text-ink-400 shrink-0" />
						<span class="text-sm text-ink-700 truncate flex-1">{receiptFile.name}</span>
						<span class="text-xs text-ink-400 shrink-0">Tap to change</span>
					{:else}
						<Upload size={18} class="text-ink-400 shrink-0" />
						<span class="text-sm text-ink-500 flex-1">Upload a receipt image or PDF</span>
					{/if}
				</label>
				<input id="receipt" name="receipt" type="file" accept="image/*,.pdf" class="sr-only" bind:files={receiptFiles} />
				{#if receiptFile}
					<div class="mt-2 border border-ink-100 rounded-xl p-2">
						{#if receiptPreview}
							<img src={receiptPreview} alt="Receipt preview" class="w-full max-h-64 rounded-lg object-contain" />
						{:else}
							<div class="flex items-center gap-2 px-2 py-6 justify-center text-ink-400">
								<FileText size={24} />
								<span class="text-sm">{receiptFile.name}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-3.5">
				<div>
					<label class="label" for="user_id">Member <span class="text-red-500">*</span></label>
					<Select id="user_id" name="user_id" options={memberOptions} bind:value={userId} placeholder="Select member" searchable searchPlaceholder="Search members…" required />
				</div>
				<div>
					<label class="label" for="subscription_id">Subscription</label>
					<Select id="subscription_id" name="subscription_id" options={subOptions} bind:value={subId} disabled={!userId} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3.5">
				<div>
					<label class="label" for="amount">Amount (PKR) <span class="text-red-500">*</span></label>
					<input id="amount" name="amount" type="number" class="input" placeholder="5000" required min="1" bind:value={amount} />
					{#if selectedBalance != null}
						<p class="text-xs mt-1 {Number(amount) > selectedBalance ? 'text-red-500' : 'text-ink-400'}">Balance due: {formatPKR(selectedBalance)}</p>
					{/if}
				</div>
				<div>
					<label class="label" for="method">Payment Method <span class="text-red-500">*</span></label>
					<Select id="method" name="method" options={methodOptions} bind:value={method} required />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3.5">
				<div>
					<label class="label" for="paid_at">Payment Date <span class="text-red-500">*</span></label>
					<DatePicker id="paid_at" name="paid_at" bind:value={paidAt} placeholder="Payment date" />
				</div>
				<div>
					<label class="label" for="gym_id">Gym <span class="text-red-500">*</span></label>
					<Select id="gym_id" name="gym_id" options={gymOptions} bind:value={gymId} searchable searchPlaceholder="Search gyms…" required />
				</div>
			</div>
			<p class="text-xs text-ink-400 -mt-2">Backdate or postdate the payment date to record this payment against a different month</p>
			<div>
				<label class="label" for="notes">Notes</label>
				<input id="notes" name="notes" class="input" placeholder="Optional reference or notes" />
			</div>
			<div class="flex flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => goBack('/payments')} class="btn btn-secondary flex-1 text-center">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading || !userId}>
					{loading ? 'Recording…' : 'Record Payment'}
				</button>
			</div>
		</form>
	</div>
</div>
