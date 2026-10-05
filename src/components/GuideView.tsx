import React, { useState } from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { API_ENDPOINTS } from '../data/apiSpec';
import type { Guide } from '../data/guides';
import { useAuth } from '../context/AuthContext';
import { generateCurlSnippet } from '../utils/codeGenerators';
import { PageHead } from './EndpointDocView';

const CodeBlock: React.FC<{ lang: string; text: string }> = ({ lang, text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-md overflow-hidden bg-code text-code-ink border border-rule">
      <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.07] text-[11px] text-code-dim">
        <span className="mono">{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 hover:text-white cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-[#1dbab0]" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 text-[12px] leading-[1.6] overflow-auto max-h-[280px]">{text}</pre>
    </div>
  );
};

export const GuideView: React.FC<{ guide: Guide; onOpen: (id: string) => void }> = ({ guide, onOpen }) => {
  const { baseUrl } = useAuth();

  return (
    <article className="max-w-[760px]">
      <PageHead kicker="Guide" title={guide.title}>
        <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">{guide.summary}</p>
      </PageHead>

      <ol>
        {guide.steps.map((step, i) => {
          const ep = API_ENDPOINTS.find((e) => e.id === step.endpointId);
          const code = step.code ?? (ep && ep.id !== 'webhook-response' ? { lang: 'curl', text: generateCurlSnippet(ep, baseUrl, '', step.sampleBody) } : undefined);
          return (
            <li key={step.title} className="relative pl-12 pb-10 last:pb-0">
              {i < guide.steps.length - 1 && <span className="absolute left-[15px] top-9 bottom-1 w-px bg-rule" />}
              <span className="absolute left-0 top-0 w-8 h-8 rounded-full border border-rule-strong bg-folio grid place-items-center mono text-[12px] text-ink-2 tabular-nums">
                {i + 1}
              </span>
              <h2 className="text-[16px] font-semibold text-ink pt-1">{step.title}</h2>
              <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed">{step.body}</p>
              {ep && (
                <button onClick={() => onOpen(ep.id)} className="mt-2.5 inline-flex items-center gap-2 text-[13px] text-ink hover:underline underline-offset-4 decoration-rule-strong cursor-pointer">
                  <span className="mono text-[12px] text-tide">§{ep.sectionNumber}</span>
                  {ep.title}: open in the console
                  <ArrowRight className="w-3.5 h-3.5 text-ink-3" />
                </button>
              )}
              {code && <CodeBlock {...code} />}
            </li>
          );
        })}
      </ol>
    </article>
  );
};
