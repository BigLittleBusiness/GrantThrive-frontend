import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, BookOpen, HelpCircle, Info, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import api from '@shared/api/client';

const questionId = (question) => (question?.id === null || question?.id === undefined ? '' : String(question.id));

function uniqueQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const id = questionId(question);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function matchesPlainLanguageSearch(question, searchTerm) {
  if (!searchTerm) return true;
  const searchableText = [
    question.question,
    question.answer,
    question.cohort_label,
    question.cohort_description,
  ].filter(Boolean).join(' ').toLowerCase();
  const terms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return terms.every((term) => searchableText.includes(term));
}

function GuidanceQuestion({ question, showCohortLabel, isContextualMatch }) {
  const id = questionId(question);

  return (
    <details
      defaultOpen={isContextualMatch}
      className={`group rounded-xl border bg-white transition-shadow ${
        isContextualMatch
          ? 'border-emerald-300 ring-2 ring-emerald-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      data-question-id={id}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:px-5">
        <span className="min-w-0">
          {showCohortLabel && question.cohort_label && (
            <span className="mb-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {question.cohort_label}
            </span>
          )}
          <span className="block font-medium leading-6 text-slate-900">{question.question}</span>
        </span>
        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-sm leading-none text-slate-600 group-open:rotate-45 group-open:border-emerald-600 group-open:text-emerald-700" aria-hidden="true">+</span>
      </summary>
      <div className="border-t border-slate-100 px-4 py-4 text-sm leading-6 text-slate-700 sm:px-5">
        {isContextualMatch && (
          <p className="mb-3 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
            Contextual guidance
          </p>
        )}
        <p>{question.answer}</p>
      </div>
    </details>
  );
}

function QuestionList({ questions, showCohortLabel, topicQuestionIds, topicId }) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3">
      {questions.map((question) => {
        const isContextualMatch = topicQuestionIds.has(questionId(question));
        return (
          <GuidanceQuestion
            key={`${questionId(question)}:${isContextualMatch ? topicId : 'standard'}`}
            question={question}
            showCohortLabel={showCohortLabel}
            isContextualMatch={isContextualMatch}
          />
        );
      })}
    </div>
  );
}

export default function HelpGuidance() {
  const [guidance, setGuidance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('top');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = searchParams.get('topic') || '';

  const loadGuidance = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/support/guidance');
      setGuidance(response || null);
    } catch (requestError) {
      setGuidance(null);
      setError(requestError.message || 'Unable to load guidance right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGuidance();
  }, [loadGuidance]);

  const cohorts = useMemo(() => Array.isArray(guidance?.cohorts) ? guidance.cohorts : [], [guidance]);
  const topQuestions = useMemo(() => Array.isArray(guidance?.top_questions) ? guidance.top_questions : [], [guidance]);
  const contextualTopics = useMemo(() => Array.isArray(guidance?.contextual_topics) ? guidance.contextual_topics : [], [guidance]);
  const guardrails = useMemo(() => (Array.isArray(guidance?.guardrails) ? guidance.guardrails : []).filter(Boolean), [guidance]);

  const libraryQuestions = useMemo(() => uniqueQuestions(cohorts.flatMap((cohort) => (
    (Array.isArray(cohort.questions) ? cohort.questions : []).map((question) => ({
      ...question,
      cohort_id: question.cohort_id ?? cohort.id,
      cohort_label: question.cohort_label ?? cohort.label,
      cohort_description: question.cohort_description ?? cohort.description,
    }))
  ))), [cohorts]);

  const allQuestions = useMemo(() => uniqueQuestions([
    ...libraryQuestions,
    ...topQuestions.map((question) => ({ ...question })),
  ]), [libraryQuestions, topQuestions]);

  const allowedCohortCount = Math.max(
    Array.isArray(guidance?.actor?.cohorts) ? guidance.actor.cohorts.length : 0,
    cohorts.length,
  );
  const showCohortLabels = allowedCohortCount > 1;

  const selectedTopic = useMemo(
    () => contextualTopics.find((topic) => String(topic.id) === topicId) || null,
    [contextualTopics, topicId],
  );
  const topicQuestionIds = useMemo(
    () => new Set((selectedTopic?.question_ids || []).map((id) => String(id))),
    [selectedTopic],
  );
  const contextualQuestions = useMemo(
    () => allQuestions.filter((question) => topicQuestionIds.has(questionId(question))),
    [allQuestions, topicQuestionIds],
  );
  const matchingQuestions = useMemo(
    () => allQuestions.filter((question) => matchesPlainLanguageSearch(question, searchTerm)),
    [allQuestions, searchTerm],
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.trim()) setActiveView('library');
  };

  const clearTopic = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('topic');
    setSearchParams(nextSearchParams, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl" aria-busy="true" role="status">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 text-slate-700"><Loader2 className="h-5 w-5 animate-spin text-emerald-700" /> Loading available guidance…</div>
          <div className="mt-6 space-y-3 animate-pulse">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm sm:p-8" role="alert">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Guidance is unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
        <Button className="mt-5 bg-emerald-700 hover:bg-emerald-800" onClick={loadGuidance}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const topTenQuestions = topQuestions.slice(0, 10);
  const totalQuestions = guidance?.total_questions ?? allQuestions.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800"><HelpCircle className="h-6 w-6" /><span className="text-sm font-semibold uppercase tracking-wide">Help centre</span></div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Help &amp; Guidance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {guidance?.actor?.label ? `Guidance available for ${guidance.actor.label}.` : 'Browse guidance available to your account.'}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
            <BookOpen className="h-4 w-4" /> {totalQuestions} {totalQuestions === 1 ? 'answer' : 'answers'}
          </span>
        </div>

        <div className="relative mt-6">
          <label htmlFor="guidance-search" className="sr-only">Search all available guidance</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="guidance-search"
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search all available guidance in plain language"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </section>

      {topicId && selectedTopic && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h2 className="font-semibold text-emerald-950">{selectedTopic.label}</h2>
                {selectedTopic.description && <p className="mt-1 text-sm leading-6 text-emerald-900">{selectedTopic.description}</p>}
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-emerald-900 hover:bg-emerald-100" onClick={clearTopic}>Show all</Button>
          </div>
          {contextualQuestions.length > 0 ? (
            <div className="mt-4">
              <QuestionList
                questions={contextualQuestions}
                showCohortLabel={showCohortLabels}
                topicQuestionIds={topicQuestionIds}
                topicId={topicId}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-900">No permitted answers are currently available for this topic.</p>
          )}
        </section>
      )}

      {topicId && !selectedTopic && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          The requested help topic is not available. You can still browse all guidance below.
        </div>
      )}

      {allQuestions.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">No guidance is available yet</h2>
          <p className="mt-2 text-sm text-slate-600">There are no answers available for your current access.</p>
        </section>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList aria-label="Guidance views" className="w-full sm:w-auto">
              <TabsTrigger value="top" className="flex-1 sm:flex-none">Top 10</TabsTrigger>
              <TabsTrigger value="library" className="flex-1 sm:flex-none">Full library</TabsTrigger>
            </TabsList>
            {searchTerm.trim() && (
              <p className="text-sm text-slate-600" aria-live="polite">
                {matchingQuestions.length} {matchingQuestions.length === 1 ? 'answer' : 'answers'} found
              </p>
            )}
          </div>

          <TabsContent value="top" className="mt-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Top 10 questions</h2>
              <p className="mt-1 text-sm text-slate-600">Common answers selected for your available guidance.</p>
            </div>
            {topTenQuestions.length > 0 ? (
              <QuestionList
                questions={topTenQuestions}
                showCohortLabel={showCohortLabels}
                topicQuestionIds={topicQuestionIds}
                topicId={topicId}
              />
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">No top questions are available right now. Use the full library to browse available answers.</p>
            )}
          </TabsContent>

          <TabsContent value="library" className="mt-5">
            {searchTerm.trim() ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Search results</h2>
                  <p className="mt-1 text-sm text-slate-600">Results include the question and answer text available to you.</p>
                </div>
                {matchingQuestions.length > 0 ? (
                  <QuestionList
                    questions={matchingQuestions}
                    showCohortLabel={showCohortLabels}
                    topicQuestionIds={topicQuestionIds}
                    topicId={topicId}
                  />
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">No available guidance matches that search. Try different everyday words.</p>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Full guidance library</h2>
                  <p className="mt-1 text-sm text-slate-600">Browse every answer available to your account.</p>
                </div>
                {showCohortLabels ? (
                  <div className="space-y-7">
                    {cohorts.map((cohort) => {
                      const cohortQuestions = libraryQuestions.filter((question) => String(question.cohort_id) === String(cohort.id));
                      if (cohortQuestions.length === 0) return null;
                      return (
                        <section key={cohort.id} aria-labelledby={`guidance-cohort-${cohort.id}`}>
                          <div className="mb-3">
                            <h3 id={`guidance-cohort-${cohort.id}`} className="font-semibold text-slate-900">{cohort.label}</h3>
                            {cohort.description && <p className="mt-1 text-sm text-slate-600">{cohort.description}</p>}
                          </div>
                          <QuestionList
                            questions={cohortQuestions}
                            showCohortLabel={false}
                            topicQuestionIds={topicQuestionIds}
                            topicId={topicId}
                          />
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <QuestionList
                    questions={allQuestions}
                    showCohortLabel={false}
                    topicQuestionIds={topicQuestionIds}
                    topicId={topicId}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {guardrails.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
            <div>
              <h2 className="font-semibold text-slate-900">Important guidance</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {guardrails.map((guardrail, index) => <li key={`${guardrail}-${index}`} className="flex gap-2"><span aria-hidden="true">•</span><span>{guardrail}</span></li>)}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
