import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_ID = 'grantthrive-turnstile-api';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Turnstile failed to load.'));
    document.head.appendChild(script);
  });
}

/**
 * Cloudflare Turnstile widget for public GrantThrive forms.
 *
 * The site key is intentionally public; the secret stays only in the backend.
 * Form submission remains disabled until a token exists, and the backend still
 * validates every one-time token with Cloudflare Siteverify.
 */
export default function TurnstileWidget({
  action,
  onToken,
  resetKey = 0,
  theme = 'auto',
  size = 'flexible',
  className = '',
}) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    if (!siteKey) {
      setError('Verification is being configured. Please try again shortly.');
      onToken('');
      return undefined;
    }

    loadTurnstile()
      .then((turnstile) => {
        if (!isActive || !turnstile || !containerRef.current) return;

        turnstile.ready(() => {
          if (!isActive || !containerRef.current) return;
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme,
            size,
            callback: (token) => {
              if (!isActive) return;
              setError('');
              onToken(token);
            },
            'expired-callback': () => {
              if (!isActive) return;
              onToken('');
              setError('Verification expired. Please complete it again.');
            },
            'error-callback': (errorCode) => {
              if (!isActive) return;
              // Keep the provider code available to authorised diagnostics
              // without disclosing implementation details to visitors.
              console.warn('[GrantThrive] Turnstile error', errorCode);
              onToken('');
              setError('Verification could not load. Please refresh and try again.');
              return true;
            },
          });
        });
      })
      .catch(() => {
        if (!isActive) return;
        onToken('');
        setError('Verification could not load. Please refresh and try again.');
      });

    return () => {
      isActive = false;
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, onToken, siteKey, size, theme]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.turnstile?.reset) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
