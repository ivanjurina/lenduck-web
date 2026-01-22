/**
 * Profit365 API Integration Service
 *
 * Handles API key authentication and data fetching from Profit365
 * Profit365 is a Slovak/Czech cloud-based accounting software
 *
 * API Documentation: https://doc.profit365.eu/developers/en/api/doc/introduction
 */

import * as db from '../database';

// Profit365 API Configuration
// These should be set in environment variables in production
const P365_CLIENT_ID = process.env.P365_CLIENT_ID || '';
const P365_CLIENT_SECRET = process.env.P365_CLIENT_SECRET || '';
const P365_API_BASE = 'https://api.profit365.eu/1.6';

/**
 * Credentials interface for Profit365 API
 */
interface Profit365Credentials {
  clientId: string;
  clientSecret: string;
  companyId: string;
}

/**
 * Invoice data from Profit365 API
 */
interface Profit365Invoice {
  id: string;
  recordNumber: string;
  partnerDetail?: string;
  partnerAddress?: string;
  partnerId?: string;
  dateCreated: string;
  dateValidTo?: string;
  dateAccounting?: string;
  sum?: number;
  sumPaid?: number;
  sumToPay?: number;
  currency1?: string;
  status?: string;
  rows?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Account data from Profit365 API
 */
interface Profit365Account {
  id: string;
  code: string;
  name: string;
  accountType?: string;
  balance?: number;
  currency?: string;
  isActive?: boolean;
}

/**
 * Get credentials for a company from database
 */
export function getCredentials(companyId: number): Profit365Credentials {
  const connection = db.getAccountingConnection(companyId);

  if (!connection || connection.software_type !== 'profit365') {
    throw new Error('No Profit365 connection found for this company');
  }

  if (!connection.api_credentials) {
    throw new Error('Profit365 API credentials not configured');
  }

  const credentials = JSON.parse(connection.api_credentials);

  return {
    clientId: credentials.clientId || P365_CLIENT_ID,
    clientSecret: credentials.clientSecret || P365_CLIENT_SECRET,
    companyId: credentials.companyId,
  };
}

/**
 * Make authenticated API request to Profit365
 */
async function makeApiRequest(
  credentials: Profit365Credentials,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${P365_API_BASE}/${endpoint}`;

  const headers: Record<string, string> = {
    'ClientID': credentials.clientId,
    'ClientSecret': credentials.clientSecret,
    'CompanyID': credentials.companyId,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
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
    throw new Error(`Profit365 API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Test connection to Profit365 API
 */
export async function testConnection(companyId: number): Promise<boolean> {
  const credentials = getCredentials(companyId);

  try {
    // Try to fetch first page of sales invoices to verify connection
    await makeApiRequest(credentials, 'sales/invoices/1');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch sales invoices (issued invoices) with pagination
 */
export async function fetchSalesInvoices(companyId: number, page: number = 1): Promise<Profit365Invoice[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `sales/invoices/${page}`);
  return data || [];
}

/**
 * Fetch all sales invoices (handles pagination)
 */
export async function fetchAllSalesInvoices(companyId: number): Promise<Profit365Invoice[]> {
  const allInvoices: Profit365Invoice[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const invoices = await fetchSalesInvoices(companyId, page);

    if (invoices.length === 0) {
      hasMore = false;
    } else {
      allInvoices.push(...invoices);
      // Profit365 returns 50 items per page by default
      if (invoices.length < 50) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Safety limit to prevent infinite loops
    if (page > 100) {
      hasMore = false;
    }
  }

  return allInvoices;
}

/**
 * Fetch purchase invoices (received invoices/bills) with pagination
 */
export async function fetchPurchaseInvoices(companyId: number, page: number = 1): Promise<Profit365Invoice[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `purchase/invoices/${page}`);
  return data || [];
}

/**
 * Fetch all purchase invoices (handles pagination)
 */
export async function fetchAllPurchaseInvoices(companyId: number): Promise<Profit365Invoice[]> {
  const allInvoices: Profit365Invoice[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const invoices = await fetchPurchaseInvoices(companyId, page);

    if (invoices.length === 0) {
      hasMore = false;
    } else {
      allInvoices.push(...invoices);
      if (invoices.length < 50) {
        hasMore = false;
      } else {
        page++;
      }
    }

    if (page > 100) {
      hasMore = false;
    }
  }

  return allInvoices;
}

/**
 * Fetch partners (customers/vendors) list
 */
export async function fetchPartners(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `catalogs/partners/${page}`);
  return data || [];
}

/**
 * Fetch items (products) catalog
 */
export async function fetchItems(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `catalogs/items/${page}`);
  return data || [];
}

/**
 * Fetch bank statements
 */
export async function fetchBankStatements(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `accounting/bankstatements/${page}`);
  return data || [];
}

/**
 * Fetch cash receipts
 */
export async function fetchCashReceipts(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `accounting/cashreceipts/${page}`);
  return data || [];
}

/**
 * Fetch journal entries
 */
export async function fetchJournalEntries(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `accounting/journalentries/${page}`);
  return data || [];
}

/**
 * Fetch general ledger
 */
export async function fetchGeneralLedger(companyId: number, page: number = 1): Promise<any[]> {
  const credentials = getCredentials(companyId);
  const data = await makeApiRequest(credentials, `accounting/generalledger/${page}`);
  return data || [];
}

/**
 * Sync sales invoices from Profit365 to database
 */
export async function syncSalesInvoices(companyId: number): Promise<number> {
  const invoices = await fetchAllSalesInvoices(companyId);
  let count = 0;

  for (const invoice of invoices) {
    // Calculate balance due
    const totalAmount = invoice.sum || 0;
    const paidAmount = invoice.sumPaid || 0;
    const balanceDue = invoice.sumToPay || (totalAmount - paidAmount);

    db.upsertInvoice({
      company_id: companyId,
      external_id: invoice.id,
      invoice_type: 'issued',
      invoice_number: invoice.recordNumber,
      customer_name: invoice.partnerDetail || invoice.partnerAddress,
      customer_id: invoice.partnerId,
      issue_date: invoice.dateCreated,
      due_date: invoice.dateValidTo,
      total_amount: totalAmount,
      balance_due: balanceDue,
      currency: invoice.currency1 || 'EUR',
      status: balanceDue === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(invoice),
    });
    count++;
  }

  return count;
}

/**
 * Sync purchase invoices (bills) from Profit365 to database
 */
export async function syncPurchaseInvoices(companyId: number): Promise<number> {
  const invoices = await fetchAllPurchaseInvoices(companyId);
  let count = 0;

  for (const invoice of invoices) {
    const totalAmount = invoice.sum || 0;
    const paidAmount = invoice.sumPaid || 0;
    const balanceDue = invoice.sumToPay || (totalAmount - paidAmount);

    db.upsertInvoice({
      company_id: companyId,
      external_id: `bill_${invoice.id}`,
      invoice_type: 'received',
      invoice_number: invoice.recordNumber,
      customer_name: invoice.partnerDetail || invoice.partnerAddress,
      customer_id: invoice.partnerId,
      issue_date: invoice.dateCreated,
      due_date: invoice.dateValidTo,
      total_amount: totalAmount,
      balance_due: balanceDue,
      currency: invoice.currency1 || 'EUR',
      status: balanceDue === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(invoice),
    });
    count++;
  }

  return count;
}

/**
 * Sync all invoices (sales + purchase)
 */
export async function syncInvoices(companyId: number): Promise<number> {
  const salesCount = await syncSalesInvoices(companyId);
  const purchaseCount = await syncPurchaseInvoices(companyId);
  return salesCount + purchaseCount;
}

/**
 * Calculate and save financial metrics
 */
export async function calculateAndSaveMetrics(companyId: number): Promise<any> {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  // Get invoices from database to calculate metrics
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

  // Calculate basic ratios (simplified without full balance sheet data)
  const currentAssets = accountsReceivable; // Simplified
  const currentLiabilities = accountsPayable; // Simplified
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
    cash_balance: 0, // Would need bank statements to calculate
    current_ratio: currentRatio,
    quick_ratio: currentRatio, // Same as current ratio in simplified model
    debt_to_equity: currentLiabilities > 0 && netIncome > 0 ? currentLiabilities / netIncome : 0,
    dso_days: dsoDays,
    dpo_days: dpoDays,
  };

  db.saveFinancialMetrics(metrics);

  return metrics;
}

/**
 * Full sync - sync all data from Profit365
 */
export async function fullSync(companyId: number): Promise<{
  accounts: number;
  invoices: number;
  metrics: any;
}> {
  // Create sync log
  const syncLog = db.createSyncLog({
    company_id: companyId,
    sync_type: 'full',
    status: 'in_progress',
  });

  try {
    // Sync invoices (sales + purchase)
    const invoiceCount = await syncInvoices(companyId);

    // Calculate metrics
    const metrics = await calculateAndSaveMetrics(companyId);

    // Update connection last sync time
    db.updateAccountingConnection(companyId, {
      last_sync_at: new Date().toISOString(),
      status: 'connected',
    });

    // Update sync log
    db.updateSyncLog(syncLog.lastInsertRowid as number, {
      status: 'completed',
      records_synced: invoiceCount,
    });

    return {
      accounts: 0, // Profit365 doesn't have a standard chart of accounts endpoint
      invoices: invoiceCount,
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
  profit365CompanyId: string
): void {
  const credentials = JSON.stringify({
    clientId,
    clientSecret,
    companyId: profit365CompanyId,
  });

  db.updateAccountingConnection(companyId, {
    api_credentials: credentials,
    status: 'connected',
  });
}
