/**
 * QuickBooks Online API Integration Service
 *
 * Handles OAuth2 authentication and data fetching from QuickBooks
 */

import * as db from '../database';

// QuickBooks OAuth2 Configuration
// These should be set in environment variables in production
const QB_CLIENT_ID = process.env.QB_CLIENT_ID || 'YOUR_CLIENT_ID';
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback';
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_API_BASE = QB_ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

// Scopes we need for financial data
const QB_SCOPES = [
  'com.intuit.quickbooks.accounting',
  'openid',
  'profile',
  'email'
].join(' ');

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthorizationUrl(companyId: number, state?: string): string {
  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    response_type: 'code',
    scope: QB_SCOPES,
    redirect_uri: QB_REDIRECT_URI,
    state: state || `company_${companyId}`,
  });

  return `${QB_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}> {
  const credentials = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: QB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    token_type: string;
  }>;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

/**
 * Make authenticated API request to QuickBooks
 */
async function makeApiRequest(
  accessToken: string,
  realmId: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${QB_API_BASE}/v3/company/${realmId}/${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
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
    throw new Error(`QuickBooks API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(companyId: number): Promise<{ accessToken: string; realmId: string }> {
  const connection = db.getAccountingConnection(companyId);

  if (!connection || connection.software_type !== 'quickbooks') {
    throw new Error('No QuickBooks connection found for this company');
  }

  if (!connection.access_token || !connection.realm_id) {
    throw new Error('QuickBooks connection not properly configured');
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - bufferMs <= now.getTime()) {
    // Token expired or about to expire, refresh it
    const tokens = await refreshAccessToken(connection.refresh_token);

    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    db.updateAccountingConnection(companyId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    });

    return {
      accessToken: tokens.access_token,
      realmId: connection.realm_id,
    };
  }

  return {
    accessToken: connection.access_token,
    realmId: connection.realm_id,
  };
}

/**
 * Fetch company info from QuickBooks
 */
export async function fetchCompanyInfo(companyId: number): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'companyinfo/' + realmId);
  return data.CompanyInfo;
}

/**
 * Fetch all accounts (Chart of Accounts)
 */
export async function fetchAccounts(companyId: number): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'query?query=SELECT * FROM Account MAXRESULTS 1000');
  return data.QueryResponse?.Account || [];
}

/**
 * Fetch invoices
 */
export async function fetchInvoices(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);

  let query = 'SELECT * FROM Invoice';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';

  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Invoice || [];
}

/**
 * Fetch bills (received invoices / accounts payable)
 */
export async function fetchBills(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);

  let query = 'SELECT * FROM Bill';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';

  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Bill || [];
}

/**
 * Fetch Profit and Loss report
 */
export async function fetchProfitAndLoss(companyId: number, startDate: string, endDate: string): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(
    accessToken,
    realmId,
    `reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`
  );
  return data;
}

/**
 * Fetch Balance Sheet report
 */
export async function fetchBalanceSheet(companyId: number, asOfDate: string): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(
    accessToken,
    realmId,
    `reports/BalanceSheet?date_macro=Today`
  );
  return data;
}

/**
 * Fetch Cash Flow report
 */
export async function fetchCashFlow(companyId: number, startDate: string, endDate: string): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(
    accessToken,
    realmId,
    `reports/CashFlow?start_date=${startDate}&end_date=${endDate}`
  );
  return data;
}

/**
 * Fetch Accounts Receivable Aging
 */
export async function fetchARAgingSummary(companyId: number): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'reports/AgedReceivables');
  return data;
}

/**
 * Fetch Accounts Payable Aging
 */
export async function fetchAPAgingSummary(companyId: number): Promise<any> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'reports/AgedPayables');
  return data;
}

/**
 * Sync all accounts from QuickBooks to database
 */
export async function syncAccounts(companyId: number): Promise<number> {
  const accounts = await fetchAccounts(companyId);
  let count = 0;

  for (const account of accounts) {
    db.upsertAccount({
      company_id: companyId,
      external_id: account.Id,
      name: account.Name,
      account_type: account.AccountType,
      account_sub_type: account.AccountSubType,
      account_number: account.AcctNum,
      current_balance: account.CurrentBalance,
      currency: account.CurrencyRef?.value || 'USD',
      is_active: account.Active,
    });
    count++;
  }

  return count;
}

/**
 * Sync invoices from QuickBooks to database
 */
export async function syncInvoices(companyId: number, startDate?: string): Promise<number> {
  const invoices = await fetchInvoices(companyId, startDate);
  let count = 0;

  for (const invoice of invoices) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: invoice.Id,
      invoice_type: 'issued',
      invoice_number: invoice.DocNumber,
      customer_name: invoice.CustomerRef?.name,
      customer_id: invoice.CustomerRef?.value,
      issue_date: invoice.TxnDate,
      due_date: invoice.DueDate,
      total_amount: invoice.TotalAmt,
      balance_due: invoice.Balance,
      currency: invoice.CurrencyRef?.value || 'USD',
      status: invoice.Balance === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(invoice),
    });
    count++;
  }

  // Also sync bills (received invoices)
  const bills = await fetchBills(companyId, startDate);
  for (const bill of bills) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `bill_${bill.Id}`,
      invoice_type: 'received',
      invoice_number: bill.DocNumber,
      customer_name: bill.VendorRef?.name,
      customer_id: bill.VendorRef?.value,
      issue_date: bill.TxnDate,
      due_date: bill.DueDate,
      total_amount: bill.TotalAmt,
      balance_due: bill.Balance,
      currency: bill.CurrencyRef?.value || 'USD',
      status: bill.Balance === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(bill),
    });
    count++;
  }

  return count;
}

/**
 * Calculate and save financial metrics
 */
export async function calculateAndSaveMetrics(companyId: number): Promise<any> {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  // Fetch reports
  const [pnl, balanceSheet, arAging, apAging] = await Promise.all([
    fetchProfitAndLoss(companyId, startOfYear, endDate).catch(() => null),
    fetchBalanceSheet(companyId, endDate).catch(() => null),
    fetchARAgingSummary(companyId).catch(() => null),
    fetchAPAgingSummary(companyId).catch(() => null),
  ]);

  // Parse P&L data (simplified - actual parsing would need to handle QuickBooks report structure)
  let revenue = 0;
  let expenses = 0;
  let grossProfit = 0;
  let netIncome = 0;

  if (pnl?.Rows?.Row) {
    // QuickBooks reports have a complex nested structure
    // This is a simplified extraction - real implementation would need proper parsing
    for (const row of pnl.Rows.Row) {
      if (row.Summary?.ColData) {
        const label = row.Summary.ColData[0]?.value || '';
        const value = parseFloat(row.Summary.ColData[1]?.value || '0');

        if (label.includes('Total Income')) revenue = value;
        if (label.includes('Total Expenses')) expenses = value;
        if (label.includes('Gross Profit')) grossProfit = value;
        if (label.includes('Net Income')) netIncome = value;
      }
    }
  }

  // Parse Balance Sheet data (simplified)
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let currentAssets = 0;
  let currentLiabilities = 0;
  let cashBalance = 0;

  // Get accounts from database to calculate totals
  const accounts = db.getAccountsByCompany(companyId);
  for (const account of accounts) {
    const balance = account.current_balance || 0;

    switch (account.account_type) {
      case 'Bank':
        cashBalance += balance;
        currentAssets += balance;
        totalAssets += balance;
        break;
      case 'Accounts Receivable':
        currentAssets += balance;
        totalAssets += balance;
        break;
      case 'Other Current Asset':
        currentAssets += balance;
        totalAssets += balance;
        break;
      case 'Fixed Asset':
        totalAssets += balance;
        break;
      case 'Accounts Payable':
        currentLiabilities += balance;
        totalLiabilities += balance;
        break;
      case 'Credit Card':
        currentLiabilities += balance;
        totalLiabilities += balance;
        break;
      case 'Other Current Liability':
        currentLiabilities += balance;
        totalLiabilities += balance;
        break;
      case 'Long Term Liability':
        totalLiabilities += balance;
        break;
      case 'Equity':
        totalEquity += balance;
        break;
    }
  }

  // Calculate receivables and payables from invoices
  const invoices = db.getInvoicesByCompany(companyId);
  let accountsReceivable = 0;
  let accountsPayable = 0;
  let totalRevenueDays = 0;
  let totalPayableDays = 0;
  let receivableCount = 0;
  let payableCount = 0;

  for (const inv of invoices) {
    if (inv.balance_due > 0) {
      if (inv.invoice_type === 'issued') {
        accountsReceivable += inv.balance_due;
        // Calculate days outstanding
        if (inv.issue_date) {
          const issueDate = new Date(inv.issue_date);
          const daysOut = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalRevenueDays += daysOut * inv.total_amount;
          receivableCount += inv.total_amount;
        }
      } else {
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

  // Calculate ratios
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities > 0 ? (currentAssets - 0) / currentLiabilities : 0; // Assuming no inventory
  const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
  const dsoDays = receivableCount > 0 ? totalRevenueDays / receivableCount : 0;
  const dpoDays = payableCount > 0 ? totalPayableDays / payableCount : 0;

  const metrics = {
    company_id: companyId,
    metric_date: endDate,
    revenue,
    expenses,
    net_income: netIncome,
    gross_profit: grossProfit,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    current_assets: currentAssets,
    current_liabilities: currentLiabilities,
    accounts_receivable: accountsReceivable,
    accounts_payable: accountsPayable,
    cash_balance: cashBalance,
    current_ratio: currentRatio,
    quick_ratio: quickRatio,
    debt_to_equity: debtToEquity,
    dso_days: dsoDays,
    dpo_days: dpoDays,
  };

  db.saveFinancialMetrics(metrics);

  return metrics;
}

/**
 * Full sync - sync all data from QuickBooks
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
    // Sync accounts
    const accountCount = await syncAccounts(companyId);

    // Sync invoices (last 12 months)
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const invoiceCount = await syncInvoices(companyId, startDate.toISOString().split('T')[0]);

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
      records_synced: accountCount + invoiceCount,
    });

    return {
      accounts: accountCount,
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
