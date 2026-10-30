// Proposed rules — NOT part of the signed V2.3.3 specification.
// Recommended by the backend team, defaults suggested by the portal; pending approval.
// Everything here is shown to clients with a "Proposed" label. Edit values here only:
// the docs, the sandbox checks and the console all read from this file.

import type { Parameter } from './apiSpec.ts';

export const PROPOSED_LABEL = 'Proposed — pending approval';

// ── 1. Allowed characters ──────────────────────────────────────────────────────
// Free text follows the SWIFT "x" character set, which every cross-border payment rail accepts.
export interface CharRule {
  id: string;
  label: string;
  allowed: string;
  pattern: RegExp;
}

export const CHAR_RULES = {
  personName: { id: 'personName', label: 'Person name', allowed: "letters A–Z, spaces, and . - '", pattern: /^[A-Za-z .'-]+$/ },
  text: {
    id: 'text',
    label: 'Text',
    allowed: "letters, digits, spaces, and / - ? : ( ) . , ' + (SWIFT character set; write “and” instead of “&”)",
    pattern: /^[A-Za-z0-9 /\-?:().,'+]+$/,
  },
  reference: { id: 'reference', label: 'Reference', allowed: 'letters, digits and - only', pattern: /^[A-Za-z0-9-]+$/ },
  code: { id: 'code', label: 'Code', allowed: 'letters, digits, / and - only', pattern: /^[A-Za-z0-9/-]+$/ },
  account: {
    id: 'account',
    label: 'Account number',
    allowed: 'the format 102-344-001-01-00-0001-00000 (digits in groups of 3-3-3-2-2-4-5)',
    pattern: /^\d{3}-\d{3}-\d{3}-\d{2}-\d{2}-\d{4}-\d{5}$/,
  },
  swift: { id: 'swift', label: 'SWIFT/BIC', allowed: '8 or 11 characters: 6 letters, then letters/digits (e.g. GECGHKHH)', pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/ },
  email: { id: 'email', label: 'Email', allowed: 'a valid email address', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ },
  phone: { id: 'phone', label: 'Phone', allowed: '+ and the country code, then digits only', pattern: /^\+\d{7,14}$/ },
} satisfies Record<string, CharRule>;

const FIELD_RULES: Record<string, CharRule> = {
  // People
  BeneficiaryFirstName: CHAR_RULES.personName,
  BeneficiaryMiddleName: CHAR_RULES.personName,
  BeneficiaryLastName: CHAR_RULES.personName,
  FirstName: CHAR_RULES.personName,
  MiddleName: CHAR_RULES.personName,
  LastName: CHAR_RULES.personName,
  // Free text
  BeneficiaryCompanyName: CHAR_RULES.text,
  CompanyName: CHAR_RULES.text,
  BeneficiaryAddress: CHAR_RULES.text,
  Address: CHAR_RULES.text,
  BeneficiaryCity: CHAR_RULES.text,
  City: CHAR_RULES.text,
  State: CHAR_RULES.text,
  BeneficiaryZip: CHAR_RULES.text,
  Zip: CHAR_RULES.text,
  PurposeOfPayment: CHAR_RULES.text,
  ProductType: CHAR_RULES.text,
  SourceOfFund: CHAR_RULES.text,
  BankName: CHAR_RULES.text,
  BranchName: CHAR_RULES.text,
  Location: CHAR_RULES.text,
  LegalForm: CHAR_RULES.text,
  BeneficiaryIDType: CHAR_RULES.text,
  IDType: CHAR_RULES.text,
  UAEPurposeCode: CHAR_RULES.text,
  EmailSignature: CHAR_RULES.text,
  // References and identifiers
  ClientReferenceNo: CHAR_RULES.reference,
  AdditionalClientRefNum: CHAR_RULES.reference,
  RegistrationNumber: CHAR_RULES.reference,
  BeneficiaryIDNo: CHAR_RULES.reference,
  IDNo: CHAR_RULES.reference,
  TransactionNumber: CHAR_RULES.reference,
  // Codes
  BeneficiaryBankAccountNo: CHAR_RULES.reference,
  BeneficiaryBankCode: CHAR_RULES.code,
  BranchCode: CHAR_RULES.code,
  AgentCode: CHAR_RULES.code,
  OtherCode: CHAR_RULES.reference,
  IntermediaryBankSwiftCode: CHAR_RULES.swift,
  // Accounts
  ClientAccountNo: CHAR_RULES.account,
  ClientAccountNumber: CHAR_RULES.account,
  RemitterAccountNumber: CHAR_RULES.account,
  SubClientAccountNumber: CHAR_RULES.account,
  // Contact
  Email: CHAR_RULES.email,
  Phone: CHAR_RULES.phone,
};

export const charRuleFor = (fieldName: string): CharRule | undefined => FIELD_RULES[fieldName.replace(/^FileUpload\[\]\./, '')];

// ── 2. File uploads ────────────────────────────────────────────────────────────
export const FILE_LIMITS = {
  maxFileMB: 5, // per file, original size (Base64 is about a third larger)
  maxRequestMB: 10, // all files in one request, original size
  types: {
    'upload-file': ['pdf', 'jpg', 'png', 'txt'], // 1.9, per the spec
    'remitter-file-upload': ['pdf'], // 1.13, per the spec
  } as Record<string, string[]>,
};

export const FILE_RULE_TEXT = `Up to ${FILE_LIMITS.maxFileMB} MB per file and ${FILE_LIMITS.maxRequestMB} MB per request (original file size; the Base64 text is about a third larger).`;

// ── 3. Outgoing webhook: amounts and charges ───────────────────────────────────
export const WEBHOOK_OUTGOING_PROPOSED: Parameter[] = [
  { name: 'PayOutAmount', type: 'Decimal', required: 'O', description: '', guidance: 'Amount paid out to the beneficiary, up to 2 decimal places.', proposed: true },
  { name: 'PayOutCurrency', type: 'String', length: 3, required: 'O', description: '', guidance: 'ISO 3-letter currency of PayOutAmount.', proposed: true },
  { name: 'Charges', type: 'Decimal', required: 'O', description: '', guidance: 'Total charges applied to this payment, up to 2 decimal places. 0 if none.', proposed: true },
  { name: 'ChargesCurrency', type: 'String', length: 3, required: 'O', description: '', guidance: 'ISO 3-letter currency of Charges.', proposed: true },
  { name: 'BankChargesType', type: 'String', length: 6, required: 'O', description: '', guidance: 'Who bears bank charges, as sent in 1.2: BEN, SHA or OUR.', proposed: true },
];

// ── 4. Remitter document types (1.14) ──────────────────────────────────────────
// Names are at most 27 characters: FileType in 1.13 is limited to 27 by the spec.
export type ClientType = 'sub-client-corporate' | 'sub-client-individual';

export const DOCUMENT_TYPES: { name: string; clientType: ClientType; countries: string }[] = [
  // Corporate
  { name: 'incorporation certificate', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'business registration', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'articles of association', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'memorandum of association', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'register of directors', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'register of shareholders', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'ubo declaration', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'board resolution', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'director id document', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'signatory id document', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'proof of business address', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'bank statement', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'service agreement', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'supporting documents', clientType: 'sub-client-corporate', countries: 'All' },
  { name: 'account closure mail', clientType: 'sub-client-corporate', countries: 'All' },
  // Individual
  { name: 'passport', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'national id', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'driving licence', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'proof of address', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'bank statement', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'source of funds declaration', clientType: 'sub-client-individual', countries: 'All' },
  { name: 'supporting documents', clientType: 'sub-client-individual', countries: 'All' },
];

export const isDocumentType = (name: string) => DOCUMENT_TYPES.some((d) => d.name === name.trim().toLowerCase());

// ── Summary shown on each affected method page ─────────────────────────────────
export const PROPOSED_NOTES: Record<string, string[]> = {
  'create-transaction': [
    'Text fields accept only the characters listed on each field: person names allow letters, spaces and . - \'; other text uses the SWIFT character set.',
    'Account numbers must use the format 102-344-001-01-00-0001-00000. IntermediaryBankSwiftCode must be a valid SWIFT/BIC.',
  ],
  'create-remitter': [
    'Text fields accept only the characters listed on each field: names allow letters, spaces and . - \'; addresses and other text use the SWIFT character set.',
    'Email must be a valid address and Phone must start with + and the country code.',
  ],
  'upload-file': [FILE_RULE_TEXT, 'Accepted types: pdf, jpg, png, txt. The file contents are checked, not just the name.'],
  'download-file': [`Files are returned in full; each is at most ${FILE_LIMITS.maxFileMB} MB, as limited at upload.`],
  'remitter-file-upload': [FILE_RULE_TEXT, 'Accepted type: pdf. FileType must be a document type from 1.14.'],
  'remitter-doc-types': [`The full list of document types is below (${DOCUMENT_TYPES.length} types). Remitter FileUpload accepts only these as FileType.`],
  'webhook-response': ['Outgoing updates also carry the payout amount and any charges applied: PayOutAmount, PayOutCurrency, Charges, ChargesCurrency and BankChargesType.'],
};
