<script>
	import { Inbox, Users2, ShieldCheck, ShieldOff, ArrowRight } from 'lucide-svelte';
	import { formatPKR, formatDateTime, initials } from '$lib/utils/format.js';

	let { data } = $props();

	const statCards = $derived([
		{ href: '/provider/requests', label: 'Pending Requests', value: data.stats.pendingRequests, icon: Inbox, iconBg: 'bg-amber-500', tint: 'from-amber-50 to-white', ring: 'ring-amber-100' },
		{ href: '/provider/accounts', label: 'Total Gym Accounts', value: data.stats.totalAccounts, icon: Users2, iconBg: 'bg-blue-500', tint: 'from-blue-50 to-white', ring: 'ring-blue-100' },
		{ href: '/provider/accounts', label: 'Active Accounts', value: data.stats.activeAccounts, icon: ShieldCheck, iconBg: 'bg-emerald-500', tint: 'from-emerald-50 to-white', ring: 'ring-emerald-100' },
		{ href: '/provider/accounts', label: 'Revoked Accounts', value: data.stats.revokedAccounts, icon: ShieldOff, iconBg: 'bg-red-500', tint: 'from-red-50 to-white', ring: 'ring-red-100' },
	]);

	const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
	const avatarColors = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-500','from-orange-500 to-red-500','from-blue-500 to-cyan-500','from-pink-500 to-rose-500'];
</script>

<svelte:head><title>Overview — Service Provider</title></svelte:head>

<div class="p-5 lg:p-7 max-w-6xl mx-auto space-y-7">
	<div class="page-header">
		<div>
			<h1 class="page-title">Overview</h1>
			<p class="text-gray-400 text-sm mt-0.5">Subscription requests and gym accounts across GymLi.</p>
		</div>
	</div>

	<div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
		{#each statCards as s}
			{@const Icon = s.icon}
			<a href={s.href} class="group relative card p-5 overflow-hidden bg-gradient-to-br {s.tint} hover:shadow-xl hover:-translate-y-1 ring-1 {s.ring} hover:ring-2 transition-all duration-200">
				<div class="flex items-start justify-between mb-3">
					<div class="text-xs font-semibold text-ink-400 uppercase tracking-wider leading-none">{s.label}</div>
					<div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 {s.iconBg} shadow-sm group-hover:scale-110 transition-transform">
						<Icon size={16} class="text-white"/>
					</div>
				</div>
				<div class="text-2xl font-extrabold text-ink-900">{s.value}</div>
			</a>
		{/each}
	</div>

	<div class="card overflow-hidden">
		<div class="card-header flex items-center justify-between">
			<h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
				<span class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Inbox size={14} class="text-amber-600"/></span>
				Recent Requests
			</h3>
			<a href="/provider/requests" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">View all <ArrowRight size={12}/></a>
		</div>
		<div class="divide-y divide-gray-50">
			{#if data.recentRequests.length === 0}
				<div class="px-6 py-10 text-center text-sm text-gray-400">No subscription requests yet</div>
			{:else}
				{#each data.recentRequests as r, i}
					<div class="px-5 py-3.5 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
								{initials(r.profiles?.full_name)}
							</div>
							<div>
								<div class="text-sm font-semibold text-gray-900">{r.profiles?.full_name ?? '—'}</div>
								<div class="text-xs text-gray-400">{r.gyms?.name ?? '—'} · {formatDateTime(r.created_at)}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-bold text-ink-900 capitalize">{r.plan} · {formatPKR(r.amount)}</div>
							<span class="{statusBadge[r.status] ?? 'badge-gray'} text-[10px] capitalize">{r.status}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
