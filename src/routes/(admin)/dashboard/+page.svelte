<script>
	import {
		Users, AlertCircle, ArrowUpRight, ArrowRight, Plus, Clock, CreditCard,
		UserCheck, UserPlus, CalendarCheck, UserCog, Package, BarChart3, Building2, Receipt
	} from 'lucide-svelte';
	import { formatDate, formatDateTime, initials } from '$lib/utils/format.js';

	let { data } = $props();
	const { stats, overdueMembers, dueSoonMembers, recentPayments, recentMembers } = $derived(data);

	/**
	 * Kiosk-style glance screen — counts and names, but never a fee amount,
	 * so it stays safe to leave on a front-desk screen anyone can see.
	 */
	const allStatCards = [
		{
			href: '/members',
			label: 'Total Members',
			value: () => stats.totalMembers,
			sub: () => `${stats.activeSubscriptions} active subscriptions`,
			icon: Users,
			ring: 'ring-blue-100',
			iconBg: 'bg-blue-500',
			tint: 'from-blue-50 to-white',
			roles: ['superadmin', 'manager', 'instructor', 'staff']
		},
		{
			href: '/payments',
			label: 'Payments Today',
			value: () => stats.paymentsToday,
			sub: () => `${stats.paymentsTotal} transactions all-time`,
			icon: CreditCard,
			ring: 'ring-emerald-100',
			iconBg: 'bg-emerald-500',
			tint: 'from-emerald-50 to-white',
			roles: ['superadmin', 'manager', 'instructor']
		},
		{
			href: '/subscriptions?status=overdue',
			label: 'Overdue Members',
			value: () => stats.overdueCount,
			sub: () => 'Need immediate attention',
			icon: AlertCircle,
			ring: 'ring-red-100',
			iconBg: 'bg-red-500',
			tint: 'from-red-50 to-white',
			alert: () => stats.overdueCount > 0,
			roles: ['superadmin', 'manager']
		},
		{
			href: '/attendance',
			label: 'Check-ins Today',
			value: () => stats.attendanceToday,
			sub: () => `This week: ${stats.attendanceWeek}`,
			icon: UserCheck,
			ring: 'ring-sky-100',
			iconBg: 'bg-sky-500',
			tint: 'from-sky-50 to-white',
			roles: ['superadmin', 'manager', 'instructor', 'staff']
		},
		{
			href: '/members',
			label: 'New Members (30d)',
			value: () => stats.newMembers30d,
			sub: () => `${stats.cancelledSubs30d} cancelled in the same period`,
			icon: UserPlus,
			ring: 'ring-purple-100',
			iconBg: 'bg-purple-500',
			tint: 'from-purple-50 to-white',
			roles: ['superadmin', 'manager', 'instructor', 'staff']
		}
	];
	const statCards = $derived(allStatCards.filter((s) => s.roles.includes(data.profile?.role)));

	const allQuickActions = [
		{ href: '/members/new', label: 'Add Member', icon: UserPlus, iconBg: 'bg-blue-500', roles: ['superadmin', 'manager'] },
		{ href: '/attendance', label: 'Mark Attendance', icon: CalendarCheck, iconBg: 'bg-sky-500', roles: ['superadmin', 'manager', 'instructor', 'staff'] },
		{ href: '/staff', label: 'Manage Staff', icon: UserCog, iconBg: 'bg-purple-500', roles: ['superadmin', 'manager'] },
		{ href: '/packages', label: 'Plans', icon: Package, iconBg: 'bg-amber-500', roles: ['superadmin'] },
		{ href: '/gyms', label: 'Gym Locations', icon: Building2, iconBg: 'bg-teal-500', roles: ['superadmin', 'manager'] },
		{ href: '/reports', label: 'Reports', icon: BarChart3, iconBg: 'bg-rose-500', roles: ['superadmin', 'manager'] }
	];
	const quickActions = $derived(allQuickActions.filter((a) => a.roles.includes(data.profile?.role)));

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
		{#if ['superadmin', 'manager'].includes(data.profile?.role)}
			<a href="/members/new" class="btn btn-primary gap-2">
				<Plus size={18}/> Add Member
			</a>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
		{#each quickActions as a}
			{@const Icon = a.icon}
			<a
				href={a.href}
				class="group flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-center
					hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
			>
				<span class="w-11 h-11 rounded-2xl flex items-center justify-center {a.iconBg} shadow-sm group-hover:scale-110 transition-transform">
					<Icon size={19} class="text-white"/>
				</span>
				<span class="text-xs font-semibold text-ink-700 leading-tight">{a.label}</span>
			</a>
		{/each}
	</div>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 xl:grid-cols-3 gap-4">
		{#each statCards as s}
			{@const Icon = s.icon}
			<a
				href={s.href}
				class="group relative card p-5 overflow-hidden bg-gradient-to-br {s.tint}
					hover:shadow-xl hover:-translate-y-1 ring-1 {s.ring} hover:ring-2 transition-all duration-200"
			>
				<div class="flex items-start justify-between mb-3">
					<div class="text-xs font-semibold text-ink-400 uppercase tracking-wider leading-none">{s.label}</div>
					<div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 {s.iconBg} shadow-sm group-hover:scale-110 transition-transform">
						<Icon size={16} class="text-white"/>
					</div>
				</div>
				<div class="text-2xl font-extrabold text-ink-900 mb-1 {s.alert?.() ? 'text-red-600' : ''}">{s.value()}</div>
				<div class="flex items-center justify-between gap-2">
					<div class="text-xs text-ink-400 truncate">{s.sub()}</div>
					<ArrowUpRight size={14} class="text-ink-300 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-ink-700 transition-all" />
				</div>
			</a>
		{/each}
	</div>

	<!-- Overdue + Due Soon -->
	<div class="grid lg:grid-cols-2 gap-5">

		<!-- Overdue -->
		<div class="card overflow-hidden">
			<div class="card-header flex items-center justify-between bg-red-50/50">
				<h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm">
					<span class="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle size={14} class="text-red-600"/></span>
					Overdue Members
					{#if stats.overdueCount > 0}
						<span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.overdueCount}</span>
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
						<a href="/members/{sub.user_id}" class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{initials(sub.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{sub.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">Due: {formatDate(sub.due_date)}</div>
								</div>
							</div>
							<span class="badge-red text-[10px]">Overdue</span>
						</a>
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
						<a href="/members/{sub.user_id}" class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{initials(sub.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{sub.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">Due: {formatDate(sub.due_date)}</div>
								</div>
							</div>
							<span class="badge-yellow text-[10px]">Due Soon</span>
						</a>
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
					<span class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt size={14} class="text-emerald-600"/></span>
					Recent Payments
				</h3>
				<a href="/payments" class="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">View all <ArrowRight size={12}/></a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if recentPayments.length === 0}
					<div class="px-6 py-10 text-center text-sm text-gray-400">No payments recorded yet</div>
				{:else}
					{#each recentPayments as p, i}
						<a href="/members/{p.user_id}" class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br {avatarColors[i % avatarColors.length]}">
									{initials(p.profiles?.full_name)}
								</div>
								<div>
									<div class="text-sm font-semibold text-gray-900">{p.profiles?.full_name ?? '—'}</div>
									<div class="text-xs text-gray-400">{formatDateTime(p.paid_at)}</div>
								</div>
							</div>
							<span class="badge-gray capitalize">{p.method}</span>
						</a>
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
									{initials(m.full_name)}
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
