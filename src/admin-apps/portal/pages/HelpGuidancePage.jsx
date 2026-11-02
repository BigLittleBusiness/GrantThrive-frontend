import { LogOut } from 'lucide-react';
import HelpGuidance from '@shared/components/HelpGuidance';
import { Button } from '@shared/components/ui/button';
import CommunityNavbar from '../components/layout/CommunityNavbar.jsx';
import StaffNavbar from '../components/layout/StaffNavbar.jsx';

export default function HelpGuidancePage({ user, onNavigate, onLogout, navigationVariant }) {
  const isCouncilAdmin = navigationVariant === 'council-admin';

  return (
    <div className="min-h-screen bg-slate-50">
      {navigationVariant === 'staff' && <StaffNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="help" />}
      {navigationVariant === 'community' && <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="help" />}
      {isCouncilAdmin && (
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Help &amp; Guidance</h1>
              <p className="mt-1 text-sm text-slate-600">Find guidance for your available council administration features.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => onNavigate('council/dashboard')}>Back to dashboard</Button>
              <Button type="button" variant="outline" onClick={onLogout} aria-label="Log out of GrantThrive council administration" title="Log out">
                <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <HelpGuidance />
      </main>
    </div>
  );
}
