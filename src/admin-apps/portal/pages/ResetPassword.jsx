import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../utils/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import grantthriveLogo from '../assets/grantthrive_logo_growth_concept.png';

const ResetPassword = ({ council }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) setStatus('invalid');
  }, [token]);

  const passwordsMatch = formData.password === formData.confirm;
  const isStrong = formData.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch || !isStrong) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        new_password: formData.password,
      });
      setStatus('success');
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'The reset link may have expired. Please request a new one.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const councilName = council?.name || 'GrantThrive';
  const primaryColour = council?.primary_colour || '#15803d';

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
              {status === 'success' ? 'Password updated' : 'Set a new password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Invalid / missing token */}
            {status === 'invalid' && (
              <div className="text-center py-4">
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">
                  This password reset link is invalid or has already been used.
                </p>
                <a
                  href="/portal/forgot-password"
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium text-sm"
                >
                  Request a new reset link
                </a>
              </div>
            )}

            {/* Success */}
            {status === 'success' && (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-6">
                  Your password has been updated successfully. You can now sign in with
                  your new password.
                </p>
                <a
                  href="/portal/login"
                  className="inline-flex items-center gap-2 text-white bg-green-700 hover:bg-green-800 font-medium px-5 py-2 rounded-md text-sm"
                >
                  Sign in
                </a>
              </div>
            )}

            {/* Form */}
            {(status === 'idle' || status === 'loading' || status === 'error') && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* New password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="rp-password">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="rp-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="pl-10 pr-10"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.password && !isStrong && (
                    <p className="text-xs text-red-600">Password must be at least 8 characters.</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="rp-confirm">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="rp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={formData.confirm}
                      onChange={(e) => setFormData(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat your new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirm && !passwordsMatch && (
                    <p className="text-xs text-red-600">Passwords do not match.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={status === 'loading' || !isStrong || !passwordsMatch}
                  className="w-full h-11 text-white font-medium"
                  style={{ backgroundColor: primaryColour }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    'Update password'
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

export default ResetPassword;
