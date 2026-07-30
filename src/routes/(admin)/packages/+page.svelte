<script>
	import { enhance } from '$app/forms';
	import { Plus, Trash2, Package } from 'lucide-svelte';
	import { formatPKR } from '$lib/utils/format.js';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
</script>

<svelte:head><title>Plans — GymLi</title></svelte:head>

<div class="p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Membership Plans</h1>
			<p class="text-gray-500 text-sm">{data.packages.length} plans configured</p>
		</div>
		<button onclick={() => modalOpen = true} class="btn-primary btn"><Plus size={16} /> Add Plan</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.packages.filter(p => p.status === 'active') as pkg}
			<div class="card p-6">
				<div class="flex items-start justify-between mb-3">
					<div class="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
						<Package size={20} />
					</div>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={pkg.id} />
						<button type="submit" class="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
					</form>
				</div>
				<h3 class="font-bold text-gray-900 text-lg">{pkg.name}</h3>
				<div class="text-3xl font-extrabold text-brand-600 my-2">{formatPKR(pkg.amount)}</div>
				<div class="text-sm text-gray-500 mb-3">per {pkg.cycles?.name ?? 'cycle'}</div>
				{#if pkg.description}
					<p class="text-sm text-gray-500 mb-3">{pkg.description}</p>
				{/if}
				{#if pkg.package_services?.length}
					<div class="flex flex-wrap gap-1">
						{#each pkg.package_services as ps}
							<span class="badge-blue text-xs">{ps.services?.name}</span>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
		{#if data.packages.filter(p => p.status === 'active').length === 0}
			<div class="md:col-span-3 card p-12 text-center text-gray-400">
				No plans yet. Add your first membership plan.
			</div>
		{/if}
	</div>
</div>

<!-- Add Plan Modal -->
{#if modalOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
			<h3 class="text-lg font-bold text-gray-900 mb-4">Add Membership Plan</h3>
			<form method="POST" action="?/create" use:enhance={() => {
				loading = true;
				return async ({ update }) => { await update(); loading = false; modalOpen = false; };
			}} class="space-y-4">
				<div>
					<label class="label">Plan Name *</label>
					<input name="name" class="input" placeholder="e.g. Monthly Basic" required />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">Billing Cycle *</label>
						<select name="cycle_id" class="input" required>
							<option value="">Select cycle</option>
							{#each data.cycles as c}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
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
								<label class="flex items-center gap-1.5 text-sm cursor-pointer">
									<input type="checkbox" name="service_ids" value={s.id} class="rounded border-gray-300 text-brand-600" />
									{s.name}
								</label>
							{/each}
						</div>
					</div>
				{/if}
				<div class="flex gap-3 pt-2">
					<button type="button" onclick={() => modalOpen = false} class="btn-secondary btn flex-1">Cancel</button>
					<button type="submit" class="btn-primary btn flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Plan'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
