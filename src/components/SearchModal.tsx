import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, STATUS_CODES, PAYMENT_STATUS_CODES } from '../data/apiSpec';
import { Search, X, Hash, ChevronRight } from 'lucide-react';
import { GUIDES } from '../data/guides';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEndpoint: (id: string) => void;
  onSelectSection: (section: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEndpoint,
  onSelectSection
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();

  const filteredGuides = GUIDES.filter(
    (g) => !normalized || g.title.toLowerCase().includes(normalized) || g.summary.toLowerCase().includes(normalized)
  );

  const filteredEndpoints = API_ENDPOINTS.filter((ep) => {
    if (!normalized) return true;
    return (
      ep.title.toLowerCase().includes(normalized) ||
      ep.path.toLowerCase().includes(normalized) ||
      ep.sectionNumber.includes(normalized) ||
      ep.description.toLowerCase().includes(normalized) ||
      ep.parameters?.some((p) => p.name.toLowerCase().includes(normalized))
    );
  });

  const filteredStatusCodes = [...STATUS_CODES, ...PAYMENT_STATUS_CODES].filter((sc) => {
    if (!normalized) return false;
    return (
      sc.code.toLowerCase().includes(normalized) ||
      sc.name.toLowerCase().includes(normalized) ||
      sc.description.toLowerCase().includes(normalized)
    );
  });

  const pick = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-[600px] bg-folio border border-rule-strong rounded-[10px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 px-4 flex items-center gap-3 border-b border-rule">
          <Search className="w-4 h-4 text-ink-3 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search methods, fields or status codes"
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-4 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-3 hover:text-ink cursor-pointer" aria-label="Clear">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="mono text-[10px] px-1.5 py-px rounded border border-rule text-ink-3">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-1.5">
          <div className="eyebrow px-2.5 pt-2 pb-1.5">Methods</div>
          {filteredEndpoints.length === 0 ? (
            <p className="px-2.5 py-4 text-[13px] text-ink-3">No methods match “{query}”.</p>
          ) : (
            filteredEndpoints.map((ep) => (
              <button key={ep.id} onClick={() => pick(() => onSelectEndpoint(ep.id))} className="menu-item group">
                <span className="mono text-[12px] text-ink-3 w-8 tabular-nums">{ep.sectionNumber}</span>
                <span className="font-medium">{ep.title}</span>
                <code className="hidden sm:inline text-[12px] text-ink-3 truncate flex-1">{ep.path}</code>
                <ChevronRight className="w-3.5 h-3.5 text-ink-4 group-hover:text-ink ml-auto shrink-0" />
              </button>
            ))
          )}

          {filteredGuides.length > 0 && (
            <>
              <div className="eyebrow px-2.5 pt-3 pb-1.5 border-t border-rule-soft mt-1.5">Guides</div>
              {filteredGuides.map((g) => (
                <button key={g.id} onClick={() => pick(() => onSelectSection(g.id))} className="menu-item group">
                  <span className="font-medium">{g.title}</span>
                  <span className="hidden sm:inline text-[12px] text-ink-3 truncate flex-1">{g.summary}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-4 group-hover:text-ink ml-auto shrink-0" />
                </button>
              ))}
            </>
          )}

          {filteredStatusCodes.length > 0 && (
            <>
              <div className="eyebrow px-2.5 pt-3 pb-1.5 border-t border-rule-soft mt-1.5">Status codes</div>
              {filteredStatusCodes.map((sc) => (
                <button key={sc.code} onClick={() => pick(() => onSelectSection('status-codes'))} className="menu-item">
                  <code className="text-[12px] font-semibold w-14">{sc.code}</code>
                  <span className="font-medium">{sc.name}</span>
                  <span className="text-[12px] text-ink-3 truncate">{sc.description}</span>
                </button>
              ))}
            </>
          )}

          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2.5 mt-1.5 border-t border-rule-soft">
            <Hash className="w-3 h-3 text-ink-4" />
            {(
              [
                ['version-history', 'Version control'],
                ['status-codes', 'Status codes'],
                ['relationships', 'Relationship'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} onClick={() => pick(() => onSelectSection(id))} className="chip hover:text-ink cursor-pointer">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
