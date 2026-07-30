<script>
	import {
		Users, DollarSign, Bell, BarChart2, Shield, Globe,
		CheckCircle, ArrowRight, Dumbbell, Zap, Star,
		TrendingUp, Menu, X, ChevronDown
	} from 'lucide-svelte';

	const features = [
		{ icon: Users,      grad: 'from-violet-500 to-purple-600', title: 'Member Enrollment',  desc: 'Full profiles with CNIC images, photos, phone, address. Enroll a new member in under 2 minutes.' },
		{ icon: DollarSign, grad: 'from-emerald-500 to-teal-600',  title: 'Fee Collection',      desc: 'Cash, card, bank transfer. Auto-track outstanding balances and full PKR payment history.' },
		{ icon: Bell,       grad: 'from-orange-500 to-red-500',    title: 'Smart Reminders',     desc: 'Automated due-soon, due-today, and overdue escalation emails — zero manual follow-up.' },
		{ icon: BarChart2,  grad: 'from-blue-500 to-cyan-500',     title: 'Owner Dashboard',     desc: 'Daily, weekly, monthly collections. Overdue members. Everything at a glance.' },
		{ icon: Globe,      grad: 'from-pink-500 to-rose-600',     title: 'Multi-Gym Support',   desc: 'One account, multiple locations. Consolidated or per-branch view.' },
		{ icon: Shield,     grad: 'from-indigo-500 to-brand-600',  title: 'Role-Based Access',   desc: 'Owner, Manager, Instructor, Staff roles. Financial data stays protected.' }
	];

	const plans = [
		{ name: 'Starter',    emoji: '🌱', price: 'Free',     period: null,     popular: false, features: ['1 Gym Location', 'Up to 50 Members', 'Basic Dashboard', 'Fee Tracking', 'Email Reminders'] },
		{ name: 'Pro',        emoji: '⚡', price: '₨ 2,999', period: '/month',  popular: true,  features: ['3 Gym Locations', 'Unlimited Members', 'Full Dashboard', 'Automated Reminders', 'CNIC Image Upload', 'Payment Reports', 'SMS Reminders', 'Priority Support'] },
		{ name: 'Enterprise', emoji: '🏢', price: 'Custom',   period: null,     popular: false, features: ['Unlimited Locations', 'Unlimited Members', 'Custom Branding', 'API Access', 'Dedicated Support', 'Data Export', 'SLA Guarantee'] }
	];

	const statsData = [
		{ val: '500+',   label: 'Gyms Managed',      icon: Dumbbell,   color: 'text-violet-500' },
		{ val: '50K+',   label: 'Members Enrolled',   icon: Users,      color: 'text-emerald-500' },
		{ val: '₨100M+', label: 'Fees Collected',     icon: DollarSign, color: 'text-amber-500' },
		{ val: '99.9%',  label: 'Uptime',             icon: TrendingUp, color: 'text-blue-500' }
	];

	let mobileOpen = $state(false);
</script>

<svelte:head>
	<title>GymLi — Gym Management System for Pakistan</title>
</svelte:head>

<!-- NAV -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100 shadow-sm">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all group-hover:shadow-brand-500/40 group-hover:shadow-md" style="background: linear-gradient(135deg, #4f46e5, #7c3aed)">
					<Dumbbell size={18} class="text-white" />
				</div>
				<span class="text-xl font-extrabold bg-clip-text text-transparent" style="background-image: linear-gradient(135deg, #4f46e5, #7c3aed); -webkit-background-clip: text;">GymLi</span>
			</a>
			<div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
				<a href="#features" class="hover:text-brand-600 transition-colors">Features</a>
				<a href="#pricing"  class="hover:text-brand-600 transition-colors">Pricing</a>
				<a href="#contact"  class="hover:text-brand-600 transition-colors">Contact</a>
			</div>
			<div class="hidden md:flex items-center gap-3">
				<a href="/login"    class="btn btn-sm btn-ghost   text-gray-700">Sign In</a>
				<a href="/register" class="btn btn-sm btn-primary">Get Started Free</a>
			</div>
			<button onclick={() => mobileOpen = !mobileOpen} class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
				{#if mobileOpen}<X size={22}/>{:else}<Menu size={22}/>{/if}
			</button>
		</div>
	</div>
	{#if mobileOpen}
		<div class="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
			<a href="#features" onclick={() => mobileOpen=false} class="block py-2 text-sm font-medium text-gray-700 hover:text-brand-600">Features</a>
			<a href="#pricing"  onclick={() => mobileOpen=false} class="block py-2 text-sm font-medium text-gray-700 hover:text-brand-600">Pricing</a>
			<a href="#contact"  onclick={() => mobileOpen=false} class="block py-2 text-sm font-medium text-gray-700 hover:text-brand-600">Contact</a>
			<div class="flex gap-3 pt-2">
				<a href="/login"    class="btn btn-secondary btn-sm flex-1 justify-center">Sign In</a>
				<a href="/register" class="btn btn-primary  btn-sm flex-1 justify-center">Get Started</a>
			</div>
		</div>
	{/if}
</nav>

<!-- HERO -->
<section class="relative min-h-screen flex items-center overflow-hidden pt-16" style="background: #0a0812;">
	<!-- Orbs -->
	<div class="anim-orb      absolute -top-40  -left-40  w-[700px] h-[700px] rounded-full opacity-25" style="background: radial-gradient(circle, #6366f1, transparent 65%)"></div>
	<div class="anim-orb-slow absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20" style="background: radial-gradient(circle, #8b5cf6, transparent 65%)"></div>
	<div class="anim-orb      absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"  style="background: radial-gradient(circle, #06b6d4, transparent 65%)"></div>
	<!-- Grid -->
	<div class="absolute inset-0 opacity-[0.04]" style="background-image: linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:60px 60px;"></div>

	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
		<div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
			<!-- Left: copy -->
			<div>
				<div class="anim-fade-up inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-8 border border-white/15 text-white/80" style="background: rgba(255,255,255,0.07)">
					<span class="w-2 h-2 rounded-full bg-emerald-400" style="animation: pulse 2s infinite; box-shadow: 0 0 0 0 rgba(52,211,153,0.4);"></span>
					Built for Pakistani Gyms · Free to Start
				</div>

				<h1 class="anim-fade-up anim-delay-1 text-5xl sm:text-6xl lg:text-[4.5rem] font-black leading-[1.05] text-white mb-6 tracking-tight">
					Manage<br/>Your Gym.<br/>
					<span style="background: linear-gradient(90deg,#818cf8,#c084fc,#67e8f9); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Never Chase Fees</span><br/>
					<span style="background: linear-gradient(90deg,#34d399,#06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Again.</span>
				</h1>

				<p class="anim-fade-up anim-delay-2 text-lg text-white/55 mb-10 leading-relaxed max-w-xl">
					Complete member enrollment with CNIC, fee collection in PKR, automated payment reminders, and a real-time owner dashboard — all in one place.
				</p>

				<div class="anim-fade-up anim-delay-3 flex flex-col sm:flex-row gap-4 mb-10">
					<a href="/register" class="btn btn-lg group text-white font-bold" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 8px 32px rgba(99,102,241,0.4);">
						Start Free Today <ArrowRight size={20} class="group-hover:translate-x-0.5 transition-transform"/>
					</a>
					<a href="/login" class="btn btn-lg text-white border border-white/20 hover:bg-white/10 backdrop-blur-sm">
						Sign In to Dashboard
					</a>
				</div>

				<div class="anim-fade-up anim-delay-4 flex flex-wrap gap-4 text-sm text-white/40">
					{#each ['No credit card required','CNIC enrollment','PKR billing','Multi-gym support'] as item}
						<span class="flex items-center gap-1.5">
							<CheckCircle size={13} class="text-emerald-400 shrink-0"/>
							{item}
						</span>
					{/each}
				</div>
			</div>

			<!-- Right: floating dashboard preview -->
			<div class="hidden lg:block mt-12 lg:mt-0 anim-fade-up anim-delay-5">
				<div class="anim-float rounded-3xl p-6 border border-white/10 shadow-2xl" style="background:rgba(255,255,255,0.06);backdrop-filter:blur(24px);">
					<div class="flex items-center gap-1.5 mb-5">
						<div class="w-3 h-3 rounded-full bg-red-400/80"></div>
						<div class="w-3 h-3 rounded-full bg-yellow-400/80"></div>
						<div class="w-3 h-3 rounded-full bg-emerald-400/80"></div>
						<span class="text-white/30 text-xs ml-3">GymLi · Dashboard</span>
					</div>
					<!-- Stats row -->
					<div class="grid grid-cols-3 gap-2 mb-4">
						{#each [['₨84,500','Month','emerald'],['127','Members','violet'],['3','Overdue','red']] as [v,l,c]}
							<div class="rounded-xl p-3 text-center" style="background:rgba(255,255,255,0.07)">
								<div class="text-base font-bold text-{c}-400">{v}</div>
								<div class="text-[10px] text-white/40 mt-0.5">{l}</div>
							</div>
						{/each}
					</div>
					<!-- List items -->
					<div class="space-y-2">
						{#each [['Ali Raza','₨5,000','bg-violet-500','paid'],['Bilal Khan','₨3,500','bg-emerald-500','paid'],['Sara Malik','₨4,200','bg-amber-500','due'],['Usman T.','₨6,000','bg-blue-500','paid']] as [n,a,bg,s]}
							<div class="flex items-center justify-between rounded-xl px-3 py-2.5" style="background:rgba(255,255,255,0.05)">
								<div class="flex items-center gap-2.5">
									<div class="w-7 h-7 rounded-full {bg} flex items-center justify-center text-xs font-bold text-white">{n[0]}</div>
									<span class="text-white/70 text-sm">{n}</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-emerald-400 text-sm font-semibold">{a}</span>
									<span class="text-[10px] px-2 py-0.5 rounded-full {s === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">{s}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
		<span class="text-xs">Scroll to explore</span>
		<ChevronDown size={16} class="anim-float"/>
	</div>
</section>

<!-- STATS STRIP -->
<section class="bg-white border-y border-gray-100">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-100">
			{#each statsData as s}
				{@const Icon = s.icon}
				<div class="flex flex-col items-center text-center px-4">
					<Icon size={22} class="{s.color} mb-2"/>
					<div class="text-3xl font-black text-gray-900">{s.val}</div>
					<div class="text-sm text-gray-500 mt-1">{s.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- FEATURES -->
<section id="features" class="py-24 bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<div class="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
				<Zap size={13}/> Everything in One Place
			</div>
			<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
				Every Tool a <span style="background:linear-gradient(135deg,#4f46e5,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Gym Owner</span> Needs
			</h2>
			<p class="text-xl text-gray-500 max-w-2xl mx-auto">From first enrollment to monthly collection report — every workflow covered, zero manual follow-up.</p>
		</div>
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each features as f}
				{@const Icon = f.icon}
				<div class="card p-7 group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-default">
					<div class="w-13 h-13 rounded-2xl bg-gradient-to-br {f.grad} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300" style="width:3.25rem;height:3.25rem;">
						<Icon size={22} class="text-white"/>
					</div>
					<h3 class="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
					<p class="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- PRICING -->
<section id="pricing" class="py-24 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-16">
			<div class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
				<Star size={13}/> Simple Pricing
			</div>
			<h2 class="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Transparent. No Surprises.</h2>
			<p class="text-xl text-gray-500">No hidden fees. No private-equity pricing tricks.</p>
		</div>

		<div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" style="align-items: stretch;">
			{#each plans as plan}
				<div class="relative card flex flex-col {plan.popular ? 'ring-2 ring-brand-500 shadow-2xl shadow-brand-500/10' : ''}">
					{#if plan.popular}
						<div class="absolute -top-4 inset-x-0 flex justify-center">
							<div class="text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
								⚡ MOST POPULAR
							</div>
						</div>
					{/if}
					<!-- Header -->
					<div class="p-7 pb-4 {plan.popular ? 'bg-gradient-to-br from-brand-50 to-violet-50 rounded-t-2xl' : ''}">
						<div class="text-3xl mb-3">{plan.emoji}</div>
						<div class="text-xl font-bold text-gray-900 mb-3">{plan.name}</div>
						<div class="flex items-end gap-1">
							<span class="text-4xl font-black text-gray-900">{plan.price}</span>
							{#if plan.period}<span class="text-gray-400 text-sm pb-1">{plan.period}</span>{/if}
						</div>
					</div>
					<div class="mx-6 border-t border-gray-100"></div>
					<!-- Features -->
					<div class="p-7 flex-1">
						<ul class="space-y-3">
							{#each plan.features as feat}
								<li class="flex items-start gap-2.5 text-sm text-gray-600">
									<CheckCircle size={16} class="{plan.popular ? 'text-brand-500' : 'text-emerald-500'} shrink-0 mt-0.5"/>
									{feat}
								</li>
							{/each}
						</ul>
					</div>
					<!-- CTA -->
					<div class="px-7 pb-7">
						<a href="/register" class="btn {plan.popular ? 'btn-primary' : 'btn-secondary'} w-full justify-center">
							Get Started {#if plan.popular}<ArrowRight size={16}/>{/if}
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA BANNER -->
<section class="relative overflow-hidden py-24" style="background:linear-gradient(135deg,#1e1b4b,#312e81);">
	<div class="anim-orb      absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-30" style="background:radial-gradient(circle,#6366f1,transparent 70%)"></div>
	<div class="anim-orb-slow absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-30" style="background:radial-gradient(circle,#8b5cf6,transparent 70%)"></div>
	<div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-4xl sm:text-5xl font-black text-white mb-4">
			Ready to Transform<br/>
			<span style="background:linear-gradient(90deg,#34d399,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Your Gym Operations?</span>
		</h2>
		<p class="text-xl text-white/60 mb-10">Join hundreds of gym owners across Pakistan who stopped chasing fees manually.</p>
		<a href="/register" class="btn btn-lg font-extrabold" style="background:white;color:#4f46e5;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
			Create Free Account <ArrowRight size={20}/>
		</a>
	</div>
</section>

<!-- FOOTER -->
<footer id="contact" class="bg-gray-950 text-gray-500">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
			<div class="sm:col-span-2 lg:col-span-1">
				<div class="flex items-center gap-2.5 mb-4">
					<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
						<Dumbbell size={18} class="text-white"/>
					</div>
					<span class="text-white font-extrabold text-lg">GymLi</span>
				</div>
				<p class="text-sm leading-relaxed">Pakistan's complete gym management system.</p>
			</div>
			<div>
				<h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
				<ul class="space-y-2.5 text-sm">
					{#each [['Features','#features'],['Pricing','#pricing'],['Sign In','/login'],['Get Started','/register']] as [l,h]}
						<li><a href={h} class="hover:text-white transition-colors">{l}</a></li>
					{/each}
				</ul>
			</div>
			<div>
				<h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Owners</h4>
				<ul class="space-y-2.5 text-sm">
					{#each ['Multi-Gym Setup','Member Enrollment','Fee Management','Reports & Analytics'] as l}
						<li><a href="/register" class="hover:text-white transition-colors">{l}</a></li>
					{/each}
				</ul>
			</div>
			<div>
				<h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
				<ul class="space-y-2.5 text-sm">
					<li>support@gymli.pk</li>
					<li>Lahore, Pakistan</li>
				</ul>
			</div>
		</div>
		<div class="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
			<p>© {new Date().getFullYear()} GymLi. All rights reserved.</p>
			<p class="flex items-center gap-1 text-gray-600">Made with <span class="text-red-500">♥</span> for Pakistani Gym Owners</p>
		</div>
	</div>
</footer>
