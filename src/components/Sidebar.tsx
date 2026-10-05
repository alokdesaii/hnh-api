import React from 'react';
import { API_ENDPOINTS } from '../data/apiSpec';
import { GUIDES } from '../data/guides';

interface SidebarProps {
  selectedId: string;
  onSelect: (id: string) => void;
  drawer?: boolean;
}

// Mirrors the table of contents in HnH_API_V2.3.3.pdf, in document order.
const REFERENCE = [
  { id: 'status-codes', num: '1.15', title: 'Status Codes' },
  { id: 'status-codes', num: '1.16', title: 'Payment Status Codes' },
  { id: 'relationships', num: '1.17', title: 'Relationship' },
];

const Item: React.FC<{ id: string; active: boolean; num?: string; title: string; trailing?: React.ReactNode; onClick: () => void }> = ({
  id,
  active,
  num,
  title,
  trailing,
  onClick,
}) => (
  <a
    href={id === 'overview' ? '#/' : `#/${id}`}
    onClick={(e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      onClick();
    }}
    aria-current={active ? 'page' : undefined}
    className={`relative w-full h-8 pl-3 pr-2 rounded-md text-[13px] flex items-center gap-2.5 text-left cursor-pointer transition-colors ${
      active ? 'bg-folio text-ink font-medium shadow-[0_0_0_1px_var(--rule)]' : 'text-ink-2 hover:text-ink hover:bg-well'
    }`}
  >
    {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded bg-tide-mark" />}
    {num && <span className={`mono text-[11px] w-7 shrink-0 tabular-nums ${active ? 'text-tide' : 'text-ink-4'}`}>{num}</span>}
    <span className="truncate flex-1">{title}</span>
    {trailing}
  </a>
);

export const Sidebar: React.FC<SidebarProps> = ({ selectedId, onSelect, drawer }) => {
  const methods = API_ENDPOINTS.slice().sort((a, b) => parseFloat(a.sectionNumber.split('.')[1]) - parseFloat(b.sectionNumber.split('.')[1]));

  return (
    <aside className={`${drawer ? 'h-full bg-paper' : 'hidden lg:block h-[calc(100vh-56px)] sticky top-14'} w-[264px] shrink-0 border-r border-rule overflow-y-auto px-3 py-5 select-none`}>
      <div className="space-y-0.5">
        <Item id="overview" active={selectedId === 'overview'} title="Getting started" onClick={() => onSelect('overview')} />
        <Item
          id="version-history"
          active={selectedId === 'version-history'}
          title="Version control"
          trailing={<span className="mono text-[10px] text-ink-3">V2.3.3</span>}
          onClick={() => onSelect('version-history')}
        />
      </div>

      <div className="eyebrow px-3 mt-7 mb-2">Guides</div>
      <div className="space-y-0.5">
        {GUIDES.map((g) => (
          <Item key={g.id} id={g.id} active={selectedId === g.id} title={g.title} onClick={() => onSelect(g.id)} />
        ))}
      </div>

      <div className="eyebrow px-3 mt-7 mb-2">1 · API methods</div>
      <div className="space-y-0.5">
        {methods.map((ep) => (
          <Item key={ep.id} id={ep.id} active={selectedId === ep.id} num={ep.sectionNumber} title={ep.title} onClick={() => onSelect(ep.id)} />
        ))}
      </div>

      <div className="eyebrow px-3 mt-7 mb-2">Reference tables</div>
      <div className="space-y-0.5">
        {REFERENCE.map((r) => (
          <Item key={r.num} id={r.id} active={selectedId === r.id && r.num !== '1.16'} num={r.num} title={r.title} onClick={() => onSelect(r.id)} />
        ))}
      </div>
    </aside>
  );
};
