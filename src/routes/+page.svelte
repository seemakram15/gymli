<script>
	import {
		Users, DollarSign, Bell, BarChart2, Shield, Building2,
		Check, ArrowRight, Dumbbell, Menu, X, IdCard, Wallet, MapPinned
	} from 'lucide-svelte';

	const services = [
		{
			title: 'Member Enrollment',
			desc: 'Capture CNIC, photos, contacts, and medical notes — enroll a member in under two minutes.',
			image: '/images/service-enrollment.jpg',
			icon: Users
		},
		{
			title: 'Fee Collection',
			desc: 'Record cash, card, or bank transfer in PKR with a clear history of every payment.',
			image: '/images/service-payment.jpg',
			icon: DollarSign
		},
		{
			title: 'Smart Reminders',
			desc: 'Due-soon, due-today, and overdue alerts — automatic follow-ups so you stop chasing fees.',
			image: '/images/service-notify.jpg',
			icon: Bell
		},
		{
			title: 'Owner Dashboard',
			desc: 'Daily, weekly, and monthly collections with overdue members visible at a glance.',
			image: '/images/service-analytics.jpg',
			icon: BarChart2
		},
		{
			title: 'Multi-Gym Control',
			desc: 'Run every branch from one account — switch locations without losing the plot.',
			image: '/images/service-locations.jpg',
			icon: Building2
		},
		{
			title: 'Staff & Roles',
			desc: 'Owner, manager, instructor, and staff access — financial data stays protected.',
			image: '/images/service-team.jpg',
			icon: Shield
		}
	];

	const highlights = [
		{
			icon: IdCard,
			title: 'CNIC Enrollment',
			desc: 'Pakistani ID format with front & back uploads on every member profile.'
		},
		{
			icon: Wallet,
			title: 'Fee Recovery',
			desc: 'Track dues, collect in PKR, and see who paid — cash, card, or transfer.'
		},
		{
			icon: MapPinned,
			title: 'Branch Control',
			desc: 'Manage multiple gym floors from one owner dashboard.'
		}
	];

	const plans = [
		{
			name: 'Starter',
			price: 'Free',
			period: '',
			blurb: 'For a single floor getting organised.',
			features: ['1 gym location', 'Up to 50 members', 'Fee tracking', 'Email reminders', 'Basic dashboard'],
			cta: 'Start free',
			featured: false
		},
		{
			name: 'Pro',
			price: '₨ 2,999',
			period: '/month',
			blurb: 'For growing gyms that need the full loop.',
			features: [
				'3 gym locations',
				'Unlimited members',
				'Automated reminders',
				'CNIC image upload',
				'Payment reports',
				'SMS reminders',
				'Priority support'
			],
			cta: 'Go Pro',
			featured: true
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			period: '',
			blurb: 'For chains that need control at scale.',
			features: [
				'Unlimited locations',
				'Custom branding',
				'API access',
				'Data export',
				'Dedicated support',
				'SLA guarantee'
			],
			cta: 'Talk to us',
			featured: false
		}
	];

	let mobileOpen = $state(false);
	let scrolled = $state(false);

	function onScroll() {
		scrolled = window.scrollY > 24;
	}
</script>

<svelte:window onscroll={onScroll} />

<svelte:head>
	<title>GymLi — Gym Management for Pakistan</title>
	<meta name="description" content="Member enrollment, PKR fee collection, automated reminders, and multi-gym dashboards built for Pakistani gym owners." />
</svelte:head>

<!-- NAV -->
<nav class="landing-nav {scrolled ? 'scrolled' : ''}">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="flex items-center justify-between h-14 sm:h-[4.25rem] gap-2">
			<a href="/" class="flex items-center gap-2 group shrink-0">
				<span class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center">
					<Dumbbell size={18} />
				</span>
				<span class="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight">GymLi</span>
			</a>

			<div class="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
				<a href="#services" class="hover:text-white transition-colors">Services</a>
				<a href="#plans" class="hover:text-white transition-colors">Plans</a>
				<a href="#contact" class="hover:text-white transition-colors">Contact</a>
			</div>

			<!-- Always show CTAs alongside on mobile + desktop -->
			<div class="flex items-center gap-2 shrink-0">
				<a href="/login" class="btn btn-sm text-white/85 hover:text-white hover:bg-white/10 px-3 sm:px-4">Sign in</a>
				<a href="/register" class="btn btn-sm btn-volt px-3 sm:px-4">Get started</a>
				<button
					type="button"
					onclick={() => (mobileOpen = !mobileOpen)}
					class="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
					aria-label="Menu"
				>
					{#if mobileOpen}<X size={20} />{:else}<Menu size={20} />{/if}
				</button>
			</div>
		</div>
	</div>

	{#if mobileOpen}
		<div class="md:hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-xl px-4 py-3">
			<div class="grid grid-cols-3 gap-2 text-center">
				{#each [['Services', '#services'], ['Plans', '#plans'], ['Contact', '#contact']] as [label, href]}
					<a
						{href}
						onclick={() => (mobileOpen = false)}
						class="py-2.5 text-sm font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/5"
					>{label}</a>
				{/each}
			</div>
		</div>
	{/if}
</nav>

<!-- HERO: text centered in the middle -->
<section class="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-ink-950">
	<div class="absolute inset-0">
		<img
			src="/images/gym-hero.jpg"
			alt=""
			class="anim-kenburns absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-ink-950/55"></div>
		<div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/50"></div>
	</div>

	<div class="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-28 text-center">
		<p class="anim-fade-up font-display text-volt-400 text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-4">
			GymLi
		</p>
		<h1 class="anim-fade-up anim-delay-1 font-display text-[2.55rem] leading-[1.05] sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mx-auto max-w-3xl">
			Run your gym.<br />Not your spreadsheets.
		</h1>
		<p class="anim-fade-up anim-delay-2 mt-5 sm:mt-6 text-base sm:text-xl text-white/65 max-w-xl mx-auto leading-relaxed">
			Enrollment, PKR billing, and reminders built for Pakistani gyms — so you stop chasing payments by hand.
		</p>
		<!-- Buttons alongside on all breakpoints -->
		<div class="anim-fade-up anim-delay-3 mt-8 flex flex-row items-center justify-center gap-2.5 sm:gap-3">
			<a href="/register" class="btn btn-volt font-bold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3">
				Start free <ArrowRight size={18} />
			</a>
			<a href="/login" class="btn border border-white/25 text-white hover:bg-white/10 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3">
				Sign in
			</a>
		</div>
	</div>
</section>

<!-- SERVICES -->
<section id="services" class="relative bg-ink-50 py-16 sm:py-28">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="max-w-2xl mb-10 sm:mb-16 text-center sm:text-left mx-auto sm:mx-0">
			<p class="font-display text-volt-700 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase mb-3">Services</p>
			<h2 class="font-display text-3xl sm:text-5xl font-extrabold text-ink-900 tracking-tight leading-tight">
				Everything a gym owner actually needs
			</h2>
			<p class="mt-3 sm:mt-4 text-ink-500 text-base sm:text-lg leading-relaxed">
				From first enrollment to the monthly collection report — clean workflows, zero clutter.
			</p>
		</div>

		<div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
			{#each services as s, i}
				{@const Icon = s.icon}
				<article
					class="group relative overflow-hidden rounded-2xl bg-ink-900 min-h-[220px] sm:min-h-[320px] anim-fade-up"
					style="animation-delay: {i * 0.06}s"
				>
					<img
						src={s.image}
						alt={s.title}
						class="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/65 to-ink-950/15"></div>
					<div class="relative h-full flex flex-col justify-end p-4 sm:p-7">
						<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center mb-3 sm:mb-4">
							<Icon size={18} />
						</div>
						<h3 class="font-display text-base sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{s.title}</h3>
						<p class="text-[11px] sm:text-sm text-white/70 leading-relaxed line-clamp-3 sm:line-clamp-none">{s.desc}</p>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- HIGHLIGHTS — meaningful service cards -->
<section class="bg-ink-900 text-white py-12 sm:py-16">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
		{#each highlights as h}
			{@const Icon = h.icon}
			<div class="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
				<div class="w-10 h-10 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center mb-4">
					<Icon size={18} />
				</div>
				<h3 class="font-display text-xl font-bold text-white">{h.title}</h3>
				<p class="mt-2 text-white/55 text-sm leading-relaxed">{h.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- PLANS -->
<section id="plans" class="relative py-16 sm:py-28 overflow-hidden" style="background: linear-gradient(180deg, #f4f4f2 0%, #e8e8e4 100%);">
	<div class="absolute inset-0 opacity-[0.35]" style="background-image: radial-gradient(circle at 20% 20%, rgba(180,239,42,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(10,10,8,0.06), transparent 45%);"></div>

	<div class="relative max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
			<p class="font-display text-volt-700 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase mb-3">Plans</p>
			<h2 class="font-display text-3xl sm:text-5xl font-extrabold text-ink-900 tracking-tight">
				Simple pricing. Clear limits.
			</h2>
			<p class="mt-3 sm:mt-4 text-ink-500 text-base sm:text-lg">Start free. Upgrade when the floor fills up.</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
			{#each plans as plan}
				<div
					class="relative flex flex-col rounded-2xl p-5 sm:p-8 transition-transform duration-300 hover:-translate-y-1
						{plan.featured
							? 'bg-ink-900 text-white ring-2 ring-volt-400'
							: 'bg-white text-ink-900 border border-ink-200'}"
				>
					{#if plan.featured}
						<div class="absolute -top-3 left-5 sm:left-6 bg-volt-400 text-ink-950 text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-md">
							Most popular
						</div>
					{/if}

					<div class="mb-5 sm:mb-6">
						<h3 class="font-display text-xl sm:text-2xl font-bold">{plan.name}</h3>
						<p class="mt-1 text-sm {plan.featured ? 'text-white/55' : 'text-ink-500'}">{plan.blurb}</p>
					</div>

					<div class="mb-6 sm:mb-8 flex items-baseline gap-1">
						<span class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">{plan.price}</span>
						{#if plan.period}
							<span class="text-sm {plan.featured ? 'text-white/45' : 'text-ink-400'}">{plan.period}</span>
						{/if}
					</div>

					<ul class="space-y-2.5 sm:space-y-3 flex-1 mb-6 sm:mb-8">
						{#each plan.features as feat}
							<li class="flex items-start gap-2.5 text-sm {plan.featured ? 'text-white/75' : 'text-ink-600'}">
								<span class="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 {plan.featured ? 'bg-volt-400/20 text-volt-400' : 'bg-volt-100 text-volt-800'}">
									<Check size={12} strokeWidth={3} />
								</span>
								{feat}
							</li>
						{/each}
					</ul>

					<a
						href="/register"
						class="btn w-full justify-center {plan.featured ? 'btn-volt' : 'btn-primary'}"
					>
						{plan.cta} <ArrowRight size={16} />
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- FOOTER — side-by-side on mobile -->
<footer id="contact" class="bg-ink-950 text-white/50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-10 mb-10 sm:mb-12">
			<div class="col-span-2 lg:col-span-1">
				<a href="/" class="inline-flex items-center gap-2.5 mb-3 sm:mb-4">
					<span class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center">
						<Dumbbell size={16} />
					</span>
					<span class="font-display text-base sm:text-lg font-extrabold text-white">GymLi</span>
				</a>
				<p class="text-xs sm:text-sm leading-relaxed text-white/45 max-w-xs">
					Pakistan’s gym management system — enrollment, fees, reminders, multi-location.
				</p>
			</div>
			<div>
				<h4 class="font-display text-white text-xs sm:text-sm font-bold tracking-wide uppercase mb-3 sm:mb-4">Product</h4>
				<ul class="space-y-2 text-xs sm:text-sm">
					<li><a href="#services" class="hover:text-white transition-colors">Services</a></li>
					<li><a href="#plans" class="hover:text-white transition-colors">Plans</a></li>
					<li><a href="/login" class="hover:text-white transition-colors">Sign in</a></li>
					<li><a href="/register" class="hover:text-white transition-colors">Get started</a></li>
				</ul>
			</div>
			<div>
				<h4 class="font-display text-white text-xs sm:text-sm font-bold tracking-wide uppercase mb-3 sm:mb-4">For owners</h4>
				<ul class="space-y-2 text-xs sm:text-sm">
					<li><a href="/register" class="hover:text-white transition-colors">Multi-gym setup</a></li>
					<li><a href="/register" class="hover:text-white transition-colors">Member enrollment</a></li>
					<li><a href="/register" class="hover:text-white transition-colors">Fee management</a></li>
					<li><a href="/register" class="hover:text-white transition-colors">Reports</a></li>
				</ul>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<h4 class="font-display text-white text-xs sm:text-sm font-bold tracking-wide uppercase mb-3 sm:mb-4">Contact</h4>
				<ul class="space-y-2 text-xs sm:text-sm">
					<li><a href="mailto:support@gymli.pk" class="hover:text-white transition-colors">support@gymli.pk</a></li>
					<li>Lahore, Pakistan</li>
				</ul>
			</div>
		</div>
		<div class="border-t border-white/10 pt-6 sm:pt-8 flex flex-row items-center justify-between gap-3 text-xs sm:text-sm">
			<p>© {new Date().getFullYear()} GymLi</p>
			<p class="text-white/30 text-right">Built for Pakistani gym owners</p>
		</div>
	</div>
</footer>
