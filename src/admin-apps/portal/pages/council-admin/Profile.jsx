/**
 * Profile — Council Admin
 * ========================
 * My Profile / Account Settings page.
 *
 * Fixes applied:
 *  1. Fetch live profile from GET /auth/me on mount instead of relying solely
 *     on the stale JWT-decoded user object passed via props.
 *  2. Remove call to undefined `updateUser()` — use `onUpdateUser` prop
 *     (added to pageProps in PortalApp) to propagate changes to the app shell.
 *  3. Graceful error state with Retry button.
 *  4. Password strength indicator and minimum 10-char requirement (matching backend).
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/api';

const Profile = ({ user, onNavigate, onLogout, onUpdateUser }) => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [formData, setFormData] = useState({
    firstName:   '',
    lastName:    '',
    email:       '',
    phone:       '',
    department:  '',
    position:    '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [saving,          setSaving]          = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message,         setMessage]         = useState('');
  const [error,           setError]           = useState('');
  const [activeTab,       setActiveTab]       = useState('profile');

  // ── Fetch live profile on mount ─────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await apiClient.get('/auth/me');
      const u = data.user || data;
      setProfile(u);
      setFormData({
        firstName:  u.first_name  || '',
        lastName:   u.last_name   || '',
        email:      u.email       || '',
        phone:      u.phone       || '',
        department: u.department  || '',
        position:   u.position    || '',
      });
    } catch (e) {
      setFetchError(e.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    if (message) setMessage('');
    if (error)   setError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData(f => ({ ...f, [e.target.name]: e.target.value }));
    if (message) setMessage('');
    if (error)   setError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await apiClient.updateProfile({
        first_name: formData.firstName.trim(),
        last_name:  formData.lastName.trim(),
        phone:      formData.phone.trim(),
        department: formData.department.trim(),
        position:   formData.position.trim(),
      });
      if (response.success) {
        setMessage('Profile updated successfully.');
        // Propagate updated user to app shell if the prop is available
        if (typeof onUpdateUser === 'function') {
          onUpdateUser(response.data);
        }
        // Refresh local state from the returned user object
        const u = response.data || {};
        setProfile(prev => ({ ...prev, ...u }));
      } else {
        setError(response.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }
    if (passwordData.newPassword.length < 10) {
      setError('New password must be at least 10 characters.');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await apiClient.changePassword({
        current_password: passwordData.currentPassword,
        new_password:     passwordData.newPassword,
      });
      if (response.success) {
        setMessage('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(response.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while changing your password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="font-medium text-rose-600">{fetchError}</p>
          <button
            onClick={fetchProfile}
            className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayUser = profile || user || {};
  const isCouncilUser = ['council_staff', 'council_admin'].includes(displayUser.role);

  // Password strength helper
  const pwStrength = (() => {
    const p = passwordData.newPassword;
    if (!p) return null;
    let score = 0;
    if (p.length >= 10) score++;
    if (p.length >= 14) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak',   color: 'bg-red-500',    width: 'w-1/5' };
    if (score <= 2) return { label: 'Fair',   color: 'bg-orange-400', width: 'w-2/5' };
    if (score <= 3) return { label: 'Good',   color: 'bg-yellow-400', width: 'w-3/5' };
    if (score <= 4) return { label: 'Strong', color: 'bg-green-500',  width: 'w-4/5' };
    return { label: 'Very strong', color: 'bg-green-700', width: 'w-full' };
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your account information and preferences.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('council/dashboard')}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">

            {/* Tab navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-8">
                {[
                  { key: 'profile',  label: 'Profile Information' },
                  { key: 'password', label: 'Change Password' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setMessage(''); setError(''); }}
                    className={`border-b-2 px-1 py-2 text-sm font-medium ${
                      activeTab === tab.key
                        ? 'border-green-600 text-green-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Feedback banners */}
            {message && (
              <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Profile tab ──────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text" name="firstName" id="firstName"
                      value={formData.firstName} onChange={handleChange}
                      disabled={saving}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text" name="lastName" id="lastName"
                      value={formData.lastName} onChange={handleChange}
                      disabled={saving}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email" name="email" id="email"
                      value={formData.email}
                      disabled
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email address cannot be changed.</p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel" name="phone" id="phone"
                      value={formData.phone} onChange={handleChange}
                      disabled={saving}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                    />
                  </div>

                  {isCouncilUser && (
                    <>
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <input
                          type="text" name="department" id="department"
                          value={formData.department} onChange={handleChange}
                          disabled={saving}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                          Position / Job Title
                        </label>
                        <input
                          type="text" name="position" id="position"
                          value={formData.position} onChange={handleChange}
                          disabled={saving}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Password tab ─────────────────────────────────────────────── */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password" name="currentPassword" id="currentPassword"
                    value={passwordData.currentPassword} onChange={handlePasswordChange}
                    disabled={passwordLoading} required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password" name="newPassword" id="newPassword"
                    value={passwordData.newPassword} onChange={handlePasswordChange}
                    disabled={passwordLoading} required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be at least 10 characters.</p>
                  {pwStrength && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Strength: {pwStrength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password" name="confirmPassword" id="confirmPassword"
                    value={passwordData.confirmPassword} onChange={handlePasswordChange}
                    disabled={passwordLoading} required
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-gray-50 ${
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                    }`}
                  />
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Changing…' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Account information ──────────────────────────────────────── */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Account Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm capitalize text-gray-900">
                    {displayUser.role?.replace(/_/g, ' ') || '—'}
                  </dd>
                </div>
                {displayUser.council_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Council</dt>
                    <dd className="mt-1 text-sm text-gray-900">{displayUser.council_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {displayUser.created_at
                      ? new Date(displayUser.created_at).toLocaleDateString('en-AU')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {displayUser.last_login
                      ? new Date(displayUser.last_login).toLocaleDateString('en-AU')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
