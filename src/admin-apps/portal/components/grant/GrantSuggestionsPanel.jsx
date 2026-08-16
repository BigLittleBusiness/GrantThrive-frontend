import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import apiClient from '../../utils/api.js'

const areaLabels = {
  eligibility: 'Eligibility',
  assessment: 'Assessment',
  timeline: 'Timeline',
  plain_language: 'Plain language',
  documents: 'Required documents',
  community_engagement: 'Community engagement',
  accessibility: 'Accessibility',
}

const priorityClasses = {
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
}

function toErrorState(error) {
  const message = error?.message || 'The AI assistant is temporarily unavailable. Please try again later.'
  const normalised = message.toLowerCase()

  if (normalised.includes('could not be processed by the ai assistant') || normalised.includes('guardrail')) {
    return {
      kind: 'guardrail',
      title: 'Request needs review',
      message: 'The assistant could not process this draft. Remove sensitive personal information, grant allocation requests, or instructions embedded in the draft, then try again.',
    }
  }

  if (normalised.includes('not enabled') || normalised.includes('not configured')) {
    return {
      kind: 'unavailable',
      title: 'AI Assistant is not enabled yet',
      message: 'This feature has not been enabled for your council environment. You can continue creating the grant without AI suggestions.',
    }
  }

  if (normalised.includes('too many requests')) {
    return {
      kind: 'rate_limit',
      title: 'Suggestion limit reached',
      message: 'Please wait a little while before requesting more suggestions.',
    }
  }

  if (normalised.includes('provide at least one') || normalised.includes('unsupported') || normalised.includes('must be')) {
    return {
      kind: 'validation',
      title: 'Update the draft before trying again',
      message,
    }
  }

  return {
    kind: 'service',
    title: 'Suggestions are temporarily unavailable',
    message: 'Please try again shortly. Your grant draft has not been changed.',
  }
}

/**
 * Advisory-only UI for the Bedrock grant creation assistant.
 * Suggestions are never applied automatically; council officers retain control.
 */
export default function GrantSuggestionsPanel({ grantDraft }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasDraftContent = Boolean(
    grantDraft?.title?.trim() || grantDraft?.description?.trim() || grantDraft?.category?.trim()
  )

  const requestSuggestions = async () => {
    if (!hasDraftContent || loading) return

    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.councilGetGrantSuggestions({ grant_draft: grantDraft })
      setResult(response)
    } catch (requestError) {
      setResult(null)
      setError(toErrorState(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-7 shadow-lg sticky top-8" aria-live="polite">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-3 rounded-lg">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">AI Assistant</h3>
            <p className="text-xs text-blue-700 mt-0.5">Advisory drafting support</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-800">
          Advisory only
        </span>
      </div>

      <p className="text-sm leading-6 text-blue-900 mb-4">
        Review practical suggestions for this grant draft. Suggestions are never applied automatically and do not make funding decisions.
      </p>

      <button
        type="button"
        onClick={requestSuggestions}
        disabled={!hasDraftContent || loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-200"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing draft…</>
        ) : result ? (
          <><RefreshCw className="h-4 w-4" /> Refresh suggestions</>
        ) : (
          <><Lightbulb className="h-4 w-4" /> Get suggestions</>
        )}
      </button>

      {!hasDraftContent && (
        <p className="mt-3 text-xs text-blue-700">
          Add a title, category, or description before requesting suggestions.
        </p>
      )}

      {error && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            error.kind === 'guardrail'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          <div className="flex gap-2">
            {error.kind === 'guardrail' ? (
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">{error.title}</p>
              <p className="mt-1 text-sm leading-5">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="bg-white/80 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900">Summary</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{result.summary}</p>
          </div>

          {result.suggestions?.length > 0 ? (
            <div className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <div key={`${suggestion.area}-${index}`} className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-blue-900">{areaLabels[suggestion.area] || 'Suggestion'}</p>
                    <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${priorityClasses[suggestion.priority] || priorityClasses.low}`}>
                      {suggestion.priority || 'low'} priority
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-5 text-slate-800">{suggestion.suggestion}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{suggestion.rationale}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white border border-blue-200 p-4 text-sm text-slate-700">
              The assistant could not identify a specific change from the current draft. Review the summary and add more detail if you would like another pass.
            </div>
          )}

          <div className="flex gap-2 rounded-lg border border-slate-200 bg-white/70 p-3 text-xs leading-5 text-slate-600">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-700" />
            <p>{result.disclaimer || 'AI-generated advisory content. Verify against council policy before relying on it.'}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
