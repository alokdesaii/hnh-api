// Task guides: portal content that strings spec methods together. Not part of the signed specification.

export interface GuideStep {
  title: string;
  body: string;
  endpointId?: string;
  // Body to show in the step's code sample, when it differs from the method's sample.
  sampleBody?: unknown;
  code?: { lang: string; text: string };
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  steps: GuideStep[];
}

export const GUIDES: Guide[] = [
  {
    id: 'guide-first-payment',
    title: 'Send your first B2B payment',
    summary: 'Authenticate, find the remitter, create an account-transfer payment, attach the invoice and track it to completion.',
    steps: [
      {
        title: 'Get a token',
        endpointId: 'auth',
        body: 'Send your Username and Password as headers. Keep the Token from the response and send it as a Bearer token on every other call.',
      },
      {
        title: 'Find the remitter account',
        endpointId: 'remitter-list',
        body: 'The payment is made on behalf of a remitter. List the remitters under your ClientAccountNumber and take the RemitterAccountNumber of the one paying. If they don’t exist yet, follow “Onboard a remitter” first.',
      },
      {
        title: 'Pick a source of funds',
        endpointId: 'source-of-funds',
        body: 'SourceOfFund is mandatory on every transaction. Use one of the names this method returns.',
      },
      {
        title: 'Create the transaction',
        endpointId: 'create-transaction',
        body: 'For a B2B account transfer, set PaymentType to B2B and TransactionType to AT. B2B needs PaymentDetails and BeneficiaryCompanyName; AT needs the beneficiary’s bank details. Use a new ClientReferenceNo for every payment. The response gives you the TransactionNumber.',
      },
      {
        title: 'Attach the invoice',
        endpointId: 'upload-file',
        body: 'Upload supporting documents against the TransactionNumber. Files are sent as Base64 strings; pdf, jpg, png and txt are accepted.',
      },
      {
        title: 'Track the payment',
        endpointId: 'transaction-status',
        body: 'Look the payment up by your ClientReferenceNo. HH5008 means it is created and in process, HH5006 means processed. If you’ve set up a webhook, you’ll receive the same updates without polling.',
      },
    ],
  },
  {
    id: 'guide-remitter',
    title: 'Onboard a remitter',
    summary: 'Create a business or individual remitter, find out which documents they need, and upload them.',
    steps: [
      {
        title: 'Create the remitter',
        endpointId: 'create-remitter',
        body: 'Choose the business or individual body. Address, Country, City and Zip are mandatory for both. The response returns the RemitterAccountNumber and its Status.',
      },
      {
        title: 'Check which documents apply',
        endpointId: 'remitter-doc-types',
        body: 'Ask for the document types for sub-client-corporate or sub-client-individual, optionally filtered by country. Each DocumentName is a valid FileType for the upload.',
      },
      {
        title: 'Upload the documents',
        endpointId: 'remitter-file-upload',
        body: 'Send the remitter’s account number as SubClientAccountNumber, with one FileUpload entry per document. FileType must be a DocumentName from the previous step.',
      },
      {
        title: 'Confirm the remitter is active',
        endpointId: 'remitter-list',
        body: 'Look the remitter up by RemitterAccountNumber and check its Status before sending payments on its behalf.',
      },
    ],
  },
  {
    id: 'guide-webhooks',
    title: 'Handle webhooks',
    summary: 'Receive incoming-deposit and outgoing-payment updates at your own endpoint.',
    steps: [
      {
        title: 'Expose an HTTPS endpoint',
        body: 'Harbour & Hills posts JSON to a URL you provide. Ask the Business team to register it for your account.',
      },
      {
        title: 'Tell the two payloads apart',
        endpointId: 'webhook-response',
        body: 'An incoming deposit carries ReferenceNumber, PayInAmount and the remitter details. An outgoing payment update carries TransactionNumber, ClientRefNumber and a Status code from 1.16.',
      },
      {
        title: 'Process updates safely',
        body: 'Reply quickly and do the work afterwards. The same update may arrive more than once, so key your processing on TransactionNumber + Status (outgoing) or ReferenceNumber (incoming).',
        code: {
          lang: 'node',
          text: `app.post('/hnh/webhook', express.json(), (req, res) => {
  res.sendStatus(200); // acknowledge first

  const event = req.body;
  if (event.TransactionNumber) {
    // Outgoing payment update — Status is a 1.16 code, e.g. HH5006
    updatePayment(event.ClientRefNumber, event.Status, event.Date);
  } else if (event.ReferenceNumber) {
    // Incoming deposit
    recordDeposit(event.ReferenceNumber, event.PayInAmount, event.PayInCurrency);
  }
});`,
        },
      },
      {
        title: 'Fall back to polling',
        endpointId: 'transaction-status',
        body: 'If an update is missed, Transaction Status returns the current state of any payment by ClientReferenceNo.',
      },
    ],
  },
  {
    id: 'guide-reconcile',
    title: 'Reconcile payments and deposits',
    summary: 'Pull payments, statement entries and deposits for a date range to match against your own records.',
    steps: [
      {
        title: 'List payments',
        endpointId: 'payment-list',
        body: 'Returns each payment created between two dates (YYYY-MM-DD), with its TransactionNumber, ClientReferenceNo, amount and PaymentStatus.',
      },
      {
        title: 'Pull the statement',
        endpointId: 'statement',
        body: 'Statement entries show each debit (D) and credit (C) against your account for the period.',
      },
      {
        title: 'List deposits',
        endpointId: 'deposit-list',
        body: 'Filter deposits by date, transaction number or status. Every filter is optional.',
      },
    ],
  },
];
