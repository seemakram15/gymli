<script>
	import { enhance } from '$app/forms';
	import { Plus, Trash2, Package } from 'lucide-svelte';
	import { formatPKR } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Select from '$lib/components/Select.svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
	let confirmOpen = $state(false);
	let pendingDeleteId = $state('');
	let pendingDeleteName = $state('');
	let cycleId = $state('');

	const cycleOptions = $derived([
		{ value: '', label: 'Select cycle' },
		...data.cycles.map((c) => ({ value: c.id, label: c.name }))
	]);

	function askDelete(pkg) {
		pendingDeleteId = pkg.id;
		pendingDeleteName = pkg.name;
		confirmOpen = true;
	}

	function submitDelete() {
		const formEl = document.getElementById('delete-plan-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}
</script>

<svelte:head><title>Plans — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Membership Plans</h1>
			<p class="text-ink-500 text-sm mt-1">{data.packages.length} plans configured</p>
		</div>
		<button onclick={() => { modalOpen = true; cycleId = ''; }} class="btn btn-primary">
			<Plus size={16} /> Add Plan
		</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.packages.filter((p) => p.status === 'active') as pkg}
			<div class="card p-5 sm:p-6 group">
				<div class="flex items-start justify-between mb-3">
					<div class="w-10 h-10 bg-ink-900 text-volt-300 rounded-xl flex items-center justify-center">
						<Package size={20} />
					</div>
					<button
						type="button"
						onclick={() => askDelete(pkg)}
						class="p-2 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors"
						aria-label="Delete plan"
					>
						<Trash2 size={16} />
					</button>
				</div>
				<h3 class="font-display font-bold text-ink-900 text-lg">{pkg.name}</h3>
				<div class="text-3xl font-extrabold text-ink-900 my-2">{formatPKR(pkg.amount)}</div>
				<div class="text-sm text-ink-500 mb-3">per {pkg.cycles?.name ?? 'cycle'}</div>
				{#if pkg.description}
					<p class="text-sm text-ink-500 mb-3">{pkg.description}</p>
				{/if}
				{#if pkg.package_services?.length}
					<div class="flex flex-wrap gap-1.5">
						{#each pkg.package_services as ps}
							<span class="badge-green text-xs">{ps.services?.name}</span>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
		{#if data.packages.filter((p) => p.status === 'active').length === 0}
			<div class="md:col-span-3 card p-12 text-center text-ink-400">
				No plans yet. Add your first membership plan.
			</div>
		{/if}
	</div>
</div>

<form id="delete-plan-form" method="POST" action="?/delete" use:enhance class="hidden">
	<input type="hidden" name="id" value={pendingDeleteId} />
</form>

<ConfirmDialog
	open={confirmOpen}
	title="Remove this plan?"
	message={`“${pendingDeleteName}” will be deactivated. Members on this plan keep their history.`}
	confirmLabel="Remove plan"
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitDelete}
/>

<Modal open={modalOpen} title="Add Membership Plan" onclose={() => (modalOpen = false)}>
	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
				modalOpen = false;
			};
		}}
		class="space-y-4"
	>
		<div>
			<label class="label">Plan Name *</label>
			<input name="name" class="input" placeholder="e.g. Monthly Basic" required />
		</div>
		<div class="grid sm:grid-cols-2 gap-4">
			<div>
				<label class="label">Billing Cycle *</label>
				<Select name="cycle_id" options={cycleOptions} bind:value={cycleId} placeholder="Select cycle" required />
			</div>
			<div>
				<label class="label">Amount (PKR) *</label>
				<input name="amount" type="number" class="input" placeholder="5000" required min="0" />
			</div>
		</div>
		<div>
			<label class="label">Description</label>
			<textarea name="description" class="input" rows="2" placeholder="What's included in this plan…"></textarea>
		</div>
		{#if data.services.length}
			<div>
				<label class="label">Included Services</label>
				<div class="flex flex-wrap gap-2 mt-1">
					{#each data.services as s}
						<label class="flex items-center gap-1.5 text-sm cursor-pointer bg-ink-50 border border-ink-100 rounded-lg px-3 py-2 hover:border-ink-300">
							<input type="checkbox" name="service_ids" value={s.id} class="rounded border-ink-300 accent-ink-900" />
							{s.name}
						</label>
					{/each}
				</div>
			</div>
		{/if}
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Plan'}</button>
		</div>
	</form>
</Modal>
