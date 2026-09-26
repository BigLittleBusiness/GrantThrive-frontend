import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_ID = 'grantthrive-turnstile-api';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  // The static pre-renderer serialises the page HTML. A script injected during
  // that pass cannot be reused by a visitor's browser, so replace it with a
  // fresh runtime script if the Turnstile API has not actually initialised.
  document.getElementById(TURNSTILE_SCRIPT_ID)?.remove();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    // Explicit rendering is invoked after this script's load event. Do not
    // combine async/defer with turnstile.ready(), which Cloudflare rejects.
    script.async = false;
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
  const isStaticPrerender = /HeadlessChrome/i.test(navigator.userAgent);
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [error, setError] = useState('');

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let isActive = true;

    if (isStaticPrerender) return undefined;

    if (!siteKey) {
      setError('Verification is being configured. Please try again shortly.');
      onTokenRef.current('');
      return undefined;
    }

    loadTurnstile()
      .then((turnstile) => {
        if (!isActive || !turnstile || !containerRef.current) return;

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          size,
          callback: (token) => {
            if (!isActive) return;
            setError('');
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            if (!isActive) return;
            onTokenRef.current('');
            setError('Verification expired. Please complete it again.');
          },
          'error-callback': (errorCode) => {
            if (!isActive) return;
            console.warn('[GrantThrive] Turnstile error', errorCode);
            onTokenRef.current('');
            setError('Verification could not load. Please refresh and try again.');
            return true;
          },
        });
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn('[GrantThrive] Turnstile failed to initialise', error);
        onTokenRef.current('');
        setError('Verification could not load. Please refresh and try again.');
      });

    return () => {
      isActive = false;
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, isStaticPrerender, siteKey, size, theme]);

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
