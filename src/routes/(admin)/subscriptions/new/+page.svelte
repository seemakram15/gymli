<script>
	import { enhance } from '$app/forms';
	import { formatPKR } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let userId = $state(data.user_id ?? '');
	let packageId = $state('');
	let gymId = $state(data.member?.gym_id ?? '');
	let startDate = $state(new Date().toISOString().split('T')[0]);

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
</script>

<svelte:head><title>Add Subscription — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-lg mx-auto">
	<div class="mb-6">
		<a href={data.member ? `/members/${data.member.id}` : '/subscriptions'} class="text-sm text-ink-500 hover:text-ink-800">← Back</a>
		<h1 class="page-title mt-2">Add Subscription</h1>
		{#if data.member}<p class="text-ink-500 text-sm mt-1">Enrolling {data.member.full_name}</p>{/if}
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
			{#if data.member}
				<input type="hidden" name="user_id" value={data.member.id} />
				<div>
					<label class="label">Member</label>
					<p class="text-ink-900 font-medium py-2.5">{data.member.full_name}</p>
				</div>
			{:else}
				<div>
					<label class="label" for="user_id">Member *</label>
					<Select id="user_id" name="user_id" options={memberOptions} bind:value={userId} placeholder="Select member" required />
				</div>
			{/if}
			<div>
				<label class="label" for="package_id">Membership Plan *</label>
				<Select id="package_id" name="package_id" options={packageOptions} bind:value={packageId} placeholder="Select plan" required />
			</div>
			<div>
				<label class="label" for="gym_id">Gym Location</label>
				<Select id="gym_id" name="gym_id" options={gymOptions} bind:value={gymId} placeholder="Select gym" />
			</div>
			<div>
				<label class="label" for="start_date">Start Date</label>
				<DatePicker id="start_date" name="start_date" bind:value={startDate} placeholder="Start date" />
			</div>
			<div>
				<label class="label" for="amount_due">Fee Amount (PKR)</label>
				<input
					id="amount_due"
					name="amount_due"
					type="number"
					class="input"
					placeholder={selectedPackage ? String(selectedPackage.amount) : 'Auto-filled from plan'}
					min="0"
				/>
				<p class="text-xs text-ink-400 mt-1">Leave blank to use the plan's price ({selectedPackage ? formatPKR(selectedPackage.amount) : 'select a plan'}).</p>
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<a href={data.member ? `/members/${data.member.id}` : '/subscriptions'} class="btn btn-secondary flex-1 text-center">Cancel</a>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading}>
					{loading ? 'Saving…' : 'Add Subscription'}
				</button>
			</div>
		</form>
	</div>
</div>
