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
 * Fetch all customers
 */
export async function fetchCustomers(companyId: number): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'query?query=SELECT * FROM Customer MAXRESULTS 1000');
  return data.QueryResponse?.Customer || [];
}

/**
 * Fetch all vendors
 */
export async function fetchVendors(companyId: number): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'query?query=SELECT * FROM Vendor MAXRESULTS 1000');
  return data.QueryResponse?.Vendor || [];
}

/**
 * Fetch all items (products/services)
 */
export async function fetchItems(companyId: number): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'query?query=SELECT * FROM Item MAXRESULTS 1000');
  return data.QueryResponse?.Item || [];
}

/**
 * Fetch all employees
 */
export async function fetchEmployees(companyId: number): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  const data = await makeApiRequest(accessToken, realmId, 'query?query=SELECT * FROM Employee MAXRESULTS 1000');
  return data.QueryResponse?.Employee || [];
}

/**
 * Fetch payments (customer payments)
 */
export async function fetchPayments(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM Payment';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Payment || [];
}

/**
 * Fetch bill payments (vendor payments)
 */
export async function fetchBillPayments(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM BillPayment';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.BillPayment || [];
}

/**
 * Fetch estimates (quotes)
 */
export async function fetchEstimates(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM Estimate';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Estimate || [];
}

/**
 * Fetch sales receipts
 */
export async function fetchSalesReceipts(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM SalesReceipt';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.SalesReceipt || [];
}

/**
 * Fetch purchases (expenses)
 */
export async function fetchPurchases(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM Purchase';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Purchase || [];
}

/**
 * Fetch purchase orders
 */
export async function fetchPurchaseOrders(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM PurchaseOrder';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.PurchaseOrder || [];
}

/**
 * Fetch credit memos
 */
export async function fetchCreditMemos(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM CreditMemo';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.CreditMemo || [];
}

/**
 * Fetch vendor credits
 */
export async function fetchVendorCredits(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM VendorCredit';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.VendorCredit || [];
}

/**
 * Fetch journal entries
 */
export async function fetchJournalEntries(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM JournalEntry';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.JournalEntry || [];
}

/**
 * Fetch transfers
 */
export async function fetchTransfers(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM Transfer';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Transfer || [];
}

/**
 * Fetch deposits
 */
export async function fetchDeposits(companyId: number, startDate?: string): Promise<any[]> {
  const { accessToken, realmId } = await getValidAccessToken(companyId);
  let query = 'SELECT * FROM Deposit';
  if (startDate) {
    query += ` WHERE TxnDate >= '${startDate}'`;
  }
  query += ' MAXRESULTS 1000';
  const data = await makeApiRequest(accessToken, realmId, `query?query=${encodeURIComponent(query)}`);
  return data.QueryResponse?.Deposit || [];
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
 * Sync customers from QuickBooks to database
 */
export async function syncCustomers(companyId: number): Promise<number> {
  const customers = await fetchCustomers(companyId);
  let count = 0;

  for (const customer of customers) {
    db.upsertAccount({
      company_id: companyId,
      external_id: `qb_customer_${customer.Id}`,
      name: customer.DisplayName || customer.CompanyName || 'Unknown',
      account_type: 'Accounts Receivable',
      account_sub_type: 'Customer',
      account_number: customer.Id,
      current_balance: customer.Balance || 0,
      currency: customer.CurrencyRef?.value || 'USD',
      is_active: customer.Active !== false,
    });
    count++;
  }

  return count;
}

/**
 * Sync vendors from QuickBooks to database
 */
export async function syncVendors(companyId: number): Promise<number> {
  const vendors = await fetchVendors(companyId);
  let count = 0;

  for (const vendor of vendors) {
    db.upsertAccount({
      company_id: companyId,
      external_id: `qb_vendor_${vendor.Id}`,
      name: vendor.DisplayName || vendor.CompanyName || 'Unknown',
      account_type: 'Accounts Payable',
      account_sub_type: 'Vendor',
      account_number: vendor.Id,
      current_balance: vendor.Balance || 0,
      currency: vendor.CurrencyRef?.value || 'USD',
      is_active: vendor.Active !== false,
    });
    count++;
  }

  return count;
}

/**
 * Sync items (products/services) from QuickBooks to database
 */
export async function syncItems(companyId: number): Promise<number> {
  const items = await fetchItems(companyId);
  let count = 0;

  for (const item of items) {
    db.upsertAccount({
      company_id: companyId,
      external_id: `qb_item_${item.Id}`,
      name: item.Name,
      account_type: 'Inventory',
      account_sub_type: item.Type || 'Product',
      account_number: item.Sku || item.Id,
      current_balance: (item.QtyOnHand || 0) * (item.UnitPrice || 0),
      currency: 'USD',
      is_active: item.Active !== false,
    });
    count++;
  }

  return count;
}

/**
 * Sync employees from QuickBooks to database
 */
export async function syncEmployees(companyId: number): Promise<number> {
  const employees = await fetchEmployees(companyId);
  let count = 0;

  for (const employee of employees) {
    db.upsertEmployee({
      company_id: companyId,
      external_id: `qb_employee_${employee.Id}`,
      display_name: employee.DisplayName || `${employee.GivenName || ''} ${employee.FamilyName || ''}`.trim() || 'Unknown',
      given_name: employee.GivenName,
      family_name: employee.FamilyName,
      email: employee.PrimaryEmailAddr?.Address,
      phone: employee.PrimaryPhone?.FreeFormNumber,
      hire_date: employee.HiredDate,
      is_active: employee.Active !== false,
      raw_data: JSON.stringify(employee),
    });
    count++;
  }

  return count;
}

/**
 * Sync payments from QuickBooks to database
 */
export async function syncPayments(companyId: number, startDate?: string): Promise<number> {
  const payments = await fetchPayments(companyId, startDate);
  const billPayments = await fetchBillPayments(companyId, startDate);
  let count = 0;

  // Customer payments
  for (const payment of payments) {
    const linkedInvoices = payment.Line?.map((l: any) => l.LinkedTxn?.map((lt: any) => lt.TxnId)).flat().filter(Boolean);
    db.upsertPayment({
      company_id: companyId,
      external_id: `qb_payment_${payment.Id}`,
      payment_type: 'received',
      payment_date: payment.TxnDate,
      amount: payment.TotalAmt,
      currency: payment.CurrencyRef?.value || 'USD',
      customer_name: payment.CustomerRef?.name,
      customer_id: payment.CustomerRef?.value,
      payment_method: payment.PaymentMethodRef?.name,
      reference_number: payment.PaymentRefNum,
      memo: payment.PrivateNote,
      linked_invoices: linkedInvoices?.length ? JSON.stringify(linkedInvoices) : null,
      raw_data: JSON.stringify(payment),
    });
    count++;
  }

  // Bill payments (vendor payments)
  for (const payment of billPayments) {
    const linkedBills = payment.Line?.map((l: any) => l.LinkedTxn?.map((lt: any) => lt.TxnId)).flat().filter(Boolean);
    db.upsertPayment({
      company_id: companyId,
      external_id: `qb_billpayment_${payment.Id}`,
      payment_type: 'sent',
      payment_date: payment.TxnDate,
      amount: payment.TotalAmt,
      currency: payment.CurrencyRef?.value || 'USD',
      customer_name: payment.VendorRef?.name,
      customer_id: payment.VendorRef?.value,
      payment_method: payment.PayType,
      reference_number: payment.DocNumber,
      memo: payment.PrivateNote,
      linked_invoices: linkedBills?.length ? JSON.stringify(linkedBills) : null,
      raw_data: JSON.stringify(payment),
    });
    count++;
  }

  return count;
}

/**
 * Sync estimates and purchase orders from QuickBooks to database
 */
export async function syncEstimates(companyId: number, startDate?: string): Promise<number> {
  const estimates = await fetchEstimates(companyId, startDate);
  const purchaseOrders = await fetchPurchaseOrders(companyId, startDate);
  let count = 0;

  // Estimates (quotes)
  for (const estimate of estimates) {
    db.upsertEstimate({
      company_id: companyId,
      external_id: `qb_estimate_${estimate.Id}`,
      estimate_type: 'quote',
      estimate_number: estimate.DocNumber,
      customer_name: estimate.CustomerRef?.name,
      customer_id: estimate.CustomerRef?.value,
      estimate_date: estimate.TxnDate,
      expiration_date: estimate.ExpirationDate,
      total_amount: estimate.TotalAmt,
      currency: estimate.CurrencyRef?.value || 'USD',
      status: estimate.TxnStatus || 'Pending',
      memo: estimate.PrivateNote,
      raw_data: JSON.stringify(estimate),
    });
    count++;
  }

  // Purchase orders
  for (const po of purchaseOrders) {
    db.upsertEstimate({
      company_id: companyId,
      external_id: `qb_purchaseorder_${po.Id}`,
      estimate_type: 'purchase_order',
      estimate_number: po.DocNumber,
      customer_name: po.VendorRef?.name,
      customer_id: po.VendorRef?.value,
      estimate_date: po.TxnDate,
      expiration_date: po.DueDate,
      total_amount: po.TotalAmt,
      currency: po.CurrencyRef?.value || 'USD',
      status: po.POStatus || 'Open',
      memo: po.PrivateNote,
      raw_data: JSON.stringify(po),
    });
    count++;
  }

  return count;
}

/**
 * Sync journal entries from QuickBooks to database
 */
export async function syncJournalEntries(companyId: number, startDate?: string): Promise<number> {
  const entries = await fetchJournalEntries(companyId, startDate);
  let count = 0;

  for (const entry of entries) {
    const lines = entry.Line?.map((l: any) => ({
      description: l.Description,
      amount: l.Amount,
      postingType: l.JournalEntryLineDetail?.PostingType,
      accountName: l.JournalEntryLineDetail?.AccountRef?.name,
      accountId: l.JournalEntryLineDetail?.AccountRef?.value,
    }));

    db.upsertJournalEntry({
      company_id: companyId,
      external_id: `qb_journalentry_${entry.Id}`,
      entry_number: entry.DocNumber,
      entry_date: entry.TxnDate,
      total_amount: entry.TotalAmt,
      currency: entry.CurrencyRef?.value || 'USD',
      memo: entry.PrivateNote,
      adjustment: entry.Adjustment === true,
      lines: lines?.length ? JSON.stringify(lines) : null,
      raw_data: JSON.stringify(entry),
    });
    count++;
  }

  return count;
}

/**
 * Sync additional invoice types (sales receipts, credit memos) from QuickBooks
 */
export async function syncAdditionalInvoices(companyId: number, startDate?: string): Promise<number> {
  const salesReceipts = await fetchSalesReceipts(companyId, startDate);
  const creditMemos = await fetchCreditMemos(companyId, startDate);
  const purchases = await fetchPurchases(companyId, startDate);
  const vendorCredits = await fetchVendorCredits(companyId, startDate);
  let count = 0;

  // Sales receipts (cash sales)
  for (const receipt of salesReceipts) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `qb_salesreceipt_${receipt.Id}`,
      invoice_type: 'issued',
      invoice_number: receipt.DocNumber,
      customer_name: receipt.CustomerRef?.name,
      customer_id: receipt.CustomerRef?.value,
      issue_date: receipt.TxnDate,
      due_date: receipt.TxnDate,
      total_amount: receipt.TotalAmt,
      balance_due: 0, // Sales receipts are paid immediately
      currency: receipt.CurrencyRef?.value || 'USD',
      status: 'paid',
      raw_data: JSON.stringify(receipt),
    });
    count++;
  }

  // Credit memos (customer credits)
  for (const memo of creditMemos) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `qb_creditmemo_${memo.Id}`,
      invoice_type: 'issued',
      invoice_number: memo.DocNumber,
      customer_name: memo.CustomerRef?.name,
      customer_id: memo.CustomerRef?.value,
      issue_date: memo.TxnDate,
      due_date: memo.TxnDate,
      total_amount: -memo.TotalAmt, // Negative for credit
      balance_due: -memo.RemainingCredit || 0,
      currency: memo.CurrencyRef?.value || 'USD',
      status: memo.RemainingCredit === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(memo),
    });
    count++;
  }

  // Purchases (expenses)
  for (const purchase of purchases) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `qb_purchase_${purchase.Id}`,
      invoice_type: 'received',
      invoice_number: purchase.DocNumber,
      customer_name: purchase.EntityRef?.name,
      customer_id: purchase.EntityRef?.value,
      issue_date: purchase.TxnDate,
      due_date: purchase.TxnDate,
      total_amount: purchase.TotalAmt,
      balance_due: 0,
      currency: purchase.CurrencyRef?.value || 'USD',
      status: 'paid',
      raw_data: JSON.stringify(purchase),
    });
    count++;
  }

  // Vendor credits
  for (const credit of vendorCredits) {
    db.upsertInvoice({
      company_id: companyId,
      external_id: `qb_vendorcredit_${credit.Id}`,
      invoice_type: 'received',
      invoice_number: credit.DocNumber,
      customer_name: credit.VendorRef?.name,
      customer_id: credit.VendorRef?.value,
      issue_date: credit.TxnDate,
      due_date: credit.TxnDate,
      total_amount: -credit.TotalAmt, // Negative for credit
      balance_due: -credit.Balance || 0,
      currency: credit.CurrencyRef?.value || 'USD',
      status: credit.Balance === 0 ? 'paid' : 'unpaid',
      raw_data: JSON.stringify(credit),
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
  customers: number;
  vendors: number;
  items: number;
  employees: number;
  payments: number;
  estimates: number;
  journalEntries: number;
  metrics: any;
}> {
  // Create sync log
  const syncLog = db.createSyncLog({
    company_id: companyId,
    sync_type: 'full',
    status: 'in_progress',
  });

  try {
    // Sync date range (last 12 months)
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const dateStr = startDate.toISOString().split('T')[0];

    // Sync all data types
    const accountCount = await syncAccounts(companyId);
    const customerCount = await syncCustomers(companyId);
    const vendorCount = await syncVendors(companyId);
    const itemCount = await syncItems(companyId);
    const employeeCount = await syncEmployees(companyId);
    const invoiceCount = await syncInvoices(companyId, dateStr);
    const additionalInvoiceCount = await syncAdditionalInvoices(companyId, dateStr);
    const paymentCount = await syncPayments(companyId, dateStr);
    const estimateCount = await syncEstimates(companyId, dateStr);
    const journalEntryCount = await syncJournalEntries(companyId, dateStr);

    // Calculate metrics
    const metrics = await calculateAndSaveMetrics(companyId);

    // Update connection last sync time
    db.updateAccountingConnection(companyId, {
      last_sync_at: new Date().toISOString(),
      status: 'connected',
    });

    // Calculate totals
    const totalInvoices = invoiceCount + additionalInvoiceCount;
    const totalRecords = accountCount + customerCount + vendorCount + itemCount + employeeCount + totalInvoices + paymentCount + estimateCount + journalEntryCount;

    // Update sync log
    db.updateSyncLog(syncLog.lastInsertRowid as number, {
      status: 'completed',
      records_synced: totalRecords,
    });

    return {
      accounts: accountCount,
      invoices: totalInvoices,
      customers: customerCount,
      vendors: vendorCount,
      items: itemCount,
      employees: employeeCount,
      payments: paymentCount,
      estimates: estimateCount,
      journalEntries: journalEntryCount,
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
