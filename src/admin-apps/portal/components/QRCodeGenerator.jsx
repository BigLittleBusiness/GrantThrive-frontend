/**
 * QRCodeGenerator
 * ================
 * Renders a real QR code for a grant using the `qrcode` npm package.
 * The QR code encodes the grant's public URL and is rendered into a
 * canvas element, then offered as a downloadable PNG.
 *
 * Props:
 *   grant           — grant object with at minimum { id, title }
 *   onQRCodeGenerated(data) — optional callback fired after generation
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import {
  Download, RefreshCw, Copy, Share2, CheckCircle, AlertCircle,
} from 'lucide-react';
import apiClient from '../utils/api.js';

// ─── Style definitions ────────────────────────────────────────────────────────
const STYLES = {
  professional: {
    name:        'Professional',
    description: 'Square modules in corporate blue — ideal for formal documents',
    dark:        '#1e40af',
    light:       '#ffffff',
  },
  modern: {
    name:        'Modern',
    description: 'Square modules in vibrant green — great for community outreach',
    dark:        '#15803d',
    light:       '#ffffff',
  },
  elegant: {
    name:        'Elegant',
    description: 'Square modules in deep purple — suited to cultural programs',
    dark:        '#6d28d9',
    light:       '#ffffff',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
const QRCodeGenerator = ({ grant, onQRCodeGenerated }) => {
  const canvasRef                       = useRef(null);
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [qrData, setQrData]             = useState(null);   // { target_url, filename }
  const [copied, setCopied]             = useState(false);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Build the public grant URL — use the backend-generated URL when available,
  // fall back to a sensible default so the canvas can still render offline.
  const buildTargetUrl = useCallback((backendUrl) => {
    if (backendUrl) return backendUrl;
    if (!grant?.id) return 'https://app.grantthrive.com';
    return `https://app.grantthrive.com/grants/${grant.id}`;
  }, [grant]);

  // Render the QR code into the canvas element.
  const renderCanvas = useCallback(async (targetUrl, styleKey) => {
    if (!canvasRef.current || !targetUrl) return;
    const style = STYLES[styleKey] || STYLES.professional;
    await QRCode.toCanvas(canvasRef.current, targetUrl, {
      width:            256,
      margin:           2,
      errorCorrectionLevel: 'M',
      color: {
        dark:  style.dark,
        light: style.light,
      },
    });
  }, []);

  // Fetch the QR data URL from the backend and render it.
  const generateQR = useCallback(async (forceRegenerate = false) => {
    if (!grant?.id) {
      setError('No grant selected.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let data;
      if (forceRegenerate) {
        data = await apiClient.regenerateGrantQR(grant.id);
      } else {
        data = await apiClient.getGrantQR(grant.id);
      }

      const targetUrl = buildTargetUrl(data.target_url);
      await renderCanvas(targetUrl, selectedStyle);

      const newQrData = {
        grant_id:   grant.id,
        grant_title: grant.title,
        target_url:  targetUrl,
        filename:    data.filename || `grant_${grant.id}_qr_code.png`,
        style:       selectedStyle,
        created_at:  new Date().toISOString(),
      };
      setQrData(newQrData);

      if (onQRCodeGenerated) onQRCodeGenerated(newQrData);
      if (forceRegenerate) showToast('QR code regenerated successfully.');

    } catch (err) {
      setError(err.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [grant, selectedStyle, buildTargetUrl, renderCanvas, onQRCodeGenerated]);

  // Re-render canvas when style changes (if QR already generated).
  useEffect(() => {
    if (qrData?.target_url) {
      renderCanvas(qrData.target_url, selectedStyle).catch(() => {});
      setQrData(prev => prev ? { ...prev, style: selectedStyle } : prev);
    }
  }, [selectedStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate when a new grant is selected.
  useEffect(() => {
    if (grant?.id) {
      setQrData(null);
      setError(null);
      generateQR(false);
    }
  }, [grant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Download the canvas as a PNG file.
  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link      = document.createElement('a');
    link.download   = qrData?.filename || `grant_${grant?.id || 'qr'}_qr_code.png`;
    link.href       = canvasRef.current.toDataURL('image/png');
    link.click();
    showToast('QR code downloaded.');
  };

  // Copy the target URL to clipboard.
  const copyUrl = async () => {
    if (!qrData?.target_url) return;
    try {
      await navigator.clipboard.writeText(qrData.target_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Grant URL copied to clipboard.');
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  // Share via Web Share API, fall back to copy.
  const shareQR = async () => {
    if (!qrData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${grant?.title || 'Grant'} — Apply Now`,
          text:  `Apply for this grant from your council`,
          url:   qrData.target_url,
        });
      } catch { /* user cancelled */ }
    } else {
      copyUrl();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error'
            ? <AlertCircle className="h-4 w-4" />
            : <CheckCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Style selector */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(STYLES).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setSelectedStyle(key)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedStyle === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: s.dark }}
                  />
                  <span className="font-medium text-gray-900">{s.name}</span>
                  {selectedStyle === key && (
                    <CheckCircle className="ml-auto h-4 w-4 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{s.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* QR Code preview */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Canvas */}
            <div className="shrink-0 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
              {loading && (
                <div className="flex h-64 w-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={loading ? 'hidden' : 'block'}
                style={{ width: 256, height: 256 }}
              />
            </div>

            {/* Info + actions */}
            <div className="flex-1 space-y-4">
              {qrData && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Grant: </span>
                    <span className="text-gray-600">{qrData.grant_title}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Style: </span>
                    <span className="text-gray-600 capitalize">{qrData.style}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Target URL: </span>
                    <a
                      href={qrData.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-blue-600 hover:underline"
                    >
                      {qrData.target_url}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={downloadQR}
                  disabled={loading || !qrData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={copyUrl}
                  disabled={!qrData}
                  className="rounded-xl"
                >
                  {copied
                    ? <><CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Copied</>
                    : <><Copy className="mr-2 h-4 w-4" /> Copy URL</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={shareQR}
                  disabled={!qrData}
                  className="rounded-xl"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateQR(true)}
                  disabled={loading}
                  className="rounded-xl"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage tips */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {[
              { icon: '📱', title: 'Mobile scanning', body: 'Applicants scan with their phone camera to instantly open the grant application form.' },
              { icon: '📄', title: 'Print materials', body: 'Include on flyers, posters, brochures, and newsletters. Minimum print size: 2 cm × 2 cm.' },
              { icon: '💻', title: 'Digital sharing', body: 'Embed in emails, social media posts, and websites to drive traffic to the application.' },
              { icon: '🏢', title: 'Events & meetings', body: 'Display at community events, council meetings, and information sessions.' },
            ].map(tip => (
              <div key={tip.title} className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{tip.title}</p>
                  <p className="text-gray-500">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
