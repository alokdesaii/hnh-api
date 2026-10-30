import React, { useRef, useState } from 'react';
import type { EndpointSpec, Parameter } from '../data/apiSpec';
import { RELATIONSHIP_TYPES } from '../data/apiSpec';
import { useAuth } from '../context/AuthContext';
import { validateBody, conditionalRequirements, unknownFields } from '../utils/validate';
import {
  generateCurlSnippet,
  generateJavaScriptSnippet,
  generatePythonSnippet,
  generateGoSnippet,
  generatePhpSnippet,
} from '../utils/codeGenerators';
import { Play, Copy, Check, RefreshCw, Clock, Paperclip, Download, Link2 } from 'lucide-react';
import { downloadJsonFile } from '../utils/exporters';
import { DOCUMENT_TYPES, FILE_LIMITS } from '../data/proposedRules';
import { getFlow, clearFlow, rememberFrom, applyFlow, flowValueFor } from '../utils/flow';

interface ApiPlaygroundProps {
  endpoint: EndpointSpec;
  subtypeIdx?: number;
}

type Language = 'curl' | 'js' | 'python' | 'go' | 'php';

const pathParamNames = (path: string) => [...path.matchAll(/{\s*([^}\s]+)\s*}/g)].map((m) => m[1]);
const FILE_ENDPOINTS = ['upload-file', 'remitter-file-upload'];
const FORM_ENDPOINTS = ['create-transaction', 'create-remitter', 'deposit-list'];
const inputCls =
  'w-full h-8 bg-black/25 border rounded-md px-2.5 mono text-[12px] text-code-ink placeholder:text-code-dim focus:outline-none focus:border-[#1dbab0]/60';

// The first word of a validation message is the field it's about.
const errorsByField = (errors: string[]) => {
  const map: Record<string, string> = {};
  for (const e of errors) {
    const field = e.split(' ')[0];
    if (!map[field]) map[field] = e;
  }
  return map;
};

const FormField: React.FC<{ p: Parameter; value: unknown; error?: string; onChange: (v: unknown) => void; requiredNow: boolean }> = ({ p, value, error, onChange, requiredNow }) => {
  const id = `f-${p.name}`;
  const options = p.enumOptions?.map((o) => o.split(' (')[0]) ?? (p.name === 'Relationship' ? RELATIONSHIP_TYPES : undefined);
  const v = value === undefined || value === null ? '' : String(value);
  const border = error ? 'border-[#ec7a70]/70' : 'border-white/[0.07]';
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 mb-1 px-1">
        <span className="mono text-[12px] text-code-ink">{p.name}</span>
        {requiredNow && <span className="text-[11px] text-[#1dbab0]">required</span>}
        {p.length && <span className="ml-auto mono text-[11px] text-code-dim tabular-nums">{v.length}/{p.length}</span>}
      </label>
      {options ? (
        <select id={id} value={v} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${border} cursor-pointer`}>
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          value={v}
          inputMode={p.type === 'Decimal' ? 'decimal' : undefined}
          placeholder={p.type === 'Date' ? 'YYYY-MM-DD' : p.description.includes('MM/DD/YYYY') ? 'MM/DD/YYYY' : p.example ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(p.type === 'Decimal' && raw !== '' && !isNaN(Number(raw)) && !raw.endsWith('.') ? Number(raw) : raw);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${inputCls} ${border}`}
        />
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[11px] text-[#ec7a70]">
          {error}
        </p>
      )}
    </div>
  );
};

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ endpoint, subtypeIdx = 0 }) => {
  const { baseUrl, token, setToken, user } = useAuth();
  const isWebhook = endpoint.id === 'webhook-response';
  const isAuth = endpoint.id === 'auth';
  const subtype = endpoint.requestSubtypes?.[subtypeIdx];
  const params = subtype?.parameters ?? endpoint.parameters ?? [];
  const sampleBody = subtype?.sampleRequest ?? endpoint.sampleRequest ?? {};

  const [activeTab, setActiveTab] = useState<'code' | 'playground'>('playground');
  const [activeLanguage, setActiveLanguage] = useState<Language>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  // Start from the sample, with identifiers from earlier calls filled in.
  // A new transaction needs a new ClientReferenceNo, so 1.2 never reuses the last one.
  const [initial] = useState(() => {
    const flow = getFlow();
    const { body, filled } = applyFlow(sampleBody, flow, endpoint.id === 'create-transaction' ? ['ClientReferenceNo'] : []);
    const path: Record<string, string> = {};
    for (const n of pathParamNames(endpoint.path)) {
      const remembered = flowValueFor(n, flow);
      if (remembered) filled.push(n);
      path[n] = remembered ?? params.find((p) => p.name.toLowerCase() === n.toLowerCase())?.example ?? '';
    }
    return { body: JSON.stringify(body, null, 2), path, filled: [...new Set(filled)] };
  });
  const [requestBodyText, setRequestBodyText] = useState(initial.body);
  const [pathValues, setPathValues] = useState<Record<string, string>>(initial.path);
  const [carried, setCarried] = useState<string[]>(initial.filled);
  const [copiedBody, setCopiedBody] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState(user?.username ?? '');
  const [authPass, setAuthPass] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseResult, setResponseResult] = useState<unknown>(endpoint.sampleResponse);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<string>((endpoint.sampleResponse as { StatusCode?: string }).StatusCode || 'HH5000');
  const [httpStatus, setHttpStatus] = useState<number>(200);
  const [hasRun, setHasRun] = useState(false);
  const canForm = FORM_ENDPOINTS.includes(endpoint.id);
  const [bodyMode, setBodyMode] = useState<'form' | 'json'>(canForm ? 'form' : 'json');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const names = pathParamNames(endpoint.path);
  const resolvedPath = endpoint.path.replace(/{\s*([^}\s]+)\s*}/g, (_, n) => encodeURIComponent(pathValues[n] ?? ''));
  const parseBody = () => {
    try {
      return JSON.parse(requestBodyText);
    } catch {
      return undefined;
    }
  };

  const getCodeSnippet = () => {
    const ep = { ...endpoint, path: names.length ? resolvedPath : endpoint.path };
    const body = endpoint.method === 'POST' ? parseBody() : undefined;
    const gen = { curl: generateCurlSnippet, js: generateJavaScriptSnippet, python: generatePythonSnippet, go: generateGoSnippet, php: generatePhpSnippet }[activeLanguage];
    return gen(ep, baseUrl, token, body);
  };

  const copy = (text: string, set: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    set(true);
    setTimeout(() => set(false), 2000);
  };

  const finish = (result: unknown, code: string, http: number, start: number) => {
    setResponseResult(result);
    setStatusCode(code);
    setHttpStatus(http);
    setExecutionTime(Math.round(performance.now() - start));
    setIsExecuting(false);
    setHasRun(true);
    rememberFrom(result);
    if (isAuth && code === 'HH5000' && typeof (result as { Token?: unknown }).Token === 'string') setToken((result as { Token: string }).Token);
  };

  // Responses use the shapes in the document; Errors and Warnings are sandbox-only explanations.
  const runSandbox = (start: number) => {
    let warnings: string[] = [];
    const done = (result: object, code: string) => finish(warnings.length ? { ...result, Warnings: warnings } : result, code, 200, start);
    const fail = (errors: string[]) => {
      setFieldErrors(errorsByField(errors));
      done({ StatusCode: 'HH5001', StatusMessage: 'Validate data', Errors: errors }, 'HH5001');
    };
    setFieldErrors({});

    if (isAuth) {
      if (!authUser.trim() || !authPass) return finish({ StatusCode: 'HH5003', StatusMessage: 'Invalid user' }, 'HH5003', 200, start);
      return finish({ ...(endpoint.sampleResponse as object), Username: authUser }, 'HH5000', 200, start);
    }

    const missing = names.filter((n) => {
      const p = params.find((x) => x.name.toLowerCase() === n.toLowerCase());
      return p?.required !== 'O' && !pathValues[n]?.trim();
    });
    if (missing.length) return fail(missing.map((n) => `${n} is mandatory.`));
    const dateErrors = names
      .filter((n) => /date$/i.test(n) && pathValues[n] && !/^\d{4}-\d{2}-\d{2}$/.test(pathValues[n]))
      .map((n) => `${n} must be a date in YYYY-MM-DD format.`);
    if (dateErrors.length) return fail(dateErrors);

    if (endpoint.method === 'POST') {
      const body = parseBody();
      if (body === undefined) return fail(['The request body is not valid JSON.']);
      warnings = unknownFields(body, params);
      const errors = validateBody(endpoint.id, body, params);
      if (errors.length) return fail(errors);
      if (endpoint.id === 'create-transaction') {
        return done(
          { ClientReferenceNo: String(body.ClientReferenceNo).trim(), TransactionNumber: String(Math.floor(100000000 + Math.random() * 900000000)), StatusCode: 'HH5000', StatusMessage: 'SUCCESS' },
          'HH5000'
        );
      }
    }

    // 1.14: the proposed full list of document types, filtered like the real method would.
    if (endpoint.id === 'remitter-doc-types') {
      const ct = (pathValues.clientType ?? '').trim();
      if (!['sub-client-corporate', 'sub-client-individual'].includes(ct)) return fail(['clientType must be one of: sub-client-individual, sub-client-corporate.']);
      const country = (pathValues.countryname ?? '').trim();
      const list = DOCUMENT_TYPES.filter((d) => d.clientType === ct && (!country || d.countries === 'All' || d.countries.toLowerCase().includes(country.toLowerCase())));
      return done(
        { RemitterDocumentTypes: list.map((d) => ({ DocumentName: d.name, ClientType: d.clientType, ApplicableCountries: d.countries })), StatusMessage: 'SUCCESS', StatusCode: 'HH5000' },
        'HH5000'
      );
    }

    const sample = endpoint.sampleResponse as Record<string, unknown>;
    if (endpoint.id === 'transaction-status') return finish({ ...sample, ClientReferenceNo: pathValues.ClientReferenceNo }, String(sample.StatusCode), 200, start);
    done(sample, String(sample.StatusCode ?? 'HH5000'));
  };

  const handleExecuteRequest = () => {
    setIsExecuting(true);
    const start = performance.now();

    setTimeout(() => runSandbox(start), 250);
  };

  const formBody = parseBody();
  const formUsable = canForm && formBody && typeof formBody === 'object' && !Array.isArray(formBody);
  const setField = (name: string, value: unknown) => {
    setRequestBodyText(JSON.stringify({ ...formBody, [name]: value }, null, 2));
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
  };
  const requiredNow = new Set([
    ...params.filter((p) => p.required === 'Y').map((p) => p.name),
    ...(endpoint.id === 'create-transaction' && formUsable ? conditionalRequirements(formBody).map((x) => x.field) : []),
  ]);
  const primary = params.filter((p) => requiredNow.has(p.name));
  const rest = params.filter((p) => !requiredNow.has(p.name));

  const attachFiles = async (files: FileList | null) => {
    setAttachError(null);
    if (!files?.length) return;
    // Proposed limits (src/data/proposedRules.ts): reject before reading the file into the page.
    const allowed = FILE_LIMITS.types[endpoint.id] ?? [];
    const MB = 1024 * 1024;
    const problems = [...files].flatMap((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase().replace('jpeg', 'jpg') ?? '';
      return [
        ...(f.size > FILE_LIMITS.maxFileMB * MB ? [`${f.name} is ${(f.size / MB).toFixed(1)} MB (limit ${FILE_LIMITS.maxFileMB} MB per file)`] : []),
        ...(!allowed.includes(ext) ? [`${f.name} isn't a ${allowed.join(', ')} file`] : []),
      ];
    });
    const total = [...files].reduce((n, f) => n + f.size, 0);
    if (total > FILE_LIMITS.maxRequestMB * MB) problems.push(`these files total ${(total / MB).toFixed(1)} MB (limit ${FILE_LIMITS.maxRequestMB} MB per request)`);
    if (problems.length) {
      setAttachError(`Not attached: ${problems.join('; ')}.`);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    const body = parseBody() ?? (endpoint.id === 'upload-file' ? [] : { FileUpload: [] });
    const txn = Array.isArray(body) ? body[0]?.TransactionNumber ?? '' : '';
    // Replace the document's placeholder entries with the chosen files.
    const entries = await Promise.all(
      [...files].map(async (f) => {
        const base64 = await readBase64(f);
        const dot = f.name.lastIndexOf('.');
        const stem = dot > 0 ? f.name.slice(0, dot) : f.name;
        return endpoint.id === 'upload-file'
          ? { TransactionNumber: txn, FileName: stem, FileBase64String: base64 }
          : { FileName: stem, FileType: '', FileExtention: dot > 0 ? f.name.slice(dot) : '', FileBase64String: base64 };
      })
    );
    const next = Array.isArray(body) ? entries : { ...body, FileUpload: entries };
    setRequestBodyText(JSON.stringify(next, null, 2));
  };

  const ok = ['HH5000', 'HH5006', 'HH5008'].includes(statusCode);
  const fileStem = `hnh-${endpoint.sectionNumber}-${endpoint.id}`;
  const resetToSample = () => {
    setRequestBodyText(JSON.stringify(sampleBody, null, 2));
    setCarried([]);
  };
  const forgetFlow = () => {
    clearFlow();
    resetToSample();
    setPathValues(Object.fromEntries(names.map((n) => [n, params.find((p) => p.name.toLowerCase() === n.toLowerCase())?.example ?? ''])));
  };
  const iconBtn = 'text-code-dim hover:text-white cursor-pointer';
  const responseText = JSON.stringify(responseResult, null, 2);

  const tabs = isWebhook
    ? ([['playground', 'Payload']] as const)
    : ([
        ['playground', 'Try it'],
        ['code', 'Code'],
      ] as const);

  return (
    <div className="rounded-[10px] overflow-hidden bg-code text-code-ink border border-rule">
      <div className="h-11 px-2 flex items-center justify-between border-b border-white/[0.07]">
        <div className="flex" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`relative h-11 px-3 text-[13px] font-medium cursor-pointer transition-colors ${activeTab === key ? 'text-white' : 'text-code-dim hover:text-code-ink'}`}
            >
              {label}
              {activeTab === key && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-[#1dbab0] rounded-t" />}
            </button>
          ))}
        </div>
        <span className="mono text-[11px] text-code-dim pr-2 truncate">
          <span className="text-[#1dbab0]">{endpoint.method}</span> {isWebhook ? 'to your endpoint' : endpoint.path}
        </span>
      </div>

      {isWebhook ? (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-1 text-[12px] text-code-dim">
            <span>{subtype?.name} payload Harbour &amp; Hills posts to you</span>
            <span className="flex items-center gap-3">
              <button onClick={() => copy(requestBodyText, setCopiedResponse)} className={iconBtn} aria-label="Copy payload">
                {copiedResponse ? <Check className="w-3.5 h-3.5 text-[#1dbab0]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => downloadJsonFile(`${fileStem}-${subtype?.name.toLowerCase()}.json`, requestBodyText)} className={iconBtn} aria-label="Download payload">
                <Download className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
          <pre className="bg-black/25 border border-white/[0.07] rounded-md p-3 text-[12px] leading-[1.65] overflow-auto">{requestBodyText}</pre>
          <p className="mt-2.5 px-1 text-[12px] text-code-dim">Switch between incoming and outgoing on the left. The document doesn't define a reply body for webhooks.</p>
        </div>
      ) : activeTab === 'code' ? (
        <div>
          <div className="h-10 px-2 flex items-center justify-between border-b border-white/[0.07]">
            <div className="flex gap-0.5">
              {(['curl', 'js', 'python', 'go', 'php'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  aria-pressed={activeLanguage === lang}
                  className={`h-7 px-2 rounded mono text-[11px] cursor-pointer transition-colors ${activeLanguage === lang ? 'bg-white/[0.08] text-white' : 'text-code-dim hover:text-code-ink'}`}
                >
                  {lang === 'js' ? 'node' : lang}
                </button>
              ))}
            </div>
            <button onClick={() => copy(getCodeSnippet(), setCopiedCode)} className="h-7 px-2 rounded text-[12px] text-code-dim hover:text-white flex items-center gap-1.5 cursor-pointer">
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#1dbab0]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-[12px] leading-[1.65] overflow-auto max-h-[calc(100vh-220px)] min-h-[360px]">{getCodeSnippet()}</pre>
        </div>
      ) : (
        <div>
          <div className="p-3 border-b border-white/[0.07] space-y-3">
            {carried.length > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-[#1dbab0]/[0.08] border border-[#1dbab0]/20 px-2.5 py-2 text-[12px]">
                <Link2 className="w-3.5 h-3.5 text-[#1dbab0] mt-px shrink-0" />
                <span className="flex-1">
                  Filled from your earlier calls: <span className="mono text-white">{carried.join(', ')}</span>
                </span>
                <button onClick={forgetFlow} className="text-code-dim hover:text-white cursor-pointer shrink-0">
                  Forget
                </button>
              </div>
            )}
            {isAuth && (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['Username', authUser, setAuthUser, 'text'],
                    ['Password', authPass, setAuthPass, 'password'],
                  ] as const
                ).map(([label, value, set, type]) => (
                  <label key={label} className="block">
                    <span className="block text-[12px] text-code-dim mb-1 px-1">{label} header</span>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      autoComplete="off"
                      className="w-full h-8 bg-black/25 border border-white/[0.07] rounded-md px-2.5 mono text-[12px] text-code-ink focus:outline-none focus:border-[#1dbab0]/60"
                    />
                  </label>
                ))}
              </div>
            )}

            {names.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[12px] text-code-dim px-1">Path parameters</span>
                {names.map((n) => {
                  const p = params.find((x) => x.name.toLowerCase() === n.toLowerCase());
                  return (
                    <label key={n} className="grid grid-cols-[minmax(110px,40%)_1fr] items-center gap-2">
                      <span className="mono text-[12px] text-code-ink px-1 truncate">
                        {n}
                        {p?.required === 'O' && <span className="text-code-dim"> (optional)</span>}
                      </span>
                      <input
                        value={pathValues[n] ?? ''}
                        onChange={(e) => setPathValues({ ...pathValues, [n]: e.target.value })}
                        placeholder={/date$/i.test(n) ? 'YYYY-MM-DD' : ''}
                        className="h-8 bg-black/25 border border-white/[0.07] rounded-md px-2.5 mono text-[12px] text-code-ink placeholder:text-code-dim focus:outline-none focus:border-[#1dbab0]/60"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {endpoint.method === 'POST' && !isAuth && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1 gap-3">
                  <span className="flex items-center gap-2.5">
                    <span className="text-[12px] text-code-dim">Request body{subtype && ` · ${subtype.name}`}</span>
                    {canForm && (
                      <span className="inline-flex p-0.5 rounded bg-black/25" role="group" aria-label="Body editor">
                        {(['form', 'json'] as const).map((m) => (
                          <button
                            key={m}
                            aria-pressed={bodyMode === m}
                            onClick={() => setBodyMode(m)}
                            className={`h-6 px-2 rounded-[3px] text-[11px] cursor-pointer ${bodyMode === m ? 'bg-white/[0.1] text-white' : 'text-code-dim hover:text-code-ink'}`}
                          >
                            {m === 'form' ? 'Form' : 'JSON'}
                          </button>
                        ))}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {FILE_ENDPOINTS.includes(endpoint.id) && (
                      <>
                        <input ref={fileInput} type="file" multiple accept={(FILE_LIMITS.types[endpoint.id] ?? []).map((t) => `.${t}${t === 'jpg' ? ',.jpeg' : ''}`).join(',')} className="hidden" onChange={(e) => attachFiles(e.target.files)} />
                        <button onClick={() => fileInput.current?.click()} className="text-[12px] text-code-dim hover:text-white flex items-center gap-1 cursor-pointer">
                          <Paperclip className="w-3 h-3" /> Attach files
                        </button>
                      </>
                    )}
                    <button onClick={resetToSample} className="text-[12px] text-code-dim hover:text-white flex items-center gap-1 cursor-pointer">
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                    <button onClick={() => copy(requestBodyText, setCopiedBody)} className={iconBtn} aria-label="Copy request body">
                      {copiedBody ? <Check className="w-3.5 h-3.5 text-[#1dbab0]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => downloadJsonFile(`${fileStem}-request.json`, requestBodyText)} className={iconBtn} aria-label="Download request body">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {attachError && (
                  <p role="alert" className="mb-2 px-1 text-[12px] text-[#ec7a70]">
                    {attachError}
                  </p>
                )}
                {FILE_ENDPOINTS.includes(endpoint.id) && (
                  <p className="mb-2 px-1 text-[11px] text-code-dim">
                    Proposed limits: {FILE_LIMITS.maxFileMB} MB per file, {FILE_LIMITS.maxRequestMB} MB per request · {(FILE_LIMITS.types[endpoint.id] ?? []).join(', ')}
                  </p>
                )}
                {bodyMode === 'form' && canForm ? (
                  formUsable ? (
                    <div className="space-y-3">
                      {primary.map((p) => (
                        <FormField key={p.name} p={p} value={formBody[p.name]} error={fieldErrors[p.name]} requiredNow onChange={(v) => setField(p.name, v)} />
                      ))}
                      {rest.length > 0 && (
                        <details className="group/opt" open={rest.some((p) => fieldErrors[p.name])}>
                          <summary className="cursor-pointer px-1 py-1 text-[12px] text-code-dim hover:text-white select-none list-none flex items-center gap-1.5">
                            <span className="inline-block transition-transform group-open/opt:rotate-90">›</span>
                            {rest.length} more fields, not needed for this request
                          </summary>
                          <div className="space-y-3 pt-2">
                            {rest.map((p) => (
                              <FormField key={p.name} p={p} value={formBody[p.name]} error={fieldErrors[p.name]} requiredNow={false} onChange={(v) => setField(p.name, v)} />
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <p className="px-1 text-[12px] text-[#e0a24a]">The JSON isn't valid, so the form can't show it. Fix it in the JSON tab or reset to the sample.</p>
                  )
                ) : (
                <textarea
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  rows={11}
                  spellCheck={false}
                  aria-label="Request body JSON"
                  className="w-full bg-black/25 border border-white/[0.07] rounded-md p-3 mono text-[12px] leading-[1.65] text-code-ink focus:outline-none focus:border-[#1dbab0]/60 resize-y"
                />
                )}
              </div>
            )}

            {endpoint.method === 'GET' && names.length === 0 && <p className="px-1 text-[12px] text-code-dim">No parameters. This is a GET request with no body.</p>}

            <button
              onClick={handleExecuteRequest}
              disabled={isExecuting}
              className="w-full h-9 rounded-md bg-[#1dbab0] text-[#0c0f19] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
            >
              {isExecuting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Send request · sandbox
                </>
              )}
            </button>
            <p className="px-1 text-[11px] text-code-dim">The sandbox checks your request against the specification's rules and returns the documented response. Nothing is sent to Harbour &amp; Hills. Use the Code tab to call the API from your own servers.</p>
          </div>

          <div className="p-3" aria-live="polite">
            <div className="flex items-center gap-2.5 mb-2 px-1 text-[12px]">
              <span className="text-code-dim">{hasRun ? 'Response' : 'Sample response'}</span>
              <span className={`mono font-medium ${ok ? 'text-[#4cc28d]' : 'text-[#e0a24a]'}`}>{statusCode}</span>
              {hasRun && httpStatus > 0 && <span className="mono text-code-dim tabular-nums">HTTP {httpStatus}</span>}
              <span className="flex-1" />
              {executionTime !== null && (
                <span className="mono text-code-dim tabular-nums flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {executionTime} ms
                </span>
              )}
              <button onClick={() => copy(responseText, setCopiedResponse)} className={iconBtn} aria-label="Copy response JSON">
                {copiedResponse ? <Check className="w-3.5 h-3.5 text-[#1dbab0]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => downloadJsonFile(`${fileStem}-response.json`, responseText)} className={iconBtn} aria-label="Download response JSON">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="bg-black/25 border border-white/[0.07] rounded-md p-3 text-[12px] leading-[1.65] overflow-auto max-h-[320px]">{responseText}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
