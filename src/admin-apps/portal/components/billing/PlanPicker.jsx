/**
 * PlanPicker — choose a GrantThrive plan and billing cycle.
 * Prices come from Stripe via GET /billing/plans and exclude GST.
 *
 * Props:
 *   plans        — catalogue from getBillingPlans().plans
 *   plan         — selected plan key ('small' | 'medium' | 'large' | '')
 *   billingCycle — 'monthly' | 'annual'
 *   onChange     — ({ plan, billingCycle }) => void
 */
import { Check } from 'lucide-react';
import { formatAud } from '@shared/lib/money';

const PLAN_ORDER = ['small', 'medium', 'large'];

function features(p) {
  return [
    p.max_active_grants == null ? 'Unlimited active grants' : `Up to ${p.max_active_grants} active grants`,
    p.max_staff_users == null ? 'Unlimited staff users' : `Up to ${p.max_staff_users} staff users`,
    p.community_voting_included && p.grant_mapping_included
      ? 'Community voting & grant mapping included'
      : 'Voting & mapping available as add-ons',
  ];
}

export default function PlanPicker({ plans, plan, billingCycle, onChange }) {
  const forCycle = (cycle) => PLAN_ORDER
    .map((key) => plans.find((p) => p.plan === key && p.billing_cycle === cycle))
    .filter(Boolean);
  const monthly = Object.fromEntries(forCycle('monthly').map((p) => [p.plan, p.amount_cents]));

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="radiogroup" aria-label="Billing cycle">
        {[['monthly', 'Monthly'], ['annual', 'Annual']].map(([cycle, label]) => (
          <button
            key={cycle}
            type="button"
            role="radio"
            aria-checked={billingCycle === cycle}
            onClick={() => onChange({ plan, billingCycle: cycle })}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              billingCycle === cycle ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Plan">
        {forCycle(billingCycle).map((p) => {
          const selected = plan === p.plan;
          const saving = billingCycle === 'annual' && monthly[p.plan] ? monthly[p.plan] * 12 - p.amount_cents : 0;
          return (
            <button
              key={p.plan}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ plan: p.plan, billingCycle })}
              className={`relative rounded-2xl border-2 p-4 text-left transition ${
                selected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="mt-2">
                <span className="text-2xl font-bold text-slate-900">{formatAud(p.amount_cents)}</span>
                <span className="text-sm text-slate-500"> /{p.interval}</span>
              </p>
              <p className="text-xs text-slate-500">+ GST for Australian councils</p>
              {saving > 0 && <p className="mt-1 text-xs font-medium text-emerald-700">Save {formatAud(saving)} a year</p>}
              <ul className="mt-3 space-y-1">
                {features(p).map((f) => (
                  <li key={f} className="flex gap-1.5 text-xs text-slate-600">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
