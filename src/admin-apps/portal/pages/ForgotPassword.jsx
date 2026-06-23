import React, { useState } from 'react';
import apiClient from '../utils/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import grantthriveLogo from '../assets/grantthrive_logo_growth_concept.png';

const ForgotPassword = ({ council }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setStatus('success');
    } catch (err) {
      // Always show success to avoid email enumeration — only show a real error
      // if the server returns a non-auth-related failure (e.g. 500).
      if (err?.status >= 500) {
        setErrorMsg('Something went wrong on our end. Please try again shortly.');
        setStatus('error');
      } else {
        // 400/404 — treat as success to prevent email enumeration
        setStatus('success');
      }
    }
  };

  const councilName = council?.name || 'GrantThrive';
  const primaryColour = council?.primary_colour || '#15803d'; // green-700

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={grantthriveLogo}
            alt="GrantThrive"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900">{councilName}</h1>
          <p className="text-gray-500 text-sm mt-1">Grant Management Portal</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-gray-800">
              {status === 'success' ? 'Check your email' : 'Reset your password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'success' ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">
                  If an account exists for <strong>{email}</strong>, you will receive a
                  password reset link shortly.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Please check your spam folder if you don't see it within a few minutes.
                </p>
                <a
                  href="/portal/login"
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-gray-600 text-sm text-center">
                  Enter the email address associated with your account and we'll send you
                  a link to reset your password.
                </p>

                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="fp-email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={status === 'loading' || !email.trim()}
                  className="w-full h-11 text-white font-medium"
                  style={{ backgroundColor: primaryColour }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>

                <div className="text-center">
                  <a
                    href="/portal/login"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to sign in
                  </a>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
