<script>
	import { enhance } from '$app/forms';
	import { Plus, Phone, Pencil, Trash2, User, Camera } from 'lucide-svelte';
	import { initials, memberStatusBadge } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Select from '$lib/components/Select.svelte';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);
	let role = $state('instructor');
	let gymId = $state('');

	let editingStaff = $state(null);
	let editRole = $state('instructor');
	let editStatus = $state('active');
	let confirmOpen = $state(false);
	let pendingDeleteId = $state('');
	let pendingDeleteName = $state('');

	let avatarPreview = $state('');
	let editAvatarPreview = $state('');

	function onAvatarChange(e, setter) {
		const file = e.currentTarget.files?.[0];
		if (!file) { setter(''); return; }
		const reader = new FileReader();
		reader.onload = () => setter(reader.result);
		reader.readAsDataURL(file);
	}

	const isSuperadmin = $derived(data.profile?.role === 'superadmin');
	const isManager = $derived(data.profile?.role === 'manager');

	const roleColors = { manager: 'badge-blue', instructor: 'badge-green', staff: 'badge-gray' };

	const allRoleOptions = [
		{ value: 'manager', label: 'Manager / Front Desk' },
		{ value: 'instructor', label: 'Instructor / Trainer' },
		{ value: 'staff', label: 'Staff' }
	];
	// Managers can create/edit instructors and staff, but not peer managers.
	const roleOptions = $derived(isSuperadmin ? allRoleOptions : allRoleOptions.filter((r) => r.value !== 'manager'));

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
	];

	const gymOptions = $derived([
		{ value: '', label: 'All Gyms' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);

	function openEdit(s) {
		editingStaff = s;
		editRole = s.role;
		editStatus = s.status ?? 'active';
		editAvatarPreview = s.avatar_url ?? '';
	}

	function askDelete(s) {
		pendingDeleteId = s.id;
		pendingDeleteName = s.full_name;
		confirmOpen = true;
	}

	function submitDelete() {
		const formEl = document.getElementById('delete-staff-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}
</script>

<svelte:head><title>Staff — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Staff & Instructors</h1>
			<p class="text-ink-500 text-sm mt-1">{data.staff.length} team members</p>
		</div>
		{#if isSuperadmin || isManager}
			<button onclick={() => { modalOpen = true; role = 'instructor'; gymId = ''; avatarPreview = ''; }} class="btn btn-primary">
				<Plus size={16} /> Add Staff
			</button>
		{/if}
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.staff as s}
			<div class="card p-5">
				<div class="flex items-center gap-4 mb-3">
					{#if s.avatar_url}
						<img src={s.avatar_url} alt={s.full_name} class="w-12 h-12 rounded-xl object-cover shrink-0" />
					{:else}
						<div class="w-12 h-12 bg-ink-900 text-volt-300 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
							{initials(s.full_name)}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="font-semibold text-ink-900 truncate">{s.full_name}</div>
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
				<div class="mt-2 flex items-center justify-between">
					<span class="{memberStatusBadge(s.status ?? 'active')}">{s.status ?? 'active'}</span>
					{#if (isSuperadmin || isManager) && !(isManager && s.role === 'manager')}
						<div class="flex items-center gap-3">
							<button type="button" onclick={() => openEdit(s)} class="text-ink-400 hover:text-ink-800 transition-colors" aria-label="Edit staff member"><Pencil size={14} /></button>
							<button type="button" onclick={() => askDelete(s)} class="text-ink-400 hover:text-red-600 transition-colors" aria-label="Remove staff member"><Trash2 size={14} /></button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="md:col-span-3 card p-12 text-center text-ink-400">No staff members yet. Add your first team member.</div>
		{/each}
	</div>
</div>

<form id="delete-staff-form" method="POST" action="?/delete" use:enhance class="hidden">
	<input type="hidden" name="id" value={pendingDeleteId} />
</form>

<ConfirmDialog
	open={confirmOpen}
	title="Remove this team member?"
	message={`"${pendingDeleteName}" will be marked inactive and lose access to sign in.`}
	confirmLabel="Remove"
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitDelete}
/>

<Modal open={modalOpen} title="Add Staff Member" onclose={() => (modalOpen = false)}>
	{#if form?.error}<div class="bg-red-50 text-red-700 rounded-xl px-3 py-2 text-sm mb-3">{form.error}</div>{/if}
	<form
		method="POST"
		action="?/create"
		enctype="multipart/form-data"
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
		<div class="flex justify-center">
			<label class="relative cursor-pointer group">
				{#if avatarPreview}
					<img src={avatarPreview} alt="Preview" class="w-24 h-24 rounded-full object-cover ring-4 ring-ink-100" />
				{:else}
					<div class="w-24 h-24 rounded-full bg-ink-50 ring-4 ring-ink-100 flex items-center justify-center text-ink-300">
						<User size={32} />
					</div>
				{/if}
				<span class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ink-900 text-volt-300 flex items-center justify-center ring-2 ring-white group-hover:bg-ink-700 transition-colors">
					<Camera size={14} />
				</span>
				<input
					name="avatar"
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={(e) => onAvatarChange(e, (v) => (avatarPreview = v))}
				/>
			</label>
		</div>

		<div><label class="label">Full Name <span class="text-red-500">*</span></label><input name="full_name" class="input" required placeholder="Full name" /></div>
		<div><label class="label">Email <span class="text-red-500">*</span></label><input name="email" type="email" class="input" required placeholder="name@email.com" /></div>

		<div class="grid grid-cols-2 gap-3">
			<div><label class="label">Phone <span class="text-red-500">*</span></label><input name="phone_number" type="tel" class="input" required placeholder="+92 300 1234567" /></div>
			<div><label class="label">City</label><input name="city" class="input" placeholder="Lahore" /></div>
		</div>

		<div class="grid {isSuperadmin && data.gyms.length ? 'grid-cols-2' : 'grid-cols-1'} gap-3">
			<div>
				<label class="label">Role <span class="text-red-500">*</span></label>
				<Select name="role" options={roleOptions} bind:value={role} required />
			</div>
			{#if isSuperadmin && data.gyms.length}
				<div>
					<label class="label">Gym Location</label>
					<Select name="gym_id" options={gymOptions} bind:value={gymId} searchable searchPlaceholder="Search gyms…" />
				</div>
			{/if}
		</div>

		<p class="text-xs text-ink-400">A temporary password will be generated and emailed to them along with their login details.</p>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => (modalOpen = false)} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Adding…' : 'Add Staff'}</button>
		</div>
	</form>
</Modal>

<Modal open={!!editingStaff} title="Edit Staff Member" onclose={() => (editingStaff = null)}>
	{#if editingStaff}
		<form
			method="POST"
			action="?/update"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
					editingStaff = null;
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={editingStaff.id} />

			<div class="flex justify-center">
				<label class="relative cursor-pointer group">
					{#if editAvatarPreview}
						<img src={editAvatarPreview} alt="Preview" class="w-24 h-24 rounded-full object-cover ring-4 ring-ink-100" />
					{:else}
						<div class="w-24 h-24 rounded-full bg-ink-900 text-volt-300 ring-4 ring-ink-100 flex items-center justify-center font-bold text-2xl">
							{initials(editingStaff.full_name)}
						</div>
					{/if}
					<span class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ink-900 text-volt-300 flex items-center justify-center ring-2 ring-white group-hover:bg-ink-700 transition-colors">
						<Camera size={14} />
					</span>
					<input
						name="avatar"
						type="file"
						accept="image/*"
						class="sr-only"
						onchange={(e) => onAvatarChange(e, (v) => (editAvatarPreview = v))}
					/>
				</label>
			</div>

			<div><label class="label">Full Name <span class="text-red-500">*</span></label><input name="full_name" class="input" required value={editingStaff.full_name ?? ''} placeholder="Full name" /></div>

			<div class="grid grid-cols-2 gap-3">
				<div><label class="label">Phone <span class="text-red-500">*</span></label><input name="phone_number" type="tel" class="input" required value={editingStaff.phone_number ?? ''} placeholder="+92 300 1234567" /></div>
				<div><label class="label">City</label><input name="city" class="input" value={editingStaff.city ?? ''} placeholder="Lahore" /></div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="label">Role <span class="text-red-500">*</span></label>
					<Select name="role" options={roleOptions} bind:value={editRole} required />
				</div>
				<div>
					<label class="label">Status</label>
					<Select name="status" options={statusOptions} bind:value={editStatus} />
				</div>
			</div>

			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (editingStaff = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
			</div>
		</form>
	{/if}
</Modal>
