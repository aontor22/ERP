# ApexERP Enterprise Platform

> **Comprehensive enterprise-grade modular ERP platform** featuring multi-company organizational hierarchies, double-entry general ledger, intelligent inventory forecasting, multi-currency sales & procurement, manufacturing MRP, HR/payroll, multi-tier approval workflows, and immutable audit logs.

---

## 📋 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Enterprise Modules](#key-enterprise-modules)
  - [1. Executive Dashboard](#1-executive-dashboard)
  - [2. Multi-Company & Organizational Hierarchy](#2-multi-company--organizational-hierarchy)
  - [3. Products & SKU Master](#3-products--sku-master)
  - [4. Inventory & Predictive Forecasting (EOQ / ROP)](#4-inventory--predictive-forecasting-eoq--rop)
  - [5. Procurement & Vendor Management](#5-procurement--vendor-management)
  - [6. Sales & Accounts Receivable](#6-sales--accounts-receivable)
  - [7. General Ledger & Double-Entry Accounting](#7-general-ledger--double-entry-accounting)
  - [8. HR & Payroll Management](#8-hr--payroll-management)
  - [9. Manufacturing & Material Requirements Planning (MRP)](#9-manufacturing--material-requirements-planning-mrp)
  - [10. Enterprise Approval Workflows & Governance](#10-enterprise-approval-workflows--governance)
  - [11. Financial Reports & Export Engine](#11-financial-reports--export-engine)
  - [12. Immutable Audit Trail & Compliance](#12-immutable-audit-trail--compliance)
  - [13. System Settings & Regulatory Parameters](#13-system-settings--regulatory-parameters)
- [Role-Based Access Control (RBAC) & Security](#role-based-access-control-rbac--security)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [REST API Reference](#rest-api-reference)
- [Getting Started & Local Development](#getting-started--local-development)
- [Production Deployment & Containerization](#production-deployment--containerization)
- [Security & Compliance Highlights](#security--compliance-highlights)

---

## Overview & Architecture

ApexERP is engineered for mid-market and enterprise organizations operating complex holding-subsidiary structures across multiple territories. Built with a full-stack architecture combining a hardened Express backend and a responsive React 19 / Vite single-page application frontend, ApexERP enforces strict double-entry ledger balance, continuous stock valuation, multi-tier authorization matrixes, and auditability.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Client Layer (React 19)                         │
│  Tailwind CSS • Lucide Icons • Recharts • Motion Transitions • jsPDF Export │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON / HTTP)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Hardened Express Gateway (Port 3000)                     │
│  Sliding-Window Rate Limiter • Security Headers • Input Validation • RBAC    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           ApexERP Engine & State                            │
│  Double-Entry Ledger • Multi-Currency Engine • MRP & EOQ • In-Memory Store  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Enterprise Modules

### 1. Executive Dashboard
- **Real-Time KPI Cards**: Cash balance, Accounts Receivable, Accounts Payable, Inventory Valuation, Monthly Run-Rate, and Active Headcount.
- **Financial Velocity Visualizations**: Interactive monthly revenue vs. expense charts powered by Recharts.
- **Operational Alerts**: Low stock warnings, pending purchase order approvals, overdue customer invoices, and manufacturing bottleneck notices.
- **Auditor Quick Snapshot**: Instant system-wide sanity check for ledger balance and operational stability.

### 2. Multi-Company & Organizational Hierarchy
- **Holding Structure**: Support for parent holdings, subsidiaries, operating divisions, and branch offices.
- **Cost Centers & Warehouses**: Segment revenue, expenditure, and inventory allocation by legal entity or functional division.
- **Consolidation**: Real-time roll-up of trial balance and balance sheet metrics across group entities.

### 3. Products & SKU Master
- **Catalog Taxonomies**: Categorization by Finished Goods, Raw Materials, Work-in-Progress (WIP), and Packaging.
- **Cost & Price Tracking**: Standard purchase cost, unit sale price, margin calculation, and unit-of-measure (UOM) definitions.
- **Safety Stock & Lead Times**: Configurable minimum stock, reorder triggers, and supplier lead-time tracking.

### 4. Inventory & Predictive Forecasting (EOQ / ROP)
- **Multi-Warehouse Stock Balances**: On-hand, allocated, available, and in-transit quantities per warehouse.
- **Automated Forecast Calculations**:
  - **Economic Order Quantity (EOQ)**: $\sqrt{\frac{2DS}{H}}$ optimizing holding costs against ordering overhead.
  - **Reorder Point (ROP)**: Lead time demand + dynamic buffer based on stockout risk probability.
  - **Stockout Risk Modeling**: Automated classification into *Critical*, *Warning*, and *Adequate*.
- **Direct Replenishment Actions**: One-click "Apply ROP" to product master and instant "Order EOQ" Purchase Order generation.
- **Transaction Ledger**: Complete chronological log of receipts, shipments, scrap, and manual adjustments.

### 5. Procurement & Vendor Management
- **Vendor Directory**: Supplier profiles, payment terms, currency preferences, tax identification, and performance ratings.
- **Purchase Order Lifecycle**: `Draft` $\rightarrow$ `Pending Approval` $\rightarrow$ `Approved` $\rightarrow$ `Received` $\rightarrow$ `Billed`.
- **Three-Way Matching**: Links purchase orders with inventory receipts and general ledger accounts payable entries.

### 6. Sales & Accounts Receivable
- **Invoice Processing**: Multi-currency sales invoice creation with line-item tax calculation (NBR VAT/TDS compliant).
- **Payment Status**: Real-time tracking of `Draft`, `Sent`, `Partial`, `Paid`, and `Overdue` invoices.
- **AR Aging Analysis**: Categorization of outstanding receivables across 0-30 days, 31-60 days, 61-90 days, and 90+ days.
- **Export Capabilities**: Clean PDF invoice generation and CSV table export.

### 7. General Ledger & Double-Entry Accounting
- **Chart of Accounts (COA)**: Standard 5-tier accounting taxonomy:
  - `1000 - Assets` (Current, Fixed, Bank/Cash, Inventory)
  - `2000 - Liabilities` (Current, Accounts Payable, Accrued Taxes)
  - `3000 - Equity` (Share Capital, Retained Earnings)
  - `4000 - Revenue` (Operating Sales, Other Income)
  - `5000 - Expenses` (COGS, Payroll, Utilities, Administrative)
- **Strict Double-Entry Validation**: Server-enforced $\sum \text{Debits} \equiv \sum \text{Credits}$ balance on every journal voucher.
- **Expense Budget Manager**: Monthly expense budget tracking vs. actuals with budget exhaustion progress bars and overage alerts.
- **Trial Balance Engine**: Live calculation of total debits, total credits, and net variance.

### 8. HR & Payroll Management
- **Employee Directory**: Full personnel records with department, designation, joining date, and basic salary structure.
- **Salary Computation Engine**: Breakdown of Basic Pay, House Rent Allowance (HRA), Medical Allowance, Tax Deductions, and Net Payable.
- **Automated Payroll Runs**: Monthly batch processing that automatically posts corresponding journal entries to the General Ledger.

### 9. Manufacturing & Material Requirements Planning (MRP)
- **Bill of Materials (BOM)**: Multi-level component recipes with scrap factor percentages and unit cost aggregation.
- **Manufacturing Orders (MO)**: Work order scheduling, status tracking (`Planned`, `In Progress`, `Completed`), and finished goods receipt.
- **Automated Stock Consumption**: Backflushing raw material consumption from inventory upon order completion.

### 10. Enterprise Approval Workflows & Governance
- **Approval Queue**: Centralized governance inbox for high-value financial vouchers, capital purchases, and payroll runs.
- **Configurable Thresholds**: Tiered threshold escalation requiring CFO, Operations Director, or CEO sign-off.
- **Auditor Verification**: Read-only oversight for compliance inspectors with full visibility into requester, reviewer notes, and timestamps.

### 11. Financial Reports & Export Engine
- **Income Statement (P&L)**: Revenue, Cost of Goods Sold, Gross Margin, Operating Expenses, and Net Profit.
- **Balance Sheet**: Comprehensive Asset, Liability, and Equity positioning.
- **Trial Balance & Cash Flow Statements**: Live operational audits and liquidity reporting.
- **Exporting Options**: Download clean, professional PDF reports with formatted financial tables via jsPDF, or export raw CSV data.

### 12. Immutable Audit Trail & Compliance
- **SOC2 / ISO 27001 Preparedness**: Immutable event logging for every user action, state change, and financial transaction.
- **Audit Attributes**: Timestamp, actor email, assigned role, IP address, module, action type, and detailed payload changes.
- **Search & Filter**: Real-time filtering by actor, role, event severity (`INFO`, `WARN`, `CRITICAL`), and date range.

### 13. System Settings & Regulatory Parameters
- **Taxation & Compliance**: Bangladesh NBR VAT rates (default 15%), Tax Deducted at Source (TDS), and tax registration numbers.
- **Multi-Currency Treasury**: Base operating currency (BDT, USD, EUR, GBP) and real-time live FX rate conversion.
- **Appearance**: Instant toggle between Light Mode and Dark Mode with full UI persistence.

---

## Role-Based Access Control (RBAC) & Security

ApexERP provides 11 distinct enterprise user roles, organized into 5 functional categories:

| Category | Role | Access Level | Description |
|---|---|---|---|
| **Executive** | **Super Admin** | Unrestricted Full Access | Complete administrative authority over all modules, branches, and system settings. |
| **Executive** | **System Admin** | Full Technical Access | Infrastructure management, user provisioning, audit inspection, and configuration. |
| **Executive** | **CEO** | Executive Governance | Global visibility, executive override, capex approvals, and strategic oversight. |
| **Finance** | **CFO** | Financial Authority | Double-entry journal sign-off, budget approvals, treasury management, and financial reporting. |
| **Finance** | **Finance Manager** | Operational Accounting | Day-to-day invoice issuance, journal voucher posting, and accounts payable/receivable. |
| **Operations** | **Operations Director**| Supply Chain Oversight | Oversight across inventory, procurement, manufacturing orders, and operational workflows. |
| **Operations** | **Inventory Manager** | Inventory Control | Stock adjustments, warehouse balance management, and ROP/EOQ optimization. |
| **Operations** | **Procurement Officer**| Purchasing Management | Supplier directory management and Purchase Order creation up to authorized limits. |
| **HR** | **HR Manager** | Personnel & Payroll | Employee directory maintenance and monthly payroll batch execution. |
| **Governance**| **Internal Auditor** | **Strict Read-Only** | Full visibility across all modules for compliance checking; all mutating actions locked. |
| **Governance**| **External Tax Auditor**| **Strict Read-Only** | Dedicated compliance role for regulatory review (NBR/IRS); all mutating actions locked. |

### Read-Only Auditor Mode
When switched to **Internal Auditor** or **External Tax Auditor**:
- Clear, prominent **Auditor Verification Mode Banners** display across every module.
- All action triggers (e.g., *Adjust Stock*, *New Journal Voucher*, *Generate PO*, *Process Payroll*, *Approve Workflow*) are replaced with locked, descriptive compliance badges.
- Data export capabilities remain active to enable formal audit extraction.

---

## Technology Stack

### Backend
- **Node.js 22+ & Express 4**: Modular REST API with route controllers in `/src/server`.
- **Security Middleware**:
  - In-memory sliding-window rate limiter (180 reads/min, 60 writes/min with `Retry-After: 60`).
  - Strict security headers (`X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`).
  - Request body limits (1MB) to prevent Denial of Service memory exhaustion.
  - Centralized error handler suppressing sensitive server stack traces.
- **Build Tooling**: `esbuild` compiling `server.ts` into a self-contained CommonJS artifact (`dist/server.cjs`).

### Frontend
- **React 19 & TypeScript 5.8**: Functional components with strict typing across all ERP domain objects.
- **Vite 6**: Next-generation frontend bundling and development server.
- **Tailwind CSS 4**: Utility-first responsive styling with light and dark mode theme switching.
- **Lucide Icons**: Consistent, semantic vector icons.
- **Recharts 3**: Composable charting library for financial and operational metrics.
- **Motion**: Fluid route transitions and micro-interactions.
- **jsPDF & jsPDF-AutoTable**: Client-side production-grade PDF document rendering.

---

## Project Directory Structure

```
.
├── dist/                         # Compiled production assets & server.cjs
├── src/
│   ├── components/
│   │   ├── accounting/           # Expense budget manager and financial components
│   │   ├── dashboard/            # Executive KPI widgets and chart components
│   │   ├── layout/               # Header, Sidebar, Role Switcher, and Nav
│   │   ├── modules/              # 13 core functional ERP domain views
│   │   │   ├── inventory/        # Predictive forecasting (EOQ/ROP) engine
│   │   │   ├── AccountingView.tsx
│   │   │   ├── AuditView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── HRPayrollView.tsx
│   │   │   ├── InventoryView.tsx
│   │   │   ├── ManufacturingView.tsx
│   │   │   ├── OrganizationView.tsx
│   │   │   ├── ProcurementView.tsx
│   │   │   ├── ProductsView.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   ├── SalesView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── WorkflowsView.tsx
│   │   └── ui/                   # Reusable atomic UI (DataTable, Modal, Badge, PermissionGate)
│   ├── lib/
│   │   ├── api.ts                # Client API abstraction & fetch wrappers
│   │   ├── csvExport.ts          # Generic tabular CSV data exporter
│   │   ├── currency.ts           # Multi-currency formatting & live FX rate conversions
│   │   ├── i18n.ts               # Currency, date, and number localization (BDT/USD)
│   │   ├── pdfExport.ts          # jsPDF document generator for invoices & financial reports
│   │   ├── permissions.ts        # RBAC role profiles, permission checks, and auditor guards
│   │   └── theme.ts              # Light / Dark mode persistence and DOM application
│   ├── server/
│   │   ├── apiRoutes.ts          # Express REST API v1 endpoints
│   │   └── erpDatabase.ts        # In-memory transactional ERP state & business logic
│   ├── types/
│   │   └── erp.ts                # Comprehensive TypeScript interfaces for all ERP entities
│   ├── App.tsx                   # Top-level state orchestration, routing, and module switching
│   ├── index.css                 # Global styles & Tailwind CSS imports
│   └── main.tsx                  # Client application entry point
├── index.html                    # HTML root entry point with metadata tags
├── metadata.json                 # AI Studio application configuration
├── package.json                  # Dependencies, build scripts, and engine specifications
├── server.ts                     # Express server entry point & security middleware
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite build and plugin configuration
```

---

## REST API Reference

The server exposes hardened REST endpoints under `/api/v1/`:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Server liveness, uptime, and security posture check |
| `/ready` | `GET` | Readiness probe confirming database connectivity |
| `/api/health` | `GET` | Internal core health endpoint |
| `/api/v1/meta` | `GET` | System overview, active currency, and summary metrics |
| `/api/v1/organization` | `GET`, `POST` | Organizational hierarchy, subsidiaries, and branches |
| `/api/v1/products` | `GET`, `POST` | Product master, SKU definitions, and cost prices |
| `/api/v1/inventory` | `GET` | Current stock balances across all warehouses |
| `/api/v1/inventory/adjust` | `POST` | Submit a stock adjustment with audit reason |
| `/api/v1/inventory/forecast` | `GET` | EOQ and ROP predictive inventory forecasting analysis |
| `/api/v1/purchase-orders` | `GET`, `POST` | Purchase orders list and PO generation |
| `/api/v1/invoices` | `GET`, `POST` | Sales invoices list and invoice creation |
| `/api/v1/accounts` | `GET` | Chart of Accounts ledger list |
| `/api/v1/journals` | `GET`, `POST` | Double-entry journal vouchers |
| `/api/v1/budgets` | `GET`, `POST` | Monthly expense budgets and actual expenditure |
| `/api/v1/payroll` | `GET`, `POST` | Employee list and monthly payroll run processing |
| `/api/v1/manufacturing` | `GET`, `POST` | BOM definitions and Manufacturing Order creation |
| `/api/v1/workflows` | `GET`, `POST` | Approval requests, approvals, and rejections |
| `/api/v1/audit-logs` | `GET` | Immutable system audit trail |
| `/api/v1/settings` | `GET`, `PUT` | System settings, NBR VAT/TDS rates, and localization |
| `/api/v1/currency/rates` | `GET` | Live multi-currency foreign exchange rates |

---

## Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd react-example
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Server
Start the full-stack server (Express backend + Vite middleware on port 3000):
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### Type Checking and Linting
Verify code health and TypeScript types across the entire project:
```bash
npm run lint
```

---

## Production Deployment & Containerization

### Building for Production
The project uses a unified build command that bundles both the static client application and the Node.js backend:
```bash
npm run build
```
This performs:
1. `vite build` — Compiles the React SPA into static assets inside `/dist`.
2. `esbuild server.ts` — Bundles the TypeScript server into a self-contained CommonJS file at `/dist/server.cjs`.

### Running in Production
Launch the precompiled production server:
```bash
npm start
```
The server will bind to `0.0.0.0:3000` and serve both the API endpoints and the static SPA frontend.

---

## Security & Compliance Highlights

1. **Information Disclosure Prevention**: `x-powered-by` header disabled; database connection errors sanitized before response delivery.
2. **Brute Force & DoS Protection**: Sliding-window rate limiting actively mitigates rapid endpoint hammering.
3. **Double-Entry Balance Verification**: Journal vouchers with unbalanced debits and credits are rejected with explicit HTTP 400 validation errors.
4. **Read-Only Verification Guarantees**: Any user operating under an Auditor profile is restricted from issuing state-mutating requests.
5. **Auditing Completeness**: All operational state changes automatically append an entry to the tamper-evident audit ledger.

---

## License

This project is licensed under the MIT License.
