import React from 'react';
import { ArrowRight } from 'lucide-react';
import { API_ENDPOINTS, VERSION_HISTORY } from '../data/apiSpec';
import { GUIDES } from '../data/guides';

interface OverviewViewProps {
  onNavigateToAuth: () => void;
  onNavigateToTx: () => void;
  onSelectEndpoint?: (id: string) => void;
}

// Everything on this page is taken from HnH_API_V2.3.3.pdf.
const FLOW = [
  { id: 'auth', num: '1.1', title: 'Authenticate', note: 'Exchange the Username and Password from the Business team for a bearer token.' },
  { id: 'create-remitter', num: '1.4', title: 'Register the remitter', note: 'Create a corporate or individual remitter, or look one up with 1.5 Remitter List.' },
  { id: 'create-transaction', num: '1.2', title: 'Create the transaction', note: 'Push a B2B, B2C, C2B or C2C payment against the remitter account.' },
  { id: 'transaction-status', num: '1.3', title: 'Track the outcome', note: 'Poll Transaction Status, or receive updates through the 1.12 webhook.' },
];

const TRANSACTION_TYPES = [
  { code: 'AT', name: 'Account transfer', needs: 'BeneficiaryBankAccountNo, BeneficiaryBankCodeType, BeneficiaryBankCode, BranchCode, BankChargesType (plus BankName and BankCountry for BankCode, IFSC or BSB)' },
  { code: 'CA', name: 'Cash', needs: 'BeneficiaryMobileNo, Location, AgentCode' },
  { code: 'WT', name: 'Wallet', needs: 'BeneficiaryMobileNo' },
  { code: 'DR', name: 'Door-to-door', needs: 'AgentCode' },
];

const CONVENTIONS = [
  ['Requirement', 'Y mandatory · C conditional · O optional'],
  ['Authorization', 'Bearer token returned by 1.1'],
  ['Account number', '102-344-001-01-00-0001-00000'],
  ['Country', 'ISO 2-letter code'],
  ['Currency', 'ISO 3-letter code'],
  ['Dates in bodies', 'MM/DD/YYYY'],
  ['Date filters (1.6–1.8)', 'YYYY-MM-DD'],
  ['Amounts', 'Decimal, up to 2 places'],
];

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateToAuth, onSelectEndpoint }) => {
  const latest = VERSION_HISTORY[VERSION_HISTORY.length - 1];
  const go = (id: string) => onSelectEndpoint?.(id);
  const methods = API_ENDPOINTS.slice().sort((a, b) => +a.sectionNumber.split('.')[1] - +b.sectionNumber.split('.')[1]);

  return (
    <div className="max-w-[860px]">
      <header className="pb-9 mb-10 border-b border-rule">
        <div className="eyebrow mb-3">Specification document · {latest.version} · {latest.issuedDate}</div>
        <h1 className="text-[36px] leading-[1.1] font-semibold text-ink">Payments API</h1>
        <p className="mt-4 text-[16px] text-ink-2 leading-relaxed max-w-[58ch]">
          One API for pushing B2B, B2C, C2B and C2C payments, managing remitters, and reading statements, deposits and documents.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={onNavigateToAuth} className="btn btn-primary">
            Start with authentication <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => go('create-transaction')} className="btn btn-ghost">
            Create a transaction
          </button>
        </div>
      </header>

      {/* Integration path — the order a client actually calls things */}
      <section>
        <h2 className="text-[18px] font-semibold text-ink mb-1">Integration path</h2>
        <p className="text-[14px] text-ink-3 mb-5">Most clients call the API in this order.</p>
        <ol className="relative">
          {FLOW.map((step, i) => (
            <li key={step.id} className="relative pl-12 pb-6 last:pb-0">
              {i < FLOW.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-rule" />}
              <span className="absolute left-0 top-0 w-8 h-8 rounded-full border border-rule-strong bg-folio grid place-items-center mono text-[12px] text-ink-2 tabular-nums">
                {i + 1}
              </span>
              <button onClick={() => go(step.id)} className="group text-left cursor-pointer">
                <span className="flex items-baseline gap-2">
                  <span className="mono text-[12px] text-tide tabular-nums">§{step.num}</span>
                  <span className="text-[15px] font-medium text-ink group-hover:underline underline-offset-4 decoration-rule-strong">{step.title}</span>
                </span>
                <span className="block mt-0.5 text-[14px] text-ink-2">{step.note}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-[18px] font-semibold text-ink mb-4">Guides</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {GUIDES.map((g) => (
            <button key={g.id} onClick={() => go(g.id)} className="folio p-4 text-left hover:border-rule-strong transition-colors cursor-pointer group">
              <div className="text-[14px] font-medium text-ink flex items-center justify-between gap-2">
                {g.title}
                <ArrowRight className="w-3.5 h-3.5 text-ink-4 group-hover:text-ink transition-colors" />
              </div>
              <p className="mt-1 text-[13px] text-ink-3 leading-relaxed">{g.summary}</p>
              <p className="mt-2 text-[12px] text-ink-4 tabular-nums">{g.steps.length} steps</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-[1fr_300px] gap-10 mt-14">
        <section>
          <h2 className="text-[18px] font-semibold text-ink mb-1">Transaction types</h2>
          <p className="text-[14px] text-ink-3 mb-4">
            <code className="text-ink-2">TransactionType</code> in §1.2 decides which conditional fields become mandatory.
          </p>
          <div className="folio overflow-hidden">
            {TRANSACTION_TYPES.map((t) => (
              <div key={t.code} className="grid grid-cols-[52px_1fr] gap-4 px-4 py-3.5 border-b border-rule-soft last:border-0">
                <span className="mono text-[15px] font-semibold text-ink">{t.code}</span>
                <div>
                  <div className="text-[14px] font-medium text-ink">{t.name}</div>
                  <div className="mt-1 text-[12px] text-ink-3 leading-relaxed">
                    Requires <span className="mono text-ink-2 break-words">{t.needs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink-3">
            <code className="text-ink-2">PaymentType</code> is one of <span className="chip">B2B</span> <span className="chip">B2C</span> <span className="chip">C2B</span> <span className="chip">C2C</span>. C2C also requires <code className="text-ink-2">Relationship</code> (§1.17).
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-ink mb-4">Conventions</h2>
          <dl className="space-y-3.5">
            {CONVENTIONS.map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-0.5 text-[13px] text-ink mono break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-14 pl-4 border-l-2 border-tide">
        <div className="eyebrow text-tide mb-1.5">What changed in {latest.version}</div>
        <ul className="text-[14px] text-ink-2 space-y-1">
          {latest.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <button onClick={() => go('version-history')} className="mt-2 text-[13px] text-ink-3 hover:text-ink cursor-pointer underline underline-offset-4 decoration-rule-strong">
          Full version history
        </button>
      </section>

      <section className="mt-14">
        <h2 className="text-[18px] font-semibold text-ink mb-4">All methods</h2>
        <div className="folio overflow-hidden">
          {methods.map((ep) => (
            <button
              key={ep.id}
              onClick={() => go(ep.id)}
              className="w-full grid grid-cols-[44px_1fr_auto] sm:grid-cols-[44px_200px_1fr_auto] items-center gap-3 px-4 h-11 text-left border-b border-rule-soft last:border-0 hover:bg-well cursor-pointer transition-colors"
            >
              <span className="mono text-[12px] text-ink-3 tabular-nums">{ep.sectionNumber}</span>
              <span className="text-[14px] text-ink font-medium truncate">{ep.title}</span>
              <code className="hidden sm:block text-[12px] text-ink-3 truncate">{ep.path}</code>
              <span className="method">{ep.method}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
