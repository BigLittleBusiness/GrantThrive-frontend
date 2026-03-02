/**
 * @shared/tenancy — barrel export
 *
 * Usage:
 *   import { TenantProvider, useTenant, TenantHeader, useTenantApi }
 *     from '@shared/tenancy';
 */

export { TenantProvider, useTenant, default as TenantContext } from './TenantContext';
export { default as TenantHeader } from './TenantHeader';
export { useTenantApi, default as useTenantApiDefault } from './useTenantApi';
