import React, { useState } from 'react';
import { STATUS_CODES, PAYMENT_STATUS_CODES } from '../data/apiSpec';
import { Search } from 'lucide-react';
import { PageHead } from './EndpointDocView';

type Code = { code: string; name: string; description: string };

// Colour carries meaning only: settled/accepted, held, rejected/failed.
const tone = (code: string) =>
  ['HH5000', 'HH5006', 'HH5008'].includes(code) ? 'text-ok' : ['HH5009'].includes(code) ? 'text-hold' : ['HH5007', 'HH5011', 'HH5005'].includes(code) ? 'text-fail' : 'text-ink';

const CodeTable: React.FC<{ section: string; title: string; rows: Code[] }> = ({ section, title, rows }) => (
  <section className="mt-10 first:mt-0">
    <h2 className="text-[16px] font-semibold text-ink mb-3">
      <span className="mono text-[13px] font-medium text-tide mr-2">§{section}</span>
      {title}
    </h2>
    <div className="folio overflow-hidden">
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-ink-3">No codes match.</p>
      ) : (
        rows.map((sc) => (
          <div key={sc.code} className="grid grid-cols-[84px_1fr] sm:grid-cols-[84px_200px_1fr] gap-x-4 gap-y-0.5 px-4 py-3 border-b border-rule-soft last:border-0">
            <code className={`text-[13px] font-semibold tabular-nums ${tone(sc.code)}`}>{sc.code}</code>
            <span className="text-[13px] font-medium text-ink">{sc.name}</span>
            <span className="col-start-2 sm:col-start-auto text-[13px] text-ink-2">{sc.description}</span>
          </div>
        ))
      )}
    </div>
  </section>
);

export const StatusCodesView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const q = searchQuery.toLowerCase().trim();
  const match = (sc: Code) => !q || [sc.code, sc.name, sc.description].some((v) => v.toLowerCase().includes(q));

  return (
    <div className="max-w-[760px]">
      <PageHead section="1.15" kicker="Reference" title="Status codes">
        <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">
          Every response carries a <code className="text-ink">StatusCode</code> and <code className="text-ink">StatusMessage</code>. Gateway codes describe the call itself; payment codes describe where a transaction is in its lifecycle.
        </p>
        <div className="relative mt-5 max-w-sm">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter, e.g. HH5009 or rejected"
            aria-label="Filter status codes"
            className="field pl-8"
          />
        </div>
      </PageHead>

      <CodeTable section="1.15" title="Gateway status codes" rows={STATUS_CODES.filter(match)} />
      <CodeTable section="1.16" title="Payment status codes" rows={PAYMENT_STATUS_CODES.filter(match)} />
    </div>
  );
};
