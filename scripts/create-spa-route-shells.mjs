/* Generate static index shells for known protected SPA routes on static Nginx hosting. */
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const shell = join(dist, 'index.html');
const routes = [
  'admin', 'admin/dashboard', 'portal', 'portal/login', 'portal/register', 'portal/forgot-password', 'portal/reset-password',
  'portal/council/dashboard', 'portal/council/admin-approvals', 'portal/council/create-grant', 'portal/council/grants',
  'portal/council/communication-settings', 'portal/council/qr-code-management', 'portal/council/community-voting',
  'portal/council/grant-map', 'portal/council/resource-hub', 'portal/council/staff-management', 'portal/council/account-billing',
  'portal/council/profile', 'portal/council/community-forum', 'portal/council/pricing', 'portal/council/pending-approvals',
  'portal/council/analytics', 'portal/council/review-workflow', 'portal/council/winners-showcase',
  'portal/staff/dashboard', 'portal/staff/grants', 'portal/staff/admin-approvals', 'portal/staff/community-voting',
  'portal/staff/grant-map', 'portal/staff/resource-hub', 'portal/staff/profile', 'portal/staff/pending-approvals', 'portal/staff/community-forum',
  'portal/community/dashboard', 'portal/community/grants', 'portal/community/community-forum', 'portal/community/resource-hub',
  'portal/community/winners-showcase', 'portal/community/community-voting', 'portal/community/grant-map', 'portal/community/transparency', 'portal/community/public-results',
];
if (!existsSync(shell)) throw new Error('Missing dist/index.html after Vite build.');
for (const route of routes) {
  const output = join(dist, route, 'index.html');
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(shell, output);
}
console.log(`[spa-route-shells] Wrote ${routes.length} route shells.`);
