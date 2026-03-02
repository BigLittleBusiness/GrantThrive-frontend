/**
 * TenantHeader
 * ============
 * Displays the council's logo and name in the portal navigation bar.
 * Falls back to the GrantThrive logo when no tenant is resolved.
 *
 * Usage:
 *   import TenantHeader from '@shared/tenancy/TenantHeader';
 *   <TenantHeader />
 */

import React from 'react';
import { useTenant } from './TenantContext';
import gtLogo from '../assets/grantthrive_official_logo.png';

export default function TenantHeader({ className = '' }) {
  const { council, isLoading } = useTenant();

  if (isLoading) {
    // Skeleton placeholder while resolving
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (council) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {council.logo_url ? (
          <img
            src={council.logo_url}
            alt={`${council.name} logo`}
            className="h-9 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: council.primary_colour || '#15803d' }}
            aria-hidden="true"
          >
            {council.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {council.name}
          </p>
          <p className="text-xs text-gray-500">Powered by GrantThrive</p>
        </div>
      </div>
    );
  }

  // No tenant — show GrantThrive branding
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={gtLogo}
        alt="GrantThrive"
        className="h-8 w-auto"
      />
    </div>
  );
}
