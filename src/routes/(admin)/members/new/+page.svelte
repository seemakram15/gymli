<script>
	import { enhance } from '$app/forms';
	import { Upload, User, Phone, MapPin, Shield, FileText } from 'lucide-svelte';
	import { formatCNIC } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let tab = $state('personal');
	let cnicValue = $state('');
	let gender = $state('');
	let dob = $state('');
	let gymId = $state('');
	let packageId = $state('');
	let startDate = $state(new Date().toISOString().split('T')[0]);

	function onCnicInput(e) {
		cnicValue = formatCNIC(e.target.value);
		e.target.value = cnicValue;
	}

	const tabs = [
		{ id: 'personal',   label: 'Personal Info',   icon: User },
		{ id: 'contact',    label: 'Contact & Address', icon: Phone },
		{ id: 'identity',   label: 'CNIC & Documents', icon: Shield },
		{ id: 'membership', label: 'Membership Plan',  icon: FileText },
	];

	const genderOptions = [
		{ value: '', label: 'Select gender' },
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'other', label: 'Other' }
	];

	const gymOptions = $derived([
		{ value: '', label: 'Select gym' },
		...data.gyms.map((g) => ({ value: g.id, label: `${g.name} — ${g.city}` }))
	]);

	const packageOptions = $derived([
		{ value: '', label: 'No plan (enroll later)' },
		...data.packages.map((p) => ({
			value: p.id,
			label: `${p.name} — PKR ${p.amount} / ${p.cycles?.name ?? 'custom'}`
		}))
	]);
</script>

<svelte:head><title>Add Member — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-4xl mx-auto">
	<div class="mb-6">
		<a href="/members" class="text-sm text-ink-500 hover:text-ink-800">← Back to Members</a>
		<h1 class="page-title mt-2">Add New Member</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{form.error}</div>
	{/if}

	<div class="flex gap-1 bg-ink-100 p-1 rounded-xl mb-6 overflow-x-auto">
		{#each tabs as t}
			<button
				type="button"
				onclick={() => tab = t.id}
				class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
					{tab === t.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}"
			>
				<svelte:component this={t.icon} size={14} />
				<span class="hidden sm:inline">{t.label}</span>
			</button>
		{/each}
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance={() => {
		loading = true;
		return async ({ update }) => { await update(); loading = false; };
	}}>
		<!-- Personal Info -->
		<div class="card card-body space-y-4 mb-4" class:hidden={tab !== 'personal'}>
			<h3 class="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
			<div class="grid md:grid-cols-2 gap-4">
				<div class="md:col-span-2">
					<label class="label" for="avatar">Profile Photo</label>
					<div class="flex items-center gap-4">
						<div class="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
							<Upload size={24} />
						</div>
						<div>
							<input id="avatar" name="avatar" type="file" accept="image/*" class="text-sm text-gray-500 file:mr-3 file:btn file:btn-secondary file:btn-sm file:cursor-pointer" />
							<p class="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
						</div>
					</div>
				</div>
				<div>
					<label class="label" for="full_name">Full Name *</label>
					<input id="full_name" name="full_name" type="text" class="input" placeholder="Muhammad Ali" required value={form?.full_name ?? ''} />
				</div>
				<div>
					<label class="label" for="gender">Gender</label>
					<Select id="gender" name="gender" options={genderOptions} bind:value={gender} placeholder="Select gender" />
				</div>
				<div>
					<label class="label" for="date_of_birth">Date of Birth</label>
					<DatePicker id="date_of_birth" name="date_of_birth" bind:value={dob} placeholder="Pick date of birth" />
				</div>
				<div>
					<label class="label" for="email">Email Address</label>
					<input id="email" name="email" type="email" class="input" placeholder="member@email.com" value={form?.email ?? ''} />
					<p class="text-xs text-gray-400 mt-1">Used for login and email reminders</p>
				</div>
				<div>
					<label class="label" for="password">Initial Password</label>
					<input id="password" name="password" type="text" class="input" placeholder="Leave blank to auto-generate" />
				</div>
			</div>
		</div>

		<!-- Contact & Address -->
		<div class="card card-body space-y-4 mb-4" class:hidden={tab !== 'contact'}>
			<h3 class="font-semibold text-gray-900 border-b pb-2">Contact & Address</h3>
			<div class="grid md:grid-cols-2 gap-4">
				<div>
					<label class="label" for="phone_number">Phone Number *</label>
					<input id="phone_number" name="phone_number" type="tel" class="input" placeholder="+92 300 0000000" required value={form?.phone_number ?? ''} />
				</div>
				<div>
					<label class="label" for="city">City</label>
					<input id="city" name="city" type="text" class="input" placeholder="Lahore" value={form?.city ?? ''} />
				</div>
				<div class="md:col-span-2">
					<label class="label" for="address">Address</label>
					<textarea id="address" name="address" class="input" rows="2" placeholder="House no, Street, Area"></textarea>
				</div>
				<div>
					<label class="label" for="emergency_contact_name">Emergency Contact Name</label>
					<input id="emergency_contact_name" name="emergency_contact_name" type="text" class="input" placeholder="Father / Spouse name" />
				</div>
				<div>
					<label class="label" for="emergency_contact_phone">Emergency Contact Phone</label>
					<input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" class="input" placeholder="+92 300 0000000" />
				</div>
				<div class="md:col-span-2">
					<label class="label" for="medical_notes">Medical Notes</label>
					<textarea id="medical_notes" name="medical_notes" class="input" rows="2" placeholder="Any medical conditions, injuries, or important notes…"></textarea>
				</div>
			</div>
		</div>

		<!-- CNIC & Documents -->
		<div class="card card-body space-y-4 mb-4" class:hidden={tab !== 'identity'}>
			<h3 class="font-semibold text-gray-900 border-b pb-2">CNIC & Identity Documents</h3>
			<div class="grid md:grid-cols-2 gap-4">
				<div class="md:col-span-2">
					<label class="label" for="cnic_number">CNIC Number</label>
					<input id="cnic_number" name="cnic_number" type="text" class="input font-mono" placeholder="35202-1234567-1" maxlength="15" oninput={onCnicInput} value={cnicValue} />
					<p class="text-xs text-gray-400 mt-1">Format: 35202-1234567-1</p>
				</div>
				<div>
					<label class="label">CNIC Front Image</label>
					<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
						<Upload size={24} class="mx-auto text-gray-400 mb-2" />
						<p class="text-sm text-gray-500 mb-1">Upload front side of CNIC</p>
						<input name="cnic_front" type="file" accept="image/*" class="text-xs text-gray-500 file:mr-2 file:btn file:btn-secondary file:btn-sm" />
					</div>
				</div>
				<div>
					<label class="label">CNIC Back Image</label>
					<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
						<Upload size={24} class="mx-auto text-gray-400 mb-2" />
						<p class="text-sm text-gray-500 mb-1">Upload back side of CNIC</p>
						<input name="cnic_back" type="file" accept="image/*" class="text-xs text-gray-500 file:mr-2 file:btn file:btn-secondary file:btn-sm" />
					</div>
				</div>
			</div>
		</div>

		<!-- Membership Plan -->
		<div class="card card-body space-y-4 mb-4" class:hidden={tab !== 'membership'}>
			<h3 class="font-semibold text-gray-900 border-b pb-2">Membership Plan & Enrollment</h3>
			<div class="grid md:grid-cols-2 gap-4">
				<div>
					<label class="label" for="gym_id">Gym Location</label>
					<Select id="gym_id" name="gym_id" options={gymOptions} bind:value={gymId} placeholder="Select gym" />
				</div>
				<div>
					<label class="label" for="package_id">Membership Plan</label>
					<Select id="package_id" name="package_id" options={packageOptions} bind:value={packageId} placeholder="No plan (enroll later)" />
				</div>
				<div>
					<label class="label" for="start_date">Membership Start Date</label>
					<DatePicker id="start_date" name="start_date" bind:value={startDate} placeholder="Start date" />
				</div>
				<div>
					<label class="label" for="amount_due">Fee Amount (PKR)</label>
					<input id="amount_due" name="amount_due" type="number" class="input" placeholder="Auto-filled from plan" min="0" />
					<p class="text-xs text-gray-400 mt-1">Override plan amount if needed</p>
				</div>
			</div>
		</div>

		<!-- Footer Actions -->
		<div class="flex items-center justify-between gap-4">
			{#if tab !== 'personal'}
				<button type="button" onclick={() => {
					const tabOrder = ['personal', 'contact', 'identity', 'membership'];
					tab = tabOrder[tabOrder.indexOf(tab) - 1];
				}} class="btn-secondary btn">← Back</button>
			{:else}
				<a href="/members" class="btn-secondary btn">Cancel</a>
			{/if}

			{#if tab !== 'membership'}
				<button type="button" onclick={() => {
					const tabOrder = ['personal', 'contact', 'identity', 'membership'];
					tab = tabOrder[tabOrder.indexOf(tab) + 1];
				}} class="btn-primary btn">Next →</button>
			{:else}
				<button type="submit" class="btn-primary btn" disabled={loading}>
					{loading ? 'Enrolling…' : 'Enroll Member'}
				</button>
			{/if}
		</div>
	</form>
</div>
