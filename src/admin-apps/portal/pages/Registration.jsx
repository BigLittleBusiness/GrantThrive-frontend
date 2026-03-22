import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import apiClient from '../utils/api.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  UserCircle2,
  LockKeyhole,
  Loader2,
  XCircle,
} from 'lucide-react';

const ROLE_OPTIONS = [
  {
    id: 'community_member',
    name: 'Community Member',
    description: 'For individuals or organisations applying for grants and participating in the community portal.',
    icon: Users,
    badge: 'Instant access',
    tone: 'purple',
    requirements: [
      'Valid email address',
      'Basic personal details',
      'Organisation details if applying on behalf of a group',
      'Most accounts can start immediately',
    ],
  },
  {
    id: 'council',
    name: 'Council',
    description: 'For the first representative of a council registering on GrantThrive. You will be set up as the Council Administrator.',
    icon: Building2,
    badge: 'Admin approval required',
    tone: 'green',
    requirements: [
      'Official council email required (.gov.au or .govt.nz)',
      'Council name and your position',
      'Choose your council\u2019s GrantThrive subdomain',
      'Account activated after GrantThrive admin approval',
    ],
  },
];

const STEP_TITLES = [
  'Choose account type',
  'Personal details',
  'Organisation details',
  'Verification',
  'Complete',
];

const toneClasses = {
  purple: {
    ring: 'ring-purple-200',
    border: 'border-purple-300',
    bgSoft: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    accent: 'text-purple-700',
  },
  green: {
    ring: 'ring-green-200',
    border: 'border-green-300',
    bgSoft: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconText: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border-green-200',
    accent: 'text-green-700',
  },
};

function validateGovernmentEmail(email) {
  const value = email.trim().toLowerCase();
  const auGov = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.gov\.au$/;
  const nzGov = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.govt\.nz$/;
  return auGov.test(value) || nzGov.test(value);
}

function getRoleLabel(userType) {
  return ROLE_OPTIONS.find((item) => item.id === userType)?.name || '';
}

export default function Registration({ onLogin }) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+61',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: '',
    abn: '',
    address: '',
    councilName: '',
    subdomain: '',
    position: '',
    department: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Subdomain availability check state ──────────────────────────────────
  // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [subdomainStatus, setSubdomainStatus] = useState('idle');
  const [subdomainMessage, setSubdomainMessage] = useState('');
  const [subdomainSuggestion, setSubdomainSuggestion] = useState('');
  const subdomainDebounceRef = useRef(null);

  /**
   * Derive a state abbreviation from the email domain to use in subdomain
   * suggestions when the default is already taken.
   * e.g. 'campbelltown.nsw.gov.au' → 'nsw'
   */
  const stateFromEmail = useMemo(() => {
    const domain = formData.email.split('@')[1] || '';
    const match = domain.match(/\b(nsw|vic|qld|sa|wa|tas|act|nt|nz)\b/i);
    return match ? match[1].toLowerCase() : '';
  }, [formData.email]);

  /**
   * Run the availability check against the backend.
   * Called with a debounce whenever the effective subdomain value changes.
   */
  const checkSubdomainAvailability = useCallback(async (value) => {
    if (!value || value.length < 3) {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
      setSubdomainSuggestion('');
      return;
    }
    setSubdomainStatus('checking');
    setSubdomainMessage('');
    setSubdomainSuggestion('');
    try {
      const result = await apiClient.checkSubdomain(value);
      if (result.available) {
        setSubdomainStatus('available');
        setSubdomainMessage('This subdomain is available.');
        setSubdomainSuggestion('');
      } else {
        // Distinguish between a reserved/invalid subdomain (no suggestion helpful)
        // and one that is simply already taken (offer a state-based alternative).
        const isReservedOrInvalid = result.reason &&
          (result.reason.includes('reserved') || result.reason.includes('must be'));
        setSubdomainStatus('taken');
        setSubdomainMessage(result.reason || 'That subdomain is already in use.');
        if (!isReservedOrInvalid) {
          // Build a state-based suggestion when the default is taken by another council
          const suggestion = stateFromEmail
            ? `${value.replace(/-+$/, '')}-${stateFromEmail}`
            : `${value.replace(/-+$/, '')}-council`;
          setSubdomainSuggestion(suggestion.slice(0, 40));
        } else {
          setSubdomainSuggestion('');
        }
      }
    } catch {
      // Treat network errors as non-blocking — don't prevent the user from continuing
      setSubdomainStatus('idle');
      setSubdomainMessage('');
    }
  }, [stateFromEmail]);

  // Auto-derive a default subdomain from the council name
  const derivedSubdomain = useMemo(() => {
    return formData.councilName
      .toLowerCase()
      .replace(/\s+council.*$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }, [formData.councilName]);

  // Debounce the availability check whenever the effective subdomain changes
  const effectiveSubdomain = formData.subdomain || derivedSubdomain;
  useEffect(() => {
    if (userType !== 'council') return;
    if (subdomainDebounceRef.current) clearTimeout(subdomainDebounceRef.current);
    if (!effectiveSubdomain) {
      setSubdomainStatus('idle');
      return;
    }
    subdomainDebounceRef.current = setTimeout(() => {
      checkSubdomainAvailability(effectiveSubdomain);
    }, 400);
    return () => clearTimeout(subdomainDebounceRef.current);
  }, [effectiveSubdomain, userType, checkSubdomainAvailability]);

  const selectedRole = ROLE_OPTIONS.find((item) => item.id === userType);
  const selectedTone = toneClasses[selectedRole?.tone || 'green'];

  const emailError =
    userType === 'council' && formData.email && !validateGovernmentEmail(formData.email)
      ? 'Please use your official council email (.gov.au or .govt.nz).'
      : '';

  // Country code → ISO region map used for libphonenumber-js parsing
  const COUNTRY_CODE_REGION = {
    '+61':  'AU',
    '+64':  'NZ',
    '+1':   'US',
    '+44':  'GB',
    '+353': 'IE',
  };

  // Phone number validation — accepts spaces and dashes; validates against selected country code
  const phoneError = useMemo(() => {
    // Strip spaces and dashes to get the raw digit string for parsing
    const raw = formData.phone.replace(/[\s\-]/g, '').trim();
    if (!raw) return '';
    const region = COUNTRY_CODE_REGION[formData.phoneCountryCode] || 'AU';
    // Build the full international number for parsing
    const fullNumber = formData.phoneCountryCode + raw;
    const parsed =
      parsePhoneNumberFromString(fullNumber) ||
      parsePhoneNumberFromString(raw, region);
    if (!parsed || !parsed.isValid()) {
      return `Please enter a valid phone number for ${formData.phoneCountryCode}.`;
    }
    return '';
  }, [formData.phone, formData.phoneCountryCode]);

  // Password complexity rules — all five must pass
  const passwordRules = [
    { label: 'At least 10 characters',           met: formData.password.length >= 10 },
    { label: 'One uppercase letter (A–Z)',        met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter (a–z)',        met: /[a-z]/.test(formData.password) },
    { label: 'One number (0–9)',                  met: /[0-9]/.test(formData.password) },
    { label: 'One special character (!@#$%…)',    met: /[^A-Za-z0-9]/.test(formData.password) },
  ];
  const passwordStrong = formData.password.length > 0 && passwordRules.every((r) => r.met);
  const passwordError =
    formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword
      ? 'Passwords do not match.'
      : formData.password && !passwordStrong
      ? 'Password does not meet all requirements below.'
      : '';

  const canContinueStep2 =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    !phoneError &&
    passwordStrong &&
    formData.confirmPassword.trim() &&
    formData.password === formData.confirmPassword &&
    !emailError;

  const canContinueStep3 = useMemo(() => {
    if (userType === 'council') {
      // Block if the subdomain is confirmed taken; allow if idle/checking/available
      const subdomainBlocked = subdomainStatus === 'taken';
      return (
        formData.councilName.trim() &&
        formData.position.trim() &&
        (formData.subdomain.trim() || derivedSubdomain) &&
        !subdomainBlocked
      );
    }

    return (
      formData.organizationType.trim() &&
      formData.address.trim() &&
      (formData.organizationType === 'individual' || formData.organizationName.trim())
    );
  }, [formData, userType]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: (formData.phoneCountryCode + formData.phone.replace(/[\s\-]/g, '').trim()).trim(),
        password: formData.password,
        user_type: userType,
        organization_name:
          userType === 'council'
            ? formData.councilName.trim()
            : formData.organizationName.trim() || undefined,
        subdomain:
          userType === 'council'
            ? (formData.subdomain.trim() || derivedSubdomain)
            : undefined,
        position: formData.position.trim() || undefined,
        department: formData.department.trim() || undefined,
      };

      const data = await apiClient.register(payload);

      // Persist token for instantly-approved accounts (community_member)
      if (data.token && data.user) {
        localStorage.setItem('gt_auth_token', data.token);
        localStorage.setItem('gt_auth_user', JSON.stringify(data.user));
      }

      setSubmitted(true);
      setStep(5);

      // Auto-login only for instantly-approved accounts
      if (data.token && data.user && !data.requires_approval) {
        onLogin?.(data.user);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepHeader = (title, description) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );

  const renderRoleSelection = () => (
    <div>
      {renderStepHeader(
        'Create your GrantThrive portal account',
        'Choose the account type that best matches how you will use the portal.'
      )}

      <div className="grid gap-5">
        {ROLE_OPTIONS.map((type) => {
          const Icon = type.icon;
          const tone = toneClasses[type.tone];
          const isSelected = userType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setUserType(type.id)}
              className={[
                'w-full rounded-2xl border bg-white p-5 text-left transition-all duration-200',
                'hover:shadow-md focus:outline-none focus:ring-2',
                isSelected
                  ? `${tone.border} ${tone.bgSoft} ${tone.ring} shadow-sm`
                  : 'border-slate-200 hover:border-slate-300 focus:ring-slate-200',
              ].join(' ')}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 ${tone.iconBg}`}>
                  <Icon className={`h-6 w-6 ${tone.iconText}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{type.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tone.badge}`}
                    >
                      {type.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{type.description}</p>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-900">What you’ll need</p>
                    <ul className="space-y-2">
                      {type.requirements.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {isSelected && <CheckCircle2 className={`h-6 w-6 shrink-0 ${tone.accent}`} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-700" />
          <div>
            <p className="font-medium text-blue-900">Security and access</p>
            <p className="mt-1 text-sm text-blue-800">
              Council staff accounts are verified before access is granted. Council admins are
              typically provisioned through onboarding or invite-based setup, not public sign-up.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          onClick={() => setStep(2)}
          disabled={!userType}
          className="h-11 rounded-xl bg-emerald-700 px-6 hover:bg-emerald-800"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderPersonalInfo = () => (
    <div>
      {renderStepHeader(
        'Personal details',
        'Tell us who you are. These details help us create and secure your account.'
      )}

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <UserCircle2 className="h-5 w-5 text-slate-600" />
        <div className="text-sm text-slate-700">
          Registering as <span className="font-semibold">{userType === 'council' ? 'Council Administrator' : getRoleLabel(userType)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">First name *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            className="h-11 rounded-xl"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Last name *</label>
          <Input
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            className="h-11 rounded-xl"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email address *
            {userType === 'council' && (
              <span className="ml-1 text-xs text-rose-600">Official council email only</span>
            )}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={
                userType === 'council'
                  ? 'name@council.gov.au or name@council.govt.nz'
                  : 'your.email@example.com'
              }
              className={`h-11 rounded-xl pl-10 ${emailError ? 'border-rose-300 focus-visible:ring-rose-200' : ''}`}
            />
          </div>
          {emailError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" />
              <span>{emailError}</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Phone number *</label>
          <div className="flex gap-2">
            {/* Country code dropdown */}
            <select
              value={formData.phoneCountryCode}
              onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 shrink-0"
              style={{ minWidth: '6.5rem' }}
            >
              <option value="+61">🇦🇺 +61 AU</option>
              <option value="+64">🇳🇿 +64 NZ</option>
              <option value="+1">🇺🇸 +1 US/CA</option>
              <option value="+44">🇬🇧 +44 UK</option>
              <option value="+353">🇮🇪 +353 IE</option>
            </select>
            {/* Number input */}
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="e.g. 04 1234 5678 or 04-1234-5678"
                className={`h-11 rounded-xl pl-10 ${
                  formData.phone && phoneError
                    ? 'border-rose-300 focus-visible:ring-rose-200'
                    : formData.phone && !phoneError
                    ? 'border-emerald-400 focus-visible:ring-emerald-200'
                    : ''
                }`}
              />
            </div>
          </div>
          {formData.phone && phoneError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{phoneError}</span>
            </div>
          )}
        </div>
      </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password *</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              className={`h-11 rounded-xl pl-10 ${
                formData.password && passwordStrong
                  ? 'border-emerald-400 focus-visible:ring-emerald-200'
                  : formData.password && !passwordStrong
                  ? 'border-rose-300 focus-visible:ring-rose-200'
                  : ''
              }`}
            />
          </div>
          {formData.password && (
            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={`flex items-center gap-2 text-xs ${
                  rule.met ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                    rule.met ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password *</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
              className={`h-11 rounded-xl pl-10 ${passwordError ? 'border-rose-300 focus-visible:ring-rose-200' : ''}`}
            />
          </div>
          {passwordError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" />
              <span>{passwordError}</span>
            </div>
          )}
        </div>

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 flex-1 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setStep(3)}
          disabled={!canContinueStep2}
          className="h-11 flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderOrganisationInfo = () => (
    <div>
      {renderStepHeader(
        userType === 'council' ? 'Council details' : 'Organisation details',
        userType === 'council'
          ? 'Tell us about your council and choose your GrantThrive subdomain.'
          : 'Tell us about the organisation or individual account using GrantThrive.'
      )}

      {userType === 'council' ? (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Council name *</label>
            <Input
              value={formData.councilName}
              onChange={(e) => handleInputChange('councilName', e.target.value)}
              placeholder="e.g. Melbourne City Council"
              className="h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Position / job title *</label>
            <Input
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              placeholder="e.g. Grants Manager"
              className="h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              GrantThrive subdomain *
              <span className="ml-1 text-xs font-normal text-slate-500">Your council's unique portal address</span>
            </label>
            <div
              className={`flex items-center gap-0 overflow-hidden rounded-xl border focus-within:border-slate-400 ${
                subdomainStatus === 'taken'
                  ? 'border-rose-400'
                  : subdomainStatus === 'available'
                  ? 'border-emerald-400'
                  : 'border-slate-300'
              }`}
            >
              <Input
                value={formData.subdomain || derivedSubdomain}
                onChange={(e) =>
                  handleInputChange(
                    'subdomain',
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '')
                      .slice(0, 40)
                  )
                }
                placeholder={derivedSubdomain || 'your-council'}
                className="h-11 flex-1 rounded-none border-0 focus-visible:ring-0"
              />
              {/* Availability status icon */}
              {subdomainStatus === 'checking' && (
                <Loader2 className="mx-2 h-4 w-4 animate-spin text-slate-400" />
              )}
              {subdomainStatus === 'available' && (
                <CheckCircle2 className="mx-2 h-4 w-4 text-emerald-600" />
              )}
              {subdomainStatus === 'taken' && (
                <XCircle className="mx-2 h-4 w-4 text-rose-500" />
              )}
              <span className="select-none whitespace-nowrap bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                .grantthrive.com.au
              </span>
            </div>

            {/* Availability feedback */}
            {subdomainStatus === 'available' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {subdomainMessage}
              </p>
            )}
            {subdomainStatus === 'taken' && (
              <div className="mt-1.5 space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-rose-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {subdomainMessage}
                </p>
                {subdomainSuggestion && (
                  <p className="text-xs text-slate-600">
                    Suggested alternative:{' '}
                    <button
                      type="button"
                      className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                      onClick={() => handleInputChange('subdomain', subdomainSuggestion)}
                    >
                      {subdomainSuggestion}
                    </button>
                    {' '}— click to use this instead.
                  </p>
                )}
              </div>
            )}

            {/* Portal URL preview */}
            {subdomainStatus !== 'taken' && (formData.subdomain || derivedSubdomain) && (
              <p className="mt-1.5 text-xs text-slate-500">
                Your portal will be at{' '}
                <span className="font-medium text-slate-700">
                  {formData.subdomain || derivedSubdomain}.grantthrive.com.au
                </span>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-medium text-amber-900">GrantThrive admin approval required</p>
                <p className="mt-1 text-sm text-amber-800">
                  Your registration will be reviewed by the GrantThrive team. Once approved you
                  will receive an email and can log in as your council's Administrator.
                  Additional staff can then be invited through your admin portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Organisation type *
            </label>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              value={formData.organizationType}
              onChange={(e) => handleInputChange('organizationType', e.target.value)}
            >
              <option value="">Select organisation type</option>
              <option value="individual">Individual</option>
              <option value="nonprofit">Non-profit organisation</option>
              <option value="community_group">Community group</option>
              <option value="sports_club">Sports club</option>
              <option value="arts_organization">Arts organisation</option>
              <option value="business">Business / enterprise</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.organizationType !== 'individual' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Organisation name *</label>
              <Input
                value={formData.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                placeholder="Enter your organisation name"
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {formData.organizationType && formData.organizationType !== 'individual' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">ABN (optional)</label>
              <Input
                value={formData.abn}
                onChange={(e) => handleInputChange('abn', e.target.value)}
                placeholder="XX XXX XXX XXX"
                className="h-11 rounded-xl"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                rows="4"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your address including postcode"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 flex-1 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setStep(4)}
          disabled={!canContinueStep3}
          className="h-11 flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div>
      {renderStepHeader(
        'Review and submit',
        'Please review your details below before submitting your registration request.'
      )}

      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <p className="font-medium text-emerald-900">No additional documents required</p>
              <p className="mt-1 text-sm text-emerald-800">
                {userType === 'council'
                  ? 'Your government email address is used to verify your council affiliation. No further documentation is needed at this stage.'
                  : 'You can continue and complete your registration now.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(3)} className="h-11 flex-1 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-11 flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
        >
          {isSubmitting ? 'Submitting...' : 'Submit registration'}
          {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-700" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Registration submitted</h2>
        <p className="mt-2 text-sm text-slate-600">
          We’ve received your request and sent a confirmation to <strong>{formData.email}</strong>.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Next steps</CardTitle>
            <CardDescription>
              What happens after you finish this registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            {userType === 'community_member' ? (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Your portal account can usually be activated immediately.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>You can begin browsing grants and managing applications.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-600" />
                  <span>Your request enters council/admin verification.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-600" />
                  <span>Approval usually takes 1–2 business days.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>You will receive access details by email once approved.</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
            <CardDescription>Your submitted account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Account type</span>
              <span className="font-medium text-slate-900">{getRoleLabel(userType)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-900">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">{formData.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Organisation</span>
              <span className="font-medium text-slate-900">
                {userType === 'council'
                  ? formData.councilName
                  : formData.organizationType === 'individual'
                    ? 'Individual'
                    : formData.organizationName}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button
          type="button"
          onClick={() => {
            if (typeof onLogin === 'function' && userType === 'community_member') {
              onLogin({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: 'community_member',
              });
              return;
            }

            window.location.href = '/portal/login';
          }}
          className="h-11 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800"
        >
          {userType === 'community_member' ? 'Continue to portal' : 'Return to login'}
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (step === 1) return renderRoleSelection();
    if (step === 2) return renderPersonalInfo();
    if (step === 3) return renderOrganisationInfo();
    if (step === 4) return renderVerification();
    return renderComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure portal onboarding
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Register for GrantThrive Portal
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create your portal account to apply for grants, manage council workflows, or
              participate in community grant programs.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Step</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {step} of {STEP_TITLES.length} — {STEP_TITLES[step - 1]}
            </p>
          </div>
        </div>

        {/* <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {STEP_TITLES.map((title, index) => {
              const stepNumber = index + 1;
              const active = step === stepNumber;
              const complete = step > stepNumber;

              return (
                <div key={title} className="flex items-center gap-3">
                  <div
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                      complete
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                  </div>
                  <span
                    className={`text-sm ${
                      active || complete ? 'font-medium text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {title}
                  </span>
                  {stepNumber < STEP_TITLES.length && (
                    <div className="hidden h-px w-8 bg-slate-200 md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div> */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Registration progress
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        Step {step} of {STEP_TITLES.length}
      </h2>
    </div>

    <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
      {STEP_TITLES[step - 1]}
    </div>
  </div>

  <div className="overflow-x-auto">
    <div className="flex min-w-max items-start gap-0 py-1">
      {STEP_TITLES.map((title, index) => {
        const stepNumber = index + 1;
        const isComplete = step > stepNumber;
        const isActive = step === stepNumber;

        return (
          <React.Fragment key={title}>
            <div className="flex min-w-[190px] items-start gap-3">
              <div
                className={[
                  'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200',
                  isComplete
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : isActive
                      ? 'border-slate-900 bg-slate-900 text-white ring-4 ring-slate-100'
                      : 'border-slate-200 bg-white text-slate-500',
                ].join(' ')}
              >
                {isComplete ? <CheckCircle2 className="h-5 w-5" /> : stepNumber}
              </div>

              <div className="min-w-0">
                <p
                  className={[
                    'text-sm font-semibold leading-5',
                    isComplete || isActive ? 'text-slate-900' : 'text-slate-500',
                  ].join(' ')}
                >
                  {title}
                </p>

                <p className="mt-1 text-xs leading-4">
                  {isComplete ? (
                    <span className="font-medium text-emerald-700">Completed</span>
                  ) : isActive ? (
                    <span className="font-medium text-slate-700">Current step</span>
                  ) : (
                    <span className="text-slate-400">Upcoming</span>
                  )}
                </p>
              </div>
            </div>

            {stepNumber < STEP_TITLES.length && (
              <div className="mx-4 mt-5 h-[2px] w-14 shrink-0 rounded-full bg-slate-200">
                <div
                  className={`h-[2px] rounded-full transition-all duration-300 ${
                    step > stepNumber ? 'w-full bg-emerald-600' : 'w-0 bg-emerald-600'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
</div>
        <Card className="rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50">
          <CardContent className="p-6 sm:p-8 lg:p-10">{renderCurrentStep()}</CardContent>
        </Card>

        {!submitted && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/portal/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Sign in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}