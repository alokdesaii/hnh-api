import React, { useState } from 'react';
import type { EndpointSpec, Parameter } from '../data/apiSpec';
import { SPEC_PAGES } from '../data/apiSpec';
import { Check, Copy, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generatePostmanCollection, downloadJsonFile } from '../utils/exporters';
import { conditionalRequirements } from '../utils/validate';

interface EndpointDocViewProps {
  endpoint: EndpointSpec;
  subtypeIdx: number;
  onSubtypeChange: (idx: number) => void;
}

const REQ_LABEL = { Y: 'Mandatory', C: 'Conditional', O: 'Optional' } as const;
const REQ_TEXT = { Y: 'text-ink', C: 'text-cond', O: 'text-ink-3' } as const;

export const PageHead: React.FC<{ section?: string; kicker: string; title: string; children?: React.ReactNode }> = ({ section, kicker, title, children }) => (
  <header className="pb-7 mb-8 border-b border-rule">
    <div className="flex items-center gap-3 mb-3">
      {section && <span className="mono text-[13px] font-medium text-tide tabular-nums">§{section}</span>}
      <span className="eyebrow">{kicker}</span>
      {section && SPEC_PAGES[section] && <span className="eyebrow ml-auto text-ink-4">Spec p.{SPEC_PAGES[section]}</span>}
    </div>
    <h1 className="text-[30px] leading-[1.15] font-semibold text-ink">{title}</h1>
    {children}
  </header>
);

const Section: React.FC<{ title: string; meta?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }> = ({ title, meta, aside, children }) => (
  <section className="mt-10 first-of-type:mt-0">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
      <h2 className="text-[16px] font-semibold text-ink">
        {title}
        {meta && <span className="ml-2 text-[13px] font-normal text-ink-3 tabular-nums">{meta}</span>}
      </h2>
      {aside}
    </div>
    {children}
  </section>
);

type Need = { state: 'required' | 'skip'; why?: string };

const FieldRow: React.FC<{ p: Parameter; copied: boolean; onCopy: () => void; noReq?: boolean; need?: Need }> = ({ p, copied, onCopy, noReq, need }) => (
  <div className={`${noReq ? '' : `req-rule req-${need?.state === 'required' ? 'Y' : p.required}`} ${need?.state === 'skip' ? 'opacity-45' : ''} group grid grid-cols-1 sm:grid-cols-[minmax(200px,38%)_1fr] gap-x-6 gap-y-1.5 pl-4 pr-4 py-3.5 border-b border-rule-soft last:border-0`}>
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <code className="text-[13px] font-medium text-ink break-all">{p.name}</code>
        <button
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 w-6 h-6 grid place-items-center rounded text-ink-3 hover:text-ink hover:bg-well transition-opacity cursor-pointer"
          aria-label={`Copy ${p.name}`}
        >
          {copied ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[12px] mono">
        {!noReq && (
          <>
            <span className={`font-medium ${REQ_TEXT[p.required]}`}>{REQ_LABEL[p.required]}</span>
            {need?.state === 'required' && <span className="font-medium text-ink">→ required</span>}
            {need?.state === 'skip' && <span className="text-ink-3">→ not needed</span>}
            <span className="text-ink-4">·</span>
          </>
        )}
        <span className="text-ink-3">{p.type}</span>
        {p.length && (
          <>
            <span className="text-ink-4">·</span>
            <span className="text-ink-3 tabular-nums">max {p.length}</span>
          </>
        )}
      </div>
    </div>
    <div className="text-[13px] text-ink-2 leading-relaxed">
      {need?.state === 'required' && need.why && <p className="text-[12px] font-medium text-ink mb-1">Required {need.why}.</p>}
      {p.description && <p>{p.description}</p>}
      {p.guidance && (
        <p className={p.description ? 'mt-1.5 text-ink-3' : ''}>
          <span className="eyebrow text-[10px] mr-1.5 align-[1px]">Guidance</span>
          {p.guidance}
        </p>
      )}
      {!p.description && !p.guidance && <p className="text-ink-4">No remarks in the specification.</p>}
      {p.enumOptions && (
        <div className="flex flex-wrap gap-1 mt-2">
          {p.enumOptions.map((opt) => (
            <span key={opt} className="chip">{opt}</span>
          ))}
        </div>
      )}
      {p.example && (
        <div className="mt-1.5 text-[12px] text-ink-3">
          e.g. <code className="text-ink-2">{p.example}</code>
        </div>
      )}
    </div>
  </div>
);

export const EndpointDocView: React.FC<EndpointDocViewProps> = ({ endpoint, subtypeIdx: selectedSubtypeIdx, onSubtypeChange: setSelectedSubtypeIdx }) => {
  const [filterType, setFilterType] = useState<'all' | 'Y' | 'C' | 'O'>('all');
  const { baseUrl } = useAuth();
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [combo, setCombo] = useState({ PaymentType: '', TransactionType: '', BeneficiaryBankCodeType: '' });
  const [onlyNeeded, setOnlyNeeded] = useState(true);

  const activeParameters: Parameter[] = endpoint.requestSubtypes
    ? endpoint.requestSubtypes[selectedSubtypeIdx]?.parameters || []
    : endpoint.parameters || [];

  const isWebhook = endpoint.id === 'webhook-response';
  const counts = { Y: 0, C: 0, O: 0 };
  activeParameters.forEach((p) => counts[p.required]++);
  // "Which fields do I need?" — resolves C fields for the chosen PaymentType / TransactionType.
  const hasPicker = endpoint.id === 'create-transaction';
  const comboActive = hasPicker && Boolean(combo.PaymentType || combo.TransactionType);
  const needed = new Map(conditionalRequirements(combo).map((x) => [x.field, x.why]));
  const needOf = (p: Parameter): Need | undefined => {
    if (!comboActive || p.required !== 'C') return undefined;
    if (needed.has(p.name)) return { state: 'required', why: needed.get(p.name) };
    // OtherCode depends on OtherCodeType, which the picker doesn't set.
    return p.name === 'OtherCode' ? undefined : { state: 'skip' };
  };
  const neededCount = activeParameters.filter((p) => p.required === 'Y' || needOf(p)?.state === 'required').length;
  const filteredParams = activeParameters.filter((p) => {
    if (comboActive && onlyNeeded) return p.required === 'Y' || needOf(p)?.state === 'required';
    return filterType === 'all' || p.required === filterType;
  });

  const copy = (text: string, field?: string) => {
    navigator.clipboard.writeText(text);
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } else {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  return (
    <article className="max-w-[760px]">
      <PageHead section={endpoint.sectionNumber} kicker={endpoint.category} title={endpoint.title}>
        <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">{endpoint.description}</p>
        <div className="mt-5 flex items-center gap-3 h-10 pl-3 pr-1 rounded-md bg-well border border-rule-soft">
          <span className="method">{endpoint.method}</span>
          <code className="flex-1 text-[13px] text-ink truncate">{endpoint.path}</code>
          <button onClick={() => copy(endpoint.path)} className="h-8 px-2.5 rounded text-[12px] text-ink-3 hover:text-ink hover:bg-folio flex items-center gap-1.5 cursor-pointer">
            {copiedPath ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPath ? 'Copied' : 'Copy'}
          </button>
          {endpoint.id !== 'webhook-response' && (
            <button
              onClick={() => downloadJsonFile(`hnh-${endpoint.sectionNumber}-${endpoint.id}.postman_collection.json`, generatePostmanCollection(baseUrl, endpoint.id))}
              className="h-8 px-2.5 rounded text-[12px] text-ink-3 hover:text-ink hover:bg-folio flex items-center gap-1.5 cursor-pointer"
              title="Download this method as a Postman request"
            >
              <Download className="w-3.5 h-3.5" />
              Postman
            </button>
          )}
        </div>
      </PageHead>

      {endpoint.conditionalNotes && endpoint.conditionalNotes.length > 0 && (
        <aside className="mb-10 pl-4 border-l-2 border-cond">
          <div className="eyebrow text-cond mb-2">Validation rules</div>
          <ul className="space-y-1.5 text-[13px] text-ink-2 leading-relaxed">
            {endpoint.conditionalNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </aside>
      )}

      <Section title="Headers">
        <div className="folio overflow-hidden">
          {endpoint.headers.map((h) => (
            <div key={h.key} className="grid grid-cols-1 sm:grid-cols-[minmax(200px,38%)_1fr] gap-x-6 gap-y-1 px-4 py-3 border-b border-rule-soft last:border-0">
              <code className="text-[13px] font-medium text-ink">{h.key}</code>
              <div className="text-[13px] text-ink-2">
                <code className="text-ink">{h.value}</code>
                {h.description && <span className="text-ink-3"> — {h.description}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {activeParameters.length > 0 && (
        <Section
          title={endpoint.id === 'webhook-response' ? 'Payload fields' : endpoint.method === 'GET' ? 'Parameters' : 'Request body'}
          meta={`${activeParameters.length} fields`}
          aside={
            isWebhook || (comboActive && onlyNeeded) ? undefined : <div className="seg" role="group" aria-label="Filter by requirement">
              {(
                [
                  ['all', 'All'],
                  ['Y', `Mandatory ${counts.Y}`],
                  ['C', `Conditional ${counts.C}`],
                  ['O', `Optional ${counts.O}`],
                ] as const
              ).map(([key, label]) => (
                <button key={key} aria-pressed={filterType === key} onClick={() => setFilterType(key)} className="tabular-nums">
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {endpoint.requestSubtypes && (
            <div className="seg mb-3" role="group" aria-label="Entity type">
              {endpoint.requestSubtypes.map((sub, idx) => (
                <button key={sub.name} aria-pressed={selectedSubtypeIdx === idx} onClick={() => setSelectedSubtypeIdx(idx)}>
                  {sub.name}
                </button>
              ))}
            </div>
          )}
          {hasPicker && (
            <div className="folio p-4 mb-3 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-ink">Which fields do I need?</h3>
                {comboActive && (
                  <button onClick={() => setCombo({ PaymentType: '', TransactionType: '', BeneficiaryBankCodeType: '' })} className="text-[12px] text-ink-3 hover:text-ink cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              {(
                [
                  ['PaymentType', ['B2B', 'B2C', 'C2B', 'C2C']],
                  ['TransactionType', ['AT', 'CA', 'WT', 'DR']],
                  ...(combo.TransactionType === 'AT' ? [['BeneficiaryBankCodeType', ['IFSC', 'SWIFT', 'BSB', 'BankCode', 'Routing Number', 'ABA']]] : []),
                ] as [keyof typeof combo, string[]][]
              ).map(([key, opts]) => (
                <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <code className="text-[12px] text-ink-3 w-[190px] shrink-0">{key}</code>
                  <div className="seg flex-wrap" role="group" aria-label={key}>
                    {opts.map((o) => (
                      <button key={o} aria-pressed={combo[key] === o} onClick={() => setCombo({ ...combo, [key]: combo[key] === o ? '' : o, ...(key === 'TransactionType' ? { BeneficiaryBankCodeType: '' } : {}) })}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {comboActive ? (
                <label className="flex items-center gap-2 text-[13px] text-ink-2 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={onlyNeeded} onChange={(e) => setOnlyNeeded(e.target.checked)} className="w-4 h-4 accent-[var(--solid)]" />
                  Show only the {neededCount} fields this payment needs
                </label>
              ) : (
                <p className="text-[12px] text-ink-3">Pick a payment and transaction type to see exactly which conditional fields apply.</p>
              )}
            </div>
          )}
          <div className="folio overflow-hidden">
            {filteredParams.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-3">No {REQ_LABEL[filterType as 'Y'].toLowerCase()} fields for this method.</p>
            ) : (
              filteredParams.map((p) => <FieldRow key={p.name} p={p} noReq={isWebhook} need={needOf(p)} copied={copiedField === p.name} onCopy={() => copy(p.name, p.name)} />)
            )}
          </div>
          {!isWebhook && <p className="mt-2.5 text-[12px] text-ink-3 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><span className="w-[2px] h-3 rounded bg-solid" />Y mandatory</span>
            <span className="flex items-center gap-1.5"><span className="w-[2px] h-3 rounded" style={{ background: 'repeating-linear-gradient(to bottom, var(--cond) 0 3px, transparent 3px 6px)' }} />C conditional</span>
            <span className="flex items-center gap-1.5"><span className="w-[2px] h-3 rounded bg-rule" />O optional</span>
          </p>}
        </Section>
      )}

      {endpoint.responseParameters && endpoint.responseParameters.length > 0 && (
        <Section title="Response" meta={`${endpoint.responseParameters.length} fields`}>
          <div className="folio overflow-hidden">
            {endpoint.responseParameters.map((r) => (
              <div key={r.name} className="grid grid-cols-1 sm:grid-cols-[minmax(200px,38%)_1fr] gap-x-6 gap-y-1 px-4 py-3 border-b border-rule-soft last:border-0">
                <div>
                  <code className="text-[13px] font-medium text-ink">{r.name}</code>
                  <div className="mono text-[12px] text-ink-3 mt-0.5">{r.type}</div>
                </div>
                <p className="text-[13px] text-ink-2 leading-relaxed">{r.description || <span className="text-ink-4">No remarks in the specification.</span>}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </article>
  );
};
