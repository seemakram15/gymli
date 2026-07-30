<script>
	import { enhance } from '$app/forms';
	import { Phone, MapPin, Shield, CreditCard, Calendar, Plus, Edit2, CheckCircle } from 'lucide-svelte';
	import { formatPKR, formatDate, formatDateTime, initials, paymentStatusBadge, memberStatusBadge, formatCNIC } from '$lib/utils/format.js';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let tab = $state('profile');
	let editMode = $state(false);
	let paymentModalOpen = $state(false);
	let loading = $state(false);
	let gender = $state(data.profile.gender ?? '');
	let status = $state(data.profile.status ?? 'active');
	let dob = $state(data.profile.date_of_birth ?? '');
	let paySubId = $state('');
	let payMethod = $state('cash');
	let payGymId = $state('');

	const tabs = [
		{ id: 'profile',       label: 'Profile' },
		{ id: 'subscriptions', label: `Subscriptions (${data.subscriptions.length})` },
		{ id: 'payments',      label: `Payments (${data.payments.length})` },
		{ id: 'attendance',    label: 'Attendance' },
		{ id: 'documents',     label: 'Documents' },
	];

	const genderOptions = [
		{ value: '', label: 'Select' },
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'other', label: 'Other' }
	];

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'frozen', label: 'Frozen' }
	];

	const methodOptions = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'card', label: 'Card' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'online', label: 'Online' }
	];

	const subOptions = $derived([
		{ value: '', label: 'General payment (no subscription)' },
		...data.subscriptions
			.filter((s) => s.status === 'active')
			.map((s) => ({
				value: s.id,
				label: `${s.packages?.name} — Balance: ${formatPKR(s.amount_due - s.amount_paid)}`
			}))
	]);

	const gymOptions = $derived([
		{ value: '', label: 'Select gym' },
		...data.gyms.map((g) => ({ value: g.id, label: g.name }))
	]);
</script>

<svelte:head><title>{data.profile.full_name ?? 'Member'} — GymLi</title></svelte:head>

<div class="p-6 max-w-5xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-start gap-4">
		<a href="/members" class="text-sm text-gray-500 hover:text-gray-700 mt-1">← Members</a>
	</div>

	<div class="card p-6">
		<div class="flex flex-col sm:flex-row items-start gap-6">
			<!-- Avatar -->
			<div class="shrink-0">
				{#if data.profile.avatar_url}
					<img src={data.profile.avatar_url} alt={data.profile.full_name} class="w-24 h-24 rounded-full object-cover border-4 border-brand-100" />
				{:else}
					<div class="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-3xl font-bold">
						{initials(data.profile.full_name)}
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-2xl font-bold text-gray-900">{data.profile.full_name ?? '—'}</h1>
					<span class="{memberStatusBadge(data.profile.status ?? 'active')}">
						{data.profile.status ?? 'active'}
					</span>
					<span class="badge-gray capitalize">{data.profile.role ?? 'member'}</span>
				</div>
				<div class="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
					{#if data.profile.phone_number}
						<span class="flex items-center gap-1"><Phone size={13} />{data.profile.phone_number}</span>
					{/if}
					{#if data.profile.city}
						<span class="flex items-center gap-1"><MapPin size={13} />{data.profile.city}</span>
					{/if}
					{#if data.profile.cnic_number}
						<span class="flex items-center gap-1"><Shield size={13} />{data.profile.cnic_number}</span>
					{/if}
				</div>
				<div class="mt-3 flex gap-4 text-sm">
					<div class="bg-green-50 text-green-700 rounded-lg px-3 py-1.5">
						<div class="font-bold">{formatPKR(data.totalPaid)}</div>
						<div class="text-xs">Total Paid</div>
					</div>
					<div class="bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5">
						<div class="font-bold">{data.subscriptions.filter(s => s.status === 'active').length}</div>
						<div class="text-xs">Active Plans</div>
					</div>
					<div class="bg-orange-50 text-orange-700 rounded-lg px-3 py-1.5">
						<div class="font-bold">{data.attendance.length}</div>
						<div class="text-xs">Check-ins</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-2 shrink-0">
				<button onclick={() => paymentModalOpen = true} class="btn-primary btn btn-sm">
					<Plus size={14} /> Record Payment
				</button>
				<button onclick={() => editMode = !editMode} class="btn-secondary btn btn-sm">
					<Edit2 size={14} /> {editMode ? 'Cancel' : 'Edit'}
				</button>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
			<CheckCircle size={16} /> Saved successfully
		</div>
	{/if}

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-ink-200 overflow-x-auto">
		{#each tabs as t}
			<button
				onclick={() => tab = t.id}
				class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
					{tab === t.id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'}"
			>{t.label}</button>
		{/each}
	</div>

	<!-- Profile Tab -->
	{#if tab === 'profile'}
		<form method="POST" action="?/updateProfile" use:enhance={() => {
			loading = true; return async ({ update }) => { await update(); loading = false; editMode = false; };
		}}>
			<div class="card card-body grid md:grid-cols-2 gap-4">
				<div>
					<label class="label">Full Name</label>
					{#if editMode}
						<input name="full_name" class="input" value={data.profile.full_name ?? ''} />
					{:else}
						<p class="text-gray-900">{data.profile.full_name ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">Phone Number</label>
					{#if editMode}
						<input name="phone_number" type="tel" class="input" value={data.profile.phone_number ?? ''} />
					{:else}
						<p class="text-gray-900">{data.profile.phone_number ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">CNIC Number</label>
					{#if editMode}
						<input name="cnic_number" class="input font-mono" value={data.profile.cnic_number ?? ''} placeholder="35202-1234567-1" />
					{:else}
						<p class="text-gray-900 font-mono">{data.profile.cnic_number ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">Gender</label>
					{#if editMode}
						<Select name="gender" options={genderOptions} bind:value={gender} />
					{:else}
						<p class="text-ink-900 capitalize">{data.profile.gender ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">Date of Birth</label>
					{#if editMode}
						<DatePicker name="date_of_birth" bind:value={dob} placeholder="Date of birth" />
					{:else}
						<p class="text-ink-900">{formatDate(data.profile.date_of_birth)}</p>
					{/if}
				</div>
				<div>
					<label class="label">Status</label>
					{#if editMode}
						<Select name="status" options={statusOptions} bind:value={status} />
					{:else}
						<span class="{memberStatusBadge(data.profile.status ?? 'active')}">{data.profile.status ?? 'active'}</span>
					{/if}
				</div>
				<div class="md:col-span-2">
					<label class="label">Address</label>
					{#if editMode}
						<textarea name="address" class="input" rows="2">{data.profile.address ?? ''}</textarea>
					{:else}
						<p class="text-gray-900">{data.profile.address ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">City</label>
					{#if editMode}
						<input name="city" class="input" value={data.profile.city ?? ''} />
					{:else}
						<p class="text-gray-900">{data.profile.city ?? '—'}</p>
					{/if}
				</div>
				<div>
					<label class="label">Emergency Contact</label>
					{#if editMode}
						<input name="emergency_contact_name" class="input" placeholder="Name" value={data.profile.emergency_contact_name ?? ''} />
						<input name="emergency_contact_phone" class="input mt-2" placeholder="Phone" value={data.profile.emergency_contact_phone ?? ''} />
					{:else}
						<p class="text-gray-900">{data.profile.emergency_contact_name ?? '—'}</p>
						<p class="text-gray-500 text-sm">{data.profile.emergency_contact_phone ?? ''}</p>
					{/if}
				</div>
				{#if data.profile.medical_notes}
					<div class="md:col-span-2">
						<label class="label">Medical Notes</label>
						{#if editMode}
							<textarea name="medical_notes" class="input" rows="2">{data.profile.medical_notes}</textarea>
						{:else}
							<p class="text-gray-900 bg-yellow-50 rounded-lg p-3 text-sm">{data.profile.medical_notes}</p>
						{/if}
					</div>
				{/if}
				{#if editMode}
					<div class="md:col-span-2 flex justify-end">
						<button type="submit" class="btn-primary btn" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
					</div>
				{/if}
			</div>
		</form>
	{/if}

	<!-- Subscriptions Tab -->
	{#if tab === 'subscriptions'}
		<div class="space-y-4">
			<div class="flex justify-end">
				<a href="/subscriptions/new?user_id={data.profile.id}" class="btn-primary btn btn-sm"><Plus size={14} /> Add Subscription</a>
			</div>
			{#each data.subscriptions as sub}
				<div class="card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					<div>
						<div class="font-semibold text-gray-900">{sub.packages?.name ?? '—'}</div>
						<div class="text-sm text-gray-500 mt-1">
							{sub.gyms?.name ?? '—'} · Start: {formatDate(sub.start_date)} · Due: {formatDate(sub.due_date)}
						</div>
					</div>
					<div class="flex items-center gap-4">
						<div class="text-right">
							<div class="font-semibold text-gray-900">{formatPKR(sub.amount_due)}</div>
							<div class="text-xs text-green-600">Paid: {formatPKR(sub.amount_paid)}</div>
						</div>
						<span class="{paymentStatusBadge(sub.payment_status)}">{sub.payment_status}</span>
						<span class="{memberStatusBadge(sub.status)}">{sub.status}</span>
					</div>
				</div>
			{:else}
				<div class="card p-12 text-center text-gray-400">No subscriptions yet</div>
			{/each}
		</div>
	{/if}

	<!-- Payments Tab -->
	{#if tab === 'payments'}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Amount</th>
						<th>Method</th>
						<th>Status</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{#each data.payments as p}
						<tr>
							<td>{formatDateTime(p.paid_at)}</td>
							<td class="font-semibold text-green-600">{formatPKR(p.amount)}</td>
							<td class="capitalize">{p.method}</td>
							<td><span class="badge-green">{p.status}</span></td>
							<td class="text-gray-400">{p.notes ?? '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-center py-8 text-gray-400">No payments recorded</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Attendance Tab -->
	{#if tab === 'attendance'}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr><th>Check-in Time</th><th>Check-out Time</th><th>Branch</th></tr>
				</thead>
				<tbody>
					{#each data.attendance as a}
						<tr>
							<td>{formatDateTime(a.checked_in_at)}</td>
							<td>{a.checked_out_at ? formatDateTime(a.checked_out_at) : '—'}</td>
							<td>{a.branch_id ?? '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="text-center py-8 text-gray-400">No attendance records</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Documents Tab -->
	{#if tab === 'documents'}
		<div class="grid md:grid-cols-2 gap-6">
			<div class="card card-body">
				<h4 class="font-semibold text-gray-900 mb-3">CNIC Front</h4>
				{#if data.profile.cnic_front_url}
					<img src={data.profile.cnic_front_url} alt="CNIC Front" class="rounded-lg border border-gray-200 w-full object-cover" />
				{:else}
					<div class="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-400">No CNIC front uploaded</div>
				{/if}
			</div>
			<div class="card card-body">
				<h4 class="font-semibold text-gray-900 mb-3">CNIC Back</h4>
				{#if data.profile.cnic_back_url}
					<img src={data.profile.cnic_back_url} alt="CNIC Back" class="rounded-lg border border-gray-200 w-full object-cover" />
				{:else}
					<div class="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-400">No CNIC back uploaded</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Record Payment Modal -->
<Modal open={paymentModalOpen} title="Record Payment" onclose={() => (paymentModalOpen = false)}>
	<form method="POST" action="?/addPayment" use:enhance={() => {
		return async ({ update }) => { await update(); paymentModalOpen = false; };
	}} class="space-y-4">
		<div>
			<label class="label">Subscription</label>
			<Select name="subscription_id" options={subOptions} bind:value={paySubId} />
		</div>
		<div>
			<label class="label">Amount (PKR) *</label>
			<input name="amount" type="number" class="input" placeholder="5000" required min="1" />
		</div>
		<div>
			<label class="label">Payment Method *</label>
			<Select name="method" options={methodOptions} bind:value={payMethod} required />
		</div>
		<div>
			<label class="label">Notes</label>
			<input name="notes" class="input" placeholder="Optional reference or notes" />
		</div>
		<div>
			<label class="label">Gym</label>
			<Select name="gym_id" options={gymOptions} bind:value={payGymId} />
		</div>
		<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
			<button type="button" onclick={() => paymentModalOpen = false} class="btn btn-secondary flex-1">Cancel</button>
			<button type="submit" class="btn btn-primary flex-1">Record Payment</button>
		</div>
	</form>
</Modal>
