<script>
	import { Dumbbell, Users, DollarSign, Bell, TrendingUp } from 'lucide-svelte';
	let { children } = $props();

	const perks = [
		{ icon: Users,      text: 'Unlimited member enrollment', sub: 'CNIC, photos, contacts' },
		{ icon: DollarSign, text: 'PKR fee collection',           sub: 'Cash, card, bank transfer' },
		{ icon: Bell,       text: 'Automated reminders',          sub: 'Never chase fees again' },
		{ icon: TrendingUp, text: 'Real-time dashboard',          sub: 'Daily & monthly reports' }
	];
</script>

<div class="min-h-screen flex">
	<!-- Left panel — brand + perks (hidden on mobile) -->
	<div class="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12" style="background:linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#1e1b4b 100%);">
		<!-- Orbs -->
		<div class="anim-orb      absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style="background:radial-gradient(circle,#6366f1,transparent 70%)"></div>
		<div class="anim-orb-slow absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15" style="background:radial-gradient(circle,#8b5cf6,transparent 70%)"></div>
		<!-- Grid -->
		<div class="absolute inset-0 opacity-[0.04]" style="background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:48px 48px;"></div>

		<!-- Logo -->
		<a href="/" class="relative flex items-center gap-3 group w-fit">
			<div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:shadow-brand-500/40 group-hover:shadow-xl" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
				<Dumbbell size={22} class="text-white"/>
			</div>
			<span class="text-2xl font-extrabold text-white">GymLi</span>
		</a>

		<!-- Middle content -->
		<div class="relative flex-1 flex flex-col justify-center py-12">
			<div class="mb-10">
				<h2 class="text-4xl font-black text-white leading-tight mb-3">
					Your Gym.<br/>
					<span style="background:linear-gradient(90deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Fully Managed.</span>
				</h2>
				<p class="text-white/50 text-base leading-relaxed max-w-sm">
					From member enrollment to automated fee reminders — everything Pakistani gym owners need.
				</p>
			</div>

			<div class="space-y-4">
				{#each perks as p, i}
					{@const Icon = p.icon}
					<div class="flex items-center gap-4 anim-fade-up" style="animation-delay:{i*0.1}s">
						<div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.3)">
							<Icon size={18} class="text-brand-400"/>
						</div>
						<div>
							<div class="text-white text-sm font-semibold">{p.text}</div>
							<div class="text-white/40 text-xs">{p.sub}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Bottom -->
		<div class="relative text-white/30 text-xs">
			© {new Date().getFullYear()} GymLi · Pakistan's Gym Management System
		</div>
	</div>

	<!-- Right panel — form -->
	<div class="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-gray-50 min-h-screen">
		<!-- Mobile logo -->
		<a href="/" class="lg:hidden flex items-center gap-2.5 mb-8">
			<div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">
				<Dumbbell size={20} class="text-white"/>
			</div>
			<span class="text-xl font-extrabold" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">GymLi</span>
		</a>

		<div class="w-full max-w-md">
			<div class="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8 sm:p-10 border border-gray-100">
				{@render children()}
			</div>
		</div>
	</div>
</div>
