<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { UserCheck, Download, KeyRound, ArrowDownToLine, ArrowUpFromLine, Users, CheckCircle2 } from 'lucide-svelte';
	import { formatDateTime, initials } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';

	let { data, form } = $props();
	let selectedUser = $state('');
	let date = $state(data.date);
	let code = $state('');

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

	function downloadCSV() {
		const rows = [
			['Member', 'Checked In', 'Checked Out', 'Method'],
			...data.attendance.map((row) => [
				row.profiles?.full_name ?? '—',
				row.checked_in_at,
				row.checked_out_at ?? '',
				row.checkin_method ?? 'manual',
			]),
		];
		const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
		const link = document.createElement('a');
		link.href = 'data:text/csv,' + encodeURIComponent(csv);
		link.download = `attendance_${data.date}.csv`;
		link.click();
	}

	const presentCount = $derived(data.attendance.filter((a) => !a.checked_out_at).length);
	const checkedOutCount = $derived(data.attendance.length - presentCount);
</script>

<svelte:head><title>Attendance — GymLi</title></svelte:head>

<div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
	<div class="page-header">
		<div>
			<h1 class="page-title">Attendance</h1>
			<p class="text-ink-500 text-sm mt-1">{data.attendance.length} check-in{data.attendance.length === 1 ? '' : 's'} on {data.date}</p>
		</div>
		<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
			<div class="w-full sm:w-48">
				<DatePicker value={date} onchange={applyDate} placeholder="Pick date" />
			</div>
			<button onclick={downloadCSV} class="btn btn-secondary"><Download size={16} /> Export CSV</button>
		</div>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
		<div class="card p-5 flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Users size={18} /></div>
			<div>
				<div class="text-xl font-bold text-ink-900">{data.attendance.length}</div>
				<div class="text-xs text-ink-500">Total Check-ins</div>
			</div>
		</div>
		<div class="card p-5 flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 size={18} /></div>
			<div>
				<div class="text-xl font-bold text-ink-900">{presentCount}</div>
				<div class="text-xs text-ink-500">Currently Present</div>
			</div>
		</div>
		<div class="card p-5 flex items-center gap-3 col-span-2 sm:col-span-1">
			<div class="w-10 h-10 rounded-xl bg-ink-100 text-ink-500 flex items-center justify-center shrink-0"><ArrowUpFromLine size={18} /></div>
			<div>
				<div class="text-xl font-bold text-ink-900">{checkedOutCount}</div>
				<div class="text-xs text-ink-500">Checked Out</div>
			</div>
		</div>
	</div>

	<div class="grid sm:grid-cols-2 gap-4">
		<div class="card p-5">
			<h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2.5">
				<span class="w-8 h-8 rounded-lg bg-volt-100 text-ink-900 flex items-center justify-center shrink-0"><UserCheck size={16} /></span>
				Quick Check-in
			</h3>
			<form method="POST" action="?/checkIn" use:enhance class="flex flex-col sm:flex-row gap-3">
				<div class="flex-1">
					<Select name="user_id" options={memberOptions} bind:value={selectedUser} placeholder="Select member…" searchable searchPlaceholder="Search members…" required />
				</div>
				<button type="submit" class="btn btn-primary shrink-0" disabled={!selectedUser}>Check In</button>
			</form>
			{#if form?.success}<div class="mt-3 text-sm text-volt-700 font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> Checked in successfully</div>{/if}
		</div>

		<div class="card p-5">
			<h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2.5">
				<span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><KeyRound size={16} /></span>
				Check-in by Code
			</h3>
			<form method="POST" action="?/checkInByCode" use:enhance={() => {
				return async ({ update }) => { await update(); code = ''; };
			}} class="flex flex-col sm:flex-row gap-3">
				<input name="code" bind:value={code} class="input flex-1 font-mono tracking-widest" placeholder="6-digit code" maxlength="6" required />
				<button type="submit" class="btn btn-primary shrink-0" disabled={!code}>Check In</button>
			</form>
			{#if form?.codeSuccess}<div class="mt-3 text-sm text-volt-700 font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> Checked in {form.checkedInName}</div>{/if}
			{#if form?.codeError}<div class="mt-3 text-sm text-red-600 font-medium">{form.codeError}</div>{/if}
		</div>
	</div>

	<div class="card">
		<div class="card-header">
			<h3 class="font-semibold text-ink-900">Check-in Log — {data.date}</h3>
		</div>
		<div class="divide-y divide-ink-100">
			{#each data.attendance as a}
				<div class="px-4 sm:px-6 py-4 flex items-center gap-4">
					{#if a.profiles?.avatar_url}
						<img src={a.profiles.avatar_url} alt={a.profiles.full_name} class="w-10 h-10 rounded-xl object-cover shrink-0" />
					{:else}
						<div class="w-10 h-10 bg-ink-900 text-volt-300 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
							{initials(a.profiles?.full_name)}
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium text-ink-900 truncate">{a.profiles?.full_name ?? '—'}</span>
							<span class="badge-gray text-xs capitalize">{a.checkin_method === 'code' ? 'Code' : 'Manual'}</span>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500 mt-1">
							<span class="flex items-center gap-1"><ArrowDownToLine size={12} class="text-green-500" />{formatDateTime(a.checked_in_at)}</span>
							{#if a.checked_out_at}
								<span class="flex items-center gap-1"><ArrowUpFromLine size={12} class="text-red-400" />{formatDateTime(a.checked_out_at)}</span>
							{/if}
						</div>
					</div>
					{#if a.checked_out_at}
						<span class="flex items-center gap-1.5 text-xs text-ink-400 shrink-0">
							<ArrowUpFromLine size={13} /> Checked out
						</span>
					{:else}
						<form method="POST" action="?/checkOut" use:enhance>
							<input type="hidden" name="id" value={a.id} />
							<button type="submit" class="btn btn-sm shrink-0 bg-green-600 text-white hover:bg-green-700">
								<ArrowUpFromLine size={13} /> Check Out
							</button>
						</form>
					{/if}
				</div>
			{:else}
				<div class="px-6 py-12 text-center text-ink-400">No check-ins recorded for this date</div>
			{/each}
		</div>
	</div>
</div>
