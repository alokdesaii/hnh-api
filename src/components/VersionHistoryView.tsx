import React from 'react';
import { VERSION_HISTORY } from '../data/apiSpec';
import { PageHead } from './EndpointDocView';

export const VersionHistoryView: React.FC = () => (
  <div className="max-w-[760px]">
    <PageHead kicker="Document control" title="Version control">
      <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">Every revision of the specification, newest first.</p>
    </PageHead>

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
