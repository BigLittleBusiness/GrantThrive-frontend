import React from 'react';
import {
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Database,
  ExternalLink,
  FileBarChart2,
  Map,
  MessageSquare,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

const STATUS_STYLES = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  deployment: 'border-amber-200 bg-amber-50 text-amber-800',
  planned: 'border-slate-200 bg-slate-50 text-slate-700',
};

const STATUS_LABELS = {
  available: 'Available in admin',
  deployment: 'Deployment configuration',
  planned: 'Backend integration required',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function SettingCard({ icon: Icon, title, description, status, detail, actionLabel, onAction, actionHref }) {
  const Action = actionHref ? 'a' : 'button';
  const actionProps = actionHref
    ? { href: actionHref, target: '_blank', rel: 'noreferrer' }
    : { type: 'button', onClick: onAction };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 p-2.5">
            <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-6 text-gray-600">{detail}</p>

      {actionLabel && (
        <Action
          {...actionProps}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          {actionLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Action>
      )}
    </section>
  );
}

/**
 * Platform settings landing page for system administrators.
 *
 * This is deliberately a control map rather than a collection of optimistic
 * toggle switches. It links to management areas that are live today and makes
 * deployment-owned settings explicit, so no control appears to change a
 * production service without a corresponding backend operation and audit trail.
 */
export default function PlatformSettings({ onNavigate }) {
  const navigate = (tab) => () => onNavigate?.(tab);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-6">
        <div className="flex items-start gap-3">
          <MonitorCog className="mt-0.5 h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Platform settings</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-700">
              A single, security-first view of GrantThrive controls. Use the available links for live administration;
              deployment-owned items are shown for operational clarity and must be changed through the approved release process.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <MonitorCog className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">Customer-facing products</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SettingCard
            icon={FileBarChart2}
            title="Marketing website and SEO"
            status="deployment"
            description="Public website content, technical SEO, social sharing and crawl controls."
            detail="Marketing pages are built and deployed with the frontend release. Canonicals, sitemap, robots rules, llms.txt and pre-rendered public pages are version-controlled rather than edited in this console."
          />
          <SettingCard
            icon={CircleDollarSign}
            title="ROI calculator"
            status="deployment"
            description="The public evaluation tool for prospective organisations."
            detail="The calculator belongs to the public frontend and should use reviewed assumptions and clearly stated methodology. It does not create council records or change subscription pricing."
          />
          <SettingCard
            icon={BarChart3}
            title="Legacy workflow comparison"
            status="deployment"
            description="Marketing comparison content describing GrantThrive against the old way of administering grants."
            detail="Maintain factual, reviewable claims. Do not add competitor-specific or disparaging copy through a platform setting; approved messaging is managed with the marketing frontend release."
          />
          <SettingCard
            icon={Map}
            title="Interactive grant mapping"
            status="available"
            description="Public grant-map visibility is controlled at the individual grant program level."
            detail="Mapping should be enabled only where a council has approved public location information. Council teams manage grant-level map settings during grant creation and administration."
            actionLabel="Manage councils"
            onAction={navigate('councils')}
          />
          <SettingCard
            icon={UsersRound}
            title="Community engagement and voting"
            status="available"
            description="Community participation controls are configured per grant program."
            detail="Community voting is always advisory and non-binding. It must never approve, reject, rank or allocate grant funding, and council decision-makers remain responsible for formal outcomes."
            actionLabel="Manage councils"
            onAction={navigate('councils')}
          />
          <SettingCard
            icon={Database}
            title="Grant data scraper and pipeline"
            status="planned"
            description="Scheduled collection, validation and publication of external grant data."
            detail="The platform history identifies this as an internal administrative capability, but no live control API is currently connected to this console. Add job health, run history, source permissions and audit logging before enabling controls here."
          />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">Operations, communications and governance</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SettingCard
            icon={MessageSquare}
            title="SMS communications"
            status="available"
            description="Centralised Twilio delivery for councils on eligible plans."
            detail="Only authorised GrantThrive administrators can manage the platform-level SMS configuration. Councils may control notification preferences but never see the shared Twilio credentials."
            actionLabel="Open SMS configuration"
            onAction={navigate('sms')}
          />
          <SettingCard
            icon={CircleDollarSign}
            title="Pricing and plan catalogue"
            status="available"
            description="Plan definitions, feature entitlements and billing presentation."
            detail="Review pricing changes carefully and keep public pricing, council entitlements and billing communications aligned. Use the dedicated management area for available controls."
            actionLabel="Open pricing management"
            onAction={navigate('pricing')}
          />
          <SettingCard
            icon={Building2}
            title="Council provisioning"
            status="available"
            description="Provision council tenants and review their platform access."
            detail="Use council management to create and administer tenant records. New council-admin registrations are reviewed separately before activation."
            actionLabel="Open council management"
            onAction={navigate('councils')}
          />
          <SettingCard
            icon={UsersRound}
            title="System administrator access"
            status="available"
            description="Privileged platform accounts and role-based administration."
            detail="Grant system-admin access only to authorised GrantThrive staff. Administrative account changes are protected by role controls and audited by the backend."
            actionLabel="Manage system admins"
            onAction={navigate('staff')}
          />
          <SettingCard
            icon={Bot}
            title="AI grant suggestions pilot"
            status="deployment"
            description="AWS Bedrock-assisted drafting suggestions for authorised council administrators."
            detail="This feature is safe-off by default and must remain advisory only. It can be enabled only after the approved model, published guardrail, least-privilege task role and pilot configuration are deployed; it must never make grant decisions."
          />
          <SettingCard
            icon={CheckCircle2}
            title="Audit and security oversight"
            status="planned"
            description="Operational evidence for privileged actions, integrations and platform changes."
            detail="Backend audit events exist for key administrative functions. A read-only, filterable audit-log view and alerting workflow should be connected before treating this console as the complete operational record."
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Change-control principle:</strong> settings that affect customer data, communications, access, public content or AI behaviour require a corresponding API or deployment change, validation and audit trail. This prevents an interface toggle from implying a change that has not safely reached the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
