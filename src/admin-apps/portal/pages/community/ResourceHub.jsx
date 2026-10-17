import React from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { BookOpen, Info } from 'lucide-react';

const ResourceHub = ({ user, onNavigate, onLogout }) => (
  <div className="min-h-screen bg-slate-50">
    <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="resources" />
    <main className="mx-auto flex max-w-4xl justify-center px-6 py-20 sm:py-28">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12" aria-labelledby="resource-hub-heading">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <BookOpen className="h-8 w-8 text-emerald-700" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-emerald-700">Community resources</p>
        <h1 id="resource-hub-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Resource Hub</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          A resource library is not available in the community portal yet. When your council publishes supported guides, templates, or other resources, they will appear here.
        </p>
        <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm text-blue-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <p>This page does not currently offer downloads, previews, saved items, or resource search.</p>
        </div>
      </section>
    </main>
  </div>
);

export default ResourceHub;
