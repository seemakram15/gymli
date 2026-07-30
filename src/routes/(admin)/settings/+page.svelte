<script>
	import { enhance } from '$app/forms';
	import { Bell, User, RefreshCw, Plus } from 'lucide-svelte';

	let { data, form } = $props();
	let tab = $state('profile');
</script>

<svelte:head><title>Settings — GymLi</title></svelte:head>

<div class="p-6 max-w-4xl mx-auto space-y-6">
	<h1 class="page-title">Settings</h1>

	<div class="flex gap-1 border-b border-gray-200">
		{#each [['profile','Account'],['reminders','Reminders'],['cycles','Billing Cycles'],['services','Services']] as [id, label]}
			<button onclick={() => tab = id} class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
				{tab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">
				{label}
			</button>
		{/each}
	</div>

	<!-- Profile -->
	{#if tab === 'profile'}
		<div class="card card-body">
			<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User size={16} /> Account Information</h3>
			{#if form?.profileSuccess}<div class="bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm mb-4">Profile updated!</div>{/if}
			<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
				<div class="grid md:grid-cols-2 gap-4">
					<div><label class="label">Full Name</label><input name="full_name" class="input" value={data.profile.full_name ?? ''} /></div>
					<div><label class="label">Phone</label><input name="phone_number" type="tel" class="input" value={data.profile.phone_number ?? ''} /></div>
					<div><label class="label">City</label><input name="city" class="input" value={data.profile.city ?? ''} /></div>
				</div>
				<button type="submit" class="btn-primary btn">Save Profile</button>
			</form>
		</div>
	{/if}

	<!-- Reminders -->
	{#if tab === 'reminders'}
		<div class="card card-body">
			<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell size={16} /> Automated Reminder Settings</h3>
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
						<p class="text-xs text-gray-400 mt-1">Example: 3,7,14 sends reminders 3, 7, and 14 days after due date</p>
					</div>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" name="overdue_email" class="rounded text-brand-600" checked={data.reminderSettings.overdue_email} />
						Send overdue email reminders
					</label>
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

				<button type="submit" class="btn-primary btn">Save Reminder Settings</button>
			</form>
		</div>
	{/if}

	<!-- Billing Cycles -->
	{#if tab === 'cycles'}
		<div class="card card-body space-y-4">
			<h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2"><RefreshCw size={16} /> Billing Cycles</h3>
			<div class="table-wrapper">
				<table>
					<thead><tr><th>Cycle Name</th><th>Duration (Days)</th></tr></thead>
					<tbody>
						{#each data.cycles as c}
							<tr><td class="font-medium">{c.name}</td><td>{c.interval_days} days</td></tr>
						{:else}
							<tr><td colspan="2" class="text-center text-gray-400 py-6">No billing cycles yet</td></tr>
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
	{#if tab === 'services'}
		<div class="card card-body space-y-4">
			<h3 class="font-semibold text-gray-900 mb-2">Gym Services</h3>
			<div class="grid md:grid-cols-2 gap-3">
				{#each data.services as s}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
						<div class="w-2 h-2 rounded-full bg-green-500"></div>
						<div>
							<div class="text-sm font-medium text-gray-900">{s.name}</div>
							{#if s.description}<div class="text-xs text-gray-400">{s.description}</div>{/if}
						</div>
					</div>
				{:else}
					<div class="md:col-span-2 text-center text-gray-400 py-6">No services yet</div>
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
