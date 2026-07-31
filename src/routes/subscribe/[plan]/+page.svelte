<script>
	import { enhance } from '$app/forms';
	import { ArrowLeft, Landmark, Smartphone, Upload, CheckCircle2 } from 'lucide-svelte';
	import { formatPKR } from '$lib/utils/format.js';
	import Select from '$lib/components/Select.svelte';

	let { data, form } = $props();
	let submitting = $state(false);
	let paymentMethod = $state('bank_transfer');
	let fileName = $state('');

	function onFileChange(e) {
		fileName = e.currentTarget.files?.[0]?.name ?? '';
	}

	const methodOptions = [
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'jazzcash', label: 'JazzCash' },
	];
</script>

<svelte:head><title>Subscribe — {data.planInfo.label} — GymLi</title></svelte:head>

<div class="min-h-screen bg-ink-950">
	<nav class="px-4 sm:px-6 py-4 sm:py-5">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<a href="/choose-plan" class="btn btn-sm text-white/85 hover:text-white hover:bg-white/10 gap-1.5">
				<ArrowLeft size={14} /> Back to plans
			</a>
		</div>
	</nav>

	<div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

		<!-- Plan summary -->
			<div class="text-center mb-8">
				<p class="font-display text-volt-400 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase mb-2">Subscribe</p>
				<h1 class="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{data.planInfo.label} Plan</h1>
				<p class="mt-2 text-white/60 text-sm sm:text-base">
					<span class="font-display text-2xl font-bold text-volt-300">{formatPKR(data.planInfo.amount)}</span> / month
				</p>
			</div>

			<!-- Bank details -->
			<div class="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 mb-6">
				<h2 class="text-white font-semibold text-sm flex items-center gap-2 mb-4">
					<Smartphone size={15} class="text-volt-400" /> JazzCash
				</h2>
				<dl class="text-sm space-y-1.5 mb-6">
					<div class="flex justify-between"><dt class="text-white/50">Account name</dt><dd class="text-white font-medium">Waseem Akram</dd></div>
					<div class="flex justify-between"><dt class="text-white/50">Number</dt><dd class="text-white font-medium font-mono">0303-4063608</dd></div>
				</dl>

				<h2 class="text-white font-semibold text-sm flex items-center gap-2 mb-4">
					<Landmark size={15} class="text-volt-400" /> Bank Transfer
				</h2>
				<dl class="text-sm space-y-1.5">
					<div class="flex justify-between"><dt class="text-white/50">Account title</dt><dd class="text-white font-medium">WASEEM AKRAM</dd></div>
					<div class="flex justify-between"><dt class="text-white/50">Bank</dt><dd class="text-white font-medium text-right">Meezan Bank<br/>New Anarkali Bazar, Lahore</dd></div>
					<div class="flex justify-between"><dt class="text-white/50">Account number</dt><dd class="text-white font-medium font-mono">02720104818375</dd></div>
					<div class="flex justify-between"><dt class="text-white/50">IBAN</dt><dd class="text-white font-medium font-mono text-right">PK92MEZN0002720104818375</dd></div>
				</dl>
			</div>

			<!-- Request form -->
			<div class="bg-white rounded-2xl border border-ink-100 p-6 sm:p-8 shadow-2xl">
				<h2 class="font-display text-lg font-bold text-ink-900 mb-1">Submit your payment</h2>
				<p class="text-sm text-ink-500 mb-6">Send {formatPKR(data.planInfo.amount)} using either method above, then upload your receipt below.</p>

				{#if form?.error}
					<div class="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{form.error}</div>
				{/if}

				<form
					method="POST"
					enctype="multipart/form-data"
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
						<label class="label" for="payment_method">Payment method *</label>
						<Select id="payment_method" name="payment_method" options={methodOptions} bind:value={paymentMethod} required />
					</div>
					<div>
						<label class="label" for="reference_number">Transaction / reference number</label>
						<input id="reference_number" name="reference_number" class="input" value={form?.reference_number ?? ''} placeholder="Optional — helps us match your payment" />
					</div>
					<div>
						<span class="label">Payment receipt *</span>
						<label
							for="receipt"
							class="flex items-center gap-3 rounded-xl border-2 border-dashed border-ink-200 hover:border-volt-400 transition-colors px-4 py-4 cursor-pointer"
						>
							<span class="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
								<Upload size={16} class="text-ink-500" />
							</span>
							<span class="text-sm text-ink-600 truncate">
								{fileName || 'Choose a screenshot or photo of your receipt'}
							</span>
						</label>
						<input id="receipt" name="receipt" type="file" accept="image/*,.pdf" required class="sr-only" onchange={onFileChange} />
						<p class="text-xs text-ink-400 mt-1.5">Required — your request can't be reviewed without proof of payment.</p>
					</div>

					<button type="submit" class="btn btn-primary w-full gap-2" disabled={submitting}>
						{#if submitting}
							Submitting…
						{:else}
							<CheckCircle2 size={16} /> Submit request
						{/if}
					</button>
				</form>
			</div>
	</div>
</div>
