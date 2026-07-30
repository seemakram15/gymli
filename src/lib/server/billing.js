/**
 * Shared subscription/payment persistence logic, extracted so every call site
 * (enrollment, subscriptions/new, payments/new, the member detail page's
 * payment modal) computes due dates and running balances the same way, and
 * so the matching notification email only needs to be wired up once per
 * action type. This module is pure DB work — it does not send email.
 */

export async function createSubscription(supabase, { user_id, package_id, gym_id, start_date, amount_due, discount }) {
	const { data: pkg, error: pkgError } = await supabase
		.from('packages')
		.select('*, cycles(name, interval_days)')
		.eq('id', package_id)
		.single();
	if (pkgError || !pkg) return { error: 'Selected plan could not be found.' };

	const effectiveStart = start_date || new Date().toISOString().split('T')[0];
	const dueDate = new Date(effectiveStart);
	if (pkg.cycles?.interval_days) dueDate.setDate(dueDate.getDate() + pkg.cycles.interval_days);

	// amount_due is the "Actual Fee" the caller already computed (plan price
	// minus discount, live, in the UI) — it's the final amount to charge, not
	// a gross figure to subtract from again here. discount is kept only as a
	// record of how much was taken off.
	const netAmount = Number(amount_due) || Number(pkg.amount) || 0;
	const netDiscount = Number(discount) || 0;

	const { data: subscription, error: err } = await supabase
		.from('subscriptions')
		.insert({
			user_id,
			package_id,
			gym_id,
			start_date: effectiveStart,
			due_date: dueDate.toISOString().split('T')[0],
			amount_due: netAmount,
			discount: netDiscount,
			amount_paid: 0,
			payment_status: 'pending',
			status: 'active',
		})
		.select()
		.single();
	if (err) return { error: err.message };

	return { subscription, pkg };
}

/** Creates the next billing period's subscription once the current one is fully paid. */
export async function renewSubscription(supabase, subscriptionId) {
	const { data: current, error: fetchError } = await supabase
		.from('subscriptions')
		.select('*, packages(*, cycles(interval_days))')
		.eq('id', subscriptionId)
		.single();
	if (fetchError || !current) return { error: 'Subscription not found.' };
	if (current.payment_status !== 'paid') return { error: 'Only a fully paid subscription can be renewed.' };

	const nextStart = current.due_date ? new Date(current.due_date) : new Date();
	const dueDate = new Date(nextStart);
	if (current.packages?.cycles?.interval_days) dueDate.setDate(dueDate.getDate() + current.packages.cycles.interval_days);

	const { data: subscription, error: err } = await supabase
		.from('subscriptions')
		.insert({
			user_id: current.user_id,
			package_id: current.package_id,
			gym_id: current.gym_id,
			start_date: nextStart.toISOString().split('T')[0],
			due_date: dueDate.toISOString().split('T')[0],
			amount_due: current.packages?.amount ?? current.amount_due,
			amount_paid: 0,
			payment_status: 'pending',
			status: 'active',
		})
		.select()
		.single();
	if (err) return { error: err.message };

	return { subscription, pkg: current.packages };
}

export async function recordPayment(supabase, { user_id, subscription_id, gym_id, amount, method, notes, receipt_url, paid_at }) {
	if (subscription_id) {
		const { data: existingSub } = await supabase
			.from('subscriptions')
			.select('amount_due, amount_paid, payment_status')
			.eq('id', subscription_id)
			.single();
		if (existingSub?.payment_status === 'paid') {
			return { error: 'This subscription is already fully paid — there is nothing left due.' };
		}
		if (existingSub) {
			const balance = Number(existingSub.amount_due) - Number(existingSub.amount_paid);
			if (Number(amount) > balance) {
				return { error: `This payment (PKR ${amount}) is more than the remaining balance of PKR ${balance} on this subscription. Reduce the amount or select a different subscription.` };
			}
		}
	}

	// A custom payment date only carries a calendar day (from a date picker), so
	// the current time-of-day is grafted onto it — this keeps same-day payments
	// ordered sensibly by `paid_at` instead of all collapsing to midnight.
	const now = new Date();
	let effectivePaidAt = now;
	if (paid_at) {
		const custom = new Date(`${paid_at}T00:00:00`);
		if (!Number.isNaN(custom.getTime())) {
			custom.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
			effectivePaidAt = custom;
		}
	}

	const { data: payment, error: err } = await supabase
		.from('payments')
		.insert({
			user_id,
			subscription_id: subscription_id || null,
			gym_id,
			amount,
			method: method || 'cash',
			notes: notes || null,
			receipt_url: receipt_url || null,
			status: 'completed',
			paid_at: effectivePaidAt.toISOString(),
		})
		.select()
		.single();
	if (err) {
		console.error('recordPayment insert failed:', err);
		// PGRST204 ("Could not find the 'X' column ... in the schema cache") and
		// other raw Postgres/PostgREST errors are meaningless to an admin — log
		// the real cause above and surface something actionable instead.
		const friendly = err.code === 'PGRST204'
			? 'Payment could not be saved because the database is out of date. Please contact your administrator to apply the latest update.'
			: 'Something went wrong while recording the payment. Please try again, or contact your administrator if this keeps happening.';
		return { error: friendly };
	}

	let subscription = null;
	if (subscription_id) {
		const { data: sub } = await supabase.from('subscriptions').select('amount_due, packages(name)').eq('id', subscription_id).single();
		const { data: payments } = await supabase.from('payments').select('amount').eq('subscription_id', subscription_id).eq('status', 'completed');
		const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
		const payment_status = totalPaid >= (sub?.amount_due ?? 0) ? 'paid' : 'pending';
		await supabase.from('subscriptions').update({ amount_paid: totalPaid, payment_status }).eq('id', subscription_id);
		subscription = { ...sub, amount_paid: totalPaid, payment_status };
	}

	return { payment, subscription };
}
