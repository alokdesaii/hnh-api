import React from 'react';
import { VERSION_HISTORY } from '../data/apiSpec';
import { PageHead, ProposedTag } from './EndpointDocView';
import { FILE_LIMITS, DOCUMENT_TYPES } from '../data/proposedRules';

// Not a released version: rules recommended by the backend team, pending approval (src/data/proposedRules.ts).
const PROPOSED = [
  'Allowed characters for text fields in 1.2 and 1.4: person names take letters, spaces and . - \'; other text uses the SWIFT character set; references, codes, account numbers, SWIFT codes, email and phone have fixed formats.',
  `File limits for 1.9 and 1.13: ${FILE_LIMITS.maxFileMB} MB per file and ${FILE_LIMITS.maxRequestMB} MB per request; file contents must match the accepted types.`,
  '1.12 outgoing webhook: adds PayOutAmount, PayOutCurrency, Charges, ChargesCurrency and BankChargesType.',
  `1.14: a full list of ${DOCUMENT_TYPES.length} remitter document types; 1.13 accepts only these as FileType.`,
];

export const VersionHistoryView: React.FC = () => (
  <div className="max-w-[760px]">
    <PageHead kicker="Document control" title="Version control">
      <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">Every revision of the specification, newest first.</p>
    </PageHead>

    <section className="mb-8 pb-8 border-b border-rule-soft grid grid-cols-[96px_1fr] sm:grid-cols-[140px_1fr] gap-6">
      <div>
        <ProposedTag />
        <div className="text-[12px] text-ink-3 mt-2">Pending approval</div>
      </div>
      <div>
        <ul className="space-y-1.5 text-[14px] text-ink-2 leading-relaxed">
          {PROPOSED.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <div className="text-[12px] text-ink-3 mt-3">Recommended by the backend team. Not part of the signed V2.3.3 specification; the sandbox already checks them.</div>
      </div>
    </section>

    <ol>
      {VERSION_HISTORY.slice().reverse().map((item, idx) => (
        <li key={item.version} className="grid grid-cols-[96px_1fr] sm:grid-cols-[140px_1fr] gap-6 pb-8 mb-8 border-b border-rule-soft last:border-0">
          <div>
            <div className={`mono text-[15px] font-semibold ${idx === 0 ? 'text-tide' : 'text-ink'}`}>{item.version}</div>
            <div className="text-[12px] text-ink-3 mt-1 tabular-nums">{item.issuedDate}</div>
            {idx === 0 && <div className="eyebrow text-tide mt-2">Current</div>}
          </div>
          <div>
            <ul className="space-y-1.5 text-[14px] text-ink-2 leading-relaxed">
              {item.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="text-[12px] text-ink-3 mt-3">{item.author}</div>
          </div>
        </li>
      ))}
    </ol>
  </div>
);
