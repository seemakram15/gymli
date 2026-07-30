<script>
	import { enhance } from '$app/forms';
	import { Bell, User, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form } = $props();
	let tab = $state('profile');

	const isSuperadmin = $derived(data.profile?.role === 'superadmin');
	const canManagePlans = $derived(data.profile?.role === 'superadmin' || data.profile?.role === 'manager');

	const allTabs = [
		['profile', 'Account', true],
		['reminders', 'Reminders', isSuperadmin],
		['cycles', 'Billing Cycles', canManagePlans],
		['services', 'Services', canManagePlans],
	];
	const tabs = $derived(allTabs.filter(([, , visible]) => visible));

	let editingCycle = $state(null);
	let editingService = $state(null);
	let confirmOpen = $state(false);
	let pendingDelete = $state(null); // { kind: 'cycle' | 'service', id, name }

	function askDeleteCycle(c) {
		pendingDelete = { kind: 'cycle', id: c.id, name: c.name };
		confirmOpen = true;
	}
	function askDeleteService(s) {
		pendingDelete = { kind: 'service', id: s.id, name: s.name };
		confirmOpen = true;
	}
	function submitDelete() {
		const formEl = document.getElementById('delete-billing-item-form');
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
		confirmOpen = false;
	}
</script>

<svelte:head><title>Settings — GymLi</title></svelte:head>

<div class="p-6 max-w-4xl mx-auto space-y-6">
	<h1 class="page-title">Settings</h1>

	<div class="flex gap-1 border-b border-ink-200 overflow-x-auto">
		{#each tabs as [id, label]}
			<button onclick={() => tab = id} class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
				{tab === id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'}">
				{label}
			</button>
		{/each}
	</div>

	<!-- Profile -->
	{#if tab === 'profile'}
		<div class="card card-body">
			<h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2"><User size={16} /> Account Information</h3>
			{#if form?.profileSuccess}<div class="bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm mb-4">Profile updated!</div>{/if}
			<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
				<div class="grid md:grid-cols-2 gap-4">
					<div><label class="label">Full Name</label><input name="full_name" class="input" placeholder="Full name" value={data.profile.full_name ?? ''} /></div>
					<div><label class="label">Phone</label><input name="phone_number" type="tel" class="input" placeholder="+92 300 1234567" value={data.profile.phone_number ?? ''} /></div>
					<div><label class="label">City</label><input name="city" class="input" placeholder="Lahore" value={data.profile.city ?? ''} /></div>
				</div>
				<button type="submit" class="btn-primary btn">Save Profile</button>
			</form>
		</div>
	{/if}

	<!-- Reminders -->
	{#if tab === 'reminders' && isSuperadmin}
		<div class="card card-body">
			<h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2"><Bell size={16} /> Automated Reminder Settings</h3>
			{#if form?.reminderSuccess}<div class="bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm mb-4">Settings saved!</div>{/if}
			<form method="POST" action="?/updateReminders" use:enhance class="space-y-5">
				<div class="bg-blue-50 rounded-lg p-4 space-y-3">
					<h4 class="font-medium text-blue-900">Due-Soon Reminders</h4>
					<div class="flex items-center gap-4">
						<label class="label mb-0 whitespace-nowrap">Days before due:</label>
						<input name="due_soon_days" type="number" class="input w-20" value={data.reminderSettings.due_soon_days} min="1" max="30" />
					</div>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="due_soon_email" class="rounded text-brand-600" checked={data.reminderSettings.due_soon_email} />
						Send email reminder
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="due_soon_sms" class="rounded text-brand-600" checked={data.reminderSettings.due_soon_sms} />
						Send SMS reminder
					</label>
				</div>

				<div class="bg-yellow-50 rounded-lg p-4 space-y-3">
					<h4 class="font-medium text-yellow-900">Due-Today Reminders</h4>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="due_today_email" class="rounded text-brand-600" checked={data.reminderSettings.due_today_email} />
						Send email on due date if unpaid
					</label>
				</div>

				<div class="bg-red-50 rounded-lg p-4 space-y-3">
					<h4 class="font-medium text-red-900">Overdue Escalation</h4>
					<div>
						<label class="label">Send reminders at days overdue (comma-separated):</label>
						<input name="overdue_intervals" class="input font-mono" value={data.reminderSettings.overdue_intervals} placeholder="3,7,14" />
						<p class="text-xs text-ink-400 mt-1">Example: 3,7,14 sends reminders 3, 7, and 14 days after due date</p>
					</div>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="overdue_email" class="rounded text-brand-600" checked={data.reminderSettings.overdue_email} />
						Send overdue email reminders
					</label>
					<div class="flex items-center gap-4 pt-2 border-t border-red-100">
						<label class="label mb-0 whitespace-nowrap">Check-in grace period (days overdue still allowed):</label>
						<input name="overdue_grace_days" type="number" class="input w-20" value={data.reminderSettings.overdue_grace_days} min="0" />
					</div>
				</div>

				<div class="bg-purple-50 rounded-lg p-4 space-y-3">
					<h4 class="font-medium text-purple-900">Expiry Reminders</h4>
					<div class="flex items-center gap-4">
						<label class="label mb-0 whitespace-nowrap">Days before expiry:</label>
						<input name="expiry_reminder_days" type="number" class="input w-20" value={data.reminderSettings.expiry_reminder_days} min="1" />
					</div>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="expiry_reminder_email" class="rounded text-brand-600" checked={data.reminderSettings.expiry_reminder_email} />
						Send expiry reminder email
					</label>
				</div>

				<div class="bg-ink-50 rounded-lg p-4 space-y-3">
					<h4 class="font-medium text-ink-900">Attendance Re-engagement</h4>
					<div class="flex items-center gap-4">
						<label class="label mb-0 whitespace-nowrap">Days inactive before email:</label>
						<input name="inactivity_days" type="number" class="input w-20" value={data.reminderSettings.inactivity_days} min="1" />
					</div>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="inactivity_email" class="rounded text-brand-600" checked={data.reminderSettings.inactivity_email} />
						Email members who haven't checked in recently
					</label>
				</div>

				<button type="submit" class="btn-primary btn">Save Reminder Settings</button>
			</form>
		</div>
	{/if}

	<!-- Billing Cycles -->
	{#if tab === 'cycles' && canManagePlans}
		<div class="card card-body space-y-4">
			<h3 class="font-semibold text-ink-900 mb-2 flex items-center gap-2"><RefreshCw size={16} /> Billing Cycles</h3>
			<div class="table-wrapper">
				<table>
					<thead><tr><th>Cycle Name</th><th>Duration (Days)</th><th></th></tr></thead>
					<tbody>
						{#each data.cycles as c}
							<tr>
								<td class="font-medium">{c.name}</td>
								<td>{c.interval_days} days</td>
								<td>
									<div class="flex items-center gap-3 justify-end">
										<button type="button" onclick={() => (editingCycle = c)} class="text-ink-400 hover:text-ink-800 transition-colors" aria-label="Edit cycle"><Pencil size={14} /></button>
										<button type="button" onclick={() => askDeleteCycle(c)} class="text-ink-400 hover:text-red-600 transition-colors" aria-label="Remove cycle"><Trash2 size={14} /></button>
									</div>
								</td>
							</tr>
						{:else}
							<tr><td colspan="3" class="text-center text-ink-400 py-6">No billing cycles yet</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
			<form method="POST" action="?/addCycle" use:enhance class="flex gap-3 mt-4">
				<input name="name" class="input" placeholder="e.g. Monthly" required />
				<input name="interval_days" type="number" class="input w-28" placeholder="Days (30)" required min="1" />
				<button type="submit" class="btn-primary btn shrink-0"><Plus size={14} /> Add</button>
			</form>
		</div>
	{/if}

	<!-- Services -->
	{#if tab === 'services' && canManagePlans}
		<div class="card card-body space-y-4">
			<h3 class="font-semibold text-ink-900 mb-2">Gym Services</h3>
			<div class="grid md:grid-cols-2 gap-3">
				{#each data.services as s}
					<div class="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
						<div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-ink-900 truncate">{s.name}</div>
							{#if s.description}<div class="text-xs text-ink-400 truncate">{s.description}</div>{/if}
						</div>
						<button type="button" onclick={() => (editingService = s)} class="text-ink-400 hover:text-ink-800 transition-colors shrink-0" aria-label="Edit service"><Pencil size={14} /></button>
						<button type="button" onclick={() => askDeleteService(s)} class="text-ink-400 hover:text-red-600 transition-colors shrink-0" aria-label="Remove service"><Trash2 size={14} /></button>
					</div>
				{:else}
					<div class="md:col-span-2 text-center text-ink-400 py-6">No services yet</div>
				{/each}
			</div>
			<form method="POST" action="?/addService" use:enhance class="flex gap-3">
				<input name="name" class="input" placeholder="e.g. Swimming Pool" required />
				<input name="description" class="input" placeholder="Description (optional)" />
				<button type="submit" class="btn-primary btn shrink-0"><Plus size={14} /> Add</button>
			</form>
		</div>
	{/if}
</div>

<form id="delete-billing-item-form" method="POST" action={pendingDelete?.kind === 'cycle' ? '?/deleteCycle' : '?/deleteService'} use:enhance class="hidden">
	<input type="hidden" name="id" value={pendingDelete?.id ?? ''} />
</form>

<ConfirmDialog
	open={confirmOpen}
	title={`Remove this ${pendingDelete?.kind ?? 'item'}?`}
	message={`"${pendingDelete?.name}" will be marked inactive. Existing plans that reference it are unaffected.`}
	confirmLabel="Remove"
	oncancel={() => (confirmOpen = false)}
	onconfirm={submitDelete}
/>

<Modal open={!!editingCycle} title="Edit Billing Cycle" onclose={() => (editingCycle = null)}>
	{#if editingCycle}
		<form method="POST" action="?/updateCycle" use:enhance={() => async ({ update }) => { await update(); editingCycle = null; }} class="space-y-3">
			<input type="hidden" name="id" value={editingCycle.id} />
			<div><label class="label">Cycle Name</label><input name="name" class="input" required value={editingCycle.name ?? ''} /></div>
			<div><label class="label">Duration (Days)</label><input name="interval_days" type="number" class="input" required min="1" value={editingCycle.interval_days ?? ''} /></div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (editingCycle = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1">Save Changes</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!editingService} title="Edit Service" onclose={() => (editingService = null)}>
	{#if editingService}
		<form method="POST" action="?/updateService" use:enhance={() => async ({ update }) => { await update(); editingService = null; }} class="space-y-3">
			<input type="hidden" name="id" value={editingService.id} />
			<div><label class="label">Service Name</label><input name="name" class="input" required value={editingService.name ?? ''} /></div>
			<div><label class="label">Description</label><input name="description" class="input" value={editingService.description ?? ''} placeholder="Description (optional)" /></div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
				<button type="button" onclick={() => (editingService = null)} class="btn btn-secondary flex-1">Cancel</button>
				<button type="submit" class="btn btn-primary flex-1">Save Changes</button>
			</div>
		</form>
	{/if}
</Modal>
