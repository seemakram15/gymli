<script>
	import {
		LayoutDashboard, Users, CreditCard, Package, Wrench,
		Building2, CalendarCheck, BarChart3, Settings,
		LogOut, Menu, X, Dumbbell, ChevronDown, UserCog,
		Bell, ChevronRight
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase.js';
	import { initials } from '$lib/utils/format.js';

	let { children, data } = $props();
	const supabase = createClient();
	let sidebarOpen  = $state(false);
	let profileOpen  = $state(false);

	const navSections = [
		{
			title: 'Overview',
			items: [
				{ path: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
				{ path: '/reports',   label: 'Reports',      icon: BarChart3 }
			]
		},
		{
			title: 'Members',
			items: [
				{ path: '/members',       label: 'All Members',    icon: Users },
				{ path: '/subscriptions', label: 'Subscriptions',  icon: CreditCard },
				{ path: '/payments',      label: 'Payments',       icon: CreditCard },
				{ path: '/attendance',    label: 'Attendance',     icon: CalendarCheck }
			]
		},
		{
			title: 'Setup',
			items: [
				{ path: '/packages', label: 'Plans',          icon: Package },
				{ path: '/services', label: 'Services',       icon: Wrench },
				{ path: '/staff',    label: 'Staff',          icon: UserCog },
				{ path: '/gyms',     label: 'Gym Locations',  icon: Building2 },
				{ path: '/settings', label: 'Settings',       icon: Settings }
			]
		}
	];

	function isActive(path) {
		const cur = $page.url.pathname;
		return path === '/dashboard' ? cur === '/dashboard' : cur.startsWith(path);
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}

	const gymName = $derived(
		data.gyms?.find(g => g.id === data.profile?.gym_id)?.name ?? data.gyms?.[0]?.name ?? 'GymLi'
	);
</script>

<div class="flex h-screen bg-gray-50 overflow-hidden">

	<!-- ── SIDEBAR ── -->
	<aside class="
		fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out
		lg:relative lg:translate-x-0
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
	" style="background:linear-gradient(180deg,#0f0c29 0%,#1e1b4b 100%);">

		<!-- Logo -->
		<div class="flex items-center gap-3 px-5 py-5 border-b border-white/5">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
				<Dumbbell size={18} class="text-white"/>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-white font-bold text-base leading-none truncate">GymLi</div>
				<div class="text-white/40 text-xs mt-0.5 truncate">{gymName}</div>
			</div>
		</div>

		<!-- Nav -->
		<nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
			{#each navSections as section}
				<div>
					<div class="px-3 text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2">{section.title}</div>
					<div class="space-y-0.5">
						{#each section.items as item}
							{@const Icon = item.icon}
							{@const active = isActive(item.path)}
							<a href={item.path} onclick={() => sidebarOpen = false}
								class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
									{active
										? 'text-white shadow-sm'
										: 'text-white/50 hover:text-white hover:bg-white/5'}"
								style={active ? 'background:linear-gradient(135deg,rgba(99,102,241,0.4),rgba(124,58,237,0.3));border:1px solid rgba(99,102,241,0.2)' : ''}>
								<Icon size={16} class={active ? 'text-brand-300' : ''}/>
								{item.label}
								{#if active}<ChevronRight size={12} class="ml-auto text-brand-400"/>{/if}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>

		<!-- User profile -->
		<div class="border-t border-white/5 p-3">
			<button onclick={() => profileOpen = !profileOpen}
				class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
				<div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
					{initials(data.profile?.full_name ?? data.user?.email ?? '?')}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-white text-sm font-semibold truncate">{data.profile?.full_name ?? 'User'}</div>
					<div class="text-white/40 text-xs capitalize">{data.profile?.role ?? 'member'}</div>
				</div>
				<ChevronDown size={14} class="text-white/30 shrink-0 transition-transform {profileOpen ? 'rotate-180' : ''}"/>
			</button>

			{#if profileOpen}
				<div class="mt-1 rounded-xl overflow-hidden border border-white/5" style="background:rgba(255,255,255,0.05)">
					<a href="/settings" class="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
						<Settings size={14}/> Account Settings
					</a>
					<button onclick={signOut} class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
						<LogOut size={14}/> Sign Out
					</button>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
			onclick={() => sidebarOpen = false} aria-label="Close menu"></button>
	{/if}

	<!-- ── MAIN ── -->
	<div class="flex-1 flex flex-col overflow-hidden min-w-0">

		<!-- Top bar -->
		<header class="bg-white border-b border-gray-100 flex items-center gap-3 px-4 lg:px-6 h-14 shrink-0 shadow-sm">
			<button onclick={() => sidebarOpen = !sidebarOpen}
				class="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors -ml-1">
				{#if sidebarOpen}<X size={20}/>{:else}<Menu size={20}/>{/if}
			</button>

			<!-- Breadcrumb / gym name -->
			<div class="flex-1 flex items-center gap-2 min-w-0">
				<span class="text-sm font-semibold text-gray-700 truncate">{gymName}</span>
			</div>

			<!-- Right actions -->
			<div class="flex items-center gap-2">
				<!-- Notifications placeholder -->
				<button class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative">
					<Bell size={18}/>
					<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
				</button>

				<!-- Avatar -->
				<a href="/settings" class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm transition-all hover:shadow-brand-500/30 hover:shadow-md"
					style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
					{initials(data.profile?.full_name ?? data.user?.email ?? '?')}
				</a>
			</div>
		</header>

		<!-- Page -->
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
