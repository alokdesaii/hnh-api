import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './BrandLogo';
import { Search, Download, LogOut, Check, Copy, Sun, Moon, Menu } from 'lucide-react';
import { generatePostmanCollection, generateOpenAPISpec, downloadJsonFile } from '../utils/exporters';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNav?: () => void;
}

// Closes a menu when clicking outside it or pressing Escape.
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onOpenNav }) => {
  const { user, logout, token, baseUrl } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [copiedToken, setCopiedToken] = useState(false);
  const [menu, setMenu] = useState<null | 'export' | 'user'>(null);
  const close = () => setMenu(null);
  const exportRef = useDismiss(menu === 'export', close);
  const userRef = useDismiss(menu === 'user', close);
  const toggle = (m: typeof menu) => setMenu(menu === m ? null : m);

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const download = (kind: 'postman' | 'openapi') => {
    if (kind === 'postman') {
      downloadJsonFile('Harbour_and_Hills_Payments_API_v2.3.3.postman_collection.json', generatePostmanCollection(baseUrl));
    } else {
      downloadJsonFile('Harbour_and_Hills_Payments_API_v2.3.3.openapi.json', generateOpenAPISpec(baseUrl));
    }
    close();
  };


  return (
    <header className="sticky top-0 z-40 h-14 bg-paper/85 backdrop-blur-md border-b border-rule px-4 lg:px-5 flex items-center gap-4">
      <button onClick={onOpenNav} className="lg:hidden -ml-1 w-9 h-9 grid place-items-center rounded-md text-ink-2 hover:bg-well cursor-pointer" aria-label="Open navigation">
        <Menu className="w-4 h-4" />
      </button>
      <BrandLogo className="lg:w-[236px] shrink-0" />

      <button
        onClick={onOpenSearch}
        className="hidden sm:flex flex-1 max-w-sm h-8 px-2.5 rounded-md bg-well border border-rule-soft hover:border-rule-strong items-center gap-2 text-[13px] text-ink-3 cursor-pointer transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left truncate">Search methods, fields, codes</span>
        <kbd className="mono text-[10px] px-1.5 py-px rounded border border-rule bg-folio text-ink-3">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button onClick={onOpenSearch} className="sm:hidden w-9 h-9 grid place-items-center rounded-md text-ink-2 hover:bg-well cursor-pointer" aria-label="Search">
          <Search className="w-4 h-4" />
        </button>

        <span
          className="h-8 px-2.5 hidden sm:inline-flex items-center gap-1.5 rounded-md text-[12px] text-ink-2 border border-rule-soft"
          title="The console simulates every request against the specification. Nothing is sent to Harbour & Hills."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-tide-mark" />
          Sandbox
        </span>

        <div className="relative hidden sm:block" ref={exportRef}>
          <button onClick={() => toggle('export')} aria-expanded={menu === 'export'} className="btn btn-ghost h-8 px-2.5 text-[12px]" aria-label="Export specification">
            <Download className="w-3.5 h-3.5 text-ink-2" />
            <span className="hidden md:inline">Export</span>
          </button>
          {menu === 'export' && (
            <div className="menu w-60">
              <button className="menu-item" onClick={() => download('postman')}>
                <span className="flex-1"><span className="block font-medium">Postman collection</span><span className="block text-[12px] text-ink-3">v2.1, with sample bodies</span></span>
              </button>
              <button className="menu-item" onClick={() => download('openapi')}>
                <span className="flex-1"><span className="block font-medium">OpenAPI schema</span><span className="block text-[12px] text-ink-3">3.1.0 JSON</span></span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 grid place-items-center rounded-md text-ink-2 hover:text-ink hover:bg-well cursor-pointer"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={userRef}>
          <button onClick={() => toggle('user')} aria-expanded={menu === 'user'} aria-label="Account" className="w-8 h-8 rounded-full bg-solid text-solid-ink mono text-[11px] font-semibold cursor-pointer">
            HH
          </button>
          {menu === 'user' && (
            <div className="menu w-72">
              <div className="px-2.5 pt-2 pb-2.5 mb-1 border-b border-rule-soft">
                <div className="eyebrow mb-1">Signed in as</div>
                <div className="mono text-[12px] text-ink truncate">{user?.username}</div>
                <div className="mono text-[11px] text-ink-3 mt-0.5 tabular-nums">{user?.clientAccountNumber}</div>
              </div>
              <button className="menu-item disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleCopyToken} disabled={!token} title={token ? undefined : 'Run 1.1 Authentication in the console to get a sandbox token'}>
                {copiedToken ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5 text-ink-3" />}
                <span>{copiedToken ? 'Token copied' : 'Copy bearer token'}</span>
              </button>
              <button className="menu-item text-fail" onClick={logout}>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
