<script>
	import { enhance } from '$app/forms';
	import { Building2, Plus, Trash2, MapPin, Phone } from 'lucide-svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
</script>

<svelte:head><title>Gym Locations — GymLi</title></svelte:head>

<div class="p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Gym Locations</h1>
			<p class="text-gray-500 text-sm">{data.gyms.filter(g => g.status === 'active').length} active locations</p>
		</div>
		<button onclick={() => modalOpen = true} class="btn-primary btn"><Plus size={16} /> Add Gym</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
		{#each data.gyms.filter(g => g.status === 'active') as gym}
			<div class="card p-6">
				<div class="flex items-start justify-between mb-4">
					<div class="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
						<Building2 size={24} />
					</div>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={gym.id} />
						<button type="submit" class="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
					</form>
				</div>
				<h3 class="font-bold text-gray-900 text-lg mb-1">{gym.name}</h3>
				<div class="space-y-1 text-sm text-gray-500">
					<div class="flex items-center gap-2"><MapPin size={13} />{gym.city}{gym.address ? ` — ${gym.address}` : ''}</div>
					{#if gym.phone}<div class="flex items-center gap-2"><Phone size={13} />{gym.phone}</div>{/if}
					{#if gym.email}<div class="text-xs text-brand-600">{gym.email}</div>{/if}
				</div>
				{#if gym.description}
					<p class="text-xs text-gray-400 mt-3 border-t pt-3">{gym.description}</p>
				{/if}
			</div>
		{/each}
		{#if data.gyms.filter(g => g.status === 'active').length === 0}
			<div class="md:col-span-3 card p-12 text-center text-gray-400">
				No gym locations yet. Add your first gym.
			</div>
		{/if}
	</div>
</div>

{#if modalOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
			<h3 class="text-lg font-bold mb-4">Add Gym Location</h3>
			<form method="POST" action="?/create" use:enhance={() => {
				loading = true;
				return async ({ update }) => { await update(); loading = false; modalOpen = false; };
			}} class="space-y-3">
				<div><label class="label">Gym Name *</label><input name="name" class="input" required placeholder="Power Zone Gym" /></div>
				<div><label class="label">City *</label><input name="city" class="input" required placeholder="Lahore" /></div>
				<div><label class="label">Address</label><input name="address" class="input" placeholder="Street, Area" /></div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class="label">Phone</label><input name="phone" type="tel" class="input" placeholder="+92 300…" /></div>
					<div><label class="label">Email</label><input name="email" type="email" class="input" placeholder="gym@email.com" /></div>
				</div>
				<div><label class="label">Description</label><textarea name="description" class="input" rows="2"></textarea></div>
				<div class="flex gap-3 pt-2">
					<button type="button" onclick={() => modalOpen = false} class="btn-secondary btn flex-1">Cancel</button>
					<button type="submit" class="btn-primary btn flex-1" disabled={loading}>{loading ? 'Saving…' : 'Add Gym'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
