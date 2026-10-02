/**
 * SubscriptionCard — council subscription status and Stripe actions.
 *
 * Not subscribed: plan picker (pre-selected from registration) → Stripe Checkout.
 * Subscribed: plan, status and renewal date → Stripe Customer Portal.
 * Also completes a checkout when Stripe redirects back with ?checkout=success.
 *
 * Props:
 *   subscription — `subscription` block from GET /councils/<id>/billing
 *   onChanged    — reload billing data after the subscription changes
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import PlanPicker from './PlanPicker.jsx';
import { getBillingPlans, startCheckout, syncCheckout, openBillingPortal } from '../../utils/api.js';

const STATUS_LABELS = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  past_due: { label: 'Payment overdue', className: 'bg-amber-100 text-amber-800' },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function SubscriptionCard({ subscription, onChanged }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [selection, setSelection] = useState({
    plan: subscription.plan || '',
    billingCycle: subscription.billing_cycle || 'monthly',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const handledReturn = useRef(false);

  // Complete (or acknowledge) a checkout when Stripe redirects back.
  useEffect(() => {
    const outcome = searchParams.get('checkout');
    if (!outcome || handledReturn.current) return;
    handledReturn.current = true;
    const sessionId = searchParams.get('session_id');
    setSearchParams({}, { replace: true });
    if (outcome === 'cancelled') {
      setMessage({ type: 'info', text: 'Checkout was cancelled — you have not been charged.' });
      return;
    }
    if (outcome === 'success' && sessionId) {
      setBusy(true);
      syncCheckout(sessionId)
        .then(() => {
          setMessage({ type: 'success', text: 'Thank you — your subscription is active.' });
          onChanged();
        })
        .catch((err) => setMessage({ type: 'error', text: err.message }))
        .finally(() => setBusy(false));
    }
  }, [searchParams, setSearchParams, onChanged]);

  useEffect(() => {
    if (subscription.is_active || plans.length) return;
    getBillingPlans()
      .then((data) => setPlans(data.plans))
      .catch((err) => setMessage({ type: 'error', text: err.message }));
  }, [subscription.is_active, plans.length]);

  const redirect = async (request) => {
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await request();
      window.location.assign(url);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  const activePlan = plans.find((p) => p.plan === subscription.plan) || null;
  const status = STATUS_LABELS[subscription.status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
        {subscription.is_active && status && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
        )}
      </div>

      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
          message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700'
            : message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-gray-50 text-gray-700'
        }`}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {subscription.is_active ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <p className="text-base font-medium capitalize text-gray-900">
              {activePlan?.name || `${subscription.plan} plan`} · {subscription.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} billing
            </p>
            {subscription.current_period_end && (
              <p className="mt-1">
                {subscription.cancel_at_period_end ? 'Ends on ' : 'Renews on '}
                {formatDate(subscription.current_period_end)}
              </p>
            )}
            {subscription.status === 'past_due' && (
              <p className="mt-1 text-amber-700">Your last payment failed. Update your payment method to keep access.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => redirect(openBillingPortal)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage billing
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {subscription.status === 'canceled'
              ? 'Your subscription has ended. Choose a plan to subscribe again.'
              : 'Choose your plan and billing cycle to activate your subscription.'}
            {' '}10% GST is added at checkout for Australian councils.
          </p>
          {plans.length > 0 && (
            <PlanPicker
              plans={plans}
              plan={selection.plan}
              billingCycle={selection.billingCycle}
              onChange={setSelection}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => redirect(() => startCheckout(selection.plan, selection.billingCycle))}
              disabled={busy || !selection.plan}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue to secure checkout
            </button>
            {subscription.has_billing_account && (
              <button
                type="button"
                onClick={() => redirect(openBillingPortal)}
                disabled={busy}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                View invoices
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
