<script>
	import { enhance } from '$app/forms';
	import { Plus, Phone, UserCog } from 'lucide-svelte';
	import { initials, memberStatusBadge } from '$lib/utils/format.js';

	let { data, form } = $props();
	let modalOpen = $state(false);
	let loading = $state(false);

	const roleColors = { manager: 'badge-blue', instructor: 'badge-purple', staff: 'badge-gray' };
</script>

<svelte:head><title>Staff — GymLi</title></svelte:head>

<div class="p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Staff & Instructors</h1>
			<p class="text-gray-500 text-sm">{data.staff.length} team members</p>
		</div>
		<button onclick={() => modalOpen = true} class="btn-primary btn"><Plus size={16} /> Add Staff</button>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{form.error}</div>
	{/if}

	<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.staff as s}
			<div class="card p-5">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-12 h-12 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-lg">
						{initials(s.full_name)}
					</div>
					<div>
						<div class="font-semibold text-gray-900">{s.full_name}</div>
						<span class="{roleColors[s.role] ?? 'badge-gray'} mt-0.5">{s.role}</span>
					</div>
				</div>
				{#if s.phone_number}
					<div class="flex items-center gap-2 text-sm text-gray-500">
						<Phone size={13} />{s.phone_number}
					</div>
				{/if}
				{#if s.city}
					<div class="text-sm text-gray-400 mt-1">{s.city}</div>
				{/if}
				<div class="mt-2"><span class="{memberStatusBadge(s.status ?? 'active')}">{s.status ?? 'active'}</span></div>
			</div>
		{:else}
			<div class="md:col-span-3 card p-12 text-center text-gray-400">No staff members yet. Add your first team member.</div>
		{/each}
	</div>
</div>

{#if modalOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
			<h3 class="text-lg font-bold mb-4">Add Staff Member</h3>
			{#if form?.error}<div class="bg-red-50 text-red-700 rounded px-3 py-2 text-sm mb-3">{form.error}</div>{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				loading = true;
				return async ({ update }) => { await update(); loading = false; if (!form?.error) modalOpen = false; };
			}} class="space-y-3">
				<div><label class="label">Full Name *</label><input name="full_name" class="input" required /></div>
				<div><label class="label">Email *</label><input name="email" type="email" class="input" required /></div>
				<div><label class="label">Phone</label><input name="phone_number" type="tel" class="input" /></div>
				<div>
					<label class="label">Role *</label>
					<select name="role" class="input" required>
						<option value="manager">Manager / Front Desk</option>
						<option value="instructor">Instructor / Trainer</option>
						<option value="staff">Staff</option>
					</select>
				</div>
				{#if data.gyms.length}
					<div>
						<label class="label">Gym Location</label>
						<select name="gym_id" class="input">
							<option value="">All Gyms</option>
							{#each data.gyms as g}<option value={g.id}>{g.name}</option>{/each}
						</select>
					</div>
				{/if}
				<div><label class="label">City</label><input name="city" class="input" /></div>
				<p class="text-xs text-gray-400">A random password will be generated. The staff member should use "Forgot Password" to set their own.</p>
				<div class="flex gap-3 pt-2">
					<button type="button" onclick={() => modalOpen = false} class="btn-secondary btn flex-1">Cancel</button>
					<button type="submit" class="btn-primary btn flex-1" disabled={loading}>{loading ? 'Adding…' : 'Add Staff'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
