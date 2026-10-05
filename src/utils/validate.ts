import type { Parameter } from '../data/apiSpec';

// Sandbox validation, following the Y/C/O rules and lengths in HnH_API_V2.3.3.pdf.
// Returns a list of problems; empty means the request would pass validation.

const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';
const enumValue = (opt: string) => opt.split(' (')[0];

function checkFields(body: Record<string, unknown>, params: Parameter[], prefix = ''): string[] {
  const errors: string[] = [];
  for (const p of params) {
    const v = body[p.name];
    if (p.required === 'Y' && blank(v)) errors.push(`${prefix}${p.name} is mandatory.`);
    if (blank(v)) continue;
    if (p.length && typeof p.length === 'number' && String(v).length > p.length) {
      errors.push(`${prefix}${p.name} is longer than ${p.length} characters.`);
    }
    if (p.enumOptions && !p.enumOptions.map(enumValue).includes(String(v))) {
      errors.push(`${prefix}${p.name} must be one of: ${p.enumOptions.map(enumValue).join(', ')}.`);
    }
    if (p.type === 'Decimal' && !/^-?\d+(\.\d{1,2})?$/.test(String(v))) {
      errors.push(`${prefix}${p.name} must be a number with up to 2 decimal places.`);
    }
    if (p.type === 'Date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
      errors.push(`${prefix}${p.name} must be a date in YYYY-MM-DD format.`);
    }
  }
  return errors;
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

const transactionRules = (b: Record<string, unknown>) =>
  conditionalRequirements(b)
    .filter(({ field }) => blank(b[field]))
    .map(({ field, why }) => `${field} is required ${why}.`);

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

// Self-check: `node --experimental-strip-types src/utils/validate.ts`
if ((globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('validate.ts')) {
  const P = (name: string, required: 'Y' | 'C' | 'O', extra: Partial<Parameter> = {}): Parameter => ({ name, type: 'String', required, description: '', ...extra });
  const params = [P('PaymentType', 'Y', { enumOptions: ['B2B', 'C2C'] }), P('TransactionType', 'Y'), P('PayInAmount', 'Y', { type: 'Decimal' }), P('ClientReferenceNo', 'Y', { length: 5 })];
  const ok = { PaymentType: 'C2C', TransactionType: 'WT', PayInAmount: 10.5, ClientReferenceNo: 'A1', BeneficiaryFirstName: 'a', BeneficiaryLastName: 'b', Relationship: 'Spouse', BeneficiaryMobileNo: '+1' };
  const assert = (cond: boolean, msg: string) => { if (!cond) throw new Error(msg); };
  assert(validateBody('create-transaction', ok, params).length === 0, 'valid body should pass');
  assert(validateBody('create-transaction', { ...ok, Relationship: '' }, params).some((e) => e.startsWith('Relationship')), 'C2C needs Relationship');
  assert(validateBody('create-transaction', { ...ok, TransactionType: 'AT' }, params).filter((e) => e.includes('AT')).length === 5, 'AT needs 5 bank fields');
  assert(validateBody('create-transaction', { ...ok, TransactionType: 'AT', BeneficiaryBankCodeType: 'IFSC' }, params).some((e) => e.startsWith('BankName')), 'IFSC needs BankName');
  assert(validateBody('create-transaction', { ...ok, PaymentType: 'X' }, params).some((e) => e.includes('one of')), 'enum enforced');
  assert(validateBody('create-transaction', { ...ok, PayInAmount: '1.234' }, params).some((e) => e.includes('decimal')), 'decimals enforced');
  assert(validateBody('create-transaction', { ...ok, ClientReferenceNo: '123456' }, params).some((e) => e.includes('longer')), 'length enforced');
  assert(validateBody('upload-file', [], [P('FileName', 'Y')]).length === 1, 'empty array rejected');
  assert(validateBody('remitter-file-upload', { SubClientAccountNumber: 'x', FileUpload: [{}] }, [P('SubClientAccountNumber', 'Y'), P('FileUpload[].FileName', 'Y')])[0] === 'FileUpload[0].FileName is mandatory.', 'nested files checked');
  console.log('validate.ts: all checks passed');
}
