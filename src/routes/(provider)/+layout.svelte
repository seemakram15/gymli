<script>
	import { LayoutDashboard, Inbox, Users2, LogOut, Menu, X, ChevronDown } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase.js';
	import { initials } from '$lib/utils/format.js';
	import Logo from '$lib/components/Logo.svelte';

	let { children, data } = $props();
	const supabase = createClient();
	let sidebarOpen = $state(false);
	let profileOpen = $state(false);

	const navItems = [
		{ path: '/provider', label: 'Overview', icon: LayoutDashboard, color: 'bg-blue-500' },
		{ path: '/provider/requests', label: 'Subscription Requests', icon: Inbox, color: 'bg-amber-500' },
		{ path: '/provider/accounts', label: 'Gym Accounts', icon: Users2, color: 'bg-purple-500' },
	];

	function isActive(path) {
		const cur = $page.url.pathname;
		return path === '/provider' ? cur === '/provider' : cur.startsWith(path);
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}
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
				<div class="text-white/40 text-xs mt-1.5 truncate">Service Provider</div>
			</div>
		</div>

		<nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
			{#each navItems as item}
				{@const Icon = item.icon}
				{@const active = isActive(item.path)}
				<a
					href={item.path}
					onclick={() => (sidebarOpen = false)}
					class="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
						{active
							? 'bg-volt-400/15 text-volt-300 border border-volt-400/20'
							: 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}"
				>
					<span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 {item.color} {active ? '' : 'opacity-80'}">
						<Icon size={14} class="text-white" />
					</span>
					{item.label}
				</a>
			{/each}
		</nav>
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
				<span class="text-sm font-semibold text-ink-700 truncate">Service Provider Dashboard</span>
			</div>

			<div class="flex items-center gap-2 relative">
				<button
					onclick={() => (profileOpen = !profileOpen)}
					class="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-ink-100 transition-colors"
				>
					<div class="w-8 h-8 rounded-lg bg-ink-900 text-volt-300 flex items-center justify-center text-xs font-bold shrink-0">
						{initials(data.profile?.full_name ?? data.user?.email ?? '?')}
					</div>
					<ChevronDown size={14} class="text-ink-400 hidden sm:block transition-transform {profileOpen ? 'rotate-180' : ''}" />
				</button>

				{#if profileOpen}
					<button
						class="fixed inset-0 z-40 cursor-default"
						onclick={() => (profileOpen = false)}
						aria-label="Close menu"
					></button>
					<div class="absolute right-0 top-12 z-50 w-56 rounded-xl overflow-hidden border border-ink-100 bg-white shadow-xl">
						<div class="px-3.5 py-3 border-b border-ink-100">
							<div class="text-sm font-semibold text-ink-900 truncate">{data.profile?.full_name ?? 'Service Provider'}</div>
							<div class="text-xs text-ink-400">{data.user?.email ?? ''}</div>
						</div>
						<button onclick={signOut} class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
							<LogOut size={14} /> Sign Out
						</button>
					</div>
				{/if}
			</div>
		</header>

		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
