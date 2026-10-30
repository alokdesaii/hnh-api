// Self-check for the sandbox validator. Not imported by the app.
// Run: node --experimental-strip-types src/utils/validate.check.ts
import type { Parameter } from '../data/apiSpec.ts';
import { API_ENDPOINTS } from '../data/apiSpec.ts';
import { validateBody, unknownFields, isCountryCode, isCurrencyCode, isUsDate, detectFileType } from './validate.ts';
import { DOCUMENT_TYPES, FILE_LIMITS } from '../data/proposedRules.ts';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAILED: ${msg}`);
};
const has = (errs: string[], text: string) => errs.some((e) => e.includes(text));
const P = (name: string, required: 'Y' | 'C' | 'O', extra: Partial<Parameter> = {}): Parameter => ({ name, type: 'String', required, description: '', ...extra });

// Basic rules
const params = [
  P('PaymentType', 'Y', { enumOptions: ['B2B', 'C2C'] }),
  P('TransactionType', 'Y'),
  P('PayInAmount', 'Y', { type: 'Decimal', description: 'Up to 2 decimal places.' }),
  P('Rate', 'O', { type: 'Decimal' }),
  P('ClientReferenceNo', 'Y', { length: 5 }),
  P('BeneficiaryMobileNo', 'C'),
];
const ok = { PaymentType: 'C2C', TransactionType: 'WT', PayInAmount: 10.5, ClientReferenceNo: 'A1', BeneficiaryFirstName: 'a', BeneficiaryLastName: 'b', Relationship: 'Spouse', BeneficiaryMobileNo: '+919876543210' };
const v = (o: object) => validateBody('create-transaction', o, params);
assert(v(ok).length === 0, 'valid body passes');
assert(has(v({ ...ok, Relationship: '' }), 'Relationship is required'), 'C2C needs Relationship');
assert(v({ ...ok, TransactionType: 'AT' }).filter((e) => e.includes('AT')).length === 5, 'AT needs 5 bank fields');
assert(has(v({ ...ok, TransactionType: 'AT', BeneficiaryBankCodeType: 'IFSC' }), 'BankName'), 'IFSC needs BankName');
assert(has(v({ ...ok, PaymentType: 'X' }), 'one of'), 'enum enforced');
assert(has(v({ ...ok, ClientReferenceNo: '123456' }), 'longer'), 'length enforced');

// Bug fix: 2-decimal limit only where the spec says so
assert(has(v({ ...ok, PayInAmount: '1.234' }), '2 decimal'), 'PayInAmount limited to 2 decimals');
assert(v({ ...ok, Rate: 1.2345 }).length === 0, 'Rate may have more decimals');
assert(has(v({ ...ok, Rate: 'abc' }), 'must be a number'), 'Rate must be numeric');

// Types
assert(has(v({ ...ok, ClientReferenceNo: 123 }), 'must be text'), 'number in a text field rejected');
assert(has(v({ ...ok, PayInAmount: 'ten' }), 'must be a number'), 'text in an amount rejected');

// Mobile
assert(has(v({ ...ok, BeneficiaryMobileNo: '9876543210' }), 'must start with +'), 'mobile needs +country code');
assert(has(v({ ...ok, BeneficiaryMobileNo: '+91 98765' }), 'must start with +'), 'mobile digits only');

// ISO codes and dates
assert(isCountryCode('US') && isCountryCode('HK') && isCountryCode('AU'), 'real country codes pass');
assert(!isCountryCode('ZZ') && !isCountryCode('QQ') && !isCountryCode('us') && !isCountryCode('USA') && !isCountryCode('HKs'), 'bad country codes fail');
assert(isCurrencyCode('USD') && isCurrencyCode('PHP') && isCurrencyCode('AED'), 'real currencies pass');
assert(!isCurrencyCode('ABC') && !isCurrencyCode('usd'), 'bad currencies fail');
assert(isUsDate('07/07/2010') && isUsDate('02/29/2024'), 'valid MM/DD/YYYY passes');
assert(!isUsDate('2010-07-07') && !isUsDate('13/01/2020') && !isUsDate('02/30/2024') && !isUsDate('7/7/2010'), 'bad dates fail');

// Real spec params
const tx = API_ENDPOINTS.find((e) => e.id === 'create-transaction')!;
const sample = tx.sampleRequest as Record<string, unknown>;
const t = (o: object) => validateBody('create-transaction', { ...sample, ...o }, tx.parameters!);
assert(has(t({ BeneficiaryCountry: 'ZZ' }), 'ISO 2-letter'), 'country checked on real field');
assert(has(t({ PayInCurrency: 'ABC' }), 'ISO 3-letter'), 'currency checked on real field');
assert(has(t({ BeneficiaryDOB: '1990-01-31' }), 'MM/DD/YYYY'), 'body date format checked');
assert(has(t({ OtherCodeType: 'ACCT', OtherCode: 'x' }), '"IBAN"'), 'OtherCodeType must be IBAN');
assert(t({ OtherCodeType: 'IBAN', OtherCode: 'GB33BUKB20201555555555' }).length === 0, 'IBAN accepted');
assert(has(t({ PaymentType: 'B2C', BeneficiaryFirstName: 'a', BeneficiaryLastName: 'b', BankCountry: 'AU', BankName: 'x' }), 'must be BSB'), 'AU + B2C requires BSB');
assert(has(t({ BeneficiaryBankCodeType: 'BSB', BeneficiaryBankCode: '612123', BankName: 'x', BankCountry: 'AU' }), '123-456'), 'BSB format');
assert(t({ BeneficiaryBankCodeType: 'BSB', BeneficiaryBankCode: '612-123', BankName: 'x', BankCountry: 'AU' }).length === 0, 'valid BSB passes');

// Unknown fields
assert(unknownFields({ ...sample, RelationShip: '' }, tx.parameters!)[0]?.includes('did you mean Relationship'), 'typo suggests the right field');
assert(unknownFields(sample, tx.parameters!).length === 0, 'sample has no unknown fields');
const rf = API_ENDPOINTS.find((e) => e.id === 'remitter-file-upload')!;
assert(unknownFields({ SubClientAccountNumber: 'x', FileUpload: [{ FileName: 'a', Extra: 1 }] }, rf.parameters!)[0]?.startsWith('FileUpload[0].Extra'), 'nested unknown field found');
assert(unknownFields([{ TransactionNumber: '1', FileName: 'a', FileBase64String: 'x', Foo: 1 }], API_ENDPOINTS.find((e) => e.id === 'upload-file')!.parameters!).length === 1, 'array unknown field found');

// Proposed: allowed characters
assert(has(t({ PaymentType: 'C2C', TransactionType: 'WT', BeneficiaryMobileNo: '+919876543210', Relationship: 'Spouse', BeneficiaryFirstName: 'J0hn', BeneficiaryLastName: 'Smith' }), 'BeneficiaryFirstName may only contain'), 'digits rejected in person name');
assert(t({ PaymentType: 'C2C', TransactionType: 'WT', BeneficiaryMobileNo: '+919876543210', Relationship: 'Spouse', BeneficiaryFirstName: "Mary-Ann O'Neil", BeneficiaryLastName: 'St. John' }).length === 0, "names with - ' . accepted");
assert(has(t({ BeneficiaryCompanyName: 'Smith & Co' }), 'BeneficiaryCompanyName may only contain'), '& rejected (SWIFT set)');
assert(t({ BeneficiaryCompanyName: 'Smith and Co. (HK) Ltd' }).length === 0, 'SWIFT-safe company name accepted');
assert(has(t({ ClientReferenceNo: 'HK 0028/54' }), 'ClientReferenceNo may only contain'), 'reference allows only letters, digits, -');
assert(has(t({ RemitterAccountNumber: '102344001010300010127' }), 'RemitterAccountNumber may only contain'), 'account number format');
assert(has(t({ IntermediaryBankSwiftCode: 'GECG12HH' }), 'IntermediaryBankSwiftCode'), 'SWIFT format');
assert(has(t({ PurposeOfPayment: 'Payment <script>' }), 'PurposeOfPayment may only contain'), 'markup characters rejected');
const rem = API_ENDPOINTS.find((e) => e.id === 'create-remitter')!.requestSubtypes![1];
const remBody = rem.sampleRequest as Record<string, unknown>;
assert(has(validateBody('create-remitter', { ...remBody, Email: 'not-an-email' }, rem.parameters), 'Email may only contain'), 'email format');
assert(has(validateBody('create-remitter', { ...remBody, Phone: '98765 43210' }, rem.parameters), 'Phone may only contain'), 'phone format');

// Proposed: files
const pdfB64 = btoa('%PDF-1.4\n% test\n');
const pngB64 = 'iVBORw0KGgoAAAANSUhEUg==';
assert(detectFileType(pdfB64) === 'pdf' && detectFileType(pngB64) === 'png' && detectFileType('/9j/4AAQ') === 'jpg' && detectFileType(btoa('hello')) === 'txt', 'file types detected from content');
const up = API_ENDPOINTS.find((e) => e.id === 'upload-file')!;
const upItem = { TransactionNumber: '453455453', FileName: 'invoice' };
assert(validateBody('upload-file', [{ ...upItem, FileBase64String: pdfB64 }], up.parameters!).length === 0, 'pdf accepted in 1.9');
assert(has(validateBody('upload-file', [{ ...upItem, FileBase64String: 'not base64!' }], up.parameters!), 'valid Base64'), 'bad Base64 rejected');
const big = 'A'.repeat(Math.ceil(((FILE_LIMITS.maxFileMB * 1024 * 1024 + 10) * 4) / 3 / 4) * 4);
assert(has(validateBody('upload-file', [{ ...upItem, FileBase64String: big }], up.parameters!), 'per file'), 'oversized file rejected');
const fourMB = 'A'.repeat(Math.ceil((4 * 1024 * 1024 * 4) / 3 / 4) * 4);
assert(has(validateBody('upload-file', [1, 2, 3].map(() => ({ ...upItem, FileBase64String: fourMB })), up.parameters!), 'per request'), 'request total limited');
const rf2 = API_ENDPOINTS.find((e) => e.id === 'remitter-file-upload')!;
const rfBody = (o: object) => ({ SubClientAccountNumber: '102-344-001-01-03-0001-01279', FileUpload: [{ FileName: 'doc', FileType: 'supporting documents', FileExtention: '.pdf', FileBase64String: pdfB64, ...o }] });
assert(validateBody('remitter-file-upload', rfBody({}), rf2.parameters!).length === 0, 'valid remitter upload passes');
assert(has(validateBody('remitter-file-upload', rfBody({ FileBase64String: pngB64 }), rf2.parameters!), 'must be a pdf'), 'png rejected in 1.13');
assert(has(validateBody('remitter-file-upload', rfBody({ FileType: 'holiday photos' }), rf2.parameters!), 'document type from 1.14'), 'unknown document type rejected');
assert(has(validateBody('remitter-file-upload', rfBody({ FileExtention: '.docx' }), rf2.parameters!), 'FileExtention'), 'extension checked');

// Proposed: document types fit the spec's FileType length (27)
assert(DOCUMENT_TYPES.every((d) => d.name.length <= 27), 'document type names fit FileType length');

// Every sample request in the portal must pass its own checks (catches rules that are too strict)
for (const ep of API_ENDPOINTS) {
  if (ep.method !== 'POST' || ep.id === 'auth' || ep.id === 'webhook-response') continue;
  const bodies = ep.requestSubtypes ? ep.requestSubtypes.map((s) => [s.name, s.sampleRequest, s.parameters] as const) : [[ep.id, ep.sampleRequest, ep.parameters ?? []] as const];
  for (const [name, body, ps] of bodies) {
    const errs = validateBody(ep.id, body, ps);
    assert(errs.length === 0, `sample for ${ep.sectionNumber} ${name} should pass, got: ${errs.join(' | ')}`);
    const warn = unknownFields(body, ps);
    assert(warn.length === 0, `sample for ${ep.sectionNumber} ${name} has unknown fields: ${warn.join(' | ')}`);
  }
}

console.log('validate.check.ts: all checks passed');
