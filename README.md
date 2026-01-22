# Lenduck

**SME Financing Marketplace** - Connect your accounting software, get personalized loan offers from multiple lenders instantly.

## Overview

Lenduck is a fintech platform that bridges the gap between small and medium enterprises (SMEs) seeking financing and lenders looking to provide capital. By integrating directly with accounting software, we automate the financial analysis process that traditionally takes weeks of paperwork.

### How It Works

1. **Connect** - Link your accounting software (QuickBooks, etc.)
2. **Analyze** - We automatically pull and analyze your financial data
3. **Match** - Get matched with lenders based on your financial health
4. **Compare** - Review personalized loan offers side by side
5. **Choose** - Select the best offer and proceed with the lender

### Key Benefits

- **For SMEs**: One application, multiple offers. No repetitive paperwork.
- **For Lenders**: Pre-qualified leads with verified financial data.
- **Speed**: Get offers in 24 hours instead of 14+ days.

## Tech Stack

- **Backend**: Node.js with Express.js and TypeScript
- **Database**: SQLite with better-sqlite3
- **Authentication**: Session-based auth with cookie-parser
- **Frontend**: Server-rendered HTML with inline CSS (Nunito font, green/earth theme)
- **Accounting Integrations**: REST APIs with OAuth2

## Project Structure

```
lenduck-web/
├── src/
│   ├── server.ts          # Express server, routes, middleware
│   ├── database.ts        # SQLite database schema and functions
│   └── services/
│       └── quickbooks.ts  # QuickBooks API integration
├── index8.html            # Main landing page (English)
├── index8-cz.html         # Czech language version
├── robots.txt             # SEO - crawler rules
├── sitemap.xml            # SEO - sitemap
└── logo.png               # Lenduck logo
```

## Database Schema

```
users                      # User accounts
companies                  # User's companies
accounting_connections     # API credentials for accounting software
software_requests          # Requests for new integrations
accounts                   # Chart of accounts (synced)
invoices                   # Issued and received invoices
bank_transactions          # Bank transaction history
journal_entries            # Accounting journal entries
financial_reports          # Cached P&L, Balance Sheet, etc.
financial_metrics          # Calculated ratios and KPIs
sync_logs                  # Data synchronization history
waitlist_sme               # SME waiting list signups
waitlist_partner           # Partner/lender waiting list
visitors                   # Page visit tracking
```

## Features

### Implemented

- **Landing Pages**: Responsive design with EN/CZ language support
- **User Authentication**: Login, signup (email-only for early access)
- **Company Management**: Add companies, view dashboard
- **QuickBooks Integration**: Full OAuth2 flow and data sync
- **Financial Metrics**: Automatic calculation of key ratios
- **Health Score**: Algorithm-based creditworthiness scoring
- **Admin Dashboard**: View visitors, signups, and waitlist
- **SEO**: Meta tags, Open Graph, sitemap, robots.txt, JSON-LD structured data
- **Google Analytics**: Tracking with gtag.js

### Financial Metrics Calculated

| Metric | Description |
|--------|-------------|
| Revenue | Total income (YTD) |
| Net Income | Profit after expenses |
| Gross Profit | Revenue minus COGS |
| Current Ratio | Current Assets / Current Liabilities |
| Quick Ratio | (Current Assets - Inventory) / Current Liabilities |
| Debt to Equity | Total Liabilities / Total Equity |
| DSO | Days Sales Outstanding (receivables collection speed) |
| DPO | Days Payable Outstanding (payment speed to vendors) |
| Cash Balance | Available cash |
| A/R & A/P | Accounts Receivable and Payable totals |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ivanjurina/lenduck-web.git
cd lenduck-web

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start
```

### Environment Variables

```bash
# Server
PORT=5000
SESSION_SECRET=your-secret-key

# QuickBooks (required for QB integration)
QB_CLIENT_ID=your-quickbooks-client-id
QB_CLIENT_SECRET=your-quickbooks-client-secret
QB_REDIRECT_URI=http://localhost:5000/api/quickbooks/callback
QB_ENVIRONMENT=sandbox  # or 'production'
```

### Default Admin Account

```
Email: admin@lenduck.com
Password: admin123
```

## API Endpoints

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | English landing page |
| GET | `/cz` | Czech landing page |
| GET | `/login` | Login page |
| GET | `/signup` | Signup page |
| GET | `/robots.txt` | SEO robots file |
| GET | `/sitemap.xml` | SEO sitemap |

### Protected Routes (require auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | User dashboard with companies |
| GET | `/company/new` | Add new company form |
| POST | `/company/new` | Create company |
| GET | `/company/:id/connect` | Select accounting software |
| POST | `/company/:id/connect` | Start OAuth flow |
| GET | `/company/:id/overview` | Financial overview |
| GET | `/company/:id/sync` | Trigger data sync |

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quickbooks/callback` | QuickBooks OAuth callback |
| POST | `/api/waitlist/sme` | SME waitlist signup |
| POST | `/api/waitlist/partner` | Partner waitlist signup |

---

## Worklog

### Session Summary (January 2025)

#### Phase 1: Landing Page & Basic Setup
- Created responsive landing page with Nature/Organic theme (green/earth tones)
- Implemented mobile-friendly navigation with hamburger menu
- Added EN/CZ language switcher and Czech translation
- Built Node.js/Express server with TypeScript
- Set up SQLite database for users, waitlists, and visitor tracking

#### Phase 2: User Authentication
- Implemented login/signup system with session-based auth
- Created admin dashboard for viewing visitors and signups
- Simplified signup to email-only (password sent later)

#### Phase 3: SEO & Analytics
- Added Google Analytics (gtag.js)
- Implemented comprehensive SEO: meta tags, Open Graph, Twitter cards
- Created robots.txt and sitemap.xml
- Added JSON-LD structured data (Organization, WebSite, FinancialService)

#### Phase 4: Company & Accounting Integration Architecture
- Designed database schema for companies and accounting connections
- Created 10 new tables for financial data storage
- Built company management UI (add company, dashboard)
- Implemented accounting software selection flow

#### Phase 5: QuickBooks Integration
- Built complete OAuth2 authorization flow
- Implemented token refresh mechanism
- Created data sync for accounts, invoices, and bills
- Added P&L, Balance Sheet, Cash Flow report fetching
- Built A/R and A/P aging report integration
- Implemented financial metrics calculation algorithm
- Created company financial overview with health score

#### Mobile & UX Fixes
- Fixed mobile menu background and overlay issues
- Made problem section responsive
- Improved hero buttons layout on mobile
- Removed false "500+ businesses" claim

---

## Roadmap

### In Progress
- Testing and refinement of QuickBooks integration
- Financial health score algorithm improvements

### Planned Integrations

We are actively working on adding support for additional accounting software:

| Software | Region | API Type | Status |
|----------|--------|----------|--------|
| **QuickBooks Online** | US/UK/Global | REST + OAuth2 | ✅ Implemented |
| **Xero** | Global | REST + OAuth2 | 🔜 Planned |
| **ABRA FlexiBee** | Czech Republic | REST API | 🔜 Planned |
| **Pohoda** | Czech Republic | XML/mServer | 🔜 Planned |
| **iDoklad** | Czech Republic | REST API | 🔜 Planned |
| **Profit365** | Slovakia/Czech | REST API | 🔜 Planned |
| **Money S3** | Czech Republic | XML Export | 📋 Backlog |

### Future Features

- **Lender Portal**: Dashboard for financing providers
- **Loan Matching Algorithm**: AI-based matching with lenders
- **Document Upload**: Manual financial statement upload
- **Multi-currency Support**: Handle different currencies
- **Automated Reports**: PDF generation for lenders
- **Notifications**: Email alerts for new offers
- **API for Partners**: REST API for lender integrations

---

## Contributing

This is currently a private project. For inquiries, contact info@lenduck.com.

## License

Proprietary - All rights reserved.

---

Built with care in Czech Republic 🇨🇿
