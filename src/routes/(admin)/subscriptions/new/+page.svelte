<script>
	import { enhance } from '$app/forms';
	import { formatPKR } from '$lib/utils/format.js';
	import { goBack } from '$lib/utils/nav.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let userId = $state(data.user_id ?? '');
	let packageId = $state('');
	let gymId = $state(data.member?.gym_id ?? '');
	let startDate = $state(new Date().toISOString().split('T')[0]);
	let amountDue = $state('');
	let discount = $state('');

	const memberOptions = $derived([
		{ value: '', label: 'Select member' },
		...data.members.map((m) => ({ value: m.id, label: `${m.full_name}${m.phone_number ? ' — ' + m.phone_number : ''}` }))
	]);

	const packageOptions = $derived([
		{ value: '', label: 'Select plan' },
		...data.packages.map((p) => ({
			value: p.id,
			label: `${p.name} — PKR ${p.amount} / ${p.cycles?.name ?? 'custom'}`
		}))
	]);

	const gymOptions = $derived([
		{ value: '', label: 'Select gym' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);

	const selectedPackage = $derived(data.packages.find((p) => p.id === packageId));
	let clientError = $state('');

	function validate() {
		const missing = [];
		if (!data.member && !userId) missing.push('Member');
		if (!packageId) missing.push('Membership Plan');
		if (!gymId) missing.push('Gym Location');
		if (!startDate) missing.push('Start Date');
		if (!String(amountDue).trim()) missing.push('Fee Amount (PKR)');
		return missing;
	}
</script>

<svelte:head><title>Add Subscription — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-lg mx-auto">
	<div class="mb-6">
		<button type="button" onclick={() => goBack(data.member ? `/members/${data.member.id}` : '/subscriptions')} class="text-sm text-ink-500 hover:text-ink-800">← Back</button>
		<h1 class="page-title mt-2">Add Subscription</h1>
		{#if data.member}<p class="text-ink-500 text-sm mt-1">Enrolling {data.member.full_name}</p>{/if}
	</div>

	{#if clientError || form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{clientError || form?.error}</div>
	{/if}

	<div class="card card-body">
		<form
			method="POST"
			use:enhance={({ cancel }) => {
				clientError = '';
				const missing = validate();
				if (missing.length) {
					cancel();
					clientError = `Please complete the following required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`;
					window.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}
				loading = true;
				return async ({ update }) => { await update(); loading = false; };
			}}
			class="space-y-4"
		>
			{#if data.member}
				<input type="hidden" name="user_id" value={data.member.id} />
				<div>
					<label class="label">Member</label>
					<p class="text-ink-900 font-medium py-2.5">{data.member.full_name}</p>
				</div>
			{:else}
				<div>
					<label class="label" for="user_id">Member <span class="text-red-500">*</span></label>
					<Select id="user_id" name="user_id" options={memberOptions} bind:value={userId} placeholder="Select member" searchable searchPlaceholder="Search members…" required />
				</div>
			{/if}
			<div>
				<label class="label" for="package_id">Membership Plan <span class="text-red-500">*</span></label>
				<Select id="package_id" name="package_id" options={packageOptions} bind:value={packageId} placeholder="Select plan" required />
			</div>
			<div>
				<label class="label" for="gym_id">Gym Location <span class="text-red-500">*</span></label>
				<Select id="gym_id" name="gym_id" options={gymOptions} bind:value={gymId} placeholder="Select gym" searchable searchPlaceholder="Search gyms…" required />
			</div>
			<div>
				<label class="label" for="start_date">Start Date <span class="text-red-500">*</span></label>
				<DatePicker id="start_date" name="start_date" bind:value={startDate} placeholder="Start date" />
			</div>
			<div>
				<label class="label" for="amount_due">Fee Amount (PKR) <span class="text-red-500">*</span></label>
				<input
					id="amount_due"
					name="amount_due"
					type="number"
					class="input"
					placeholder={selectedPackage ? String(selectedPackage.amount) : 'Enter fee amount'}
					min="0"
					required
					bind:value={amountDue}
				/>
				<p class="text-xs text-ink-400 mt-1">{selectedPackage ? `Plan price: ${formatPKR(selectedPackage.amount)}` : 'Select a plan to see its price'}</p>
			</div>
			<div>
				<label class="label" for="discount">Discount (PKR)</label>
				<input id="discount" name="discount" type="number" class="input" placeholder="0" min="0" bind:value={discount} />
				<p class="text-xs text-ink-400 mt-1">Optional — deducted from the fee amount above.</p>
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => goBack(data.member ? `/members/${data.member.id}` : '/subscriptions')} class="btn btn-secondary flex-1 text-center">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading}>
					{loading ? 'Saving…' : 'Add Subscription'}
				</button>
			</div>
		</form>
	</div>
</div>
