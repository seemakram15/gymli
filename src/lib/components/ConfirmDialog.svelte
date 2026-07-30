<script>
	import { X, AlertTriangle } from 'lucide-svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {string} [title]
	 * @property {string} [message]
	 * @property {string} [confirmLabel]
	 * @property {string} [cancelLabel]
	 * @property {boolean} [danger]
	 * @property {() => void} [onconfirm]
	 * @property {() => void} [oncancel]
	 */

	/** @type {Props} */
	let {
		open = false,
		title = 'Are you sure?',
		message = 'This action cannot be undone.',
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = true,
		onconfirm = () => {},
		oncancel = () => {}
	} = $props();

	function close() {
		oncancel();
	}

	function confirm() {
		onconfirm();
	}

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if open}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby="confirm-title"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		onkeydown={(e) => { if (e.key === 'Escape') close(); }}
	>
		<div class="modal-panel sm:max-w-md p-5 sm:p-6 mx-0 sm:mx-auto">
			<div class="flex items-start gap-3 mb-4">
				<div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 {danger ? 'bg-red-50 text-red-600' : 'bg-volt-100 text-volt-800'}">
					<AlertTriangle size={20} />
				</div>
				<div class="flex-1 min-w-0 pt-0.5">
					<h3 id="confirm-title" class="font-display text-lg font-bold text-ink-900">{title}</h3>
					<p class="text-sm text-ink-500 mt-1 leading-relaxed">{message}</p>
				</div>
				<button type="button" class="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" onclick={close} aria-label="Close">
					<X size={18} />
				</button>
			</div>
			<div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-2">
				<button type="button" class="btn btn-secondary w-full sm:w-auto" onclick={close}>{cancelLabel}</button>
				<button type="button" class="btn {danger ? 'btn-danger' : 'btn-primary'} w-full sm:w-auto" onclick={confirm}>{confirmLabel}</button>
			</div>
		</div>
	</div>
{/if}
