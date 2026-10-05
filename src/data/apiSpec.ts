export interface Parameter {
  name: string;
  type: string;
  length?: number | string;
  required: 'Y' | 'O' | 'C';
  description: string;
  example?: string;
  enumOptions?: string[];
  /** Portal guidance, not part of the signed specification. */
  guidance?: string;
}

export interface HeaderParam {
  key: string;
  value: string;
  description?: string;
}

export interface EndpointSpec {
  id: string;
  sectionNumber: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'auth' | 'remitter' | 'transaction' | 'statement' | 'files' | 'webhook' | 'reference';
  description: string;
  headers: HeaderParam[];
  authorization?: string;
  requestSubtypes?: {
    name: string;
    description: string;
    parameters: Parameter[];
    sampleRequest: any;
  }[];
  parameters?: Parameter[];
  responseParameters?: Parameter[];
  sampleRequest?: any;
  sampleResponse: any;
  conditionalNotes?: string[];
}

export interface VersionHistoryItem {
  version: string;
  issuedDate: string;
  author: string;
  details: string[];
}

export const VERSION_HISTORY: VersionHistoryItem[] = [
  {
    version: 'V2.0',
    issuedDate: 'Mar 24, 2022',
    author: 'Product Team',
    details: ['Production version']
  },
  {
    version: 'V2.1',
    issuedDate: 'July 15, 2024',
    author: 'Product Team',
    details: [
      'Reviewed production version and updated fields and validation.',
      'Added methods: 1.9 File Upload, 1.10 File Download.'
    ]
  },
  {
    version: 'V2.2',
    issuedDate: 'Nov 5, 2024',
    author: 'Product Team',
    details: [
      'Reviewed production version and updated fields.',
      'Added methods: Webhook Response, RemitterFileUpload, RemitterDocumentTypesList (listed as 1.15–1.17 in the document; now sections 1.12–1.14).'
    ]
  },
  {
    version: 'V2.3',
    issuedDate: 'April 7, 2025',
    author: 'Product Team',
    details: [
      'Reviewed production version and updated fields.',
      'Updated field: ClientAccountNumber (prefix 1 added), e.g. 102-344-001-01-00-0001-00000.'
    ]
  },
  {
    version: 'V2.3.1',
    issuedDate: 'Nov 21, 2025',
    author: 'Product Team',
    details: [
      'Reviewed production version, added fields and updated validation.',
      '1.2: BeneficiaryZip mandatory.',
      '1.4: Zip mandatory.',
      '1.4: City mandatory.'
    ]
  },
  {
    version: 'V2.3.2',
    issuedDate: 'Jun 05, 2026',
    author: 'Product Team',
    details: [
      'Reviewed production version, updated field lengths in 1.4 and updated validation: IncorporationCountry, CountryOfOperation, Country, Nationality, BirthCountry.'
    ]
  },
  {
    version: 'V2.3.3',
    issuedDate: 'Aug 22, 2026',
    author: 'Product Team',
    details: [
      'Reviewed production version, added fields and updated validation.',
      '1.2: BeneficiaryCity mandatory.'
    ]
  }
];

export const STATUS_CODES = [
  { code: 'HH5000', name: 'Success', description: 'Get Success response for all method' },
  { code: 'HH5001', name: 'ValidationFailed', description: 'Validate data' },
  { code: 'HH5002', name: 'ExceptionOccured', description: 'Unpredictable exception found' },
  { code: 'HH5003', name: 'Unauthorized', description: 'Invalid user' },
  { code: 'HH5004', name: 'IPAddressNotAllowed', description: 'Requested server ip not registered' },
  { code: 'HH5010', name: 'NotExists', description: 'Given data not found' }
];

export const PAYMENT_STATUS_CODES = [
  { code: 'HH5005', name: 'PaymentNotFound', description: 'Record not found' },
  { code: 'HH5006', name: 'PaymentProcessed', description: 'Payment processed' },
  { code: 'HH5007', name: 'PaymentCancelled', description: 'Payment has been cancelled' },
  { code: 'HH5008', name: 'PaymentSuccess', description: 'Payment has been created and in process' },
  { code: 'HH5009', name: 'ComplianceOnHold', description: 'Payment is on hold' },
  { code: 'HH5011', name: 'DD Rejected', description: 'Payment is rejected' }
];

export const RELATIONSHIP_TYPES = [
  'Spouse',
  'Children',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Self',
  'Friend',
  'Business partner',
  'Customer',
  'Employee',
  'Family',
  'Affiliate',
  'Client',
  'Contractor',
  'Vendor'
];

export const API_ENDPOINTS: EndpointSpec[] = [
  {
    id: 'auth',
    sectionNumber: '1.1',
    title: 'Authentication',
    method: 'POST',
    path: '/api/users/authenticate',
    category: 'auth',
    description: 'Used to get a token with valid credentials. Send the token as a Bearer token in the Authorization header of every other method.',
    headers: [
      { key: 'Username', value: 'Your username', description: 'Provided by the Business team' },
      { key: 'Password', value: 'Your password', description: 'Provided by the Business team' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    parameters: [],
    responseParameters: [
      { name: 'Username', type: 'String', required: 'Y', description: 'The Username passed in the header is returned.' },
      { name: 'Token', type: 'String (JWT)', required: 'Y', description: 'Unique token generated for your user.' },
      { name: 'StatusCode', type: 'String', required: 'Y', description: 'See 1.15 and 1.16.' },
      { name: 'StatusMessage', type: 'String', required: 'Y', description: 'See 1.15 and 1.16.' }
    ],
    sampleRequest: {},
    sampleResponse: {
      Username: "0000aa-730c-0000",
      Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiNTUyMTI5YWEtNzMwYy00OTc4IiwibmJmIjoxNjQxODI4NDg4LCJleHAiOjE2NDE4MjkzODgsImlhdCI6MTY0MTgyODQ4OH0.7AdS8JDA3kPauTKn_-MAPCSBGNIIoPQxDh-F9pAVHNg",
      StatusCode: "HH5000",
      StatusMessage: "User validated successfully"
    }
  },
  {
    id: 'create-transaction',
    sectionNumber: '1.2',
    title: 'Create Transaction',
    method: 'POST',
    path: '/api/transaction/create',
    category: 'transaction',
    description: 'Used to push B2B, B2C, C2B and C2C transactions, by account transfer (AT), cash (CA), wallet (WT) or door-to-door (DR).',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'ClientAccountNo', type: 'String', length: 28, required: 'Y', description: 'Main client account.', example: '102-344-001-01-00-0001-00000' },
      { name: 'RemitterAccountNumber', type: 'String', length: 28, required: 'Y', description: 'From GetRemitterList() (1.5).', example: '102-344-001-01-03-0001-01279' },
      { name: 'ClientReferenceNo', type: 'String', length: 30, required: 'Y', description: 'Unique reference number, provided by you.', example: 'HK0002854498' },
      { name: 'PaymentType', type: 'String', length: 3, required: 'Y', description: 'One of the values below.', enumOptions: ['B2B', 'B2C', 'C2B', 'C2C'], example: 'B2B' },
      { name: 'TransactionType', type: 'String', length: 2, required: 'Y', description: 'AT for account transfer, CA for cash, WT for wallet, DR for door-to-door.', enumOptions: ['AT (Account Transfer)', 'CA (Cash)', 'WT (Wallet)', 'DR (Door-to-door)'], example: 'AT' },
      { name: 'PayInAmount', type: 'Decimal', required: 'Y', description: 'Up to 2 decimal places.', example: '100.00' },
      { name: 'PayOutAmount', type: 'Decimal', required: 'O', description: 'Up to 2 decimal places.', example: '100.00' },
      { name: 'PayInCurrency', type: 'String', length: 3, required: 'Y', description: 'Valid ISO 3-letter currency code.', example: 'USD' },
      { name: 'PayOutCurrency', type: 'String', length: 3, required: 'Y', description: 'Valid ISO 3-letter currency code.', example: 'USD' },
      { name: 'Rate', type: 'Decimal', required: 'O', description: '', guidance: "Exchange rate for the payment, if you've agreed one. Leave it out otherwise." },
      { name: 'PaymentDetails', type: 'String', length: 100, required: 'C', description: 'Required in B2B. One of: IMPORT OF, PURCHASE OF, PAYMENT FOR.', example: 'PAYMENT FOR' },
      { name: 'ProductType', type: 'String', length: 100, required: 'O', description: '', guidance: 'What the payment is for in trade terms, e.g. AUTO PARTS.', example: 'AUTO PARTS' },
      { name: 'PurposeOfPayment', type: 'String', length: 100, required: 'Y', description: '', guidance: 'A short, plain description of why the payment is being made, e.g. Car auto parts.', example: 'Car auto parts' },
      { name: 'BeneficiaryFirstName', type: 'String', length: 100, required: 'C', description: 'Required if PaymentType is C2C or B2C.' },
      { name: 'BeneficiaryMiddleName', type: 'String', length: 100, required: 'O', description: '', guidance: 'Leave empty if the beneficiary has no middle name.' },
      { name: 'BeneficiaryLastName', type: 'String', length: 100, required: 'C', description: 'Required if PaymentType is C2C or B2C.' },
      { name: 'BeneficiaryCompanyName', type: 'String', length: 500, required: 'C', description: 'Required if PaymentType is B2B or C2B.', example: 'Harbour and Hills Pvt Ltd' },
      { name: 'BeneficiaryDOB', type: 'String', length: 10, required: 'O', description: 'MM/DD/YYYY format.' },
      { name: 'BeneficiaryNationality', type: 'String', length: 2, required: 'O', description: 'Valid ISO 2-letter country code.' },
      { name: 'BeneficiaryPlaceOfBirth', type: 'String', length: 2, required: 'O', description: 'Valid ISO 2-letter country code.' },
      { name: 'BeneficiaryIDType', type: 'String', length: 100, required: 'O', description: '', guidance: 'Type of ID document, e.g. Passport or NationalId.' },
      { name: 'BeneficiaryIDNo', type: 'String', length: 20, required: 'O', description: '', guidance: "Number on the beneficiary's ID document." },
      { name: 'BeneficiaryAddress', type: 'String', length: 200, required: 'Y', description: 'Required if PaymentType is C2C or B2C.', example: 'Las Vegas, USA' },
      { name: 'BeneficiaryMobileNo', type: 'String', length: 15, required: 'C', description: 'Required if TransactionType is WT or CA. e.g. +91XXXXXXXXXX' },
      { name: 'BeneficiaryZip', type: 'String', length: 50, required: 'Y', description: 'Mandatory since V2.3.1.', example: '12345' },
      { name: 'BeneficiaryCity', type: 'String', length: 100, required: 'Y', description: 'Mandatory since V2.3.3.', example: 'Las Vegas' },
      { name: 'BeneficiaryCountry', type: 'String', length: 2, required: 'Y', description: 'Valid ISO 2-letter country code.', example: 'US' },
      { name: 'BeneficiaryBankAccountNo', type: 'String', length: 50, required: 'C', description: 'Required if TransactionType is AT. A valid bank account number.', example: 'XXXXXXXXX' },
      { name: 'BeneficiaryBankCodeType', type: 'String', length: 10, required: 'C', description: 'Required if TransactionType is AT. Mandatory for major currencies.', enumOptions: ['IFSC', 'SWIFT', 'BSB', 'BankCode', 'Routing Number', 'ABA'], example: 'SWIFT' },
      { name: 'BeneficiaryBankCode', type: 'String', length: 20, required: 'C', description: 'Required if TransactionType is AT. IFSC: pass the IFSC code. SWIFT: pass the SWIFT code. BSB: required if the bank country is Australia and PaymentType is C2C or B2C (e.g. 612-123). BankCode: pass the bank code (for Indonesia, Sri Lanka and the Philippines, with PaymentType C2C or B2C).', example: 'GECGHKHH' },
      { name: 'BranchCode', type: 'String', length: 3, required: 'C', description: 'Required if TransactionType is AT. e.g. XXX/123 for SWIFT, 012 for BankCode.', example: 'XXX' },
      { name: 'IntermediaryBankSwiftCode', type: 'String', length: 11, required: 'O', description: '', guidance: 'SWIFT code of an intermediary bank, if the payment must route through one.' },
      { name: 'BankChargesType', type: 'String', length: 6, required: 'C', description: 'Required if TransactionType is AT.', enumOptions: ['BEN', 'SHA', 'OUR'], example: 'SHA' },
      { name: 'BankName', type: 'String', length: 100, required: 'C', description: 'Required if TransactionType is AT. Required if BankCode, IFSC or BSB.' },
      { name: 'BankCountry', type: 'String', length: 2, required: 'C', description: 'Required if TransactionType is AT. Required if BankCode, IFSC or BSB. Valid ISO 2-letter country code.' },
      { name: 'BranchName', type: 'String', length: 100, required: 'O', description: '', guidance: "Name of the beneficiary's bank branch." },
      { name: 'Location', type: 'String', length: 500, required: 'C', description: 'Required if TransactionType is CA.' },
      { name: 'AgentCode', type: 'String', length: 20, required: 'C', description: 'Required if TransactionType is CA or DR. Country-wise AreaCode/PickupCode.' },
      { name: 'Relationship', type: 'String', length: 50, required: 'C', description: 'Required if PaymentType is C2C. A value from 1.17.' },
      { name: 'SourceOfFund', type: 'String', length: 100, required: 'Y', description: 'See 1.11 Source of Funds.', example: 'Other - abc' },
      { name: 'OtherCodeType', type: 'String', length: 4, required: 'O', description: '"IBAN" should be passed.' },
      { name: 'OtherCode', type: 'String', length: 100, required: 'C', description: 'Required if OtherCodeType is added.' },
      { name: 'UAEPurposeCode', type: 'String', length: 50, required: 'O', description: '', guidance: 'Purpose code for payments into the UAE. Only needed for UAE payments.' },
      { name: 'Fee', type: 'Decimal', required: 'O', description: '', guidance: 'Fee for this transaction, if one applies to your account.' },
      { name: 'AdditionalClientRefNum', type: 'String', length: 255, required: 'O', description: '', guidance: 'A second reference of your own, e.g. an invoice or order number.' },
      { name: 'EmailSignature', type: 'String', length: 50, required: 'O', description: '', guidance: 'Optional sign-off text for emails about this payment.' }
    ],
    conditionalNotes: [
      'BeneficiaryCompanyName is required if PaymentType is B2B or C2B.',
      'BeneficiaryFirstName and BeneficiaryLastName are required if PaymentType is C2C or B2C.',
      'BeneficiaryAddress, BeneficiaryZip, BeneficiaryCity and BeneficiaryCountry are mandatory.',
      'TransactionType AT requires BeneficiaryBankAccountNo, BeneficiaryBankCodeType, BeneficiaryBankCode, BranchCode and BankChargesType. BankName and BankCountry are also required when the code type is BankCode, IFSC or BSB.',
      'TransactionType WT or CA requires BeneficiaryMobileNo. CA also requires Location and AgentCode.',
      'TransactionType DR requires AgentCode.',
      'PaymentDetails is required for B2B. Relationship is required for C2C.',
      'OtherCode is required if OtherCodeType is passed.',
      'BSB code is mandatory when BeneficiaryCountry is Australia and PaymentType is C2C or B2C.'
    ],
    sampleRequest: {
      PaymentType: "B2B",
      TransactionType: "AT",
      PayInAmount: 100.00,
      PayInCurrency: "USD",
      PayOutCurrency: "USD",
      ClientAccountNo: "102-344-001-01-00-0001-00000",
      RemitterAccountNumber: "102-344-001-01-03-0001-01279",
      PaymentDetails: "PAYMENT FOR",
      ProductType: "AUTO PARTS",
      PurposeOfPayment: "Car auto parts",
      ClientReferenceNo: "HK0002854498",
      BeneficiaryCompanyName: "Harbour and Hills Pvt Ltd",
      BeneficiaryDOB: "",
      BeneficiaryNationality: "",
      BeneficiaryAddress: "Las Vegas, USA",
      BeneficiaryZip: "12345",
      BeneficiaryCity: "Las Vegas",
      BeneficiaryCountry: "US",
      BeneficiaryBankAccountNo: "XXXXXXXXX",
      BeneficiaryBankCodeType: "SWIFT",
      BeneficiaryBankCode: "GECGHKHH",
      BranchCode: "XXX",
      BankChargesType: "SHA",
      Relationship: "",
      BankCountry: "",
      SourceOfFund: "Other - abc",
      BankName: "",
      BeneficiaryIDType: "",
      BeneficiaryIDNo: ""
    },
    responseParameters: [
      { name: 'ClientReferenceNo', type: 'String', required: 'Y', description: 'The reference number passed in the request.' },
      { name: 'TransactionNumber', type: 'String', required: 'Y', description: 'Unique reference number generated by HnH for your transaction.' },
      { name: 'StatusCode', type: 'String', required: 'Y', description: 'See 1.15 and 1.16.' },
      { name: 'StatusMessage', type: 'String', required: 'Y', description: 'See 1.15 and 1.16.' }
    ],
    sampleResponse: {
      ClientReferenceNo: "HK0002854498",
      TransactionNumber: "125484532",
      StatusCode: "HH5000",
      StatusMessage: "SUCCESS"
    }
  },
  {
    id: 'transaction-status',
    sectionNumber: '1.3',
    title: 'Transaction Status',
    method: 'GET',
    path: '/api/transaction/status/{ClientReferenceNo}',
    category: 'transaction',
    description: 'Returns the status of a transaction, looked up by the ClientReferenceNo you sent in 1.2. Status codes are listed in 1.16.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'ClientReferenceNo', type: 'String (Path)', required: 'Y', description: 'The unique client reference number provided during transaction creation.', example: 'HK0002854498' }
    ],
    sampleResponse: {
      ClientReferenceNo: "HK0002854498",
      TransactionNumber: "125484532",
      StatusCode: "HH5008",
      StatusMessage: "Payment Success"
    }
  },
  {
    id: 'create-remitter',
    sectionNumber: '1.4',
    title: 'Create Remitter',
    method: 'POST',
    path: '/api/remitter/create',
    category: 'remitter',
    description: 'Creates a business or individual remitter under your main client account. The RemitterAccountNumber returned is used in 1.2 Create Transaction.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    requestSubtypes: [
      {
        name: 'Business remitter',
        description: 'For a business type remitter.',
        parameters: [
          { name: 'ClientAccountNumber', type: 'String', length: 28, required: 'Y', description: 'Main client account.', example: '102-344-001-01-00-0001-00000' },
          { name: 'CompanyName', type: 'String', length: 200, required: 'Y', description: '', guidance: 'Registered legal name of the business.', example: 'Harbour and Hills Pvt Ltd' },
          { name: 'RegistrationNumber', type: 'String', length: 50, required: 'Y', description: '', guidance: 'Company registration number from the incorporation certificate.', example: 'XXXXXXXXX' },
          { name: 'IncorporationCountry', type: 'String', length: 2, required: 'O', description: 'Registration country.' },
          { name: 'IncorporationDate', type: 'String', length: 11, required: 'O', description: 'MM/DD/YYYY format.' },
          { name: 'CountryOfOperation', type: 'String', length: 2, required: 'O', description: 'Operation country.' },
          { name: 'LegalForm', type: 'String', length: 50, required: 'O', description: 'e.g. Private Limited Company, Partnership, Public Limited, Sole Establishment.' },
          { name: 'Address', type: 'String', length: 150, required: 'Y', description: '', guidance: 'Registered business address.', example: 'Unit 1611, 16th floor Tower 1, Silvercord Building, 30 Canton Road' },
          { name: 'Country', type: 'String', length: 2, required: 'Y', description: '', guidance: 'ISO 2-letter country code, e.g. HK.', example: 'HK' },
          { name: 'State', type: 'String', length: 100, required: 'O', description: '', guidance: 'State or province, where the country uses them.' },
          { name: 'City', type: 'String', length: 100, required: 'Y', description: 'Mandatory since V2.3.1.', example: 'Tsim Sha Tsui' },
          { name: 'Zip', type: 'String', length: 50, required: 'Y', description: 'Mandatory since V2.3.1.', example: '12345' },
          { name: 'Email', type: 'String', length: 100, required: 'O', description: '', guidance: 'Contact email for the business.' },
          { name: 'Phone', type: 'String', length: 15, required: 'O', description: '', guidance: 'Contact phone number, with country code.' }
        ],
        sampleRequest: {
          ClientAccountNumber: "102-344-001-01-00-0001-00000",
          CompanyName: "Harbour and Hills Pvt Ltd",
          RegistrationNumber: "XXXXXXXXX",
          IncorporationCountry: "",
          IncorporationDate: "",
          CountryOfOperation: "",
          LegalForm: "",
          Address: "Unit 1611, 16th floor Tower 1, Silvercord Building, 30 Canton Road",
          Country: "HK",
          State: "",
          City: "Tsim Sha Tsui",
          Zip: "12345",
          Email: "",
          Phone: ""
        }
      },
      {
        name: 'Individual remitter',
        description: 'For an individual remitter.',
        parameters: [
          { name: 'ClientAccountNumber', type: 'String', length: 28, required: 'Y', description: 'Main client account number.', example: '102-344-001-01-00-0001-00000' },
          { name: 'FirstName', type: 'String', length: 200, required: 'Y', description: '', guidance: 'Given name, as on the ID document.', example: 'ABC' },
          { name: 'MiddleName', type: 'String', length: 50, required: 'O', description: '', guidance: 'Leave empty if the remitter has no middle name.' },
          { name: 'LastName', type: 'String', length: 50, required: 'Y', description: '', guidance: 'Family name, as on the ID document.', example: 'XYZ' },
          { name: 'DOB', type: 'String', length: 10, required: 'O', description: 'MM/DD/YYYY format.' },
          { name: 'IDType', type: 'String', length: 50, required: 'Y', description: 'e.g. Passport, NationalId.', example: 'Passport' },
          { name: 'IDNo', type: 'String', length: 50, required: 'Y', description: 'e.g. N123456.', example: 'N123456' },
          { name: 'IDIssueDate', type: 'String', length: 10, required: 'O', description: 'MM/DD/YYYY format.', example: '07/07/2010' },
          { name: 'IDExpiryDate', type: 'String', length: 10, required: 'O', description: 'MM/DD/YYYY format.' },
          { name: 'Nationality', type: 'String', length: 2, required: 'O', description: '', guidance: 'ISO 2-letter country code of nationality.' },
          { name: 'BirthCountry', type: 'String', length: 2, required: 'O', description: '', guidance: 'ISO 2-letter country code of birth.' },
          { name: 'Address', type: 'String', length: 150, required: 'Y', description: '', guidance: 'Residential address.', example: 'Unit 1611, 16th floor Tower 1, Silvercord Building, 30 Canton Road' },
          { name: 'Country', type: 'String', length: 2, required: 'Y', description: '', guidance: 'ISO 2-letter country code, e.g. HK.', example: 'HK' },
          { name: 'State', type: 'String', length: 100, required: 'O', description: '', guidance: 'State or province, where the country uses them.' },
          { name: 'City', type: 'String', length: 100, required: 'Y', description: 'Mandatory since V2.3.1.', example: 'Tsim Sha Tsui' },
          { name: 'Zip', type: 'String', length: 50, required: 'Y', description: 'Mandatory since V2.3.1.', example: '12345' },
          { name: 'Email', type: 'String', length: 100, required: 'O', description: '', guidance: 'Contact email.' },
          { name: 'Phone', type: 'String', length: 15, required: 'O', description: '', guidance: 'Contact phone number, with country code.' }
        ],
        sampleRequest: {
          ClientAccountNumber: "102-344-001-01-00-0001-00000",
          FirstName: "ABC",
          MiddleName: "",
          LastName: "XYZ",
          DOB: "",
          IDType: "passport",
          IDNo: "XXXXXXX",
          IDIssueDate: "07/07/2010",
          IDExpiryDate: "",
          Nationality: "",
          BirthCountry: "",
          Address: "Unit 1611, 16th floor Tower 1, Silvercord Building, 30 Canton Road",
          Country: "HK",
          State: "",
          City: "Tsim Sha Tsui",
          Zip: "12345",
          Email: "",
          Phone: ""
        }
      }
    ],
    sampleResponse: {
      RemitterAccountNumber: "102-344-001-01-03-0001-01279",
      Status: "ACTIVATED",
      StatusCode: "HH5000",
      StatusMessage: "SUCCESS"
    }
  },
  {
    id: 'remitter-list',
    sectionNumber: '1.5',
    title: 'Remitter List',
    method: 'GET',
    path: '/api/remitter/getremitterlist/{ClientAccountNumber}/{RemitterAccountNumber}',
    category: 'remitter',
    description: 'Lists the remitters under a client account. Pass a RemitterAccountNumber to return one remitter.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'ClientAccountNumber', type: 'String (Path)', length: 28, required: 'Y', description: 'Main client account number.', example: '102-344-001-01-00-0001-00000' },
      { name: 'RemitterAccountNumber', type: 'String (Path)', length: 28, required: 'O', description: 'If already created; otherwise use 1.4 Create Remitter to create the remitter.', example: '102-344-001-01-03-0001-01279' }
    ],
    sampleResponse: {
      ClientAccountNumber: "XXX-344-XXX-03-00-XXXX-XXXXX",
      Remitters: [
        {
          Type: "Corporate",
          RemitterAccountNumber: "XXX-212-XXX-02-03-XXXX-XXXXX",
          IDType: null,
          IDNumber: null,
          RegistrationNumber: "23275",
          Name: "gg6g6",
          FirstName: null,
          MiddleName: null,
          LastName: null,
          Zip: "testzip",
          City: "NY",
          Nationality: "",
          BirthCountry: "",
          Country: "US",
          State: "NY",
          Address: "123, west",
          CreatedDate: "2025-12-10",
          Status: "activated",
          Email: "test@test.com"
        },
        {
          Type: "Individual",
          RemitterAccountNumber: "XXX-212-XXX-02-04-XXXX-XXXXX",
          IDType: "Passport",
          IDNumber: "ID999880",
          RegistrationNumber: null,
          Name: "Marios  Nikoletta",
          FirstName: "Marios",
          MiddleName: "",
          LastName: "Nikoletta",
          Zip: "12345",
          City: "NY",
          Nationality: "New york",
          BirthCountry: "New york",
          Country: "CY",
          State: "Nicosia State",
          Address: "Address line 1 in Cyprus, Alganzia, Line 2 of the address",
          CreatedDate: "2025-10-09",
          Status: "activated",
          Email: null
        }
      ],
      Message: "SUCCESS",
      StatusCode: "HH5000"
    }
  },
  {
    id: 'payment-list',
    sectionNumber: '1.6',
    title: 'Payment List',
    method: 'GET',
    path: '/api/transaction/getpaymentlist/{Fromdate}/{Todate}',
    category: 'transaction',
    description: 'Lists payments created between two dates (YYYY-MM-DD).',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'Fromdate', type: 'Date (Path)', required: 'Y', description: 'Start date formatted as YYYY-MM-DD.', example: '2023-10-01' },
      { name: 'Todate', type: 'Date (Path)', required: 'Y', description: 'End date formatted as YYYY-MM-DD.', example: '2023-10-31' }
    ],
    sampleResponse: {
      PaymentList: [
        {
          TransactionNumber: "34576768",
          ClientReferenceNo: "HK102765",
          Amount: 100.0000,
          Currency: "USD",
          CreatedDate: "10/12/2023",
          PaymentStatus: "Auto DD done"
        },
        {
          TransactionNumber: "638785974",
          ClientReferenceNo: "TH87819473",
          Amount: 120.0000,
          Currency: "USD",
          CreatedDate: "10/13/2023",
          PaymentStatus: "Auto DD done"
        }
      ],
      Message: "2 Records Found.",
      StatusCode: "HH5000"
    }
  },
  {
    id: 'statement',
    sectionNumber: '1.7',
    title: 'Statement',
    method: 'GET',
    path: '/api/transaction/getstatement/{Fromdate}/{Todate}',
    category: 'statement',
    description: 'Returns statement entries between two dates (YYYY-MM-DD). CreditDebit is D for debit or C for credit.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'Fromdate', type: 'Date (Path)', required: 'Y', description: 'Start date formatted as YYYY-MM-DD.', example: '2023-10-01' },
      { name: 'Todate', type: 'Date (Path)', required: 'Y', description: 'End date formatted as YYYY-MM-DD.', example: '2023-10-31' }
    ],
    sampleResponse: {
      TransactionList: [
        {
          ClientReferenceNo: "HnH12345",
          ReferenceNo: "4772901",
          Amount: 24.0000,
          Currency: "USD",
          ApproverDate: "10-10-2023",
          Narration: "REF NO: 4772901| Winner Meet Limited",
          CreditDebit: "D"
        }
      ],
      StatusCode: "HH5000",
      StatusMessage: "1 Records Found."
    }
  },
  {
    id: 'deposit-list',
    sectionNumber: '1.8',
    title: 'Deposit List',
    method: 'POST',
    path: '/api/transaction/depositlist',
    category: 'statement',
    description: 'Lists deposits. All filters are optional.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'FromDate', type: 'Date', required: 'O', description: 'YYYY-MM-DD format.', example: '2024-01-01' },
      { name: 'ToDate', type: 'Date', required: 'O', description: 'YYYY-MM-DD format.', example: '2024-12-31' },
      { name: 'TxnNo', type: 'String', required: 'O', description: '', guidance: 'Return only the deposit with this transaction number.' },
      { name: 'PaymentStatus', type: 'String', required: 'O', description: '', guidance: 'Return only deposits with this status, e.g. DD Approved.' }
    ],
    // Note: the document gives no sample request for 1.8; this is the parameter table with example dates.
    sampleRequest: {
      FromDate: "2024-01-01",
      ToDate: "2024-12-31",
      TxnNo: "",
      PaymentStatus: ""
    },
    sampleResponse: {
      DepositList: [
        {
          ReferenceNumber: "6479400053",
          ClientAccountNumber: "102-344-001-01-00-0001-00000",
          PayInCurrency: "USD",
          PayInAmount: 32.0000,
          RemitterName: "Harbour and Hills Pvt Ltd",
          RemitterCountry: "Hong Kong",
          BeneficiaryName: "Sachin",
          BeneficiaryType: "company",
          BenBankName: "",
          Description: "FAMILY MAINTENANCE",
          CreatedDate: "11/14/2022",
          RemitterBankAccountNumber: "",
          PaymentStatus: "DD Approved",
          DDDate: "11/26/2024",
          IsApproved: true
        }
      ],
      StatusCode: "HH5000",
      StatusMessage: "1 Records Found."
    }
  },
  {
    id: 'upload-file',
    sectionNumber: '1.9',
    title: 'Upload File',
    method: 'POST',
    path: '/api/transaction/uploadfile',
    category: 'files',
    description: 'Attaches one or more files to a transaction, as Base64 strings. Supported types: pdf, jpg, png, txt.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'TransactionNumber', type: 'String', required: 'Y', description: 'From the response of 1.2 Create Transaction.', example: '453455453' },
      { name: 'FileName', type: 'String', required: 'Y', description: '', guidance: 'A name for the file, e.g. invoice-1024.', example: 'file1' },
      { name: 'FileBase64String', type: 'String', required: 'Y', description: 'Supported extension types: pdf, jpg, png, txt.' }
    ],
    sampleRequest: [
      {
        TransactionNumber: "453455453",
        FileName: "file1",
        FileBase64String: "Base64String will come here"
      },
      {
        TransactionNumber: "453455453",
        FileName: "file2",
        FileBase64String: "Base64String will come here"
      }
    ],
    sampleResponse: {
      StatusCode: "HH5000",
      StatusMessage: "File added successfully."
    }
  },
  {
    id: 'download-file',
    sectionNumber: '1.10',
    title: 'Download File',
    method: 'GET',
    path: '/api/transaction/downloadfile/{transactionnumber}',
    category: 'files',
    description: 'Returns the files attached to a transaction, as Base64 strings.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'transactionnumber', type: 'String (Path)', required: 'Y', description: 'TransactionNumber from 1.2.', example: '12345678' }
    ],
    sampleResponse: {
      FileUploadModel: [
        {
          TransactionNumber: "12345678",
          FileName: "test2",
          FileExt: "pdf",
          FileBase64String: "Base64String will come here."
        }
      ],
      StatusCode: "HH5000",
      StatusMessage: "1 File found successfully."
    }
  },
  {
    id: 'source-of-funds',
    sectionNumber: '1.11',
    title: 'Source of Funds',
    method: 'GET',
    path: '/api/transaction/getsourceoffunds',
    category: 'reference',
    description: 'Returns the list of source-of-funds values.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [],
    sampleResponse: {
      SourceOfFunds: [
        { ID: 1, Name: "Commission of Sales" },
        { ID: 2, Name: "Investment/Capital" }
      ],
      StatusCode: "HH5000",
      StatusMessage: "2 Records Found."
    }
  },
  {
    id: 'webhook-response',
    sectionNumber: '1.12',
    title: 'Webhook Post Data',
    method: 'POST',
    path: 'Your webhook endpoint',
    category: 'webhook',
    description: 'Data Harbour & Hills posts to your webhook endpoint, for incoming deposits and for outgoing payment status updates.',
    headers: [
      { key: 'Content-Type', value: 'application/json' }
    ],
    requestSubtypes: [
      {
        name: 'Incoming',
        description: 'Sent for an incoming deposit.',
        parameters: [
          { name: 'ReferenceNumber', type: 'String', required: 'O', description: '', guidance: 'Harbour & Hills reference for the deposit.' },
          { name: 'ClientAccountNumber', type: 'String', required: 'O', description: '', guidance: 'Your client account the deposit was credited to.' },
          { name: 'PayInCurrency', type: 'String', required: 'O', description: '', guidance: 'Currency of the deposit.' },
          { name: 'PayInAmount', type: 'Decimal', required: 'O', description: '', guidance: 'Amount deposited.' },
          { name: 'RemitterName', type: 'String', required: 'O', description: '', guidance: 'Who sent the funds.' },
          { name: 'RemitterCountry', type: 'String', required: 'O', description: '', guidance: 'Country of the sender.' },
          { name: 'BeneficiaryName', type: 'String', required: 'O', description: '', guidance: 'Name of the account holder receiving the funds.' },
          { name: 'BeneficiaryType', type: 'String', required: 'O', description: '', guidance: 'Whether the beneficiary is a company or an individual.' },
          { name: 'BenBankName', type: 'String', required: 'O', description: '', guidance: "Beneficiary's bank, if known." },
          { name: 'Description', type: 'String', required: 'O', description: '', guidance: 'Payment description sent with the deposit.' },
          { name: 'CreatedDate', type: 'String', required: 'O', description: '', guidance: 'When the deposit was created, as an ISO 8601 timestamp.' },
          { name: 'RemitterBankAccountNumber', type: 'String', required: 'O', description: '', guidance: "Sender's bank account number, if known." }
        ],
        sampleRequest: {
          ReferenceNumber: "2613732480",
          ClientAccountNumber: "XXX-124-001-01-00-XXXX-00000",
          PayInCurrency: "USD",
          PayInAmount: 100.0000,
          RemitterName: "Test CORP",
          RemitterCountry: "UNITED STATES",
          BeneficiaryName: "Test AG",
          BeneficiaryType: "COMPANY",
          BenBankName: "",
          Description: "IMPORT OF 2727 DIVERSIFIED INDUSTRIALS",
          CreatedDate: "2024-10-03T15:34:26.85",
          RemitterBankAccountNumber: ""
        }
      },
      {
        name: 'Outgoing',
        description: 'Sent when an outgoing payment changes status. Status is a 1.16 payment status code.',
        parameters: [
          { name: 'TransactionNumber', type: 'String', required: 'O', description: '', guidance: 'Harbour & Hills transaction number, as returned by 1.2.' },
          { name: 'ClientRefNumber', type: 'String', required: 'O', description: '', guidance: 'The ClientReferenceNo you sent in 1.2.' },
          { name: 'Status', type: 'String', required: 'O', description: '', guidance: 'Payment status code from 1.16, e.g. HH5006.' },
          { name: 'Message', type: 'String', required: 'O', description: '', guidance: 'Text description of the status.' },
          { name: 'Date', type: 'String', required: 'O', description: '', guidance: 'When the status changed, as an ISO 8601 timestamp.' }
        ],
        sampleRequest: {
          TransactionNumber: "2613732480",
          ClientRefNumber: "HK2613732480",
          Status: "HH5006",
          Message: "Payment processed",
          Date: "2024-10-03T15:34:26.85"
        }
      }
    ],
    // Note: the document defines no acknowledgement body for webhooks.
    sampleResponse: {}
  },
  {
    id: 'remitter-file-upload',
    sectionNumber: '1.13',
    title: 'Remitter FileUpload',
    method: 'POST',
    path: '/api/remitter/uploadremitterdocuments',
    category: 'remitter',
    description: 'Uploads documents for a remitter. FileType must be a DocumentName from 1.14.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'SubClientAccountNumber', type: 'String', length: 28, required: 'Y', description: 'Remitter SubClientAccountNumber.', example: '102-344-001-01-03-0001-01279' },
      { name: 'FileUpload[].FileName', type: 'String', length: 27, required: 'Y', description: '', guidance: 'A name for the file, e.g. trade licence.', example: 'test doc' },
      { name: 'FileUpload[].FileType', type: 'String', length: 27, required: 'Y', description: 'A DocumentName from 1.14.', example: 'supporting documents' },
      { name: 'FileUpload[].FileExtention', type: 'String', length: 7, required: 'Y', description: 'Pdf.', example: '.pdf' },
      { name: 'FileUpload[].FileBase64String', type: 'String', required: 'Y', description: '', guidance: 'The file contents, Base64-encoded. Use Attach files in the console to generate it.' }
    ],
    sampleRequest: {
      SubClientAccountNumber: "102-344-001-01-03-0001-01279",
      FileUpload: [
        {
          FileName: "test doc",
          FileType: "supporting documents",
          FileExtention: ".pdf",
          FileBase64String: "/9j/4GET APPAAQSkZJRgABAQAAAQABAAD/....."
        },
        {
          FileName: "test bill",
          FileType: "service agreement",
          FileExtention: ".pdf",
          FileBase64String: "/9j/4GET JCEKXLLJJJRgABAkJKJHKKKMAD/....."
        }
      ]
    },
    // Note: the document gives no sample response for 1.13; this is the standard HH5000 shape.
    sampleResponse: {
      StatusCode: "HH5000",
      StatusMessage: "SUCCESS"
    }
  },
  {
    id: 'remitter-doc-types',
    sectionNumber: '1.14',
    title: 'RemitterDocumentTypes List',
    method: 'GET',
    path: '/api/remitter/getremitterdocumenttypes/{clientType}/{countryname}',
    category: 'remitter',
    description: 'Lists the document types a remitter can upload, by client type and, optionally, country.',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {Token}', description: 'Received token from Section 1.1' }
    ],
    authorization: 'Bearer Token',
    parameters: [
      { name: 'clientType', type: 'String (Path)', required: 'Y', description: 'Either sub-client-individual or sub-client-corporate.', enumOptions: ['sub-client-individual', 'sub-client-corporate'], example: 'sub-client-corporate' },
      { name: 'countryname', type: 'String (Path)', required: 'O', description: '', guidance: 'Country to filter document types by. Leave empty for all countries.' }
    ],
    sampleResponse: {
      RemitterDocumentTypes: [
        {
          DocumentName: "account closure mail",
          ClientType: "sub-client-corporate",
          ApplicableCountries: "All"
        },
        {
          DocumentName: "articles of association",
          ClientType: "sub-client-corporate",
          ApplicableCountries: "All"
        }
      ],
      StatusMessage: "SUCCESS",
      StatusCode: "HH5000"
    }
  }
];

// Page in HnH_API_V2.3.3.pdf where each section starts — lets clients cross-reference the signed document.
export const SPEC_PAGES: Record<string, number> = {
  '1.1': 3, '1.2': 4, '1.3': 8, '1.4': 9, '1.5': 13, '1.6': 15, '1.7': 16, '1.8': 17,
  '1.9': 18, '1.10': 19, '1.11': 20, '1.12': 21, '1.13': 22, '1.14': 23, '1.15': 24, '1.16': 24, '1.17': 25,
};
