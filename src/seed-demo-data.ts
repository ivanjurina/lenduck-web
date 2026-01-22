/**
 * Seed Demo Data Script
 * Creates a test company with realistic financial data for the admin user
 *
 * Run with: npx ts-node src/seed-demo-data.ts
 */

// Import the database module which initializes tables and creates admin
import * as dbModule from './database';

// Also need direct access for raw queries
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'lenduck.db');
const db = new Database(dbPath);

// Initialize default admin if not exists
dbModule.initDefaultAdmin();

// Get admin user
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@lenduck.com') as any;

if (!admin) {
  console.error('Admin user not found. Please run the server first to create the default admin.');
  process.exit(1);
}

console.log('Found admin user:', admin.email);

// Check if demo company already exists
const existingCompany = db.prepare('SELECT * FROM companies WHERE name = ? AND user_id = ?').get('TechStart Solutions s.r.o.', admin.id) as any;

let companyId: number;

if (existingCompany) {
  console.log('Demo company already exists, updating data...');
  companyId = existingCompany.id;

  // Clear existing data for this company
  db.prepare('DELETE FROM invoices WHERE company_id = ?').run(companyId);
  db.prepare('DELETE FROM accounts WHERE company_id = ?').run(companyId);
  db.prepare('DELETE FROM financial_metrics WHERE company_id = ?').run(companyId);
  db.prepare('DELETE FROM bank_transactions WHERE company_id = ?').run(companyId);
} else {
  // Create demo company
  const result = db.prepare(`
    INSERT INTO companies (user_id, name, business_id, country, currency)
    VALUES (?, ?, ?, ?, ?)
  `).run(admin.id, 'TechStart Solutions s.r.o.', '12345678', 'CZ', 'CZK');

  companyId = result.lastInsertRowid as number;
  console.log('Created demo company with ID:', companyId);
}

// Create accounting connection (QuickBooks)
const existingConnection = db.prepare('SELECT * FROM accounting_connections WHERE company_id = ?').get(companyId);

if (!existingConnection) {
  db.prepare(`
    INSERT INTO accounting_connections (company_id, software_type, status, last_sync_at)
    VALUES (?, ?, ?, ?)
  `).run(companyId, 'quickbooks', 'connected', new Date().toISOString());
  console.log('Created QuickBooks connection');
} else {
  db.prepare(`
    UPDATE accounting_connections SET status = ?, last_sync_at = ? WHERE company_id = ?
  `).run('connected', new Date().toISOString(), companyId);
  console.log('Updated existing connection');
}

// Create Chart of Accounts
const accounts = [
  { external_id: 'acc_1', name: 'Business Checking', account_type: 'Bank', account_sub_type: 'Checking', account_number: '1000', current_balance: 2850000, currency: 'CZK' },
  { external_id: 'acc_2', name: 'Savings Account', account_type: 'Bank', account_sub_type: 'Savings', account_number: '1010', current_balance: 1500000, currency: 'CZK' },
  { external_id: 'acc_3', name: 'Accounts Receivable', account_type: 'Accounts Receivable', account_sub_type: 'AccountsReceivable', account_number: '1200', current_balance: 1250000, currency: 'CZK' },
  { external_id: 'acc_4', name: 'Office Equipment', account_type: 'Fixed Asset', account_sub_type: 'FurnitureAndFixtures', account_number: '1500', current_balance: 450000, currency: 'CZK' },
  { external_id: 'acc_5', name: 'Computer Equipment', account_type: 'Fixed Asset', account_sub_type: 'MachineryAndEquipment', account_number: '1510', current_balance: 380000, currency: 'CZK' },
  { external_id: 'acc_6', name: 'Accounts Payable', account_type: 'Accounts Payable', account_sub_type: 'AccountsPayable', account_number: '2000', current_balance: 420000, currency: 'CZK' },
  { external_id: 'acc_7', name: 'Credit Card', account_type: 'Credit Card', account_sub_type: 'CreditCard', account_number: '2100', current_balance: 85000, currency: 'CZK' },
  { external_id: 'acc_8', name: 'Bank Loan', account_type: 'Long Term Liability', account_sub_type: 'NotesPayable', account_number: '2500', current_balance: 800000, currency: 'CZK' },
  { external_id: 'acc_9', name: 'Owner Equity', account_type: 'Equity', account_sub_type: 'OpeningBalanceEquity', account_number: '3000', current_balance: 3500000, currency: 'CZK' },
  { external_id: 'acc_10', name: 'Retained Earnings', account_type: 'Equity', account_sub_type: 'RetainedEarnings', account_number: '3100', current_balance: 1625000, currency: 'CZK' },
];

const insertAccount = db.prepare(`
  INSERT INTO accounts (company_id, external_id, name, account_type, account_sub_type, account_number, current_balance, currency, is_active, synced_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
`);

for (const acc of accounts) {
  insertAccount.run(companyId, acc.external_id, acc.name, acc.account_type, acc.account_sub_type, acc.account_number, acc.current_balance, acc.currency);
}
console.log(`Created ${accounts.length} accounts`);

// Create Invoices (issued - sales)
const customers = [
  { name: 'Škoda Auto a.s.', id: 'cust_1' },
  { name: 'České dráhy, a.s.', id: 'cust_2' },
  { name: 'Alza.cz a.s.', id: 'cust_3' },
  { name: 'Komerční banka, a.s.', id: 'cust_4' },
  { name: 'O2 Czech Republic a.s.', id: 'cust_5' },
  { name: 'Avast Software s.r.o.', id: 'cust_6' },
];

const vendors = [
  { name: 'Microsoft Czech Republic', id: 'vend_1' },
  { name: 'Amazon Web Services', id: 'vend_2' },
  { name: 'ČSOB Leasing', id: 'vend_3' },
  { name: 'T-Mobile Czech Republic', id: 'vend_4' },
  { name: 'PRE (Pražská energetika)', id: 'vend_5' },
];

const insertInvoice = db.prepare(`
  INSERT INTO invoices (company_id, external_id, invoice_type, invoice_number, customer_name, customer_id, issue_date, due_date, total_amount, balance_due, currency, status, synced_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

// Generate sales invoices for the last 12 months
const today = new Date();
let invoiceNum = 2024001;

const salesInvoices: any[] = [];

for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
  const invoiceDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 20) + 1);
  const numInvoices = Math.floor(Math.random() * 4) + 3; // 3-6 invoices per month

  for (let i = 0; i < numInvoices; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const amount = Math.floor(Math.random() * 400000) + 50000; // 50k - 450k CZK
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const isPaid = monthsAgo > 1 || Math.random() > 0.4;
    const balanceDue = isPaid ? 0 : amount;

    salesInvoices.push({
      external_id: `inv_${invoiceNum}`,
      invoice_type: 'issued',
      invoice_number: `FV-${invoiceNum}`,
      customer_name: customer.name,
      customer_id: customer.id,
      issue_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      total_amount: amount,
      balance_due: balanceDue,
      status: isPaid ? 'paid' : 'unpaid',
    });

    invoiceNum++;
  }
}

// Generate purchase invoices (bills)
let billNum = 2024001;
const purchaseInvoices: any[] = [];

for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
  const invoiceDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 20) + 5);
  const numBills = Math.floor(Math.random() * 3) + 2; // 2-4 bills per month

  for (let i = 0; i < numBills; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const amount = Math.floor(Math.random() * 150000) + 15000; // 15k - 165k CZK
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 14);

    const isPaid = monthsAgo > 0 || Math.random() > 0.5;
    const balanceDue = isPaid ? 0 : amount;

    purchaseInvoices.push({
      external_id: `bill_${billNum}`,
      invoice_type: 'received',
      invoice_number: `PF-${billNum}`,
      customer_name: vendor.name,
      customer_id: vendor.id,
      issue_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      total_amount: amount,
      balance_due: balanceDue,
      status: isPaid ? 'paid' : 'unpaid',
    });

    billNum++;
  }
}

// Insert all invoices
for (const inv of [...salesInvoices, ...purchaseInvoices]) {
  insertInvoice.run(
    companyId, inv.external_id, inv.invoice_type, inv.invoice_number,
    inv.customer_name, inv.customer_id, inv.issue_date, inv.due_date,
    inv.total_amount, inv.balance_due, 'CZK', inv.status
  );
}
console.log(`Created ${salesInvoices.length} sales invoices and ${purchaseInvoices.length} purchase invoices`);

// Calculate totals for metrics
const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
const totalExpenses = purchaseInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
const accountsReceivable = salesInvoices.filter(inv => inv.balance_due > 0).reduce((sum, inv) => sum + inv.balance_due, 0);
const accountsPayable = purchaseInvoices.filter(inv => inv.balance_due > 0).reduce((sum, inv) => sum + inv.balance_due, 0);

// Create financial metrics for the last 12 months
const insertMetrics = db.prepare(`
  INSERT INTO financial_metrics (
    company_id, metric_date, revenue, expenses, net_income, gross_profit,
    total_assets, total_liabilities, total_equity, current_assets, current_liabilities,
    accounts_receivable, accounts_payable, cash_balance, current_ratio, quick_ratio,
    debt_to_equity, dso_days, dpo_days
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Generate monthly metrics
for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
  const metricDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0); // Last day of month

  // Calculate cumulative revenue and expenses up to this month
  const monthCutoff = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 1);

  const monthlyRevenue = salesInvoices
    .filter(inv => new Date(inv.issue_date) < monthCutoff)
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const monthlyExpenses = purchaseInvoices
    .filter(inv => new Date(inv.issue_date) < monthCutoff)
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const netIncome = monthlyRevenue - monthlyExpenses;
  const grossProfit = monthlyRevenue * 0.65; // 65% gross margin

  // Assets grow over time
  const growthFactor = 1 + (11 - monthsAgo) * 0.02;
  const totalAssets = Math.round(6430000 * growthFactor);
  const currentAssets = Math.round(5600000 * growthFactor);
  const cashBalance = Math.round(4350000 * growthFactor);

  // Liabilities
  const totalLiabilities = Math.round(1305000 * growthFactor);
  const currentLiabilities = Math.round(505000 * growthFactor);

  const totalEquity = totalAssets - totalLiabilities;

  // Ratios
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities > 0 ? (currentAssets * 0.9) / currentLiabilities : 0;
  const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

  // DSO and DPO (realistic values)
  const dsoDays = 28 + Math.random() * 10;
  const dpoDays = 18 + Math.random() * 8;

  const monthlyAR = Math.round(accountsReceivable * growthFactor * (Math.random() * 0.3 + 0.7));
  const monthlyAP = Math.round(accountsPayable * growthFactor * (Math.random() * 0.3 + 0.7));

  insertMetrics.run(
    companyId,
    metricDate.toISOString().split('T')[0],
    monthlyRevenue,
    monthlyExpenses,
    netIncome,
    grossProfit,
    totalAssets,
    totalLiabilities,
    totalEquity,
    currentAssets,
    currentLiabilities,
    monthlyAR,
    monthlyAP,
    cashBalance,
    currentRatio,
    quickRatio,
    debtToEquity,
    dsoDays,
    dpoDays
  );
}

console.log('Created 12 months of financial metrics');

// Create some bank transactions
const insertTransaction = db.prepare(`
  INSERT INTO bank_transactions (company_id, external_id, transaction_date, amount, transaction_type, description, payee, category, is_reconciled, synced_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
`);

const transactionTypes = [
  { type: 'deposit', desc: 'Payment received', category: 'Income' },
  { type: 'withdrawal', desc: 'Supplier payment', category: 'Expense' },
  { type: 'deposit', desc: 'Client payment', category: 'Income' },
  { type: 'withdrawal', desc: 'Office rent', category: 'Rent' },
  { type: 'withdrawal', desc: 'Software subscription', category: 'Software' },
  { type: 'withdrawal', desc: 'Utilities', category: 'Utilities' },
];

let txnNum = 1;
for (let daysAgo = 60; daysAgo >= 0; daysAgo -= Math.floor(Math.random() * 3) + 1) {
  const txnDate = new Date(today);
  txnDate.setDate(txnDate.getDate() - daysAgo);

  const txnType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
  const amount = txnType.type === 'deposit'
    ? Math.floor(Math.random() * 200000) + 50000
    : -(Math.floor(Math.random() * 80000) + 10000);

  const payee = txnType.type === 'deposit'
    ? customers[Math.floor(Math.random() * customers.length)].name
    : vendors[Math.floor(Math.random() * vendors.length)].name;

  insertTransaction.run(
    companyId,
    `txn_${txnNum++}`,
    txnDate.toISOString().split('T')[0],
    amount,
    txnType.type,
    txnType.desc,
    payee,
    txnType.category
  );
}

console.log(`Created ${txnNum - 1} bank transactions`);

console.log('\n✅ Demo data created successfully!');
console.log(`\nLogin as admin@lenduck.com / admin123 and go to Dashboard to see the company "TechStart Solutions s.r.o."`);

db.close();
