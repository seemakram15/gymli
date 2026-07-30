<script>
	import {
		LayoutDashboard, Users, CreditCard, Package,
		Building2, CalendarCheck, BarChart3, Settings,
		LogOut, Menu, X, ChevronDown, UserCog,
		Bell, ChevronRight
	} from 'lucide-svelte';
	import { page, navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase.js';
	import { initials } from '$lib/utils/format.js';
	import Logo from '$lib/components/Logo.svelte';
	import PageSkeleton from '$lib/components/PageSkeleton.svelte';

	let { children, data } = $props();
	const supabase = createClient();
	let sidebarOpen = $state(false);
	let profileOpen = $state(false);

	/** @type {[RegExp, 'stats' | 'table' | 'cards' | 'form' | 'detail'][]} */
	const skeletonVariants = [
		[/^\/(dashboard|reports)/, 'stats'],
		[/^\/(members|subscriptions|payments|staff|attendance)\/?$/, 'table'],
		[/^\/(packages|gyms)\/?$/, 'cards'],
		[/\/(new|settings)/, 'form'],
		[/^\/members\/[^/]+$/, 'detail'],
	];

	const navigatingVariant = $derived.by(() => {
		/** @type {string | undefined} */
		const path = $navigating?.to?.url?.pathname;
		if (!path) return null;
		return skeletonVariants.find(([re]) => re.test(path))?.[1] ?? 'table';
	});

	const allNavSections = [
		{
			title: 'Overview',
			items: [
				{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'manager', 'instructor', 'staff'] },
				{ path: '/reports', label: 'Reports', icon: BarChart3, roles: ['superadmin', 'manager'] }
			]
		},
		{
			title: 'Members',
			items: [
				{ path: '/members', label: 'All Members', icon: Users, roles: ['superadmin', 'manager', 'instructor', 'staff'] },
				{ path: '/subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['superadmin', 'manager'] },
				{ path: '/payments', label: 'Payments', icon: CreditCard, roles: ['superadmin', 'manager', 'instructor'] },
				{ path: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['superadmin', 'manager', 'instructor', 'staff'] }
			]
		},
		{
			title: 'Setup',
			items: [
				{ path: '/packages', label: 'Plans', icon: Package, roles: ['superadmin', 'manager'] },
				{ path: '/staff', label: 'Staff', icon: UserCog, roles: ['superadmin', 'manager'] },
				{ path: '/gyms', label: 'Gym Locations', icon: Building2, roles: ['superadmin', 'manager'] },
				{ path: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin', 'manager', 'instructor', 'staff'] }
			]
		}
	];

	const navSections = $derived(
		allNavSections
			.map((section) => ({
				...section,
				items: section.items.filter((item) => item.roles.includes(data.profile?.role))
			}))
			.filter((section) => section.items.length)
	);

	function isActive(path) {
		const cur = $page.url.pathname;
		return path === '/dashboard' ? cur === '/dashboard' : cur.startsWith(path);
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}

	const gymName = $derived(
		data.gyms?.find((g) => g.id === data.profile?.gym_id)?.name ?? data.gyms?.[0]?.name ?? 'GymLi'
	);
</script>

<div class="flex h-screen bg-ink-50 overflow-hidden">
	<aside
		class="fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out
			lg:relative lg:translate-x-0
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
			bg-ink-950"
	>
		<div class="flex items-center gap-3 px-5 py-5 border-b border-white/8">
			<div class="w-9 h-9 shrink-0 flex items-center justify-center">
				<img src="/images/logo_dark_mode_transparent.png" alt="GymLi" class="w-full h-full object-contain" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="font-brand text-white text-xl leading-none truncate">Gym<span class="text-volt-500">Li</span></div>
				<div class="text-white/40 text-xs mt-1.5 truncate">{gymName}</div>
			</div>
		</div>

		<nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
			{#each navSections as section}
				<div>
					<div class="px-3 text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2">{section.title}</div>
					<div class="space-y-0.5">
						{#each section.items as item}
							{@const Icon = item.icon}
							{@const active = isActive(item.path)}
							<a
								href={item.path}
								onclick={() => (sidebarOpen = false)}
								class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
									{active
										? 'bg-volt-400/15 text-volt-300 border border-volt-400/20'
										: 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}"
							>
								<Icon size={16} class={active ? 'text-volt-400' : ''} />
								{item.label}
								{#if active}<ChevronRight size={12} class="ml-auto text-volt-400" />{/if}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>

		<div class="border-t border-white/8 p-3">
			<button
				onclick={() => (profileOpen = !profileOpen)}
				class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
			>
				<div class="w-9 h-9 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center text-xs font-bold shrink-0">
					{initials(data.profile?.full_name ?? data.user?.email ?? '?')}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-white text-sm font-semibold truncate">{data.profile?.full_name ?? 'User'}</div>
					<div class="text-white/40 text-xs capitalize">{data.profile?.role ?? 'member'}</div>
				</div>
				<ChevronDown size={14} class="text-white/30 shrink-0 transition-transform {profileOpen ? 'rotate-180' : ''}" />
			</button>

			{#if profileOpen}
				<div class="mt-1 rounded-xl overflow-hidden border border-white/8 bg-white/5">
					<a href="/settings" class="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
						<Settings size={14} /> Account Settings
					</a>
					<button onclick={signOut} class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
						<LogOut size={14} /> Sign Out
					</button>
				</div>
			{/if}
		</div>
	</aside>

	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close menu"
		></button>
	{/if}

	<div class="flex-1 flex flex-col overflow-hidden min-w-0">
		<header class="bg-white border-b border-ink-100 flex items-center gap-3 px-4 lg:px-6 h-14 shrink-0">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="lg:hidden p-2 rounded-xl text-ink-500 hover:bg-ink-100 transition-colors -ml-1"
			>
				{#if sidebarOpen}<X size={20} />{:else}<Menu size={20} />{/if}
			</button>

			<div class="flex-1 flex items-center gap-2 min-w-0">
				<span class="text-sm font-semibold text-ink-700 truncate">{gymName}</span>
			</div>

			<div class="flex items-center gap-2">
				<button class="w-9 h-9 flex items-center justify-center rounded-xl text-ink-500 hover:bg-ink-100 transition-colors relative" aria-label="Notifications">
					<Bell size={18} />
					<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-volt-400 rounded-full"></span>
				</button>
				<a
					href="/settings"
					class="w-9 h-9 rounded-lg bg-ink-900 text-volt-300 flex items-center justify-center text-xs font-bold"
				>
					{initials(data.profile?.full_name ?? data.user?.email ?? '?')}
				</a>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto">
			{#if navigatingVariant}
				<PageSkeleton variant={navigatingVariant} />
			{:else}
				{@render children()}
			{/if}
		</main>
	</div>
</div>
