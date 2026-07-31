<script>
	import { enhance } from '$app/forms';
	import { Mail, Phone, MapPin, ArrowRight, ArrowLeft, Send, User, MessageSquare } from 'lucide-svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Contact Us — GymLi</title>
	<meta name="description" content="Have questions about GymLi or need a custom plan? Send us a message and we'll get back to you." />
</svelte:head>

<div class="min-h-screen bg-ink-950 flex flex-col">
	<!-- NAV -->
	<nav class="px-4 sm:px-6 py-4 sm:py-5">
		<div class="max-w-6xl mx-auto flex items-center justify-between">
			<a href="/" class="flex items-center gap-2">
				<Logo theme="dark" iconClass="w-8 h-8 sm:w-9 sm:h-9" textClass="text-2xl sm:text-3xl" />
			</a>
			<a href="/" class="btn btn-sm text-white/85 hover:text-white hover:bg-white/10 gap-1.5">
				<ArrowLeft size={14} /> Back to home
			</a>
		</div>
	</nav>

	<!-- CONTENT -->
	<div class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

		<!-- Left: copy + contact details -->
		<div>
			<p class="font-display text-volt-400 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase mb-3">Contact Us</p>
			<h1 class="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
				Let's talk about<br />your gym.
			</h1>
			<p class="mt-4 text-white/60 text-base sm:text-lg leading-relaxed max-w-md">
				Questions about GymLi, need a Custom plan for multiple locations, or just want a demo? Send us a message and we'll reply by email.
			</p>

			<div class="mt-8 sm:mt-10 space-y-4">
				<div class="flex items-center gap-3">
					<span class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
						<User size={16} class="text-volt-400" />
					</span>
					<span class="text-white/70 text-sm">Waseem Akram</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
						<Mail size={16} class="text-volt-400" />
					</span>
					<a href="mailto:seemakram15@gmail.com" class="text-white/70 text-sm hover:text-white transition-colors">seemakram15@gmail.com</a>
				</div>
				<div class="flex items-center gap-3">
					<span class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
						<MapPin size={16} class="text-volt-400" />
					</span>
					<span class="text-white/70 text-sm">Lahore, Pakistan</span>
				</div>
			</div>
		</div>

		<!-- Right: form card -->
		<div class="bg-white rounded-2xl border border-ink-100 p-6 sm:p-8 shadow-2xl">
			{#if form?.success}
				<div class="py-8 text-center">
					<div class="w-14 h-14 rounded-2xl bg-volt-100 text-volt-800 flex items-center justify-center mx-auto mb-4">
						<Send size={22} />
					</div>
					<h2 class="font-display text-xl font-bold text-ink-900">Message sent</h2>
					<p class="mt-2 text-sm text-ink-500 max-w-xs mx-auto">Thanks for reaching out — we'll get back to you at your email shortly.</p>
					<a href="/" class="btn btn-primary mt-6 gap-2">Back to home <ArrowRight size={16} /></a>
				</div>
			{:else}
				<h2 class="font-display text-xl font-bold text-ink-900 mb-1">Send us a message</h2>
				<p class="text-sm text-ink-500 mb-6">Fill in your details and we'll email you back.</p>

				{#if form?.error}
					<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{form.error}</div>
				{/if}

				<form
					method="POST"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
					class="space-y-4"
				>
					<div>
						<label class="label" for="contact-name">Full Name *</label>
						<input id="contact-name" name="name" class="input" required value={form?.name ?? ''} placeholder="Your name" />
					</div>
					<div>
						<label class="label" for="contact-email">Email *</label>
						<input id="contact-email" name="email" type="email" class="input" required value={form?.email ?? ''} placeholder="you@example.com" />
					</div>
					<div>
						<label class="label" for="contact-phone">Phone</label>
						<input id="contact-phone" name="phone" class="input" value={form?.phone ?? ''} placeholder="03xx-xxxxxxx" />
					</div>
					<div>
						<label class="label" for="contact-message">Message *</label>
						<textarea id="contact-message" name="message" class="input" required rows="4" placeholder="Tell us about your gym and what you need">{form?.message ?? ''}</textarea>
					</div>
					<button type="submit" class="btn btn-primary w-full gap-2" disabled={submitting}>
						{#if submitting}
							Sending…
						{:else}
							<MessageSquare size={16} /> Send message
						{/if}
					</button>
				</form>
			{/if}
		</div>
	</div>

	<footer class="px-4 sm:px-6 py-6 text-center text-white/30 text-xs">
		© {new Date().getFullYear()} GymLi · Pakistan
	</footer>
</div>
