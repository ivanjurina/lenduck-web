import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(__dirname, '..', 'lenduck.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS waitlist_sme (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    accounting_software TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS waitlist_partner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    partner_type TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    user_agent TEXT,
    page_visited TEXT,
    referrer TEXT,
    visited_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Companies table
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    business_id TEXT,
    country TEXT DEFAULT 'CZ',
    currency TEXT DEFAULT 'CZK',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Accounting software connections
  CREATE TABLE IF NOT EXISTS accounting_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    software_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TEXT,
    realm_id TEXT,
    api_credentials TEXT,
    last_sync_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- For users who select "Other" accounting software
  CREATE TABLE IF NOT EXISTS software_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    software_name TEXT NOT NULL,
    additional_info TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Chart of Accounts
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    external_id TEXT,
    name TEXT NOT NULL,
    account_type TEXT,
    account_sub_type TEXT,
    account_number TEXT,
    current_balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'CZK',
    is_active INTEGER DEFAULT 1,
    synced_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Invoices (both issued and received)
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    external_id TEXT,
    invoice_type TEXT NOT NULL,
    invoice_number TEXT,
    customer_name TEXT,
    customer_id TEXT,
    issue_date TEXT,
    due_date TEXT,
    total_amount REAL,
    balance_due REAL,
    currency TEXT DEFAULT 'CZK',
    status TEXT,
    synced_at TEXT,
    raw_data TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Bank Transactions
  CREATE TABLE IF NOT EXISTS bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    external_id TEXT,
    account_id INTEGER,
    transaction_date TEXT,
    amount REAL,
    transaction_type TEXT,
    description TEXT,
    payee TEXT,
    category TEXT,
    is_reconciled INTEGER DEFAULT 0,
    synced_at TEXT,
    raw_data TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  -- Journal Entries
  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    external_id TEXT,
    entry_date TEXT,
    entry_number TEXT,
    memo TEXT,
    total_debit REAL,
    total_credit REAL,
    synced_at TEXT,
    raw_data TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Cached Financial Reports
  CREATE TABLE IF NOT EXISTS financial_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    report_type TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    report_data TEXT,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Financial Metrics (calculated)
  CREATE TABLE IF NOT EXISTS financial_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    metric_date TEXT,
    revenue REAL,
    expenses REAL,
    net_income REAL,
    gross_profit REAL,
    total_assets REAL,
    total_liabilities REAL,
    total_equity REAL,
    current_assets REAL,
    current_liabilities REAL,
    accounts_receivable REAL,
    accounts_payable REAL,
    cash_balance REAL,
    current_ratio REAL,
    quick_ratio REAL,
    debt_to_equity REAL,
    dso_days REAL,
    dpo_days REAL,
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Data Sync Log
  CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    sync_type TEXT,
    status TEXT,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
`);

// Password hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// User functions
export function createUser(email: string, password: string, isAdmin: boolean = false) {
  const passwordHash = hashPassword(password);
  const stmt = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)');
  return stmt.run(email.toLowerCase(), passwordHash, isAdmin ? 1 : 0);
}

export function createPendingUser(email: string) {
  const stmt = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, NULL, 0)');
  return stmt.run(email.toLowerCase());
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase()) as any;
}

export function getUserById(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as any;
}

export function validateUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return user;
}

export function getUserCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  return (stmt.get() as any).count;
}

// SME Waitlist functions
export function addSMEToWaitlist(data: {
  company_name: string;
  email: string;
  phone?: string;
  accounting_software?: string;
  message?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO waitlist_sme (company_name, email, phone, accounting_software, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.company_name, data.email.toLowerCase(), data.phone || null, data.accounting_software || null, data.message || null);
}

export function getSMEByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM waitlist_sme WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

export function getSMEWaitlist(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM waitlist_sme ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getSMECount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM waitlist_sme');
  return (stmt.get() as any).count;
}

// Partner Waitlist functions
export function addPartnerToWaitlist(data: {
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  partner_type?: string;
  message?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO waitlist_partner (company_name, contact_name, email, phone, partner_type, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.company_name, data.contact_name || null, data.email.toLowerCase(), data.phone || null, data.partner_type || null, data.message || null);
}

export function getPartnerByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM waitlist_partner WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

export function getPartnerWaitlist(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM waitlist_partner ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getPartnerCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM waitlist_partner');
  return (stmt.get() as any).count;
}

// Visitor tracking functions
export function trackVisitor(data: {
  ip_address?: string;
  user_agent?: string;
  page_visited: string;
  referrer?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO visitors (ip_address, user_agent, page_visited, referrer)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(data.ip_address || null, data.user_agent || null, data.page_visited, data.referrer || null);
}

export function getRecentVisitors(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM visitors ORDER BY visited_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getTotalVisitors() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM visitors');
  return (stmt.get() as any).count;
}

export function getTodayVisitors() {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM visitors WHERE date(visited_at) = date('now')`);
  return (stmt.get() as any).count;
}

// Company functions
export function createCompany(data: {
  user_id: number;
  name: string;
  business_id?: string;
  country?: string;
  currency?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO companies (user_id, name, business_id, country, currency)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.user_id,
    data.name,
    data.business_id || null,
    data.country || 'CZ',
    data.currency || 'CZK'
  );
}

export function getCompaniesByUserId(userId: number) {
  const stmt = db.prepare('SELECT * FROM companies WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as any[];
}

export function getCompanyById(id: number) {
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  return stmt.get(id) as any;
}

export function getCompanyWithConnection(companyId: number) {
  const stmt = db.prepare(`
    SELECT c.*, ac.software_type, ac.status as connection_status, ac.last_sync_at
    FROM companies c
    LEFT JOIN accounting_connections ac ON c.id = ac.company_id
    WHERE c.id = ?
  `);
  return stmt.get(companyId) as any;
}

// Accounting Connection functions
export type SoftwareType = 'quickbooks' | 'xero' | 'flexibee' | 'pohoda' | 'idoklad' | 'profit365' | 'fakturoid' | 'other';

export function createAccountingConnection(data: {
  company_id: number;
  software_type: SoftwareType;
  status?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  realm_id?: string;
  api_credentials?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO accounting_connections (company_id, software_type, status, access_token, refresh_token, token_expires_at, realm_id, api_credentials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.company_id,
    data.software_type,
    data.status || 'pending',
    data.access_token || null,
    data.refresh_token || null,
    data.token_expires_at || null,
    data.realm_id || null,
    data.api_credentials || null
  );
}

export function getAccountingConnection(companyId: number) {
  const stmt = db.prepare('SELECT * FROM accounting_connections WHERE company_id = ?');
  return stmt.get(companyId) as any;
}

export function updateAccountingConnection(companyId: number, data: {
  status?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  realm_id?: string;
  api_credentials?: string;
  last_sync_at?: string;
}) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.access_token !== undefined) { fields.push('access_token = ?'); values.push(data.access_token); }
  if (data.refresh_token !== undefined) { fields.push('refresh_token = ?'); values.push(data.refresh_token); }
  if (data.token_expires_at !== undefined) { fields.push('token_expires_at = ?'); values.push(data.token_expires_at); }
  if (data.realm_id !== undefined) { fields.push('realm_id = ?'); values.push(data.realm_id); }
  if (data.api_credentials !== undefined) { fields.push('api_credentials = ?'); values.push(data.api_credentials); }
  if (data.last_sync_at !== undefined) { fields.push('last_sync_at = ?'); values.push(data.last_sync_at); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(companyId);

  const stmt = db.prepare(`UPDATE accounting_connections SET ${fields.join(', ')} WHERE company_id = ?`);
  return stmt.run(...values);
}

// Software Request (for "Other" option)
export function createSoftwareRequest(data: {
  company_id: number;
  software_name: string;
  additional_info?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO software_requests (company_id, software_name, additional_info)
    VALUES (?, ?, ?)
  `);
  return stmt.run(data.company_id, data.software_name, data.additional_info || null);
}

export function getSoftwareRequests() {
  const stmt = db.prepare(`
    SELECT sr.*, c.name as company_name, u.email as user_email
    FROM software_requests sr
    JOIN companies c ON sr.company_id = c.id
    JOIN users u ON c.user_id = u.id
    ORDER BY sr.created_at DESC
  `);
  return stmt.all() as any[];
}

// Invoice functions
export function upsertInvoice(data: {
  company_id: number;
  external_id: string;
  invoice_type: 'issued' | 'received';
  invoice_number?: string;
  customer_name?: string;
  customer_id?: string;
  issue_date?: string;
  due_date?: string;
  total_amount?: number;
  balance_due?: number;
  currency?: string;
  status?: string;
  raw_data?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO invoices (company_id, external_id, invoice_type, invoice_number, customer_name, customer_id, issue_date, due_date, total_amount, balance_due, currency, status, synced_at, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(company_id, external_id) DO UPDATE SET
      invoice_number = excluded.invoice_number,
      customer_name = excluded.customer_name,
      customer_id = excluded.customer_id,
      issue_date = excluded.issue_date,
      due_date = excluded.due_date,
      total_amount = excluded.total_amount,
      balance_due = excluded.balance_due,
      currency = excluded.currency,
      status = excluded.status,
      synced_at = CURRENT_TIMESTAMP,
      raw_data = excluded.raw_data
  `);
  return stmt.run(
    data.company_id,
    data.external_id,
    data.invoice_type,
    data.invoice_number || null,
    data.customer_name || null,
    data.customer_id || null,
    data.issue_date || null,
    data.due_date || null,
    data.total_amount || null,
    data.balance_due || null,
    data.currency || 'CZK',
    data.status || null,
    data.raw_data || null
  );
}

export function getInvoicesByCompany(companyId: number, type?: 'issued' | 'received') {
  if (type) {
    const stmt = db.prepare('SELECT * FROM invoices WHERE company_id = ? AND invoice_type = ? ORDER BY issue_date DESC');
    return stmt.all(companyId, type) as any[];
  }
  const stmt = db.prepare('SELECT * FROM invoices WHERE company_id = ? ORDER BY issue_date DESC');
  return stmt.all(companyId) as any[];
}

// Bank Transaction functions
export function upsertBankTransaction(data: {
  company_id: number;
  external_id: string;
  account_id?: number;
  transaction_date?: string;
  amount?: number;
  transaction_type?: string;
  description?: string;
  payee?: string;
  category?: string;
  is_reconciled?: boolean;
  raw_data?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO bank_transactions (company_id, external_id, account_id, transaction_date, amount, transaction_type, description, payee, category, is_reconciled, synced_at, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(company_id, external_id) DO UPDATE SET
      account_id = excluded.account_id,
      transaction_date = excluded.transaction_date,
      amount = excluded.amount,
      transaction_type = excluded.transaction_type,
      description = excluded.description,
      payee = excluded.payee,
      category = excluded.category,
      is_reconciled = excluded.is_reconciled,
      synced_at = CURRENT_TIMESTAMP,
      raw_data = excluded.raw_data
  `);
  return stmt.run(
    data.company_id,
    data.external_id,
    data.account_id || null,
    data.transaction_date || null,
    data.amount || null,
    data.transaction_type || null,
    data.description || null,
    data.payee || null,
    data.category || null,
    data.is_reconciled ? 1 : 0,
    data.raw_data || null
  );
}

export function getBankTransactionsByCompany(companyId: number, limit: number = 100) {
  const stmt = db.prepare('SELECT * FROM bank_transactions WHERE company_id = ? ORDER BY transaction_date DESC LIMIT ?');
  return stmt.all(companyId, limit) as any[];
}

// Account functions
export function upsertAccount(data: {
  company_id: number;
  external_id: string;
  name: string;
  account_type?: string;
  account_sub_type?: string;
  account_number?: string;
  current_balance?: number;
  currency?: string;
  is_active?: boolean;
}) {
  const stmt = db.prepare(`
    INSERT INTO accounts (company_id, external_id, name, account_type, account_sub_type, account_number, current_balance, currency, is_active, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(company_id, external_id) DO UPDATE SET
      name = excluded.name,
      account_type = excluded.account_type,
      account_sub_type = excluded.account_sub_type,
      account_number = excluded.account_number,
      current_balance = excluded.current_balance,
      currency = excluded.currency,
      is_active = excluded.is_active,
      synced_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    data.company_id,
    data.external_id,
    data.name,
    data.account_type || null,
    data.account_sub_type || null,
    data.account_number || null,
    data.current_balance || 0,
    data.currency || 'CZK',
    data.is_active !== false ? 1 : 0
  );
}

export function getAccountsByCompany(companyId: number) {
  const stmt = db.prepare('SELECT * FROM accounts WHERE company_id = ? ORDER BY account_type, name');
  return stmt.all(companyId) as any[];
}

// Financial Metrics functions
export function saveFinancialMetrics(data: {
  company_id: number;
  metric_date: string;
  revenue?: number;
  expenses?: number;
  net_income?: number;
  gross_profit?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
  current_assets?: number;
  current_liabilities?: number;
  accounts_receivable?: number;
  accounts_payable?: number;
  cash_balance?: number;
  current_ratio?: number;
  quick_ratio?: number;
  debt_to_equity?: number;
  dso_days?: number;
  dpo_days?: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO financial_metrics (company_id, metric_date, revenue, expenses, net_income, gross_profit, total_assets, total_liabilities, total_equity, current_assets, current_liabilities, accounts_receivable, accounts_payable, cash_balance, current_ratio, quick_ratio, debt_to_equity, dso_days, dpo_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.company_id,
    data.metric_date,
    data.revenue || null,
    data.expenses || null,
    data.net_income || null,
    data.gross_profit || null,
    data.total_assets || null,
    data.total_liabilities || null,
    data.total_equity || null,
    data.current_assets || null,
    data.current_liabilities || null,
    data.accounts_receivable || null,
    data.accounts_payable || null,
    data.cash_balance || null,
    data.current_ratio || null,
    data.quick_ratio || null,
    data.debt_to_equity || null,
    data.dso_days || null,
    data.dpo_days || null
  );
}

export function getLatestMetrics(companyId: number) {
  const stmt = db.prepare('SELECT * FROM financial_metrics WHERE company_id = ? ORDER BY metric_date DESC LIMIT 1');
  return stmt.get(companyId) as any;
}

export function getMetricsHistory(companyId: number, months: number = 12) {
  const stmt = db.prepare(`
    SELECT * FROM financial_metrics
    WHERE company_id = ? AND metric_date >= date('now', '-' || ? || ' months')
    ORDER BY metric_date ASC
  `);
  return stmt.all(companyId, months) as any[];
}

// Financial Reports cache
export function saveFinancialReport(data: {
  company_id: number;
  report_type: string;
  period_start: string;
  period_end: string;
  report_data: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO financial_reports (company_id, report_type, period_start, period_end, report_data)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.company_id, data.report_type, data.period_start, data.period_end, data.report_data);
}

export function getFinancialReport(companyId: number, reportType: string, periodStart: string, periodEnd: string) {
  const stmt = db.prepare(`
    SELECT * FROM financial_reports
    WHERE company_id = ? AND report_type = ? AND period_start = ? AND period_end = ?
    ORDER BY generated_at DESC LIMIT 1
  `);
  return stmt.get(companyId, reportType, periodStart, periodEnd) as any;
}

// Sync Log functions
export function createSyncLog(data: {
  company_id: number;
  sync_type: string;
  status: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO sync_logs (company_id, sync_type, status, started_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
  return stmt.run(data.company_id, data.sync_type, data.status);
}

export function updateSyncLog(id: number, data: {
  status: string;
  records_synced?: number;
  error_message?: string;
}) {
  const stmt = db.prepare(`
    UPDATE sync_logs SET status = ?, records_synced = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(data.status, data.records_synced || 0, data.error_message || null, id);
}

export function getRecentSyncLogs(companyId: number, limit: number = 10) {
  const stmt = db.prepare('SELECT * FROM sync_logs WHERE company_id = ? ORDER BY started_at DESC LIMIT ?');
  return stmt.all(companyId, limit) as any[];
}

// Add unique constraint for upsert operations (run once)
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_company_external ON invoices(company_id, external_id)');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_company_external ON bank_transactions(company_id, external_id)');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_company_external ON accounts(company_id, external_id)');
} catch (e) {
  // Indexes might already exist
}

// Initialize default admin
export function initDefaultAdmin() {
  const admin = getUserByEmail('admin@lenduck.com');
  if (!admin) {
    createUser('admin@lenduck.com', 'admin123', true);
    console.log('Default admin created: admin@lenduck.com / admin123');
  }
}
