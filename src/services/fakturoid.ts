/**
 * Fakturoid API v3 Integration Service
 *
 * Handles OAuth 2.0 authentication and data fetching from Fakturoid
 * Fakturoid is a Czech invoicing/accounting software
 *
 * API Documentation: https://www.fakturoid.cz/api/v3
 *
 * Available endpoints:
 * - Invoices (issued, proformas, corrections)
 * - Expenses (received bills)
 * - Subjects (customers/vendors)
 * - Bank Accounts
 * - Inventory Items
 * - Events (activity log)
 * - Todos
 */

import * as db from '../database';

// Fakturoid API Base URL
const FAKTUROID_API_BASE = 'https://app.fakturoid.cz/api/v3';
const FAKTUROID_OAUTH_URL = `${FAKTUROID_API_BASE}/oauth/token`;

/**
 * Credentials interface for Fakturoid API (OAuth 2.0)
 */
interface FakturoidCredentials {
  clientId: string;
  clientSecret: string;
  accountSlug: string; // The account "slug" (URL identifier)
  accessToken?: string;
  tokenExpiresAt?: number;
}

/**
 * Invoice from Fakturoid API
 */
interface FakturoidInvoice {
  id: number;
  custom_id?: string;
  document_type: 'invoice' | 'proforma' | 'correction' | 'tax_document';
  number: string;
  variable_symbol?: string;
  your_name?: string;
  your_street?: string;
  your_city?: string;
  your_zip?: string;
  your_country?: string;
  your_registration_no?: string;
  your_vat_no?: string;
  client_name?: string;
  client_street?: string;
  client_city?: string;
  client_zip?: string;
  client_country?: string;
  client_registration_no?: string;
  client_vat_no?: string;
  subject_id?: number;
  subtotal: number;
  total: number;
  native_subtotal: number;
  native_total: number;
  remaining_amount: number;
  remaining_native_amount: number;
  paid_amount?: number;
  currency: string;
  exchange_rate?: number;
  payment_method?: string;
  bank_account?: string;
  iban?: string;
  swift_bic?: string;
  issued_on: string;
  taxable_fulfillment_due?: string;
  due_on: string;
  paid_on?: string;
  sent_at?: string;
  cancelled_at?: string;
  status: 'open' | 'sent' | 'overdue' | 'paid' | 'cancelled';
  note?: string;
  footer_note?: string;
  lines: FakturoidInvoiceLine[];
  created_at: string;
  updated_at: string;
}

interface FakturoidInvoiceLine {
  id: number;
  name: string;
  quantity: number;
  unit_name?: string;
  unit_price: number;
  vat_rate: number;
  unit_price_without_vat: number;
  unit_price_with_vat: number;
}

/**
 * Expense (received bill) from Fakturoid API
 */
interface FakturoidExpense {
  id: number;
  custom_id?: string;
  number?: string;
  original_number?: string;
  variable_symbol?: string;
  supplier_name?: string;
  supplier_street?: string;
  supplier_city?: string;
  supplier_zip?: string;
  supplier_country?: string;
  supplier_registration_no?: string;
  supplier_vat_no?: string;
  subject_id?: number;
  subtotal: number;
  total: number;
  native_subtotal: number;
  native_total: number;
  remaining_amount: number;
  remaining_native_amount: number;
  currency: string;
  exchange_rate?: number;
  payment_method?: string;
  issued_on: string;
  taxable_fulfillment_due?: string;
  due_on?: string;
  paid_on?: string;
  status: 'open' | 'overdue' | 'paid';
  lines: FakturoidExpenseLine[];
  created_at: string;
  updated_at: string;
}

interface FakturoidExpenseLine {
  id: number;
  name: string;
  quantity: number;
  unit_name?: string;
  unit_price: number;
  vat_rate: number;
}

/**
 * Subject (contact/customer) from Fakturoid API
 */
interface FakturoidSubject {
  id: number;
  custom_id?: string;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country?: string;
  registration_no?: string;
  vat_no?: string;
  local_vat_no?: string;
  bank_account?: string;
  iban?: string;
  swift_bic?: string;
  full_name?: string;
  email?: string;
  email_copy?: string;
  phone?: string;
  web?: string;
  private_note?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Bank Account from Fakturoid API
 */
interface FakturoidBankAccount {
  id: number;
  name: string;
  number: string;
  currency: string;
  iban?: string;
  swift_bic?: string;
  pairing: boolean;
  payment_adjustment: boolean;
}

/**
 * Event from Fakturoid API
 */
interface FakturoidEvent {
  id: number;
  name: string;
  created_at: string;
  invoice_id?: number;
  subject_id?: number;
  text?: string;
}

/**
 * Inventory Item from Fakturoid API
 */
interface FakturoidInventoryItem {
  id: number;
  name: string;
  sku?: string;
  article_number?: string;
  unit_name?: string;
  native_purchase_price?: number;
  native_retail_price?: number;
  track_quantity: boolean;
  quantity?: number;
  native_retail_price_without_vat?: number;
  native_retail_price_with_vat?: number;
  vat_rate?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Account info from Fakturoid API
 */
interface FakturoidAccount {
  subdomain: string;
  plan: string;
  plan_price: number;
  email: string;
  invoice_email?: string;
  phone?: string;
  web?: string;
  name: string;
  full_name?: string;
  registration_no?: string;
  vat_no?: string;
  vat_mode?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  country?: string;
  bank_account?: string;
  iban?: string;
  swift_bic?: string;
  currency: string;
  unit_name?: string;
  vat_rate?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get stored credentials for a company from database
 */
export function getCredentials(companyId: number): FakturoidCredentials {
  const connection = db.getAccountingConnection(companyId);

  if (!connection || connection.software_type !== 'fakturoid') {
    throw new Error('No Fakturoid connection found for this company');
  }

  if (!connection.api_credentials) {
    throw new Error('Fakturoid API credentials not configured');
  }

  const credentials = JSON.parse(connection.api_credentials);

  if (!credentials.clientId || !credentials.clientSecret || !credentials.accountSlug) {
    throw new Error('Incomplete Fakturoid credentials');
  }

  return {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    accountSlug: credentials.accountSlug,
    accessToken: credentials.accessToken,
    tokenExpiresAt: credentials.tokenExpiresAt,
  };
}

/**
 * Get OAuth access token using Client Credentials flow
 */
async function getAccessToken(credentials: FakturoidCredentials): Promise<string> {
  // Check if we have a valid cached token
  if (credentials.accessToken && credentials.tokenExpiresAt) {
    const now = Date.now();
    // Token is valid if it expires more than 5 minutes from now
    if (credentials.tokenExpiresAt > now + 5 * 60 * 1000) {
      return credentials.accessToken;
    }
  }

  // Request new token
  const basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

  const response = await fetch(FAKTUROID_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fakturoid OAuth error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in?: number };
  const accessToken = data.access_token;
  const expiresIn = data.expires_in || 7200; // Default 2 hours
  const tokenExpiresAt = Date.now() + expiresIn * 1000;

  // Cache the token (update in memory for this session)
  credentials.accessToken = accessToken;
  credentials.tokenExpiresAt = tokenExpiresAt;

  return accessToken;
}

/**
 * Make authenticated API request to Fakturoid
 */
async function makeApiRequest(
  credentials: FakturoidCredentials,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const accessToken = await getAccessToken(credentials);
  const url = `${FAKTUROID_API_BASE}/accounts/${credentials.accountSlug}/${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Lenduck/1.0 (podpora@lenduck.com)', // Required by Fakturoid
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fakturoid API error: ${response.status} - ${error}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text);
}

/**
 * Fetch paginated data from Fakturoid
 */
async function fetchPaginated<T>(
  credentials: FakturoidCredentials,
  endpoint: string,
  maxPages: number = 50
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const items = await makeApiRequest(credentials, `${endpoint}${separator}page=${page}`);

    if (!items || items.length === 0) {
      hasMore = false;
    } else {
      allItems.push(...items);
      // Fakturoid returns up to 100 items per page
      if (items.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allItems;
}

/**
 * Test connection to Fakturoid API
 */
export async function testConnection(companyId: number): Promise<boolean> {
  try {
    const credentials = getCredentials(companyId);
    await getAccessToken(credentials);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch account info
 */
export async function fetchAccountInfo(companyId: number): Promise<FakturoidAccount> {
  const credentials = getCredentials(companyId);
  // Account info is at a slightly different endpoint
  const accessToken = await getAccessToken(credentials);
  const url = `${FAKTUROID_API_BASE}/accounts/${credentials.accountSlug}.json`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Lenduck/1.0 (podpora@lenduck.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account info: ${response.status}`);
  }

  return response.json() as Promise<FakturoidAccount>;
}

/**
 * Fetch all invoices
 */
export async function fetchInvoices(companyId: number): Promise<FakturoidInvoice[]> {
  const credentials = getCredentials(companyId);
  return fetchPaginated<FakturoidInvoice>(credentials, 'invoices.json');
}

/**
 * Fetch all expenses (received bills)
 */
export async function fetchExpenses(companyId: number): Promise<FakturoidExpense[]> {
  const credentials = getCredentials(companyId);
  return fetchPaginated<FakturoidExpense>(credentials, 'expenses.json');
}

/**
 * Fetch all subjects (contacts)
 */
export async function fetchSubjects(companyId: number): Promise<FakturoidSubject[]> {
  const credentials = getCredentials(companyId);
  return fetchPaginated<FakturoidSubject>(credentials, 'subjects.json');
}

/**
 * Fetch bank accounts
 */
export async function fetchBankAccounts(companyId: number): Promise<FakturoidBankAccount[]> {
  const credentials = getCredentials(companyId);
  return makeApiRequest(credentials, 'bank_accounts.json') || [];
}

/**
 * Fetch events (activity log)
 */
export async function fetchEvents(companyId: number): Promise<FakturoidEvent[]> {
  const credentials = getCredentials(companyId);
  return fetchPaginated<FakturoidEvent>(credentials, 'events.json');
}

/**
 * Fetch inventory items
 */
export async function fetchInventoryItems(companyId: number): Promise<FakturoidInventoryItem[]> {
  const credentials = getCredentials(companyId);
  return fetchPaginated<FakturoidInventoryItem>(credentials, 'inventory_items.json');
}

/**
 * Sync invoices (issued) from Fakturoid to database
 */
export async function syncInvoices(companyId: number): Promise<number> {
  const invoices = await fetchInvoices(companyId);
  let count = 0;

  for (const invoice of invoices) {
    // Skip cancelled invoices
    if (invoice.status === 'cancelled') continue;

    db.upsertInvoice({
      company_id: companyId,
      external_id: `fkt_inv_${invoice.id}`,
      invoice_type: 'issued',
      invoice_number: invoice.number,
      customer_name: invoice.client_name,
      customer_id: invoice.subject_id?.toString(),
      issue_date: invoice.issued_on,
      due_date: invoice.due_on,
      total_amount: invoice.native_total,
      balance_due: invoice.remaining_native_amount,
      currency: invoice.currency,
      status: invoice.status === 'paid' ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(invoice),
    });
    count++;
  }

  return count;
}

/**
 * Sync expenses (received bills) from Fakturoid to database
 */
export async function syncExpenses(companyId: number): Promise<number> {
  const expenses = await fetchExpenses(companyId);
  let count = 0;

  for (const expense of expenses) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `fkt_exp_${expense.id}`,
      invoice_type: 'received',
      invoice_number: expense.original_number || expense.number || `EXP-${expense.id}`,
      customer_name: expense.supplier_name,
      customer_id: expense.subject_id?.toString(),
      issue_date: expense.issued_on,
      due_date: expense.due_on,
      total_amount: expense.native_total,
      balance_due: expense.remaining_native_amount,
      currency: expense.currency,
      status: expense.status === 'paid' ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(expense),
    });
    count++;
  }

  return count;
}

/**
 * Sync subjects (contacts) from Fakturoid to database
 * We'll store them as accounts for reference
 */
export async function syncSubjects(companyId: number): Promise<number> {
  const subjects = await fetchSubjects(companyId);
  let count = 0;

  for (const subject of subjects) {
    // Create a synthetic account for each contact
    db.upsertAccount({
      company_id: companyId,
      external_id: `fkt_subj_${subject.id}`,
      name: subject.name,
      account_type: subject.type === 'customer' ? 'Accounts Receivable' :
                    subject.type === 'supplier' ? 'Accounts Payable' : 'Other',
      account_sub_type: subject.type,
      account_number: subject.registration_no || subject.custom_id,
      current_balance: 0,
      currency: 'CZK',
      is_active: true,
    });
    count++;
  }

  return count;
}

/**
 * Sync bank accounts from Fakturoid to database
 */
export async function syncBankAccounts(companyId: number): Promise<number> {
  const bankAccounts = await fetchBankAccounts(companyId);
  let count = 0;

  for (const account of bankAccounts) {
    db.upsertAccount({
      company_id: companyId,
      external_id: `fkt_bank_${account.id}`,
      name: account.name,
      account_type: 'Bank',
      account_sub_type: 'Checking',
      account_number: account.number,
      current_balance: 0, // Fakturoid doesn't provide balance
      currency: account.currency,
      is_active: true,
    });
    count++;
  }

  return count;
}

/**
 * Sync inventory items from Fakturoid to database
 */
export async function syncInventory(companyId: number): Promise<number> {
  const items = await fetchInventoryItems(companyId);
  let count = 0;

  for (const item of items) {
    db.upsertAccount({
      company_id: companyId,
      external_id: `fkt_inv_item_${item.id}`,
      name: item.name,
      account_type: 'Inventory',
      account_sub_type: 'Product',
      account_number: item.sku || item.article_number,
      current_balance: (item.quantity || 0) * (item.native_purchase_price || 0),
      currency: 'CZK',
      is_active: true,
    });
    count++;
  }

  return count;
}

/**
 * Calculate and save financial metrics from synced data
 */
export async function calculateAndSaveMetrics(companyId: number): Promise<any> {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  // Get invoices from database
  const invoices = db.getInvoicesByCompany(companyId);

  let revenue = 0;
  let expenses = 0;
  let accountsReceivable = 0;
  let accountsPayable = 0;
  let totalRevenueDays = 0;
  let totalPayableDays = 0;
  let receivableCount = 0;
  let payableCount = 0;

  for (const inv of invoices) {
    if (inv.invoice_type === 'issued') {
      revenue += inv.total_amount || 0;
      if (inv.balance_due > 0) {
        accountsReceivable += inv.balance_due;
        if (inv.issue_date) {
          const issueDate = new Date(inv.issue_date);
          const daysOut = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalRevenueDays += daysOut * inv.total_amount;
          receivableCount += inv.total_amount;
        }
      }
    } else {
      expenses += inv.total_amount || 0;
      if (inv.balance_due > 0) {
        accountsPayable += inv.balance_due;
        if (inv.issue_date) {
          const issueDate = new Date(inv.issue_date);
          const daysOut = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalPayableDays += daysOut * inv.total_amount;
          payableCount += inv.total_amount;
        }
      }
    }
  }

  const netIncome = revenue - expenses;
  const dsoDays = receivableCount > 0 ? totalRevenueDays / receivableCount : 0;
  const dpoDays = payableCount > 0 ? totalPayableDays / payableCount : 0;

  // Calculate ratios
  const currentAssets = accountsReceivable;
  const currentLiabilities = accountsPayable;
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  const metrics = {
    company_id: companyId,
    metric_date: endDate,
    revenue,
    expenses,
    net_income: netIncome,
    gross_profit: netIncome,
    total_assets: currentAssets,
    total_liabilities: currentLiabilities,
    total_equity: netIncome,
    current_assets: currentAssets,
    current_liabilities: currentLiabilities,
    accounts_receivable: accountsReceivable,
    accounts_payable: accountsPayable,
    cash_balance: 0,
    current_ratio: currentRatio,
    quick_ratio: currentRatio,
    debt_to_equity: currentLiabilities > 0 && netIncome > 0 ? currentLiabilities / netIncome : 0,
    dso_days: dsoDays,
    dpo_days: dpoDays,
  };

  db.saveFinancialMetrics(metrics);

  return metrics;
}

/**
 * Full sync - sync all data from Fakturoid
 */
export async function fullSync(companyId: number): Promise<{
  invoices: number;
  expenses: number;
  subjects: number;
  bankAccounts: number;
  inventory: number;
  metrics: any;
}> {
  // Create sync log
  const syncLog = db.createSyncLog({
    company_id: companyId,
    sync_type: 'full',
    status: 'in_progress',
  });

  try {
    // Sync all data types
    const invoiceCount = await syncInvoices(companyId);
    const expenseCount = await syncExpenses(companyId);
    const subjectCount = await syncSubjects(companyId);
    const bankAccountCount = await syncBankAccounts(companyId);
    const inventoryCount = await syncInventory(companyId);

    // Calculate metrics
    const metrics = await calculateAndSaveMetrics(companyId);

    // Update connection
    db.updateAccountingConnection(companyId, {
      last_sync_at: new Date().toISOString(),
      status: 'connected',
    });

    // Update sync log
    const totalRecords = invoiceCount + expenseCount + subjectCount + bankAccountCount + inventoryCount;
    db.updateSyncLog(syncLog.lastInsertRowid as number, {
      status: 'completed',
      records_synced: totalRecords,
    });

    return {
      invoices: invoiceCount,
      expenses: expenseCount,
      subjects: subjectCount,
      bankAccounts: bankAccountCount,
      inventory: inventoryCount,
      metrics,
    };
  } catch (error: any) {
    db.updateSyncLog(syncLog.lastInsertRowid as number, {
      status: 'failed',
      error_message: error.message,
    });
    throw error;
  }
}

/**
 * Save API credentials for a company
 */
export function saveCredentials(
  companyId: number,
  clientId: string,
  clientSecret: string,
  accountSlug: string
): void {
  const credentials = JSON.stringify({
    clientId,
    clientSecret,
    accountSlug,
  });

  db.updateAccountingConnection(companyId, {
    api_credentials: credentials,
    status: 'pending',
  });
}
