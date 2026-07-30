<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { UserCheck } from 'lucide-svelte';
	import { formatDateTime, initials } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let selectedUser = $state('');
	let date = $state(data.date);

	const memberOptions = $derived([
		{ value: '', label: 'Select member to check in…' },
		...data.members.map((m) => ({ value: m.id, label: m.full_name }))
	]);

	function applyDate(val) {
		date = val;
		const params = new URLSearchParams($page.url.searchParams);
		params.set('date', val);
		goto(`?${params}`);
	}
</script>

<svelte:head><title>Attendance — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<h1 class="page-title">Attendance</h1>
		<div class="w-full sm:w-48">
			<DatePicker value={date} onchange={applyDate} placeholder="Pick date" />
		</div>
	</div>

	<div class="card p-5">
		<h3 class="font-semibold text-ink-900 mb-3 flex items-center gap-2"><UserCheck size={16} /> Quick Check-in</h3>
		<form method="POST" action="?/checkIn" use:enhance class="flex flex-col sm:flex-row gap-3">
			<div class="flex-1">
				<Select name="user_id" options={memberOptions} bind:value={selectedUser} placeholder="Select member…" searchable searchPlaceholder="Search members…" required />
			</div>
			<button type="submit" class="btn btn-primary" disabled={!selectedUser}>Check In</button>
		</form>
		{#if form?.success}<div class="mt-2 text-sm text-volt-700 font-medium">Checked in successfully</div>{/if}
	</div>

	<div class="card">
		<div class="card-header">
			<h3 class="font-semibold text-ink-900">Attendance for {data.date} ({data.attendance.length} check-ins)</h3>
		</div>
		<div class="divide-y divide-ink-100">
			{#each data.attendance as a}
				<div class="px-4 sm:px-6 py-3 flex items-center gap-4">
					<div class="w-9 h-9 bg-ink-900 text-volt-300 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
						{initials(a.profiles?.full_name)}
					</div>
					<div class="flex-1 min-w-0">
						<div class="font-medium text-ink-900 truncate">{a.profiles?.full_name ?? '—'}</div>
						<div class="text-xs text-ink-500">
							Checked in: {formatDateTime(a.checked_in_at)}
							{#if a.checked_out_at} · Checked out: {formatDateTime(a.checked_out_at)}{/if}
						</div>
					</div>
					{#if a.checked_out_at}
						<span class="badge-gray">Checked out</span>
					{:else}
						<form method="POST" action="?/checkOut" use:enhance>
							<input type="hidden" name="id" value={a.id} />
							<button type="submit" class="badge-green cursor-pointer hover:opacity-80">Present · Check out</button>
						</form>
					{/if}
				</div>
			{:else}
				<div class="px-6 py-12 text-center text-ink-400">No check-ins recorded for this date</div>
			{/each}
		</div>
	</div>
</div>
