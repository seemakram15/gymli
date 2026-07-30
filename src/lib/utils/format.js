export function formatPKR(amount) {
	if (amount == null) return '—';
	return new Intl.NumberFormat('en-PK', {
		style: 'currency',
		currency: 'PKR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatDate(date) {
	if (!date) return '—';
	return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatDateTime(date) {
	if (!date) return '—';
	return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export function daysUntil(date) {
	if (!date) return null;
	const diff = new Date(date) - new Date();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function paymentStatusBadge(status) {
	const map = {
		paid:    'badge-green',
		pending: 'badge-yellow',
		overdue: 'badge-red',
	};
	return map[status] ?? 'badge-gray';
}

export function memberStatusBadge(status) {
	const map = {
		active:    'badge-green',
		inactive:  'badge-gray',
		suspended: 'badge-red',
		frozen:    'badge-blue',
	};
	return map[status] ?? 'badge-gray';
}

export function initials(name) {
	if (!name) return '?';
	return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function formatCNIC(value) {
	if (!value) return '';
	const digits = value.replace(/\D/g, '').slice(0, 13);
	if (digits.length <= 5) return digits;
	if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
	return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}
