<script>
	/** @type {{ class?: string }} */
	let { class: klass = '' } = $props();
</script>

<div class="animate-pulse rounded-lg bg-ink-100 {klass}"></div>
