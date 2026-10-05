// Values carried between console calls, so a client can test a whole flow:
// create a remitter → create a transaction → check its status → upload a file.
// Kept for this browser session only.

export type FlowValues = Partial<Record<'ClientReferenceNo' | 'TransactionNumber' | 'RemitterAccountNumber', string>>;

const KEY = 'hnh_console_flow';

export function getFlow(): FlowValues {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function clearFlow() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
}

// Pick up the identifiers a successful response hands back.
export function rememberFrom(response: unknown) {
  if (!response || typeof response !== 'object') return;
  const r = response as Record<string, unknown>;
  if (r.StatusCode !== 'HH5000' && r.StatusCode !== 'HH5008') return;
  const next = { ...getFlow() };
  for (const k of ['ClientReferenceNo', 'TransactionNumber', 'RemitterAccountNumber'] as const) {
    if (typeof r[k] === 'string' && r[k]) next[k] = (r[k] as string).trim();
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
}

// Field and path names in the spec that take each remembered value.
const TARGETS: Record<string, keyof FlowValues> = {
  clientreferenceno: 'ClientReferenceNo',
  transactionnumber: 'TransactionNumber',
  remitteraccountnumber: 'RemitterAccountNumber',
  subclientaccountnumber: 'RemitterAccountNumber',
};

export const flowValueFor = (name: string, flow: FlowValues) => {
  const k = TARGETS[name.toLowerCase()];
  return k ? flow[k] : undefined;
};

// Fill remembered values into a sample body (object or array of objects). Returns the names filled.
export function applyFlow(body: unknown, flow: FlowValues, skip: string[] = []): { body: unknown; filled: string[] } {
  const filled = new Set<string>();
  const fill = (o: Record<string, unknown>) => {
    const out = { ...o };
    for (const key of Object.keys(out)) {
      const v = skip.includes(key) ? undefined : flowValueFor(key, flow);
      if (v) {
        out[key] = v;
        filled.add(key);
      }
    }
    return out;
  };
  if (Array.isArray(body)) return { body: body.map((x) => (x && typeof x === 'object' ? fill(x) : x)), filled: [...filled] };
  if (body && typeof body === 'object') return { body: fill(body as Record<string, unknown>), filled: [...filled] };
  return { body, filled: [] };
}
