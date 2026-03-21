import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organization: '',
    role: 'community_member',
    abn: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.organization.trim()) errors.organization = 'Organisation is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.password && formData.password.length < 10) {
      errors.password = 'Password must be at least 10 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Accept Australian and New Zealand phone numbers
    const phoneRegex = /^(\+61|\+64|0)[2-9]\d{7,9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid Australian or New Zealand phone number';
    }

    if (formData.abn && formData.abn.trim()) {
      const abnRegex = /^\d{11}$/;
      if (!abnRegex.test(formData.abn.replace(/\s/g, ''))) {
        errors.abn = 'ABN must be 11 digits';
      }
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        organization: formData.organization,
        role: formData.role,
        abn: formData.abn
      };

      const result = await register(userData);
      if (result.success) {
        // Registration creates an inactive account pending admin approval —
        // show the pending notice instead of navigating to the dashboard.
        setSuccess(true);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Input class helpers ──────────────────────────────────────────────────────
  const inputClass = (field) =>
    `mt-1 appearance-none relative block w-full px-3 py-2 border ${
      validationErrors[field] ? 'border-red-300' : 'border-gray-300'
    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`;

  // ── Pending-approval success screen ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Application received!</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Thank you for registering with GrantThrive. Your account is currently
            <strong> pending approval</strong> by the council administrator.
            You will receive an email once your account has been activated.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm text-green-800">
            Check your inbox at <strong>{formData.email}</strong> for a confirmation email.
          </div>
          <Link
            to="/login"
            className="inline-block mt-4 font-medium text-green-700 hover:text-green-800 text-sm"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-auto flex justify-center">
            <img
              className="h-20 w-auto"
              src="/grantthrive_logo_growth_concept.png"
              alt="GrantThrive"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the GrantThrive community
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={inputClass('firstName')}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className={inputClass('lastName')}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass('email')}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={inputClass('phone')}
                placeholder="04XX XXX XXX or +64 XX XXX XXXX"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={inputClass('password')}
                  placeholder="Min. 10 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={inputClass('confirmPassword')}
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Account Type — community_member and professional_consultant only */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="community_member">Community Member / Organisation</option>
                <option value="professional_consultant">Professional Grants Consultant</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Council staff and administrators are provisioned directly by their council.
                <a href="/pages/start-trial.html" className="ml-1 text-green-700 hover:text-green-800 font-medium">
                  Start a council trial &rarr;
                </a>
              </p>
            </div>

            {/* Organisation */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organisation <span className="text-red-500">*</span>
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                autoComplete="organization"
                required
                className={inputClass('organization')}
                placeholder={formData.role === 'professional_consultant' ? 'Your firm or trading name' : 'Organisation or community group name'}
                value={formData.organization}
                onChange={handleChange}
                disabled={loading}
              />
              {validationErrors.organization && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.organization}</p>
              )}
            </div>

            {/* ABN */}
            <div>
              <label htmlFor="abn" className="block text-sm font-medium text-gray-700">
                ABN <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="abn"
                name="abn"
                type="text"
                className={inputClass('abn')}
                placeholder="11 digit ABN"
                value={formData.abn}
                onChange={handleChange}
                disabled={loading}
              />
              {validationErrors.abn && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.abn}</p>
              )}
            </div>

            {/* Pending-approval notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800">
              <strong>Please note:</strong> New accounts require approval by the council administrator before you can log in. You will be notified by email once your account is activated.
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                className="h-4 w-4 text-green-700 focus:ring-green-500 border-gray-300 rounded mt-0.5"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="https://grantthrive.com/terms" className="text-green-700 hover:text-green-800 font-medium">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="https://grantthrive.com/privacy" className="text-green-700 hover:text-green-800 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>
            {validationErrors.agreeToTerms && (
              <p className="text-sm text-red-600">{validationErrors.agreeToTerms}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account…
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-700 hover:text-green-800">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
