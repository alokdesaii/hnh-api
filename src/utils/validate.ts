import type { Parameter } from '../data/apiSpec';

// Sandbox validation, following the Y/C/O rules and lengths in HnH_API_V2.3.3.pdf.
// Returns a list of problems; empty means the request would pass validation.

const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';
const enumValue = (opt: string) => opt.split(' (')[0];

// ISO 3166-1 alpha-2 country codes and ISO 4217 currency codes, from the runtime's Intl data (no lists to maintain).
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const isCountryCode = (v: string) => {
  if (!/^[A-Z]{2}$/.test(v)) return false;
  try {
    const name = regionNames.of(v);
    return Boolean(name) && name !== v && name !== 'Unknown Region';
  } catch {
    return false;
  }
};
const CURRENCIES = new Set(Intl.supportedValuesOf('currency'));
export const isCurrencyCode = (v: string) => CURRENCIES.has(v);

// MM/DD/YYYY and a real calendar date.
export const isUsDate = (v: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const [mm, dd, yyyy] = [+m[1], +m[2], +m[3]];
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return d.getUTCFullYear() === yyyy && d.getUTCMonth() === mm - 1 && d.getUTCDate() === dd;
};

const COUNTRY_FIELDS = new Set(['BeneficiaryCountry', 'BeneficiaryNationality', 'BeneficiaryPlaceOfBirth', 'BankCountry', 'IncorporationCountry', 'CountryOfOperation', 'Country', 'Nationality', 'BirthCountry']);
const CURRENCY_FIELDS = new Set(['PayInCurrency', 'PayOutCurrency']);
const isNumeric = (v: unknown) => (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()));

function checkFields(body: Record<string, unknown>, params: Parameter[], prefix = ''): string[] {
  const errors: string[] = [];
  for (const p of params) {
    const v = body[p.name];
    const name = `${prefix}${p.name}`;
    if (p.required === 'Y' && blank(v)) errors.push(`${name} is mandatory.`);
    if (blank(v)) continue;
    const text = String(v).trim();

    // Types
    if (p.type === 'Decimal') {
      if (!isNumeric(v)) {
        errors.push(`${name} must be a number.`);
        continue;
      }
      // The spec limits decimals only where the remark says so (PayInAmount, PayOutAmount), not Rate or Fee.
      if (/2 decimal/i.test(p.description) && !/^-?\d+(\.\d{1,2})?$/.test(text)) {
        errors.push(`${name} can have at most 2 decimal places.`);
      }
      continue;
    }
    if (typeof v !== 'string') {
      errors.push(`${name} must be text (a JSON string), not ${Array.isArray(v) ? 'a list' : typeof v}.`);
      continue;
    }

    if (p.length && typeof p.length === 'number' && v.length > p.length) {
      errors.push(`${name} is longer than ${p.length} characters.`);
    }
    if (p.enumOptions && !p.enumOptions.map(enumValue).includes(text)) {
      errors.push(`${name} must be one of: ${p.enumOptions.map(enumValue).join(', ')}.`);
    }
    if (p.type === 'Date' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      errors.push(`${name} must be a date in YYYY-MM-DD format.`);
    }
    if (p.description.includes('MM/DD/YYYY') && !isUsDate(text)) {
      errors.push(`${name} must be a real date in MM/DD/YYYY format.`);
    }
    if (COUNTRY_FIELDS.has(p.name) && !isCountryCode(text)) {
      errors.push(`${name} must be an ISO 2-letter country code in capitals, e.g. US or HK.`);
    }
    if (CURRENCY_FIELDS.has(p.name) && !isCurrencyCode(text)) {
      errors.push(`${name} must be an ISO 3-letter currency code in capitals, e.g. USD.`);
    }
    if (p.name === 'BeneficiaryMobileNo' && !/^\+\d{7,14}$/.test(text)) {
      errors.push(`${name} must start with + and the country code, then digits only, e.g. +91XXXXXXXXXX.`);
    }
    if (p.name === 'OtherCodeType' && text !== 'IBAN') {
      errors.push(`${name} must be "IBAN".`);
    }
  }
  return errors;
}

// Fields the method doesn't define — usually a typo, e.g. "RelationShip" for "Relationship".
// Reported as warnings: the spec doesn't say whether the gateway rejects them.
export function unknownFields(body: unknown, params: Parameter[]): string[] {
  const top = params.filter((p) => !p.name.includes('[].')).map((p) => p.name);
  const nested = params.filter((p) => p.name.startsWith('FileUpload[].')).map((p) => p.name.slice('FileUpload[].'.length));
  if (nested.length) top.push('FileUpload');
  const check = (o: unknown, known: string[], prefix: string) =>
    o && typeof o === 'object' && !Array.isArray(o)
      ? Object.keys(o).filter((k) => !known.includes(k)).map((k) => {
          const close = known.find((x) => x.toLowerCase() === k.toLowerCase());
          return `${prefix}${k} isn't a field of this method${close ? ` — did you mean ${close}?` : ''}`;
        })
      : [];
  if (Array.isArray(body)) return body.flatMap((item, i) => check(item, top, `[${i}] `));
  const out = check(body, top, '');
  const files = (body as Record<string, unknown> | null)?.FileUpload;
  if (nested.length && Array.isArray(files)) files.forEach((f, i) => out.push(...check(f, nested, `FileUpload[${i}].`)));
  return out;
}

// Conditional (C) rules for 1.2 Create Transaction, as written in the field remarks.
// Returns each conditional field that becomes required, and why. Shared by the docs picker and the sandbox.
export function conditionalRequirements(b: Record<string, unknown>): { field: string; why: string }[] {
  const out: { field: string; why: string }[] = [];
  const need = (field: string, why: string) => out.push({ field, why });
  const pt = String(b.PaymentType ?? '');
  const tt = String(b.TransactionType ?? '');

  if (pt === 'B2B') need('PaymentDetails', 'when PaymentType is B2B');
  if (pt === 'B2B' || pt === 'C2B') need('BeneficiaryCompanyName', `when PaymentType is ${pt}`);
  if (pt === 'C2C' || pt === 'B2C') {
    need('BeneficiaryFirstName', `when PaymentType is ${pt}`);
    need('BeneficiaryLastName', `when PaymentType is ${pt}`);
  }
  if (pt === 'C2C') need('Relationship', 'when PaymentType is C2C');
  if (tt === 'AT') {
    for (const f of ['BeneficiaryBankAccountNo', 'BeneficiaryBankCodeType', 'BeneficiaryBankCode', 'BranchCode', 'BankChargesType']) {
      need(f, 'when TransactionType is AT');
    }
    const codeType = String(b.BeneficiaryBankCodeType ?? '');
    if (['BankCode', 'IFSC', 'BSB'].includes(codeType)) {
      need('BankName', `when BeneficiaryBankCodeType is ${codeType}`);
      need('BankCountry', `when BeneficiaryBankCodeType is ${codeType}`);
    }
  }
  if (tt === 'WT' || tt === 'CA') need('BeneficiaryMobileNo', `when TransactionType is ${tt}`);
  if (tt === 'CA') need('Location', 'when TransactionType is CA');
  if (tt === 'CA' || tt === 'DR') need('AgentCode', `when TransactionType is ${tt}`);
  if (!blank(b.OtherCodeType)) need('OtherCode', 'when OtherCodeType is passed');
  return out;
}

const transactionRules = (b: Record<string, unknown>) => {
  const errors = conditionalRequirements(b)
    .filter(({ field }) => blank(b[field]))
    .map(({ field, why }) => `${field} is required ${why}.`);
  const pt = String(b.PaymentType ?? '');
  const codeType = String(b.BeneficiaryBankCodeType ?? '');
  // BSB: required when the bank is in Australia and PaymentType is C2C or B2C; format as in the spec (e.g. 612-123).
  if (b.TransactionType === 'AT' && b.BankCountry === 'AU' && (pt === 'C2C' || pt === 'B2C') && codeType !== 'BSB') {
    errors.push(`BeneficiaryBankCodeType must be BSB when BankCountry is AU and PaymentType is ${pt}.`);
  }
  if (codeType === 'BSB' && !blank(b.BeneficiaryBankCode) && !/^\d{3}-\d{3}$/.test(String(b.BeneficiaryBankCode))) {
    errors.push('BeneficiaryBankCode must be a BSB in the format 123-456 when BeneficiaryBankCodeType is BSB.');
  }
  return errors;
};

export function validateBody(endpointId: string, body: unknown, params: Parameter[]): string[] {
  // 1.9 takes an array of files
  if (Array.isArray(body)) {
    if (body.length === 0) return ['Send at least one file.'];
    return body.flatMap((item, i) => checkFields(item ?? {}, params, `[${i}] `));
  }
  if (typeof body !== 'object' || body === null) return ['The request body must be a JSON object.'];
  const b = body as Record<string, unknown>;

  // 1.13 nests files under FileUpload[]; its table lists them as FileUpload[].Field
  const top = params.filter((p) => !p.name.includes('[].'));
  const nested = params.filter((p) => p.name.startsWith('FileUpload[].')).map((p) => ({ ...p, name: p.name.slice('FileUpload[].'.length) }));
  const errors = checkFields(b, top);
  if (nested.length) {
    const files = b.FileUpload;
    if (!Array.isArray(files) || files.length === 0) errors.push('FileUpload must contain at least one file.');
    else files.forEach((f, i) => errors.push(...checkFields(f ?? {}, nested, `FileUpload[${i}].`)));
  }
  if (endpointId === 'create-transaction') errors.push(...transactionRules(b));
  return errors;
}

// Self-check lives in validate.check.ts (kept out of the app bundle).
