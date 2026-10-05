import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EndpointDocView } from './components/EndpointDocView';
import { ApiPlayground } from './components/ApiPlayground';
import { OverviewView } from './components/OverviewView';
import { VersionHistoryView } from './components/VersionHistoryView';
import { StatusCodesView } from './components/StatusCodesView';
import { RelationshipsView } from './components/RelationshipsView';
import { SearchModal } from './components/SearchModal';
import { LoginPage } from './components/LoginPage';
import { API_ENDPOINTS } from './data/apiSpec';
import { GUIDES } from './data/guides';
import { GuideView } from './components/GuideView';

// Hash routes (#/create-transaction) so links work on any static host, no server rewrites needed.
const PAGES = new Set(['overview', 'version-history', 'status-codes', 'relationships', ...API_ENDPOINTS.map((e) => e.id), ...GUIDES.map((g) => g.id)]);
const idFromHash = () => {
  const id = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  return PAGES.has(id) ? id : 'overview';
};

const PortalMain: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(idFromHash);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [subtypeIdx, setSubtypeIdx] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((o) => !o);
      }
    };
    const onHash = () => {
      setSelectedId(idFromHash());
      setSubtypeIdx(0);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  useEffect(() => {
    const ep = API_ENDPOINTS.find((e) => e.id === selectedId);
    const guide = GUIDES.find((g) => g.id === selectedId);
    document.title = `${ep ? `${ep.sectionNumber} ${ep.title}` : guide ? guide.title : 'Payments API'} · Harbour & Hills`;
  }, [selectedId]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Navigation goes through the URL; the hashchange listener updates the page.
  const select = (id: string) => {
    setIsNavOpen(false);
    const hash = id === 'overview' ? '#/' : `#/${id}`;
    if (window.location.hash === hash || (id === 'overview' && !window.location.hash)) window.scrollTo({ top: 0 });
    else window.location.hash = hash;
  };

  const currentEndpoint = API_ENDPOINTS.find((ep) => ep.id === selectedId);
  const currentGuide = GUIDES.find((g) => g.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} onOpenNav={() => setIsNavOpen(true)} />

      <div className="flex-1 flex">
        <Sidebar selectedId={selectedId} onSelect={select} />

        {isNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setIsNavOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative h-full" onClick={(e) => e.stopPropagation()}>
              <Sidebar drawer selectedId={selectedId} onSelect={select} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col 2xl:flex-row">
          <div className="flex-1 min-w-0 px-5 sm:px-8 lg:px-12 py-10 lg:py-12">
            {selectedId === 'overview' && (
              <OverviewView onNavigateToAuth={() => select('auth')} onNavigateToTx={() => select('create-transaction')} onSelectEndpoint={select} />
            )}
            {selectedId === 'version-history' && <VersionHistoryView />}
            {currentGuide && <GuideView guide={currentGuide} onOpen={select} />}
            {selectedId === 'status-codes' && <StatusCodesView />}
            {selectedId === 'relationships' && <RelationshipsView />}
            {currentEndpoint && <EndpointDocView key={currentEndpoint.id} endpoint={currentEndpoint} subtypeIdx={subtypeIdx} onSubtypeChange={setSubtypeIdx} />}
          </div>

          {currentEndpoint && (
            <div className="w-full 2xl:w-[520px] shrink-0 px-5 sm:px-8 lg:px-12 2xl:px-6 pb-10 2xl:py-12 2xl:border-l border-rule">
              <div className="2xl:sticky 2xl:top-[80px] max-w-[760px]">
                <ApiPlayground key={`${currentEndpoint.id}-${subtypeIdx}`} endpoint={currentEndpoint} subtypeIdx={subtypeIdx} />
              </div>
            </div>
          )}
        </main>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectEndpoint={select} onSelectSection={select} />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortalMain />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
