<script>
	import { Check, ArrowRight, LogOut } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase.js';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();
	const supabase = createClient();

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}

	const plans = [
		{
			name: 'Starter',
			price: '₨ 1,500',
			period: '/month',
			blurb: 'For a single floor getting organised.',
			features: ['1 gym location', 'Up to 20 members', 'Up to 5 staff accounts', 'Member enrollment', 'Fee collection', 'Smart reminders', 'Owner dashboard', 'Staff & roles'],
			cta: 'Choose Starter',
			href: '/subscribe/starter',
			featured: false
		},
		{
			name: 'Pro',
			price: '₨ 4,000',
			period: '/month',
			blurb: 'For growing gyms that need the full loop.',
			features: ['3 gym locations', 'Unlimited members', 'Up to 10 staff accounts', 'Automated reminders', 'CNIC image upload', 'Payment reports', 'Priority support', 'Everything in Starter'],
			cta: 'Choose Pro',
			href: '/subscribe/pro',
			featured: true
		},
		{
			name: 'Custom',
			price: 'Custom',
			period: '',
			blurb: 'For chains that need control at scale.',
			features: ['Unlimited gym locations', 'Unlimited members & staff', 'All GymLi services, unlocked', 'Custom branding', 'API access', 'Data export', 'Dedicated support'],
			cta: 'Talk to us',
			href: '/contact',
			featured: false
		}
	];
</script>

<svelte:head><title>Choose your plan — GymLi</title></svelte:head>

<div class="min-h-screen bg-ink-950">
	<nav class="px-4 sm:px-6 py-4 sm:py-5">
		<div class="max-w-6xl mx-auto flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Logo theme="dark" iconClass="w-8 h-8 sm:w-9 sm:h-9" textClass="text-2xl sm:text-3xl" />
			</div>
			<button onclick={signOut} class="btn btn-sm text-white/85 hover:text-white hover:bg-white/10 gap-1.5">
				<LogOut size={14} /> Sign out
			</button>
		</div>
	</nav>

	<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
		<div class="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
			<p class="font-display text-volt-400 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase mb-3">One last step</p>
			<h1 class="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
				{data.full_name ? `Welcome, ${data.full_name}` : 'Welcome to GymLi'} — pick your plan
			</h1>
			<p class="mt-3 sm:mt-4 text-white/60 text-base sm:text-lg">
				Choose a plan below, send payment, and upload your receipt. We'll activate your account as soon as it's verified.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
			{#each plans as plan}
				<div
					class="relative flex flex-col rounded-2xl p-5 sm:p-8 transition-transform duration-300 hover:-translate-y-1
						{plan.featured ? 'bg-white text-ink-900 ring-2 ring-volt-400' : 'bg-white/5 text-white border border-white/10'}"
				>
					{#if plan.featured}
						<div class="absolute -top-3 left-5 sm:left-6 bg-volt-400 text-ink-950 text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-md">
							Most popular
						</div>
					{/if}

					<div class="mb-5 sm:mb-6">
						<h3 class="font-display text-xl sm:text-2xl font-bold">{plan.name}</h3>
						<p class="mt-1 text-sm {plan.featured ? 'text-ink-500' : 'text-white/55'}">{plan.blurb}</p>
					</div>

					<div class="mb-6 sm:mb-8 flex items-baseline gap-1">
						<span class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">{plan.price}</span>
						{#if plan.period}
							<span class="text-sm {plan.featured ? 'text-ink-400' : 'text-white/45'}">{plan.period}</span>
						{/if}
					</div>

					<ul class="space-y-2.5 sm:space-y-3 flex-1 mb-6 sm:mb-8">
						{#each plan.features as feat}
							<li class="flex items-start gap-2.5 text-sm {plan.featured ? 'text-ink-600' : 'text-white/75'}">
								<span class="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 {plan.featured ? 'bg-volt-100 text-volt-800' : 'bg-volt-400/20 text-volt-400'}">
									<Check size={12} strokeWidth={3} />
								</span>
								{feat}
							</li>
						{/each}
					</ul>

					<a href={plan.href} class="btn w-full justify-center {plan.featured ? 'btn-primary' : 'btn-volt'}">
						{plan.cta} <ArrowRight size={16} />
					</a>
				</div>
			{/each}
		</div>
	</div>
</div>
