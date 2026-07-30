<script>
	import { Users, CreditCard, AlertCircle, TrendingUp, ArrowRight, Clock, Plus, DollarSign, Activity, UserCheck, UserPlus } from 'lucide-svelte';
	import { formatPKR, formatDate, formatDateTime } from '$lib/utils/format.js';

	let { data } = $props();
	const { stats, overdueMembers, dueSoonMembers, recentPayments, recentMembers } = $derived(data);

	const statCards = $derived([
		{
			label: 'Total Members',
			value: stats.totalMembers,
			sub: `${stats.activeSubscriptions} active subscriptions`,
			icon: Users,
			grad: 'from-ink-800 to-ink-950',
			light: 'bg-ink-50 text-ink-700'
		},
		{
			label: 'Collected Today',
			value: formatPKR(stats.collectionToday),
			sub: `This month: ${formatPKR(stats.collectionMonth)}`,
			icon: TrendingUp,
			grad: 'from-volt-500 to-volt-700',
			light: 'bg-volt-50 text-volt-800'
		},
		{
			label: 'Overdue Members',
			value: stats.overdueCount,
			sub: 'Need immediate attention',
			icon: AlertCircle,
			grad: 'from-red-500 to-rose-600',
			light: 'bg-red-50 text-red-600',
			alert: stats.overdueCount > 0
		},
		{
			label: 'Total Collected',
			value: formatPKR(stats.collectionTotal),
			sub: `This week: ${formatPKR(stats.collectionWeek)}`,
			icon: DollarSign,
			grad: 'from-ink-700 to-ink-900',
			light: 'bg-ink-50 text-ink-700'
		},
		{
			label: 'Check-ins Today',
			value: stats.attendanceToday,
			sub: `This week: ${stats.attendanceWeek}`,
			icon: UserCheck,
			grad: 'from-sky-500 to-blue-600',
			light: 'bg-sky-50 text-sky-700'
		},
		{
			label: 'New Members (30d)',
			value: stats.newMembers30d,
			sub: `${stats.cancelledSubs30d} cancelled in the same period`,
			icon: UserPlus,
			grad: 'from-purple-500 to-fuchsia-600',
			light: 'bg-purple-50 text-purple-700'
		}
	]);

	function memberInitials(name) {
		if (!name) return '?';
		return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
	}

	const avatarColors = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-500','from-orange-500 to-red-500','from-blue-500 to-cyan-500','from-pink-500 to-rose-500'];
</script>

<svelte:head><title>Dashboard — GymLi</title></svelte:head>

<div class="p-5 lg:p-7 max-w-7xl mx-auto space-y-7">

	<!-- Header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Dashboard</h1>
			<p class="text-gray-400 text-sm mt-0.5">{new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
		</div>
		<a href="/members/new" class="btn btn-primary gap-2">
			<Plus size={18}/> Add Member
		</a>
	</div>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
		{#each statCards as s}
			{@const Icon = s.icon}
			<div class="relative card p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
				<!-- Gradient accent bar -->
				<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {s.grad}"></div>
				<div class="flex items-start justify-between mb-3">
					<div class="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-none">{s.label}</div>
					<div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br {s.grad} shadow-sm group-hover:scale-110 transition-transform">
						<Icon size={16} class="text-white"/>
					</div>
				</div>
				<div class="text-2xl font-extrabold text-gray-900 mb-1 {s.alert ? 'text-red-600' : ''}">{s.value}</div>
				<div class="text-xs text-gray-400">{s.sub}</div>
			</div>
		{/each}
	</div>

	<!-- Collection Summary Banner -->
	<div class="relative rounded-2xl p-6 overflow-hidden bg-ink-950">
		<div class="absolute inset-0 opacity-40" style="background: radial-gradient(circle at 85% 20%, rgba(180,239,42,0.25), transparent 40%);"></div>
		<div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<div class="text-white/60 text-sm font-medium mb-1 flex items-center gap-2"><Activity size={14}/> Revenue Overview</div>
				<div class="font-display text-4xl font-extrabold text-white">{formatPKR(stats.collectionTotal)}</div>
				<div class="text-white/50 text-sm mt-1">Total collected all time</div>
			</div>
			<div class="flex gap-6">
				{#each [['Today', stats.collectionToday],['This Week', stats.collectionWeek],['This Month', stats.collectionMonth]] as [l, v]}
					<div class="text-center">
						<div class="text-lg font-bold text-volt-300">{formatPKR(v)}</div>
						<div class="text-white/40 text-xs mt-0.5">{l}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Overdue + Due Soon -->
	<div class="grid lg:grid-cols-2 gap-5">

		<!-- Overdue -->
		<div class="card overflow-hidden">
			<div class="card-header flex items-center justify-between bg-red-50/50">
				<h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm">
					<span class="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle size={14} class="text-red-600"/></span>
					Overdue Members
					{#if overdueMembers.length > 0}
						<span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{overdueMembers.length}</span>
					{/if}
				</h3>
				<a href="/subscriptions?status=overdue" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
					View all <ArrowRight size={12}/>
				</a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if overdueMembers.length === 0}
					<div class="px-6 py-10 text-center">
						<div class="text-2xl mb-2">🎉</div>
						<div class="text-sm text-gray-400 font-medium">No overdue members!</div>
					</div>
				{:else}
					{#each overdueMembers as sub, i}
						<div class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{memberInitials(sub.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{sub.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">Due: {formatDate(sub.due_date)}</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold text-red-600">{formatPKR(sub.amount_due - sub.amount_paid)}</div>
								<span class="badge-red text-[10px]">Overdue</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Due Soon -->
		<div class="card overflow-hidden">
			<div class="card-header flex items-center justify-between bg-amber-50/50">
				<h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm">
					<span class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Clock size={14} class="text-amber-600"/></span>
					Due in Next 5 Days
					{#if dueSoonMembers.length > 0}
						<span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{dueSoonMembers.length}</span>
					{/if}
				</h3>
				<a href="/subscriptions?status=pending" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
					View all <ArrowRight size={12}/>
				</a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if dueSoonMembers.length === 0}
					<div class="px-6 py-10 text-center">
						<div class="text-2xl mb-2">✅</div>
						<div class="text-sm text-gray-400 font-medium">No upcoming dues</div>
					</div>
				{:else}
					{#each dueSoonMembers as sub, i}
						<div class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{memberInitials(sub.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{sub.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">Due: {formatDate(sub.due_date)}</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold text-amber-600">{formatPKR(sub.amount_due)}</div>
								<span class="badge-yellow text-[10px]">Due Soon</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="grid lg:grid-cols-2 gap-5">

		<!-- Recent Payments -->
		<div class="card overflow-hidden">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
					<span class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><CreditCard size={14} class="text-emerald-600"/></span>
					Recent Payments
				</h3>
				<a href="/payments" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">View all <ArrowRight size={12}/></a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if recentPayments.length === 0}
					<div class="px-6 py-10 text-center text-sm text-gray-400">No payments recorded yet</div>
				{:else}
					{#each recentPayments as p, i}
						<div class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{memberInitials(p.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{p.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">{formatDateTime(p.paid_at)} · <span class="capitalize">{p.method}</span></div>
								</div>
							</div>
							<div class="text-sm font-bold text-emerald-600">{formatPKR(p.amount)}</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- New Members -->
		<div class="card overflow-hidden">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
					<span class="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><Users size={14} class="text-violet-600"/></span>
					New Members
				</h3>
				<a href="/members" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">View all <ArrowRight size={12}/></a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if recentMembers.length === 0}
					<div class="px-6 py-10 text-center">
						<div class="text-sm text-gray-400 mb-3">No members yet</div>
						<a href="/members/new" class="btn btn-primary btn-sm">Add First Member</a>
					</div>
				{:else}
					{#each recentMembers as m, i}
						<a href="/members/{m.id}" class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors block">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{memberInitials(m.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{m.full_name}</div>
									<div class="text-xs text-gray-400">Joined {formatDate(m.created_at)}</div>
								</div>
							</div>
							<span class="badge-green">Active</span>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
