<script>
	/** @type {{
	 *   theme?: 'dark' | 'light',
	 *   iconClass?: string,
	 *   textClass?: string,
	 *   showText?: boolean,
	 *   showIcon?: boolean,
	 *   gap?: string
	 * }} */
	let {
		theme = 'light',
		iconClass = 'w-9 h-9',
		textClass = 'text-2xl',
		showText = true,
		showIcon = true,
		gap = 'gap-2.5'
	} = $props();

	const iconSrc = $derived(
		theme === 'dark' ? '/images/logo_dark_mode_transparent.png' : '/images/logo_light_mode_transparent.png'
	);
</script>

<span class="inline-flex items-center {gap}">
	{#if showIcon}
		<img src={iconSrc} alt="GymLi" class="{iconClass} object-contain shrink-0" />
	{/if}
	{#if showText}
		<span class="font-brand {textClass} {theme === 'dark' ? 'text-white' : 'text-ink-900'}"
			>Gym<span class="text-volt-500">Li</span></span
		>
	{/if}
</span>
