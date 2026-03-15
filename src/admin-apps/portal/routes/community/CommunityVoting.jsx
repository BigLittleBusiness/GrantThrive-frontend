import React, { useState, useEffect, useCallback } from 'react';
import AuthGateModal from '../components/common/AuthGateModal.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import {
  Vote,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ThumbsUp,
} from 'lucide-react';
import apiClient from '../utils/api.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CommunityVoting = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth gate
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingVoteOptionId, setPendingVoteOptionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(user || null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/voting/api/sessions?status=open`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const list = data.sessions || [];
      setSessions(list);
      if (list.length > 0 && !selectedSession) {
        setSelectedSession(list[0]);
        // Seed user votes from server if authenticated
        if (list[0].user_votes) {
          const mapped = {};
          Object.entries(list[0].user_votes).forEach(([k, v]) => {
            mapped[parseInt(k)] = v;
          });
          setUserVotes(mapped);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load voting sessions.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSelectSession = async (session) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/voting/api/sessions/${session.id}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setSelectedSession(data);
      const mapped = {};
      Object.entries(data.user_votes || {}).forEach(([k, v]) => {
        mapped[parseInt(k)] = v;
      });
      setUserVotes(mapped);
      setSubmitSuccess(false);
    } catch (err) {
      setError(err.message || 'Failed to load session.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (optionId) => {
    if (!currentUser) {
      setPendingVoteOptionId(optionId);
      setShowAuthGate(true);
      return;
    }
    setUserVotes((prev) => {
      const next = { ...prev };
      if (next[optionId] !== undefined) {
        delete next[optionId];
      } else {
        const maxVotes = selectedSession?.max_votes_per_user || 99;
        if (Object.keys(next).length >= maxVotes) {
          setError(`You can only vote for ${maxVotes} option${maxVotes !== 1 ? 's' : ''}.`);
          return prev;
        }
        next[optionId] = 1;
      }
      setError(null);
      return next;
    });
  };

  const handleAuthSuccess = (loggedInUser) => {
    setCurrentUser(loggedInUser);
    setShowAuthGate(false);
    if (pendingVoteOptionId !== null) {
      const optId = pendingVoteOptionId;
      setPendingVoteOptionId(null);
      setTimeout(() => handleVote(optId), 50);
    }
  };

  const submitAllVotes = async () => {
    if (!currentUser) {
      setShowAuthGate(true);
      return;
    }
    if (Object.keys(userVotes).length === 0) {
      setError('Please select at least one option before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('grantthrive_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const promises = Object.entries(userVotes).map(([optionId, value]) =>
        fetch(`${API_BASE}/voting/api/vote`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            application_id: parseInt(optionId),
            voting_session_id: selectedSession.id,
            vote_value: value || 1,
          }),
        })
      );
      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error('Some votes could not be submitted.');
      setSubmitSuccess(true);
      // Refresh session to get updated counts
      await handleSelectSession(selectedSession);
    } catch (err) {
      setError(err.message || 'Failed to submit votes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

  const timeRemaining = (endDate) => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Closed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading voting sessions…</p>
        </div>
      </div>
    );
  }

  if (!loading && sessions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Vote className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h2 className="text-2xl font-bold text-slate-900">No Active Voting Sessions</h2>
          <p className="mt-2 text-slate-500">Check back later for new community voting opportunities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Vote className="h-8 w-8 text-emerald-700" />
            <h1 className="text-3xl font-bold text-slate-900">Community Voting</h1>
          </div>
          <p className="text-slate-600">
            Have your say in shaping your community's future. Vote for the projects that matter most to you.
          </p>
        </div>

        {/* Session selector (if multiple) */}
        {sessions.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {sessions.map((s) => (
              <Button
                key={s.id}
                variant={selectedSession?.id === s.id ? 'default' : 'outline'}
                className="rounded-xl"
                onClick={() => handleSelectSession(s)}
              >
                {s.title}
              </Button>
            ))}
          </div>
        )}

        {selectedSession && (
          <>
            {/* Campaign overview card */}
            <Card className="mb-8 rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedSession.title}</CardTitle>
                    {selectedSession.description && (
                      <p className="mt-2 text-slate-600">{selectedSession.description}</p>
                    )}
                  </div>
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs text-slate-500">Voting period</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(selectedSession.starts_at)} — {formatDate(selectedSession.ends_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-slate-500">Time remaining</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {timeRemaining(selectedSession.ends_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Participants</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {(selectedSession.unique_voters || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500">Total votes cast</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {(selectedSession.total_votes || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {submitSuccess && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Your votes have been submitted successfully. Thank you for participating!
              </div>
            )}

            {/* Voting options */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {(selectedSession.options || []).map((option) => {
                const isVoted = userVotes[option.id] !== undefined;
                return (
                  <Card
                    key={option.id}
                    className={`rounded-3xl border-2 shadow-sm transition-all ${
                      isVoted ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {option.category && (
                            <Badge variant="outline" className="mb-2 rounded-full text-xs">
                              {option.category}
                            </Badge>
                          )}
                          <CardTitle className="text-lg leading-snug">{option.title}</CardTitle>
                        </div>
                        {isVoted && (
                          <div className="flex-shrink-0 rounded-full bg-emerald-100 p-2">
                            <CheckCircle className="h-5 w-5 text-emerald-700" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {option.description && (
                        <p className="mb-4 text-sm leading-6 text-slate-600">{option.description}</p>
                      )}

                      <div className="mb-4 space-y-2 text-sm">
                        {option.estimated_budget > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-500">
                              <DollarSign className="h-4 w-4" />
                              Estimated budget
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(option.estimated_budget)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <ThumbsUp className="h-4 w-4" />
                            Votes received
                          </span>
                          <span className="font-semibold text-slate-900">
                            {(option.vote_count || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Vote percentage bar */}
                      <div className="mb-5">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Community support</span>
                          <span className="font-medium text-slate-700">{option.percentage || 0}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${option.percentage || 0}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        className={`w-full rounded-xl ${
                          isVoted
                            ? 'bg-emerald-700 hover:bg-emerald-800'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                        onClick={() => handleVote(option.id)}
                        disabled={submitting}
                      >
                        {isVoted ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Voted — click to remove
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            {currentUser ? 'Vote for this' : 'Sign in to vote'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Submit votes CTA */}
            {Object.keys(userVotes).length > 0 && !submitSuccess && (
              <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900">
                      You have selected {Object.keys(userVotes).length} option
                      {Object.keys(userVotes).length !== 1 ? 's' : ''}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Review your selections above, then submit to record your votes.
                    </p>
                  </div>
                  <Button
                    className="rounded-xl bg-emerald-700 px-8 hover:bg-emerald-800"
                    onClick={submitAllVotes}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit my votes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth gate modal */}
      {showAuthGate && (
        <AuthGateModal
          onClose={() => setShowAuthGate(false)}
          onSuccess={handleAuthSuccess}
          message="Please sign in or register to cast your vote."
        />
      )}
    </div>
  );
};

export default CommunityVoting;
