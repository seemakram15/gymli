<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { UserCheck, Search } from 'lucide-svelte';
	import { formatDateTime, initials } from '$lib/utils/format.js';

	let { data, form } = $props();
	let selectedUser = $state('');
	let date = $state(data.date);

	function applyDate() {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('date', date);
		goto(`?${params}`);
	}
</script>

<svelte:head><title>Attendance — GymLi</title></svelte:head>

<div class="p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Attendance</h1>
		<div class="flex gap-3 items-center">
			<input type="date" class="input" bind:value={date} onchange={applyDate} />
		</div>
	</div>

	<!-- Quick Check-in -->
	<div class="card p-5">
		<h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2"><UserCheck size={16} /> Quick Check-in</h3>
		<form method="POST" action="?/checkIn" use:enhance class="flex gap-3">
			<select name="user_id" class="input flex-1" bind:value={selectedUser} required>
				<option value="">Select member to check in…</option>
				{#each data.members as m}
					<option value={m.id}>{m.full_name}</option>
				{/each}
			</select>
			<button type="submit" class="btn-primary btn" disabled={!selectedUser}>Check In</button>
		</form>
		{#if form?.success}<div class="mt-2 text-sm text-green-600">✓ Checked in successfully</div>{/if}
	</div>

	<!-- Attendance Log -->
	<div class="card">
		<div class="card-header">
			<h3 class="font-semibold text-gray-900">Attendance for {data.date} ({data.attendance.length} check-ins)</h3>
		</div>
		<div class="divide-y divide-gray-100">
			{#each data.attendance as a}
				<div class="px-6 py-3 flex items-center gap-4">
					<div class="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
						{initials(a.profiles?.full_name)}
					</div>
					<div class="flex-1">
						<div class="font-medium text-gray-900">{a.profiles?.full_name ?? '—'}</div>
						<div class="text-xs text-gray-500">Checked in: {formatDateTime(a.checked_in_at)}</div>
					</div>
					<span class="badge-green">Present</span>
				</div>
			{:else}
				<div class="px-6 py-12 text-center text-gray-400">No check-ins recorded for this date</div>
			{/each}
		</div>
	</div>
</div>
