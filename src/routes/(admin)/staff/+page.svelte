<script>
	import { enhance } from '$app/forms';
	import { Plus, Phone } from 'lucide-svelte';
	import { initials, memberStatusBadge } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
	let role = $state('manager');
	let gymId = $state('');

	const roleColors = { manager: 'badge-blue', instructor: 'badge-green', staff: 'badge-gray' };

	const roleOptions = [
		{ value: 'manager', label: 'Manager / Front Desk' },
		{ value: 'instructor', label: 'Instructor / Trainer' },
		{ value: 'staff', label: 'Staff' }
	];

	const gymOptions = $derived([
		{ value: '', label: 'All Gyms' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);
</script>

<svelte:head><title>Staff — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Staff & Instructors</h1>
			<p class="text-ink-500 text-sm mt-1">{data.staff.length} team members</p>
		</div>
		<button onclick={() => { modalOpen = true; role = 'manager'; gymId = ''; }} class="btn btn-primary">
			<Plus size={16} /> Add Staff
		</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.staff as s}
			<div class="card p-5">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-12 h-12 bg-ink-900 text-volt-300 rounded-xl flex items-center justify-center font-bold text-lg">
						{initials(s.full_name)}
					</div>
					<div>
						<div class="font-semibold text-ink-900">{s.full_name}</div>
						<span class="{roleColors[s.role] ?? 'badge-gray'} mt-0.5">{s.role}</span>
					</div>
				</div>
				{#if s.phone_number}
					<div class="flex items-center gap-2 text-sm text-ink-500">
						<Phone size={13} />{s.phone_number}
					</div>
				{/if}
				{#if s.city}
					<div class="text-sm text-ink-400 mt-1">{s.city}</div>
				{/if}
				<div class="mt-2"><span class="{memberStatusBadge(s.status ?? 'active')}">{s.status ?? 'active'}</span></div>
			</div>
		{:else}
			<div class="md:col-span-3 card p-12 text-center text-ink-400">No staff members yet. Add your first team member.</div>
		{/each}
	</div>
</div>

<Modal open={modalOpen} title="Add Staff Member" onclose={() => (modalOpen = false)}>
	{#if form?.error}<div class="bg-red-50 text-red-700 rounded-xl px-3 py-2 text-sm mb-3">{form.error}</div>{/if}
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
		<div><label class="label">Full Name *</label><input name="full_name" class="input" required /></div>
		<div><label class="label">Email *</label><input name="email" type="email" class="input" required /></div>
		<div><label class="label">Phone</label><input name="phone_number" type="tel" class="input" /></div>
		<div>
			<label class="label">Role *</label>
			<Select name="role" options={roleOptions} bind:value={role} required />
		</div>
		{#if data.gyms.length}
			<div>
				<label class="label">Gym Location</label>
				<Select name="gym_id" options={gymOptions} bind:value={gymId} />
			</div>
		{/if}
		<div><label class="label">City</label><input name="city" class="input" /></div>
		<p class="text-xs text-ink-400">A random password will be generated. Staff can reset it from sign-in support.</p>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Adding…' : 'Add Staff'}</button>
		</div>
	</form>
</Modal>
