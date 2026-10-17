import React, { useState, useEffect, useCallback } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  X,
  Plus,
  Minus,
  Users,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Target,
  TrendingUp,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  createApplication,
  deleteApplicationDocument,
  getApplication,
  getGrant,
  listApplicationDocuments,
  submitApplication,
  updateApplication,
  uploadApplicationDocument,
  validateAbn as validateAbnApi,
} from '../../utils/api.js';

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp',
]);

const createInitialFormData = () => ({
  organizationName: '', organizationType: '', abn: '', address: '', city: '', postcode: '', website: '', establishedYear: '',
  primaryContactName: '', primaryContactTitle: '', primaryContactEmail: '', primaryContactPhone: '', secondaryContactName: '', secondaryContactEmail: '',
  projectTitle: '', projectDescription: '', projectCategory: '', projectLocation: '', projectStartDate: '', projectEndDate: '',
  totalProjectCost: '', amountRequested: '', budgetItems: [{ category: '', description: '', amount: '' }], otherFunding: '', inKindContributions: '',
  communityNeed: '', projectImpact: '', sustainability: '', riskManagement: '', teamExperience: '',
  declarationAccepted: false, privacyAccepted: false, termsAccepted: false,
});

const displayDocumentName = (document) => document?.original_filename || document?.originalFilename || document?.filename || document?.name || 'Supporting document';
const documentId = (document) => document?.id || document?.document_id || document?.documentId;
const documentSize = (document) => Number(document?.size || document?.file_size || document?.fileSize || 0);

const toFormValue = (value, fallback = '') => (value === null || value === undefined ? fallback : String(value));
const scalarOrSaved = (scalar, saved, fallback = '') => (scalar === null || scalar === undefined ? toFormValue(saved, fallback) : toFormValue(scalar));

const hydrateFormData = (application) => {
  const saved = application?.form_data && typeof application.form_data === 'object' ? application.form_data : {};
  const initial = createInitialFormData();
  return {
    ...initial,
    ...saved,
    // These core columns are authoritative even if an older form_data copy exists.
    organizationName: scalarOrSaved(application?.organization_name, saved.organizationName),
    projectTitle: scalarOrSaved(application?.project_title, saved.projectTitle),
    projectDescription: scalarOrSaved(application?.project_description, saved.projectDescription),
    amountRequested: scalarOrSaved(application?.amount_requested, saved.amountRequested),
    primaryContactName: scalarOrSaved(application?.contact_person, saved.primaryContactName),
    primaryContactEmail: scalarOrSaved(application?.contact_email, saved.primaryContactEmail),
    primaryContactPhone: scalarOrSaved(application?.contact_phone, saved.primaryContactPhone),
    address: scalarOrSaved(application?.address, saved.address),
    postcode: scalarOrSaved(application?.postcode, saved.postcode),
    budgetItems: Array.isArray(saved.budgetItems) && saved.budgetItems.length ? saved.budgetItems : initial.budgetItems,
  };
};

const normaliseDocuments = (response) => {
  const documents = Array.isArray(response) ? response : response?.documents || response?.data || [];
  return Array.isArray(documents) ? documents : [];
};

const ApplicationForm = ({ user, onNavigate, onLogout }) => {
  const { grantId: grantIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const routeGrantId = grantIdParam || searchParams.get('grantId');
  const requestedApplicationId = searchParams.get('applicationId');
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);
  const [effectiveGrantId, setEffectiveGrantId] = useState(routeGrantId || null);
  const [grantTitle, setGrantTitle] = useState('Loading grant…');
  const [grantLoadError, setGrantLoadError] = useState(null);
  const [grantRetryCount, setGrantRetryCount] = useState(0);
  const [isGrantLoading, setIsGrantLoading] = useState(Boolean(routeGrantId));
  const [isApplicationLoading, setIsApplicationLoading] = useState(Boolean(requestedApplicationId));
  const [applicationLoadError, setApplicationLoadError] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData);
  const [documents, setDocuments] = useState([]);
  const [documentError, setDocumentError] = useState(null);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [removingDocumentId, setRemovingDocumentId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const hasUserEditedRef = React.useRef(false);
  const abnDebounceRef = React.useRef(null);

  // An application ID takes priority for its grant association. A conflicting URL
  // is blocked rather than risking a new draft against a different grant.
  useEffect(() => {
    let cancelled = false;
    const loadApplication = async () => {
      setApplicationLoadError(null);
      setRouteError(null);
      setDocumentError(null);
      setSubmitError(null);

      if (!requestedApplicationId) {
        hasUserEditedRef.current = false;
        setApplicationId(null);
        setEffectiveGrantId(routeGrantId || null);
        setFormData(createInitialFormData());
        setDocuments([]);
        if (!routeGrantId) setRouteError('Choose a grant before starting an application.');
        setIsApplicationLoading(false);
        return;
      }

      setIsApplicationLoading(true);
      try {
        const response = await getApplication(requestedApplicationId);
        const application = response?.application || response?.data || response;
        const loadedGrantId = application?.grant_id ?? application?.grantId;
        if (!application?.id || !loadedGrantId) {
          throw new Error('This application could not be opened because its grant information is unavailable.');
        }
        if (!routeGrantId || String(routeGrantId) !== String(loadedGrantId)) {
          if (!cancelled) {
            setRouteError(!routeGrantId
              ? 'This saved application must be opened from its grant. Return to grants and reopen the application there.'
              : 'This saved application belongs to a different grant. Return to grants and reopen it from the correct application.');
          }
          return;
        }
        if (cancelled) return;

        hasUserEditedRef.current = false;
        setApplicationId(application.id);
        setEffectiveGrantId(loadedGrantId);
        setFormData(hydrateFormData(application));
        setLastSaved(application.updated_at ? new Date(application.updated_at) : null);

        try {
          const documentResponse = await listApplicationDocuments(application.id);
          if (!cancelled) setDocuments(normaliseDocuments(documentResponse));
        } catch (error) {
          if (!cancelled) setDocumentError(error.message || 'Existing documents could not be loaded. Please try again.');
        }
      } catch (error) {
        if (!cancelled) setApplicationLoadError(error.message || 'We could not load this saved application. Please try again.');
      } finally {
        if (!cancelled) setIsApplicationLoading(false);
      }
    };

    loadApplication();
    return () => { cancelled = true; };
  }, [requestedApplicationId, routeGrantId]);

  // ── Load grant title from API ─────────────────────────────────────────────
  useEffect(() => {
    if (isApplicationLoading || !effectiveGrantId) return undefined;
    let cancelled = false;
    setIsGrantLoading(true);
    setGrantLoadError(null);
    setGrantTitle('Loading grant…');
    getGrant(effectiveGrantId)
      .then((data) => {
        const grant = data?.grant || data;
        if (cancelled) return;
        if (grant?.title) setGrantTitle(grant.title);
        else setGrantLoadError('This grant is no longer available. Please return to grants and choose an available grant.');
      })
      .catch((error) => {
        if (!cancelled) setGrantLoadError(error.message || 'We could not load this grant. Please retry or return to grants.');
      })
      .finally(() => { if (!cancelled) setIsGrantLoading(false); });
    return () => { cancelled = true; };
  }, [effectiveGrantId, grantRetryCount, isApplicationLoading]);

  const steps = [
    { id: 1, title: 'Organization', icon: Building, description: 'Basic organization information' },
    { id: 2, title: 'Contact Details', icon: User, description: 'Primary and secondary contacts' },
    { id: 3, title: 'Project Details', icon: Target, description: 'Project overview and timeline' },
    { id: 4, title: 'Budget', icon: DollarSign, description: 'Financial breakdown and funding' },
    { id: 5, title: 'Impact & Planning', icon: TrendingUp, description: 'Community impact and sustainability' },
    { id: 6, title: 'Documents', icon: FileText, description: 'Supporting documentation' },
    { id: 7, title: 'Review & Submit', icon: CheckCircle, description: 'Final review and declaration' }
  ];

  const getDraftBlockReason = useCallback(() => {
    if (!effectiveGrantId) return 'Choose a grant before saving this application.';
    const requiredFields = [
      ['organization name', formData.organizationName],
      ['project title', formData.projectTitle],
      ['project description', formData.projectDescription],
      ['amount requested', formData.amountRequested],
      ['primary contact name', formData.primaryContactName],
      ['primary contact email', formData.primaryContactEmail],
    ];
    const missing = requiredFields.filter(([, value]) => value === '' || value === null || value === undefined).map(([label]) => label);
    return missing.length ? `Complete ${missing.join(', ')} before saving your draft.` : null;
  }, [effectiveGrantId, formData]);

  // ── Build API payload from formData ──────────────────────────────────────
  // File objects are deliberately excluded: supporting documents use multipart endpoints.
  const buildPayload = useCallback(() => {
    return {
      grant_id: Number(effectiveGrantId),
      organization_name: formData.organizationName,
      project_title: formData.projectTitle,
      project_description: formData.projectDescription,
      amount_requested: Number(formData.amountRequested),
      contact_person: formData.primaryContactName,
      contact_email: formData.primaryContactEmail,
      contact_phone: formData.primaryContactPhone,
      address: formData.address,
      postcode: formData.postcode,
      form_data: formData,
    };
  }, [effectiveGrantId, formData]);

  // Create the draft on first save, update it afterwards. Resolves with its server ID.
  const saveDraft = useCallback(async () => {
    const blockReason = getDraftBlockReason();
    if (blockReason) throw new Error(blockReason);
    const payload = buildPayload();
    if (applicationId) {
      await updateApplication(applicationId, payload);
      return applicationId;
    }
    const response = await createApplication(payload);
    const created = response?.application || response?.data || response;
    if (!created?.id) throw new Error('The draft was saved, but no application ID was returned. Please reload before uploading documents.');
    setApplicationId(created.id);
    return created.id;
  }, [applicationId, buildPayload, getDraftBlockReason]);

  // ── Save Draft handler ────────────────────────────────────────────────────
  const handleSaveDraft = async (silentlySkipIncomplete = false) => {
    const blockReason = getDraftBlockReason();
    if (blockReason && silentlySkipIncomplete) return null;
    setIsAutoSaving(true);
    setSubmitError(null);
    try {
      const savedId = await saveDraft();
      hasUserEditedRef.current = false;
      setLastSaved(new Date());
      return savedId;
    } catch (error) {
      if (!silentlySkipIncomplete) setSubmitError(error.message || 'Failed to save draft. Please try again.');
      return null;
    } finally {
      setIsAutoSaving(false);
    }
  };

  // ── Submit Application handler ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplication(await saveDraft());
      setSubmitSuccess(true);
      // Navigate back to grants list after short delay
      setTimeout(() => {
        if (onNavigate) onNavigate('grants');
        else navigate('/portal/community/grants');
      }, 2000);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Auto-save (real API call) ─────────────────────────────────────────────
  useEffect(() => {
    if (isApplicationLoading || isGrantLoading || grantLoadError || routeError || !hasUserEditedRef.current) return undefined;
    const autoSave = setTimeout(() => {
      if (hasUserEditedRef.current) handleSaveDraft(true);
    }, 3000);
    return () => clearTimeout(autoSave);
  }, [formData, isApplicationLoading, isGrantLoading, grantLoadError, routeError]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFormData = (field, value) => {
    hasUserEditedRef.current = true;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // ── ABN validation state ──────────────────────────────────────────────────
  const [abnStatus, setAbnStatus] = React.useState('idle');
  const [abnResult, setAbnResult] = React.useState(null);

  const runAbnValidation = async (abn) => {
    setAbnStatus('checking');
    try {
      const data = await validateAbnApi(abn);
      setAbnResult(data);
      if (!data.valid_format) {
        setAbnStatus('invalid');
        setErrors(prev => ({ ...prev, abn: data.error || 'This ABN is not valid.' }));
      } else if (data.live_validated && data.active === false) {
        setAbnStatus('inactive');
        setErrors(prev => ({ ...prev, abn: 'This ABN is registered but not currently active.' }));
      } else if (data.live_validated && data.active === true) {
        setAbnStatus('valid');
        setErrors(prev => ({ ...prev, abn: null }));
      } else {
        setAbnStatus('format_only');
        setErrors(prev => ({ ...prev, abn: null }));
      }
    } catch (error) {
      setAbnResult({ error: error.message });
      setAbnStatus('network_error');
      setErrors(prev => ({ ...prev, abn: null }));
    }
  };

  const handleAbnChange = (value) => {
    updateFormData('abn', value);
    setAbnStatus('idle');
    setAbnResult(null);
    if (abnDebounceRef.current) clearTimeout(abnDebounceRef.current);
    const stripped = value.replace(/\D/g, '');
    if (stripped.length < 11) return;
    setAbnStatus('checking');
    abnDebounceRef.current = setTimeout(() => runAbnValidation(stripped), 600);
  };

  const addBudgetItem = () => {
    hasUserEditedRef.current = true;
    setFormData(prev => ({
      ...prev,
      budgetItems: [...prev.budgetItems, { category: '', description: '', amount: '' }]
    }));
  };

  const removeBudgetItem = (index) => {
    hasUserEditedRef.current = true;
    setFormData(prev => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((_, i) => i !== index)
    }));
  };

  const updateBudgetItem = (index, field, value) => {
    hasUserEditedRef.current = true;
    setFormData(prev => ({
      ...prev,
      budgetItems: prev.budgetItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.organizationName) newErrors.organizationName = 'Organization name is required';
        if (!formData.organizationType) newErrors.organizationType = 'Organization type is required';
        if (!formData.abn) newErrors.abn = 'ABN is required';
        if (formData.abn && formData.abn.replace(/\D/g, '').length !== 11) newErrors.abn = 'ABN must contain 11 digits.';
        if (formData.abn && abnStatus === 'checking') newErrors.abn = 'ABN validation is still in progress.';
        if (abnStatus === 'invalid' || abnStatus === 'inactive') newErrors.abn = errors.abn || 'Enter an active, valid ABN.';
        break;
      case 2:
        if (!formData.primaryContactName) newErrors.primaryContactName = 'Primary contact name is required';
        if (!formData.primaryContactEmail) newErrors.primaryContactEmail = 'Primary contact email is required';
        if (!formData.primaryContactPhone) newErrors.primaryContactPhone = 'Primary contact phone is required';
        break;
      case 3:
        if (!formData.projectTitle) newErrors.projectTitle = 'Project title is required';
        if (!formData.projectDescription) newErrors.projectDescription = 'Project description is required';
        if (!formData.projectCategory) newErrors.projectCategory = 'Project category is required';
        break;
      case 4:
        if (!formData.amountRequested) newErrors.amountRequested = 'Amount requested is required';
        if (!formData.totalProjectCost) newErrors.totalProjectCost = 'Total project cost is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(7, prev + 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleFileUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    const rejected = files.filter((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return file.size > MAX_DOCUMENT_SIZE || !SUPPORTED_DOCUMENT_EXTENSIONS.has(extension);
    });
    const accepted = files.filter((file) => !rejected.includes(file));
    const rejectionMessage = rejected.length
      ? `Not uploaded: ${rejected.map(file => file.name).join(', ')}. Files must be 20MB or smaller and use a supported format.`
      : null;
    setDocumentError(rejectionMessage);
    if (!accepted.length) return;

    const draftId = await handleSaveDraft();
    if (!draftId) {
      setDocumentError('Save the required organization, project, contact, and address details before uploading documents.');
      return;
    }

    setIsUploadingDocuments(true);
    const uploadFailures = [];
    try {
      for (const file of accepted) {
        try {
          await uploadApplicationDocument(draftId, file);
        } catch (error) {
          uploadFailures.push(`${file.name}: ${error.message || 'upload failed'}`);
        }
      }
      const documentResponse = await listApplicationDocuments(draftId);
      setDocuments(normaliseDocuments(documentResponse));
      setDocumentError(uploadFailures.length ? `Some documents were not uploaded. ${uploadFailures.join(' ')}` : rejectionMessage);
    } catch (error) {
      setDocumentError(error.message || 'Documents could not be refreshed after upload. Please try again.');
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  const removeFile = async (file) => {
    const id = documentId(file);
    if (!applicationId || !id) {
      setDocumentError('This document cannot be removed because its server ID is unavailable. Please refresh and try again.');
      return;
    }
    setRemovingDocumentId(id);
    setDocumentError(null);
    try {
      await deleteApplicationDocument(applicationId, id);
      setDocuments(previous => previous.filter(document => String(documentId(document)) !== String(id)));
    } catch (error) {
      setDocumentError(error.message || 'Document could not be removed. Please try again.');
    } finally {
      setRemovingDocumentId(null);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name *</label>
              <Input
                value={formData.organizationName}
                onChange={(e) => updateFormData('organizationName', e.target.value)}
                placeholder="Enter your organization name"
                className={errors.organizationName ? 'border-red-500' : ''}
              />
              {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Organization Type *</label>
              <select
                value={formData.organizationType}
                onChange={(e) => updateFormData('organizationType', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.organizationType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select organization type</option>
                <option value="charity">Registered Charity</option>
                <option value="nonprofit">Non-profit Organization</option>
                <option value="community">Community Group</option>
                <option value="school">Educational Institution</option>
                <option value="sports">Sports Club</option>
                <option value="arts">Arts Organization</option>
                <option value="other">Other</option>
              </select>
              {errors.organizationType && <p className="text-red-500 text-sm mt-1">{errors.organizationType}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ABN *</label>
                <div className="relative">
                  <Input
                    value={formData.abn}
                    onChange={(e) => handleAbnChange(e.target.value)}
                    placeholder="12 345 678 901"
                    className={`pr-10 ${
                      errors.abn ? 'border-red-500' :
                      abnStatus === 'valid' ? 'border-green-400' : ''
                    }`}
                  />
                  {abnStatus === 'checking' && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                  )}
                  {abnStatus === 'valid' && (
                    <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                  )}
                  {(abnStatus === 'invalid' || abnStatus === 'inactive') && (
                    <XCircle className="absolute right-3 top-2.5 h-4 w-4 text-red-400" />
                  )}
                </div>
                {abnStatus === 'valid' && abnResult?.entity_name && (
                  <div className="mt-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                    <span className="font-semibold">{abnResult.entity_name}</span>
                    {abnResult.entity_type && <span className="text-green-600"> &mdash; {abnResult.entity_type}</span>}
                    {abnResult.state && <span className="text-green-600"> ({abnResult.state}{abnResult.postcode ? ` ${abnResult.postcode}` : ''})</span>}
                    {abnResult.gst_registered === true && <span className="ml-1 text-green-600">&middot; GST Registered</span>}
                  </div>
                )}
                {abnStatus === 'format_only' && (
                  <p className="text-slate-500 text-xs mt-1">ABN format is valid.</p>
                )}
                {abnStatus === 'network_error' && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-amber-700" role="alert">
                    <span>{abnResult?.error || 'ABN verification could not be completed.'}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runAbnValidation(formData.abn.replace(/\D/g, ''))}
                    >
                      Retry check
                    </Button>
                  </div>
                )}
                {errors.abn && <p className="text-red-500 text-sm mt-1">{errors.abn}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Established Year</label>
                <Input
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) => updateFormData('establishedYear', e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postcode</label>
                <Input
                  value={formData.postcode}
                  onChange={(e) => updateFormData('postcode', e.target.value)}
                  placeholder="4825"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Primary Contact</h3>
              <p className="text-sm text-blue-700">This person will be the main point of contact for this application.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input
                  value={formData.primaryContactName}
                  onChange={(e) => updateFormData('primaryContactName', e.target.value)}
                  placeholder="John Smith"
                  className={errors.primaryContactName ? 'border-red-500' : ''}
                />
                {errors.primaryContactName && <p className="text-red-500 text-sm mt-1">{errors.primaryContactName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input
                  value={formData.primaryContactTitle}
                  onChange={(e) => updateFormData('primaryContactTitle', e.target.value)}
                  placeholder="Project Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <Input
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => updateFormData('primaryContactEmail', e.target.value)}
                  placeholder="john@example.com"
                  className={errors.primaryContactEmail ? 'border-red-500' : ''}
                />
                {errors.primaryContactEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryContactEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <Input
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e) => updateFormData('primaryContactPhone', e.target.value)}
                  placeholder="(07) 1234 5678"
                  className={errors.primaryContactPhone ? 'border-red-500' : ''}
                />
                {errors.primaryContactPhone && <p className="text-red-500 text-sm mt-1">{errors.primaryContactPhone}</p>}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Secondary Contact (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">Provide an alternative contact person for this application.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={formData.secondaryContactName}
                    onChange={(e) => updateFormData('secondaryContactName', e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={formData.secondaryContactEmail}
                    onChange={(e) => updateFormData('secondaryContactEmail', e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Title *</label>
              <Input
                value={formData.projectTitle}
                onChange={(e) => updateFormData('projectTitle', e.target.value)}
                placeholder="Enter a clear, descriptive project title"
                className={errors.projectTitle ? 'border-red-500' : ''}
              />
              {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Description *</label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => updateFormData('projectDescription', e.target.value)}
                placeholder="Describe your project, its objectives, and how it will benefit the community..."
                rows={6}
                className={`w-full border rounded-lg px-3 py-2 ${errors.projectDescription ? 'border-red-500' : 'border-gray-300'}`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{formData.projectDescription.length} / 2000 characters</span>
                {errors.projectDescription && <span className="text-red-500">{errors.projectDescription}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Category *</label>
                <select
                  value={formData.projectCategory}
                  onChange={(e) => updateFormData('projectCategory', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.projectCategory ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select category</option>
                  <option value="community">Community Development</option>
                  <option value="arts">Arts & Culture</option>
                  <option value="sports">Sports & Recreation</option>
                  <option value="environment">Environment</option>
                  <option value="education">Education</option>
                  <option value="health">Health & Wellbeing</option>
                  <option value="youth">Youth Programs</option>
                  <option value="seniors">Seniors Programs</option>
                </select>
                {errors.projectCategory && <p className="text-red-500 text-sm mt-1">{errors.projectCategory}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project Location</label>
                <Input
                  value={formData.projectLocation}
                  onChange={(e) => updateFormData('projectLocation', e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Start Date</label>
                <Input
                  type="date"
                  value={formData.projectStartDate}
                  onChange={(e) => updateFormData('projectStartDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project End Date</label>
                <Input
                  type="date"
                  value={formData.projectEndDate}
                  onChange={(e) => updateFormData('projectEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total Project Cost *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={formData.totalProjectCost}
                    onChange={(e) => updateFormData('totalProjectCost', e.target.value)}
                    placeholder="10000"
                    className={`pl-8 ${errors.totalProjectCost ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.totalProjectCost && <p className="text-red-500 text-sm mt-1">{errors.totalProjectCost}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount Requested *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={formData.amountRequested}
                    onChange={(e) => updateFormData('amountRequested', e.target.value)}
                    placeholder="8000"
                    className={`pl-8 ${errors.amountRequested ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.amountRequested && <p className="text-red-500 text-sm mt-1">{errors.amountRequested}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Budget Breakdown</h3>
                <Button onClick={addBudgetItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.budgetItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                    <div>
                      <Input
                        placeholder="Category"
                        value={item.category}
                        onChange={(e) => updateBudgetItem(index, 'category', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateBudgetItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => updateBudgetItem(index, 'amount', e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      {formData.budgetItems.length > 1 && (
                        <Button
                          onClick={() => removeBudgetItem(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Other Funding Sources</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={formData.otherFunding}
                    onChange={(e) => updateFormData('otherFunding', e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Funding from other sources</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">In-Kind Contributions</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={formData.inKindContributions}
                    onChange={(e) => updateFormData('inKindContributions', e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Volunteer time, donated materials, etc.</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Community Need</label>
              <textarea
                value={formData.communityNeed}
                onChange={(e) => updateFormData('communityNeed', e.target.value)}
                placeholder="Describe the community need your project addresses..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expected Impact</label>
              <textarea
                value={formData.projectImpact}
                onChange={(e) => updateFormData('projectImpact', e.target.value)}
                placeholder="Describe the expected outcomes and benefits for the community..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sustainability Plan</label>
              <textarea
                value={formData.sustainability}
                onChange={(e) => updateFormData('sustainability', e.target.value)}
                placeholder="How will the project continue or maintain its impact after completion?"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Risk Management</label>
              <textarea
                value={formData.riskManagement}
                onChange={(e) => updateFormData('riskManagement', e.target.value)}
                placeholder="Identify potential risks and how you plan to manage them..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Team Experience</label>
              <textarea
                value={formData.teamExperience}
                onChange={(e) => updateFormData('teamExperience', e.target.value)}
                placeholder="Describe your team's relevant experience and qualifications..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Required Documents</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Completed application form (auto-generated)</li>
                <li>• Project plan with timeline</li>
                <li>• Detailed budget breakdown</li>
                <li>• Letters of support</li>
                <li>• Proof of insurance and registration</li>
                <li>• Risk management plan</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Supporting Documents</h3>
              <p className="text-gray-600 mb-4">Drag and drop files here, or browse</p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  handleFileUpload(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp"
              />
              <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploadingDocuments}>
                {isUploadingDocuments ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : 'Browse Files'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, PNG, JPG, JPEG, GIF, WEBP (Max 20MB per file)
              </p>
            </div>

            {documentError && <p className="text-sm text-red-600" role="alert">{documentError}</p>}

            {documents.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {documents.map(file => (
                    <div key={documentId(file)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{displayDocumentName(file)}</div>
                          {documentSize(file) > 0 && <div className="text-sm text-gray-500">{(documentSize(file) / 1024 / 1024).toFixed(2)} MB</div>}
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFile(file)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        disabled={removingDocumentId === documentId(file)}
                        aria-label={`Remove ${displayDocumentName(file)}`}
                      >
                        {removingDocumentId === documentId(file) ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Application Summary</h3>
              <p className="text-sm text-green-700">Please review your application before submitting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Name:</strong> {formData.organizationName}</div>
                  <div><strong>Type:</strong> {formData.organizationType}</div>
                  <div><strong>ABN:</strong> {formData.abn}</div>
                  <div><strong>Contact:</strong> {formData.primaryContactName}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Title:</strong> {formData.projectTitle}</div>
                  <div><strong>Category:</strong> {formData.projectCategory}</div>
                  <div><strong>Amount Requested:</strong> ${formData.amountRequested}</div>
                  <div><strong>Total Cost:</strong> ${formData.totalProjectCost}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Declaration</h3>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) => updateFormData('declarationAccepted', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    I declare that the information provided in this application is true and correct to the best of my knowledge.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacyAccepted}
                    onChange={(e) => updateFormData('privacyAccepted', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    I consent to the collection and use of personal information as outlined in the Privacy Policy.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    I agree to the Terms and Conditions of this grant program.
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canSubmit = formData.declarationAccepted && formData.privacyAccepted && formData.termsAccepted;

  const returnToGrants = () => {
    if (onNavigate) onNavigate('community/grants');
    else navigate('/portal/community/grants');
  };

  if (isApplicationLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="grants" />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-600" role="status">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading your saved application…
        </div>
      </div>
    );
  }

  if (routeError || applicationLoadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="grants" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardHeader><CardTitle>Application unavailable</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-slate-700" role="alert">{routeError || applicationLoadError}</p>
              <div className="flex gap-3">
                {applicationLoadError && requestedApplicationId && <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>}
                <Button onClick={returnToGrants}>Back to grants</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="grants" />
      {/* Header */}
      <div className="bg-green-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => onNavigate ? onNavigate('community/grants') : navigate(-1)}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{grantTitle}</h1>
                <p className="text-blue-100">Application Form</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">
                {isAutoSaving ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {grantLoadError && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">
            <p>{grantLoadError}</p>
            <div className="mt-3 flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setGrantRetryCount(count => count + 1)}>Retry</Button>
              <Button variant="outline" size="sm" onClick={returnToGrants}>Back to grants</Button>
            </div>
          </div>
        )}
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </h2>
            <Badge variant="outline">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full ${
                  index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-600">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <div className={`font-medium ${step.id === currentStep ? 'text-blue-600' : ''}`}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <p className="text-gray-600">{steps[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isAutoSaving || isSubmitting || isGrantLoading || Boolean(grantLoadError)}>
              <Save className="w-4 h-4 mr-2" />
              {isAutoSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {currentStep < 7 ? (
              <Button onClick={nextStep} className="bg-green-700 hover:bg-green-800" disabled={isGrantLoading || Boolean(grantLoadError)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              submitSuccess ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Application Submitted!
                </div>
              ) : (
                <>
                  {submitError && (
                    <p className="text-red-600 text-sm mr-2">{submitError}</p>
                  )}
                  <Button
                    disabled={!canSubmit || isSubmitting || isGrantLoading || Boolean(grantLoadError)}
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                      <>Submit Application<CheckCircle className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
