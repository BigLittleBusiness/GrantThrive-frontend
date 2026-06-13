/**
 * StaffNavbar
 *
 * A persistent top navigation bar rendered on every logged-in Council Staff
 * sub-page. Provides quick links to the key areas of the staff portal and a
 * clear path back to the Staff Dashboard, along with a Logout button.
 *
 * Props:
 *   user        – the current user object (from AuthContext / pageProps)
 *   onNavigate  – the role-aware navigation helper from PortalApp
 *   onLogout    – logout handler from PortalApp
 *   activePage  – optional string key matching one of the NAV_ITEMS ids,
 *                 used to highlight the current page in the nav
 */
import React, { useState } from 'react';
import { Button } from '@shared/components/ui/button.jsx';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Vote,
  Map,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import grantThriveLogo from '../../assets/grantthrive_logo_growth_concept.png';

const NAV_ITEMS = [
  { id: 'dashboard',        label: 'Dashboard',        icon: LayoutDashboard, path: 'staff/dashboard' },
  { id: 'grants',           label: 'Grants',           icon: FileText,        path: 'staff/grants' },
  { id: 'pending-approvals',label: 'Pending Approvals',icon: ClipboardList,   path: 'staff/pending-approvals' },
  { id: 'admin-approvals',  label: 'Admin Approvals',  icon: ShieldCheck,     path: 'staff/admin-approvals' },
  { id: 'community-voting', label: 'Voting',           icon: Vote,            path: 'staff/community-voting' },
  { id: 'grant-map',        label: 'Grant Map',        icon: Map,             path: 'staff/grant-map' },
  { id: 'resource-hub',     label: 'Resources',        icon: BookOpen,        path: 'staff/resource-hub' },
  { id: 'community-forum',  label: 'Forum',            icon: MessageSquare,   path: 'staff/community-forum' },
  { id: 'profile',          label: 'Profile',          icon: User,            path: 'staff/profile' },
];

export default function StaffNavbar({ user, onNavigate, onLogout, activePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path) => {
    setMobileOpen(false);
    if (onNavigate) onNavigate(path);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo + brand */}
          <button
            onClick={() => handleNav('staff/dashboard')}
            className="flex items-center gap-2 shrink-0"
          >
            <img src={grantThriveLogo} alt="GrantThrive" className="h-7 w-auto" />
            <span className="hidden sm:block text-sm font-semibold text-slate-800">GrantThrive</span>
            <span className="hidden sm:block text-xs text-slate-400 font-normal">Staff</span>
          </button>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
              const isActive = activePage === id || (activePage === undefined && id === 'dashboard');
              return (
                <button
                  key={id}
                  onClick={() => handleNav(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="hidden md:block text-xs text-slate-500 max-w-[140px] truncate">
                {user.name}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-md">
          <nav className="flex flex-col py-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(path)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-green-500" />}
                </button>
              );
            })}
            <div className="border-t border-slate-200 mt-2 pt-2 px-4 pb-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
