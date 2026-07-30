<script>
	import { Dumbbell } from 'lucide-svelte';
	let { children } = $props();
</script>

<div class="min-h-screen flex bg-ink-50">
	<!-- Visual panel -->
	<div class="hidden lg:block lg:w-[48%] relative overflow-hidden">
		<img
			src="/images/auth-gym.jpg"
			alt=""
			class="anim-kenburns absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40"></div>
		<div class="absolute inset-0 bg-gradient-to-r from-ink-950/30 to-transparent"></div>

		<div class="relative h-full flex flex-col justify-between p-10 xl:p-14">
			<a href="/" class="flex items-center gap-2.5 w-fit">
				<span class="w-10 h-10 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center">
					<Dumbbell size={20} />
				</span>
				<span class="font-display text-2xl font-extrabold text-white">GymLi</span>
			</a>

			<div class="max-w-md">
				<p class="font-display text-volt-400 text-sm font-bold tracking-[0.18em] uppercase mb-3">GymLi</p>
				<h2 class="font-display text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
					Your floor.<br />Fully managed.
				</h2>
				<p class="mt-4 text-white/55 text-base leading-relaxed">
					Enrollment, PKR fees, and automated reminders — built for Pakistani gym owners.
				</p>
			</div>

			<p class="text-white/35 text-xs">
				© {new Date().getFullYear()} GymLi · Pakistan
			</p>
		</div>
	</div>

	<!-- Form panel -->
	<div class="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:px-8 sm:py-12 min-h-screen">
		<a href="/" class="lg:hidden flex items-center gap-2.5 mb-8">
			<span class="w-10 h-10 rounded-lg bg-volt-400 text-ink-950 flex items-center justify-center">
				<Dumbbell size={20} />
			</span>
			<span class="font-display text-xl font-extrabold text-ink-900">GymLi</span>
		</a>

		<div class="w-full max-w-md">
			<div class="bg-white rounded-2xl border border-ink-100 p-6 sm:p-9 shadow-sm">
				{@render children()}
			</div>
		</div>
	</div>
</div>
