# Harbour & Hills — Payments API V2.3.3 Client Integration Portal

An enterprise-grade, interactive developer documentation portal and API client sandbox built for **Harbour & Hills International Payments API (Specification V2.3.3)**.

Designed for authorized clients to assess, explore, generate code snippets, and interactively test the complete Payments API specification behind secure client credentials.

---

## 🌟 Key Features

1. **Client Authentication Barrier**
   - Branded Harbour & Hills login page with client credentials (`Username` and `Password`).
   - Supports both **Instant Client Evaluation** (pre-seeded credentials) and **Live Backend Gateway Authentication** (posting directly to `POST /api/users/authenticate`).
   - In-portal Bearer Token persistence & one-click token copy.

2. **Complete V2.3.3 Specification Coverage**
   - **1.1 Authentication** (`POST /api/users/authenticate`)
   - **1.2 Create Transaction** (B2B, B2C, C2B, C2C; AT, CA, WT, DR rails; banking validation for SWIFT, IFSC, BSB, BankCode, ABA, IBAN)
   - **1.3 Transaction Status** (`GET /api/transaction/status/{ClientReferenceNo}`)
   - **1.4 Create Remitter** (Corporate vs. Individual entity schemas)
   - **1.5 Remitter List** (`GET /api/remitter/getremitterlist/{ClientAccountNumber}/{RemitterAccountNumber}`)
   - **1.6 Payment List** (`GET /api/transaction/getpaymentlist/{Fromdate}/{Todate}`)
   - **1.7 Statement** (`GET /api/transaction/getstatement/{Fromdate}/{Todate}`)
   - **1.8 Deposit List** (`POST /api/transaction/depositlist`)
   - **1.9 Upload File** (`POST /api/transaction/uploadfile`)
   - **1.10 Download File** (`GET /api/transaction/downloadfile/{transactionnumber}`)
   - **1.11 Source of Funds** (`GET /api/transaction/getsourceoffunds`)
   - **1.12 Webhook Post Data** (Incoming deposit notifications & outgoing transaction status events)
   - **1.13 Remitter FileUpload** (`POST /api/remitter/uploadremitterdocuments`)
   - **1.14 Remitter Document Types List** (`GET /api/remitter/getremitterdocumenttypes/{clientType}/{countryname}`)
   - **1.15 & 1.16 Status Codes** (`HH5000` to `HH5011` with cause & description)
   - **1.17 Relationship Types** (Mandatory C2C enumeration)
   - **Version History & Changelog** (V2.0 to V2.3.3)

3. **Interactive "Try It Out" Playground & Sandbox**
   - Live endpoint execution runner with latency timing (`ms`), status badges, and syntax-highlighted response viewer.
   - **Mock Sandbox Mode**: Fully simulated responses matching the exact sample outputs from the V2.3.3 PDF document, allowing client testing before backend deployment.
   - **Live Gateway Mode**: Proxies requests to staging/production server with real Authorization headers.

4. **Multi-Language Code Generation**
   - Real-time client code snippets generated dynamically in:
     - **cURL**
     - **JavaScript (Fetch / async-await)**
     - **Python (Requests)**
     - **Go (net/http)**
     - **PHP (cURL)**

5. **Instant Export Tools**
   - **One-click Postman Collection (v2.1)** export with pre-configured variables (`{{baseUrl}}`, `{{bearerToken}}`).
   - **OpenAPI 3.1 (Swagger)** JSON schema export.

6. **Quick Search (`⌘K` / `Ctrl+K`)**
   - Fast instant search across all endpoints, paths, parameter names, error codes (`HH5000`–`HH5011`), and changelog entries.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` (Tested on `v24.6.0`)
- npm `v9+`

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or the port indicated in your terminal.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🔐 How the Backend Team Can Integrate

The frontend is completely decoupled and ready to connect to any backend environment:

1. **Authentication Endpoint Integration**:
   - The login page calls `POST ${baseUrl}/api/users/authenticate` with:
     ```http
     Username: <client-username>
     Password: <client-password>
     Content-Type: application/json
     ```
   - Expects standard response format:
     ```json
     {
       "Username": "0000aa-730c-0000",
       "Token": "eyJhbGciOi...",
       "StatusCode": "HH5000",
       "StatusMessage": "User validated successfully"
     }
     ```
2. **Base URL Configuration**:
   - In `src/context/AuthContext.tsx`, `DEFAULT_BASE_URL` is set to `https://api.harbourandhills.com`.
   - Users or backend engineers can switch or edit this URL dynamically via the **Environment Switcher** in the top navigation bar.
3. **CORS Configuration**:
   - Ensure the backend API allows CORS requests from the domain hosting this portal, including headers `Authorization`, `Username`, `Password`, and `Content-Type`.

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── ApiPlayground.tsx     # Interactive request runner & code generators
│   │   ├── EndpointDocView.tsx   # Parameter tables, headers, validation callouts
│   │   ├── LoginPage.tsx         # Branded client authentication screen
│   │   ├── Navbar.tsx            # Header, environment switcher, exports, token pill
│   │   ├── OverviewView.tsx      # Getting started & 3-step workflow
│   │   ├── RelationshipsView.tsx # Section 1.17 relationship list
│   │   ├── SearchModal.tsx       # Cmd+K fuzzy search modal
│   │   ├── Sidebar.tsx           # Category navigation & method badges
│   │   ├── StatusCodesView.tsx   # Sections 1.15 & 1.16 code matrices
│   │   └── VersionHistoryView.tsx# Changelog from V2.0 to V2.3.3
│   ├── context/
│   │   └── AuthContext.tsx       # Auth session & environment state
│   ├── data/
│   │   └── apiSpec.ts            # Complete V2.3.3 specification data model
│   ├── utils/
│   │   ├── codeGenerators.ts     # cURL, JS, Python, Go, PHP generators
│   │   └── exporters.ts          # Postman Collection & OpenAPI 3.1 exporters
│   ├── App.tsx                   # Main layout container
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind v4 styles & design tokens
├── package.json
└── vite.config.ts
```
