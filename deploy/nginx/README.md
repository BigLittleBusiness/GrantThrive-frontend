# BinaryLane Nginx hardening

`90-grantthrive-security.conf` is copied to `/etc/nginx/conf.d/` by the production deployment workflow. It is valid in Nginx's `http` context and applies browser-hardening headers, an enforced Content Security Policy, and immutable caching for fingerprinted static assets. BinaryLane's existing global Nginx configuration provides gzip compression.

The policy permits the self-hosted application plus Cloudflare Turnstile. If a future approved integration needs an additional origin, add the narrowest possible directive entry, deploy it through the same validation workflow, and confirm that it does not weaken script, frame, or form protections.
