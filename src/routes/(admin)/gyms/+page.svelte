<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Building2, Plus, Trash2, Pencil, MapPin, Phone, Search } from 'lucide-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let editingGym = $state(null);
	let loading = $state(false);
	let confirmOpen = $state(false);
	let pendingDeleteId = $state('');
	let pendingDeleteName = $state('');

	const isSuperadmin = $derived(data.profile?.role === 'superadmin');

	function canEdit(gym) {
		return isSuperadmin || gym.id === data.profile?.gym_id;
	}

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

	function openEdit(gym) {
		editingGym = gym;
	}

	let search = $state('');
	const activeGyms = $derived(data.gyms.filter((g) => g.status === 'active'));
	const filteredGyms = $derived(
		search.trim()
			? activeGyms.filter((g) => {
					const q = search.trim().toLowerCase();
					return g.name?.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q);
				})
			: activeGyms
	);
</script>

<svelte:head><title>Gym Locations — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Gym Locations</h1>
			<p class="text-ink-500 text-sm mt-1">{data.gyms.filter((g) => g.status === 'active').length} active locations</p>
		</div>
		{#if isSuperadmin}
			<button onclick={() => (modalOpen = true)} class="btn btn-primary"><Plus size={16} /> Add Gym</button>
		{/if}
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="relative max-w-sm">
		<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
		<input class="input pl-9" placeholder="Search by name or city…" bind:value={search} />
	</div>

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
		{#each filteredGyms as gym}
			<div
				role="button"
				tabindex="0"
				onclick={() => goto(`/gyms/${gym.id}`)}
				onkeydown={(e) => e.key === 'Enter' && goto(`/gyms/${gym.id}`)}
				class="card p-5 sm:p-6 flex flex-col hover:shadow-sm hover:border-ink-200 transition-all cursor-pointer"
			>
				<div class="flex items-start justify-between mb-4">
					<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background: linear-gradient(135deg, var(--color-volt-400), var(--color-volt-500));">
						<Building2 size={22} class="text-ink-950" />
					</div>
					<span class="badge-green">Active</span>
				</div>

				<h3 class="font-display font-bold text-ink-900 text-lg mb-2 truncate">{gym.name}</h3>

				<div class="space-y-1.5 text-sm text-ink-500 flex-1">
					<div class="flex items-center gap-2 min-w-0">
						<MapPin size={13} class="shrink-0 text-ink-300" />
						<span class="truncate">{gym.city}{gym.address ? ` — ${gym.address}` : ''}</span>
					</div>
					{#if gym.phone}
						<div class="flex items-center gap-2"><Phone size={13} class="shrink-0 text-ink-300" />{gym.phone}</div>
					{/if}
					{#if gym.email}
						<div class="text-xs text-ink-400 truncate">{gym.email}</div>
					{/if}
				</div>

				{#if gym.description}
					<p class="text-xs text-ink-400 mt-3 pt-3 border-t border-ink-100 line-clamp-2">{gym.description}</p>
				{/if}

				{#if canEdit(gym) || isSuperadmin}
					<div class="flex justify-end gap-4 mt-4 pt-3 border-t border-ink-100">
						{#if canEdit(gym)}
							<button
								type="button"
								onclick={(e) => { e.stopPropagation(); openEdit(gym); }}
								class="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-800 transition-colors"
							>
								<Pencil size={13} /> Edit
							</button>
						{/if}
						{#if isSuperadmin}
							<button
								type="button"
								onclick={(e) => { e.stopPropagation(); askDelete(gym); }}
								class="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-red-600 transition-colors"
							>
								<Trash2 size={13} /> Remove
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
		{#if filteredGyms.length === 0}
			<div class="md:col-span-3 card p-12 text-center text-ink-400">
				{search.trim() ? 'No gyms match your search.' : 'No gym locations yet. Add your first gym.'}
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

{#if isSuperadmin}
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
			<div><label class="label">Description</label><textarea name="description" class="input" rows="2" placeholder="Short description of this location"></textarea></div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (modalOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Add Gym'}</button>
			</div>
		</form>
	</Modal>
{/if}

<Modal open={!!editingGym} title="Edit Gym Location" onclose={() => (editingGym = null)}>
	{#if editingGym}
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
					editingGym = null;
				};
			}}
			class="space-y-3"
		>
			<input type="hidden" name="id" value={editingGym.id} />
			<div><label class="label">Gym Name *</label><input name="name" class="input" required value={editingGym.name ?? ''} placeholder="Power Zone Gym" /></div>
			<div><label class="label">City *</label><input name="city" class="input" required value={editingGym.city ?? ''} placeholder="Lahore" /></div>
			<div><label class="label">Address</label><input name="address" class="input" value={editingGym.address ?? ''} placeholder="Street, Area" /></div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div><label class="label">Phone</label><input name="phone" type="tel" class="input" value={editingGym.phone ?? ''} placeholder="+92 300…" /></div>
				<div><label class="label">Email</label><input name="email" type="email" class="input" value={editingGym.email ?? ''} placeholder="gym@email.com" /></div>
			</div>
			<div><label class="label">Description</label><textarea name="description" class="input" rows="2" placeholder="Short description of this location">{editingGym.description ?? ''}</textarea></div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (editingGym = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
			</div>
		</form>
	{/if}
</Modal>
