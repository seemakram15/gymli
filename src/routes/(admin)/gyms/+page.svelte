<script>
	import { enhance } from '$app/forms';
	import { Building2, Plus, Trash2, MapPin, Phone } from 'lucide-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
	let confirmOpen = $state(false);
	let pendingDeleteId = $state('');
	let pendingDeleteName = $state('');

	function askDelete(gym) {
		pendingDeleteId = gym.id;
		pendingDeleteName = gym.name;
		confirmOpen = true;
	}

	function submitDelete() {
		const formEl = document.getElementById('delete-gym-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}
</script>

<svelte:head><title>Gym Locations — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Gym Locations</h1>
			<p class="text-ink-500 text-sm mt-1">{data.gyms.filter((g) => g.status === 'active').length} active locations</p>
		</div>
		<button onclick={() => (modalOpen = true)} class="btn btn-primary"><Plus size={16} /> Add Gym</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
		{#each data.gyms.filter((g) => g.status === 'active') as gym}
			<div class="card p-5 sm:p-6 overflow-hidden relative">
				<div class="absolute inset-x-0 top-0 h-24 opacity-40 pointer-events-none" style="background: linear-gradient(135deg, #1a1a17, #3d3d38);"></div>
				<div class="relative flex items-start justify-between mb-4">
					<div class="w-12 h-12 bg-volt-400 text-ink-950 rounded-xl flex items-center justify-center">
						<Building2 size={22} />
					</div>
					<button
						type="button"
						onclick={() => askDelete(gym)}
						class="p-2 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors bg-white/80"
						aria-label="Remove gym"
					>
						<Trash2 size={16} />
					</button>
				</div>
				<h3 class="relative font-display font-bold text-ink-900 text-lg mb-1">{gym.name}</h3>
				<div class="relative space-y-1 text-sm text-ink-500">
					<div class="flex items-center gap-2"><MapPin size={13} />{gym.city}{gym.address ? ` — ${gym.address}` : ''}</div>
					{#if gym.phone}<div class="flex items-center gap-2"><Phone size={13} />{gym.phone}</div>{/if}
					{#if gym.email}<div class="text-xs text-ink-600 font-medium">{gym.email}</div>{/if}
				</div>
				{#if gym.description}
					<p class="relative text-xs text-ink-400 mt-3 border-t border-ink-100 pt-3">{gym.description}</p>
				{/if}
			</div>
		{/each}
		{#if data.gyms.filter((g) => g.status === 'active').length === 0}
			<div class="md:col-span-3 card p-12 text-center text-ink-400">
				No gym locations yet. Add your first gym.
			</div>
		{/if}
	</div>
</div>

<form id="delete-gym-form" method="POST" action="?/delete" use:enhance class="hidden">
	<input type="hidden" name="id" value={pendingDeleteId} />
</form>

<ConfirmDialog
	open={confirmOpen}
	title="Remove this gym?"
	message={`“${pendingDeleteName}” will be marked inactive. Member records stay intact.`}
	confirmLabel="Remove gym"
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitDelete}
/>

<Modal open={modalOpen} title="Add Gym Location" onclose={() => (modalOpen = false)}>
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
		class="space-y-3"
	>
		<div><label class="label">Gym Name *</label><input name="name" class="input" required placeholder="Power Zone Gym" /></div>
		<div><label class="label">City *</label><input name="city" class="input" required placeholder="Lahore" /></div>
		<div><label class="label">Address</label><input name="address" class="input" placeholder="Street, Area" /></div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<div><label class="label">Phone</label><input name="phone" type="tel" class="input" placeholder="+92 300…" /></div>
			<div><label class="label">Email</label><input name="email" type="email" class="input" placeholder="gym@email.com" /></div>
		</div>
		<div><label class="label">Description</label><textarea name="description" class="input" rows="2"></textarea></div>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Add Gym'}</button>
		</div>
	</form>
</Modal>
