# @grantthrive/auth — Shared SSO Authentication Library

Single source of truth for authentication across all GrantThrive UI applications.

## How it works

A JWT issued by the Flask backend is stored in `localStorage` under the key `gt_auth_token`. Because all GrantThrive apps are served from subdomains of `grantthrive.com`, they all share the same `localStorage` origin when accessed via a browser, giving seamless single sign-on without a separate auth server.

| App | URL | Auth required |
|---|---|---|
| Core platform | `app.grantthrive.com` | Yes — all roles |
| Admin dashboard | `admin.grantthrive.com` | Yes — `system_admin` only |
| Grant mapping | `map.grantthrive.com` | No — public |
| ROI calculator | `roi.grantthrive.com` | No — public |
| Marketing site | `grantthrive.com` | No — public |

## Login flow

1. User visits any authenticated app.
2. If no token is found in `localStorage`, the app redirects to `app.grantthrive.com/login?redirect=<current_url>`.
3. After successful login the backend issues a JWT; this library stores it.
4. The user is redirected back to the original app — already authenticated.

## Installation (within the monorepo)

In each app's `package.json`, add:

```json
"dependencies": {
  "@grantthrive/auth": "file:../shared-auth"
}
```

Then run `pnpm install` in the app directory.

## Usage

```js
import {
  login, logout, getToken, getStoredUser,
  isAuthenticated, isSystemAdmin, isCouncilAdmin,
  verifyToken, redirectToLogin, useGrantThriveAuth,
  TOKEN_KEY, ROLES
} from '@grantthrive/auth';

// React hook (recommended for React apps)
const { user, loading, isAuthenticated, login, logout } = useGrantThriveAuth();
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `https://api.grantthrive.com/api` | Backend API base URL |
| `VITE_LOGIN_URL` | `https://app.grantthrive.com/login` | Central login page URL |

For local development, create a `.env.local` in each app:

```
VITE_API_URL=http://localhost:5000/api
VITE_LOGIN_URL=http://localhost:5173/login
```
