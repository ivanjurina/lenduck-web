// App translations for LenDuck

export type Language = 'en' | 'cs' | 'sk';

export interface Translations {
  // Navigation
  nav: {
    overview: string;
    data: string;
    invoices: string;
    accounts: string;
    customers: string;
    bankAccounts: string;
    inventory: string;
    events: string;
    todos: string;
    transactions: string;
    reports: string;
    offers: string;
    settings: string;
    logout: string;
    switchCompany: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    yourCompanies: string;
    addCompany: string;
    tryDemo: string;
    noCompanies: string;
    createFirst: string;
    revenue: string;
    expenses: string;
    netIncome: string;
    viewDetails: string;
    lastSync: string;
    notConnected: string;
  };
  // Company Overview
  overview: {
    title: string;
    keyMetrics: string;
    revenue: string;
    expenses: string;
    netIncome: string;
    cashBalance: string;
    accountsReceivable: string;
    accountsPayable: string;
    financialHealth: string;
    healthScore: string;
    revenueVsExpenses: string;
    quickLinks: string;
    viewInvoices: string;
    viewAllInvoices: string;
    chartOfAccounts: string;
    viewAllAccounts: string;
    integrationSettings: string;
    last12Months: string;
    syncNow: string;
    lastSyncAt: string;
  };
  // Invoices page
  invoicesPage: {
    title: string;
    subtitle: string;
    totalInvoices: string;
    issued: string;
    received: string;
    paid: string;
    unpaid: string;
    all: string;
    filter: string;
    invoiceNumber: string;
    customer: string;
    vendor: string;
    type: string;
    issueDate: string;
    dueDate: string;
    amount: string;
    status: string;
    noInvoices: string;
    // Filter translations
    filters: string;
    dateFrom: string;
    dateTo: string;
    searchCustomer: string;
    clearFilters: string;
    applyFilters: string;
    filteredResults: string;
    showingOf: string;
    totalAmount: string;
    totalBalance: string;
    totalPaid: string;
    totalUnpaid: string;
    // Charts and analytics
    invoiceList: string;
    analytics: string;
    hideList: string;
    showList: string;
    paymentStatus: string;
    invoicesByType: string;
    topCustomers: string;
    topSuppliers: string;
    monthlyOverview: string;
    avgDaysToPay: string;
    days: string;
    overdue: string;
    onTime: string;
    paymentTiming: string;
    invoicesCount: string;
    // Quick date presets
    lastMonth: string;
    lastQuarter: string;
    lastYear: string;
    currentMonth: string;
    currentQuarter: string;
    currentYear: string;
    // Extra columns
    paidOn: string;
    sentAt: string;
    variableSymbol: string;
    subtotal: string;
    paymentMethod: string;
    documentType: string;
    invoice: string;
    proforma: string;
    correction: string;
    taxDocument: string;
    sent: string;
    cancelled: string;
    open: string;
    amountFrom: string;
    amountTo: string;
    currency: string;
    byCurrency: string;
    nativeAmount: string;
    total: string;
    exportCSV: string;
    exportJSON: string;
    export: string;
  };
  // Accounts page
  accountsPage: {
    title: string;
    subtitle: string;
    totalAccounts: string;
    totalBalance: string;
    assets: string;
    liabilities: string;
    equity: string;
    accountNumber: string;
    accountName: string;
    type: string;
    balance: string;
    noAccounts: string;
    noAccountsFromIntegration: string;
  };
  // Customers page
  customersPage: {
    title: string;
    subtitle: string;
    totalCustomers: string;
    totalSuppliers: string;
    customers: string;
    suppliers: string;
    name: string;
    registrationNo: string;
    type: string;
    noCustomers: string;
  };
  // Bank Accounts page
  bankAccountsPage: {
    title: string;
    subtitle: string;
    totalBankAccounts: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    balance: string;
    noBankAccounts: string;
  };
  // Inventory page
  inventoryPage: {
    title: string;
    subtitle: string;
    totalItems: string;
    totalValue: string;
    sku: string;
    name: string;
    quantity: string;
    unit: string;
    purchasePrice: string;
    retailPrice: string;
    noInventory: string;
  };
  // Events/Activity page
  eventsPage: {
    title: string;
    subtitle: string;
    totalEvents: string;
    event: string;
    user: string;
    date: string;
    relatedTo: string;
    noEvents: string;
  };
  // Todos page
  todosPage: {
    title: string;
    subtitle: string;
    totalTodos: string;
    pendingTodos: string;
    task: string;
    status: string;
    createdAt: string;
    completedAt: string;
    relatedTo: string;
    noTodos: string;
    pending: string;
    completed: string;
  };
  // Transactions page
  transactionsPage: {
    title: string;
    subtitle: string;
    totalTransactions: string;
    income: string;
    expenses: string;
    netFlow: string;
    date: string;
    description: string;
    payee: string;
    category: string;
    amount: string;
    noTransactions: string;
  };
  // Reports page
  reportsPage: {
    title: string;
    subtitle: string;
    profitability: string;
    profitabilityDesc: string;
    revenueTrend: string;
    grossMargin: string;
    grossMarginPercent: string;
    netMargin: string;
    netMarginPercent: string;
    liquidity: string;
    liquidityDesc: string;
    currentRatio: string;
    quickRatio: string;
    cashPosition: string;
    cashTrend: string;
    receivablesPayables: string;
    receivablesPayablesDesc: string;
    receivables: string;
    payables: string;
    dso: string;
    dpo: string;
    agingBreakdown: string;
    current: string;
    days30: string;
    days60: string;
    days90Plus: string;
    financialStructure: string;
    financialStructureDesc: string;
    debtToEquity: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    assetComposition: string;
    customerAnalysis: string;
    customerAnalysisDesc: string;
    topCustomers: string;
    topVendors: string;
    customer: string;
    vendor: string;
    invoiceCount: string;
    totalValue: string;
  };
  // Settings page
  settingsPage: {
    title: string;
    subtitle: string;
    companyInfo: string;
    companyName: string;
    businessId: string;
    country: string;
    currency: string;
    integration: string;
    connectedTo: string;
    connectionStatus: string;
    connected: string;
    pending: string;
    disconnected: string;
    lastSync: string;
    syncNow: string;
    changeIntegration: string;
    dangerZone: string;
    deleteCompany: string;
    deleteWarning: string;
  };
  // Connect page
  connectPage: {
    title: string;
    subtitle: string;
    selectSoftware: string;
    popular: string;
    other: string;
    comingSoon: string;
    connect: string;
    requestIntegration: string;
  };
  // Offers page
  offersPage: {
    title: string;
    subtitle: string;
    getOffers: string;
    viewOffers: string;
    noOffers: string;
    noOffersDesc: string;
    enableVisibility: string;
    visibilityEnabled: string;
    visibilityDisabled: string;
    financingNeeds: string;
    desiredAmount: string;
    purpose: string;
    purposeOptions: {
      workingCapital: string;
      equipment: string;
      expansion: string;
      inventory: string;
      other: string;
    };
    savePreferences: string;
    offerDetails: string;
    lender: string;
    offerType: string;
    amount: string;
    interestRate: string;
    term: string;
    monthlyPayment: string;
    requirements: string;
    expiresAt: string;
    apply: string;
    decline: string;
    offerTypes: {
      loan: string;
      creditLine: string;
      factoring: string;
      leasing: string;
    };
    pendingOffers: string;
    activeOffers: string;
    expiredOffers: string;
    applySuccess: string;
    preferencesUpdated: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    submit: string;
    close: string;
    search: string;
    noData: string;
    total: string;
    average: string;
    monthly: string;
    yearly: string;
    days: string;
    months: string;
  };
  // Months
  months: string[];
  // Short months
  monthsShort: string[];
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      overview: 'Overview',
      data: 'Data',
      invoices: 'Invoices',
      accounts: 'Accounts',
      customers: 'Customers',
      bankAccounts: 'Bank Accounts',
      inventory: 'Inventory',
      events: 'Activity',
      todos: 'Tasks',
      transactions: 'Transactions',
      reports: 'Reports',
      offers: 'Offers',
      settings: 'Settings',
      logout: 'Logout',
      switchCompany: 'Switch Company',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      yourCompanies: 'Your Companies',
      addCompany: 'Add Company',
      tryDemo: 'Try Demo',
      noCompanies: 'No companies yet',
      createFirst: 'Create your first company to get started',
      revenue: 'Revenue',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      viewDetails: 'View Details',
      lastSync: 'Last sync',
      notConnected: 'Not connected',
    },
    overview: {
      title: 'Company Overview',
      keyMetrics: 'Key Metrics',
      revenue: 'Revenue',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      cashBalance: 'Cash Balance',
      accountsReceivable: 'Accounts Receivable',
      accountsPayable: 'Accounts Payable',
      financialHealth: 'Financial Health',
      healthScore: 'Health Score',
      revenueVsExpenses: 'Revenue vs Expenses',
      quickLinks: 'Quick Links',
      viewInvoices: 'View Invoices',
      viewAllInvoices: 'View all invoices',
      chartOfAccounts: 'Chart of Accounts',
      viewAllAccounts: 'View all accounts',
      integrationSettings: 'Integration Settings',
      last12Months: 'Last 12 months',
      syncNow: 'Sync Now',
      lastSyncAt: 'Last synced',
    },
    invoicesPage: {
      title: 'Invoices',
      subtitle: 'All synced invoices and bills from your accounting software',
      totalInvoices: 'Total Invoices',
      issued: 'Issued',
      received: 'Received',
      paid: 'Paid',
      unpaid: 'Unpaid',
      all: 'All',
      filter: 'Filter',
      invoiceNumber: 'Invoice #',
      customer: 'Customer',
      vendor: 'Vendor',
      type: 'Type',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      amount: 'Amount',
      status: 'Status',
      noInvoices: 'No invoices found',
      filters: 'Filters',
      dateFrom: 'Date from',
      dateTo: 'Date to',
      searchCustomer: 'Search customer/vendor',
      clearFilters: 'Clear filters',
      applyFilters: 'Apply filters',
      filteredResults: 'Filtered results',
      showingOf: 'Showing %count% of %total% invoices',
      totalAmount: 'Total amount',
      totalBalance: 'Total balance due',
      totalPaid: 'Total paid',
      totalUnpaid: 'Total unpaid',
      invoiceList: 'Invoice List',
      analytics: 'Analytics',
      hideList: 'Hide list',
      showList: 'Show list',
      paymentStatus: 'Payment Status',
      invoicesByType: 'Invoices by Type',
      topCustomers: 'Top Customers',
      topSuppliers: 'Top Suppliers',
      monthlyOverview: 'Monthly Overview',
      avgDaysToPay: 'Avg. Days to Pay',
      days: 'days',
      overdue: 'Overdue',
      onTime: 'On Time',
      paymentTiming: 'Payment Timing',
      invoicesCount: 'invoices',
      lastMonth: 'Last Month',
      lastQuarter: 'Last Quarter',
      lastYear: 'Last Year',
      currentMonth: 'This Month',
      currentQuarter: 'This Quarter',
      currentYear: 'This Year',
      paidOn: 'Paid On',
      sentAt: 'Sent',
      variableSymbol: 'Var. Symbol',
      subtotal: 'Subtotal',
      paymentMethod: 'Payment',
      documentType: 'Doc Type',
      invoice: 'Invoice',
      proforma: 'Proforma',
      correction: 'Correction',
      taxDocument: 'Tax Doc',
      sent: 'Sent',
      cancelled: 'Cancelled',
      open: 'Open',
      amountFrom: 'Amount from',
      amountTo: 'Amount to',
      currency: 'Currency',
      byCurrency: 'By currency',
      nativeAmount: 'Amount (CZK)',
      total: 'Total',
      exportCSV: 'Export CSV',
      exportJSON: 'Export JSON',
      export: 'Export',
    },
    accountsPage: {
      title: 'Chart of Accounts',
      subtitle: 'All accounts synced from your accounting software',
      totalAccounts: 'Total Accounts',
      totalBalance: 'Total Balance',
      assets: 'Assets',
      liabilities: 'Liabilities',
      equity: 'Equity',
      accountNumber: 'Account #',
      accountName: 'Account Name',
      type: 'Type',
      balance: 'Balance',
      noAccounts: 'No accounts found',
      noAccountsFromIntegration: 'No chart of accounts available from your current integration.',
    },
    customersPage: {
      title: 'Customers & Suppliers',
      subtitle: 'All contacts synced from your accounting software',
      totalCustomers: 'Customers',
      totalSuppliers: 'Suppliers',
      customers: 'Customers',
      suppliers: 'Suppliers',
      name: 'Name',
      registrationNo: 'Registration No.',
      type: 'Type',
      noCustomers: 'No customers or suppliers found',
    },
    bankAccountsPage: {
      title: 'Bank Accounts',
      subtitle: 'Bank accounts synced from your accounting software',
      totalBankAccounts: 'Total Accounts',
      accountNumber: 'Account Number',
      bankName: 'Bank Name',
      currency: 'Currency',
      balance: 'Balance',
      noBankAccounts: 'No bank accounts found',
    },
    inventoryPage: {
      title: 'Inventory',
      subtitle: 'Products and inventory items synced from your accounting software',
      totalItems: 'Total Items',
      totalValue: 'Total Value',
      sku: 'SKU',
      name: 'Name',
      quantity: 'Quantity',
      unit: 'Unit',
      purchasePrice: 'Purchase Price',
      retailPrice: 'Retail Price',
      noInventory: 'No inventory items found',
    },
    eventsPage: {
      title: 'Activity Log',
      subtitle: 'Recent activity and events from your accounting software',
      totalEvents: 'Total Events',
      event: 'Event',
      user: 'User',
      date: 'Date',
      relatedTo: 'Related To',
      noEvents: 'No activity events found',
    },
    todosPage: {
      title: 'Tasks',
      subtitle: 'Tasks and reminders from your accounting software',
      totalTodos: 'Total Tasks',
      pendingTodos: 'Pending',
      task: 'Task',
      status: 'Status',
      createdAt: 'Created',
      completedAt: 'Completed',
      relatedTo: 'Related To',
      noTodos: 'No tasks found',
      pending: 'Pending',
      completed: 'Completed',
    },
    transactionsPage: {
      title: 'Bank Transactions',
      subtitle: 'All bank transactions synced from your accounting software',
      totalTransactions: 'Total Transactions',
      income: 'Income',
      expenses: 'Expenses',
      netFlow: 'Net Flow',
      date: 'Date',
      description: 'Description',
      payee: 'Payee',
      category: 'Category',
      amount: 'Amount',
      noTransactions: 'No transactions found',
    },
    reportsPage: {
      title: 'Reports & Analytics',
      subtitle: 'Comprehensive financial analysis and insights',
      profitability: 'Profitability',
      profitabilityDesc: 'Revenue trends and profit margins',
      revenueTrend: 'Revenue Trend',
      grossMargin: 'Gross Margin',
      grossMarginPercent: 'Gross Margin %',
      netMargin: 'Net Margin',
      netMarginPercent: 'Net Margin %',
      liquidity: 'Liquidity & Cash Flow',
      liquidityDesc: 'Cash position and liquidity ratios',
      currentRatio: 'Current Ratio',
      quickRatio: 'Quick Ratio',
      cashPosition: 'Cash Position',
      cashTrend: 'Cash Trend',
      receivablesPayables: 'Receivables & Payables',
      receivablesPayablesDesc: 'AR/AP analysis and aging',
      receivables: 'Receivables',
      payables: 'Payables',
      dso: 'DSO (Days Sales Outstanding)',
      dpo: 'DPO (Days Payable Outstanding)',
      agingBreakdown: 'Aging Breakdown',
      current: 'Current',
      days30: '1-30 days',
      days60: '31-60 days',
      days90Plus: '90+ days',
      financialStructure: 'Financial Structure',
      financialStructureDesc: 'Balance sheet composition',
      debtToEquity: 'Debt to Equity',
      totalAssets: 'Total Assets',
      totalLiabilities: 'Total Liabilities',
      totalEquity: 'Total Equity',
      assetComposition: 'Asset Composition',
      customerAnalysis: 'Customer & Vendor Analysis',
      customerAnalysisDesc: 'Top customers and vendors by revenue',
      topCustomers: 'Top Customers',
      topVendors: 'Top Vendors',
      customer: 'Customer',
      vendor: 'Vendor',
      invoiceCount: 'Invoices',
      totalValue: 'Total Value',
    },
    settingsPage: {
      title: 'Settings',
      subtitle: 'Company settings and integration management',
      companyInfo: 'Company Information',
      companyName: 'Company Name',
      businessId: 'Business ID',
      country: 'Country',
      currency: 'Currency',
      integration: 'Integration',
      connectedTo: 'Connected to',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      pending: 'Pending',
      disconnected: 'Disconnected',
      lastSync: 'Last Sync',
      syncNow: 'Sync Now',
      changeIntegration: 'Change Integration',
      dangerZone: 'Danger Zone',
      deleteCompany: 'Delete Company',
      deleteWarning: 'This action cannot be undone. All company data will be permanently deleted.',
    },
    connectPage: {
      title: 'Connect Accounting Software',
      subtitle: 'Select your accounting software to sync your financial data',
      selectSoftware: 'Select Software',
      popular: 'Popular',
      other: 'Other',
      comingSoon: 'Coming Soon',
      connect: 'Connect',
      requestIntegration: 'Request Integration',
    },
    offersPage: {
      title: 'Financing Offers',
      subtitle: 'View and compare financing offers from our partner lenders',
      getOffers: 'Get Financing Offers',
      viewOffers: 'View Offers',
      noOffers: 'No offers yet',
      noOffersDesc: 'Enable visibility to lenders to start receiving personalized financing offers based on your financial health.',
      enableVisibility: 'Enable Visibility to Lenders',
      visibilityEnabled: 'Your company is visible to lenders',
      visibilityDisabled: 'Your company is hidden from lenders',
      financingNeeds: 'Financing Needs',
      desiredAmount: 'Desired Amount',
      purpose: 'Purpose',
      purposeOptions: {
        workingCapital: 'Working Capital',
        equipment: 'Equipment Purchase',
        expansion: 'Business Expansion',
        inventory: 'Inventory',
        other: 'Other',
      },
      savePreferences: 'Save Preferences',
      offerDetails: 'Offer Details',
      lender: 'Lender',
      offerType: 'Offer Type',
      amount: 'Amount',
      interestRate: 'Interest Rate',
      term: 'Term',
      monthlyPayment: 'Monthly Payment',
      requirements: 'Requirements',
      expiresAt: 'Expires',
      apply: 'Apply Now',
      decline: 'Decline',
      offerTypes: {
        loan: 'Business Loan',
        creditLine: 'Credit Line',
        factoring: 'Invoice Factoring',
        leasing: 'Leasing',
      },
      pendingOffers: 'Pending Offers',
      activeOffers: 'Active Offers',
      expiredOffers: 'Expired Offers',
      applySuccess: 'Application submitted successfully',
      preferencesUpdated: 'Preferences updated successfully',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      close: 'Close',
      search: 'Search',
      noData: 'No data available',
      total: 'Total',
      average: 'Average',
      monthly: 'Monthly',
      yearly: 'Yearly',
      days: 'days',
      months: 'months',
    },
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  cs: {
    nav: {
      overview: 'Přehled',
      data: 'Data',
      invoices: 'Faktury',
      accounts: 'Účtová osnova',
      customers: 'Kontakty',
      bankAccounts: 'Bankovní účty',
      inventory: 'Sklad',
      events: 'Aktivita',
      todos: 'Úkoly',
      transactions: 'Transakce',
      reports: 'Reporty',
      offers: 'Nabídky',
      settings: 'Nastavení',
      logout: 'Odhlásit',
      switchCompany: 'Změnit firmu',
    },
    dashboard: {
      title: 'Nástěnka',
      welcome: 'Vítejte zpět',
      yourCompanies: 'Vaše firmy',
      addCompany: 'Přidat firmu',
      tryDemo: 'Vyzkoušet demo',
      noCompanies: 'Zatím žádné firmy',
      createFirst: 'Vytvořte svou první firmu',
      revenue: 'Tržby',
      expenses: 'Náklady',
      netIncome: 'Čistý zisk',
      viewDetails: 'Zobrazit detail',
      lastSync: 'Poslední sync',
      notConnected: 'Nepřipojeno',
    },
    overview: {
      title: 'Přehled firmy',
      keyMetrics: 'Klíčové metriky',
      revenue: 'Tržby',
      expenses: 'Náklady',
      netIncome: 'Čistý zisk',
      cashBalance: 'Hotovost',
      accountsReceivable: 'Pohledávky',
      accountsPayable: 'Závazky',
      financialHealth: 'Finanční zdraví',
      healthScore: 'Skóre zdraví',
      revenueVsExpenses: 'Tržby vs náklady',
      quickLinks: 'Rychlé odkazy',
      viewInvoices: 'Zobrazit faktury',
      viewAllInvoices: 'Zobrazit všechny faktury',
      chartOfAccounts: 'Účtová osnova',
      viewAllAccounts: 'Zobrazit všechny účty',
      integrationSettings: 'Nastavení integrace',
      last12Months: 'Posledních 12 měsíců',
      syncNow: 'Synchronizovat',
      lastSyncAt: 'Poslední synchronizace',
    },
    invoicesPage: {
      title: 'Faktury',
      subtitle: 'Všechny synchronizované faktury z vašeho účetního softwaru',
      totalInvoices: 'Celkem faktur',
      issued: 'Vydané',
      received: 'Přijaté',
      paid: 'Zaplacené',
      unpaid: 'Nezaplacené',
      all: 'Všechny',
      filter: 'Filtr',
      invoiceNumber: 'Číslo faktury',
      customer: 'Zákazník',
      vendor: 'Dodavatel',
      type: 'Typ',
      issueDate: 'Datum vystavení',
      dueDate: 'Datum splatnosti',
      amount: 'Částka',
      status: 'Stav',
      noInvoices: 'Žádné faktury nenalezeny',
      filters: 'Filtry',
      dateFrom: 'Datum od',
      dateTo: 'Datum do',
      searchCustomer: 'Hledat zákazníka/dodavatele',
      clearFilters: 'Vymazat filtry',
      applyFilters: 'Použít filtry',
      filteredResults: 'Filtrované výsledky',
      showingOf: 'Zobrazeno %count% z %total% faktur',
      totalAmount: 'Celková částka',
      totalBalance: 'Celkový zůstatek k úhradě',
      totalPaid: 'Celkem zaplaceno',
      totalUnpaid: 'Celkem nezaplaceno',
      invoiceList: 'Seznam faktur',
      analytics: 'Analýzy',
      hideList: 'Skrýt seznam',
      showList: 'Zobrazit seznam',
      paymentStatus: 'Stav plateb',
      invoicesByType: 'Faktury podle typu',
      topCustomers: 'Top zákazníci',
      topSuppliers: 'Top dodavatelé',
      monthlyOverview: 'Měsíční přehled',
      avgDaysToPay: 'Prům. dní do zaplacení',
      days: 'dní',
      overdue: 'Po splatnosti',
      onTime: 'Včas',
      paymentTiming: 'Časování plateb',
      invoicesCount: 'faktur',
      lastMonth: 'Minulý měsíc',
      lastQuarter: 'Minulé čtvrtletí',
      lastYear: 'Minulý rok',
      currentMonth: 'Tento měsíc',
      currentQuarter: 'Toto čtvrtletí',
      currentYear: 'Tento rok',
      paidOn: 'Zaplaceno',
      sentAt: 'Odesláno',
      variableSymbol: 'Var. symbol',
      subtotal: 'Bez DPH',
      paymentMethod: 'Platba',
      documentType: 'Typ dok.',
      invoice: 'Faktura',
      proforma: 'Proforma',
      correction: 'Opravný',
      taxDocument: 'Daň. dokl.',
      sent: 'Odesláno',
      cancelled: 'Storno',
      open: 'Otevřeno',
      amountFrom: 'Částka od',
      amountTo: 'Částka do',
      currency: 'Měna',
      byCurrency: 'Podle měny',
      nativeAmount: 'Částka (CZK)',
      total: 'Celkem',
      exportCSV: 'Export CSV',
      exportJSON: 'Export JSON',
      export: 'Export',
    },
    accountsPage: {
      title: 'Účtová osnova',
      subtitle: 'Všechny účty synchronizované z vašeho účetního softwaru',
      totalAccounts: 'Celkem účtů',
      totalBalance: 'Celkový zůstatek',
      assets: 'Aktiva',
      liabilities: 'Pasiva',
      equity: 'Vlastní kapitál',
      accountNumber: 'Číslo účtu',
      accountName: 'Název účtu',
      type: 'Typ',
      balance: 'Zůstatek',
      noAccounts: 'Žádné účty nenalezeny',
      noAccountsFromIntegration: 'Účtová osnova není dostupná z vaší aktuální integrace.',
    },
    customersPage: {
      title: 'Kontakty',
      subtitle: 'Zákazníci a dodavatelé synchronizovaní z vašeho účetního softwaru',
      totalCustomers: 'Zákazníci',
      totalSuppliers: 'Dodavatelé',
      customers: 'Zákazníci',
      suppliers: 'Dodavatelé',
      name: 'Název',
      registrationNo: 'IČO',
      type: 'Typ',
      noCustomers: 'Žádní zákazníci ani dodavatelé nenalezeni',
    },
    bankAccountsPage: {
      title: 'Bankovní účty',
      subtitle: 'Bankovní účty synchronizované z vašeho účetního softwaru',
      totalBankAccounts: 'Celkem účtů',
      accountNumber: 'Číslo účtu',
      bankName: 'Název banky',
      currency: 'Měna',
      balance: 'Zůstatek',
      noBankAccounts: 'Žádné bankovní účty nenalezeny',
    },
    inventoryPage: {
      title: 'Sklad',
      subtitle: 'Produkty a skladové položky synchronizované z vašeho účetního softwaru',
      totalItems: 'Celkem položek',
      totalValue: 'Celková hodnota',
      sku: 'SKU',
      name: 'Název',
      quantity: 'Množství',
      unit: 'Jednotka',
      purchasePrice: 'Nákupní cena',
      retailPrice: 'Prodejní cena',
      noInventory: 'Žádné skladové položky nenalezeny',
    },
    eventsPage: {
      title: 'Historie aktivit',
      subtitle: 'Nedávná aktivita a události z vašeho účetního softwaru',
      totalEvents: 'Celkem událostí',
      event: 'Událost',
      user: 'Uživatel',
      date: 'Datum',
      relatedTo: 'Související s',
      noEvents: 'Žádné události nenalezeny',
    },
    todosPage: {
      title: 'Úkoly',
      subtitle: 'Úkoly a připomínky z vašeho účetního softwaru',
      totalTodos: 'Celkem úkolů',
      pendingTodos: 'Nevyřízené',
      task: 'Úkol',
      status: 'Stav',
      createdAt: 'Vytvořeno',
      completedAt: 'Dokončeno',
      relatedTo: 'Související s',
      noTodos: 'Žádné úkoly nenalezeny',
      pending: 'Nevyřízené',
      completed: 'Dokončené',
    },
    transactionsPage: {
      title: 'Bankovní transakce',
      subtitle: 'Všechny bankovní transakce synchronizované z vašeho účetního softwaru',
      totalTransactions: 'Celkem transakcí',
      income: 'Příjmy',
      expenses: 'Výdaje',
      netFlow: 'Čistý tok',
      date: 'Datum',
      description: 'Popis',
      payee: 'Příjemce',
      category: 'Kategorie',
      amount: 'Částka',
      noTransactions: 'Žádné transakce nenalezeny',
    },
    reportsPage: {
      title: 'Reporty a analýzy',
      subtitle: 'Komplexní finanční analýza a přehledy',
      profitability: 'Ziskovost',
      profitabilityDesc: 'Trendy tržeb a ziskové marže',
      revenueTrend: 'Trend tržeb',
      grossMargin: 'Hrubá marže',
      grossMarginPercent: 'Hrubá marže %',
      netMargin: 'Čistá marže',
      netMarginPercent: 'Čistá marže %',
      liquidity: 'Likvidita a cash flow',
      liquidityDesc: 'Hotovostní pozice a ukazatele likvidity',
      currentRatio: 'Běžná likvidita',
      quickRatio: 'Pohotová likvidita',
      cashPosition: 'Hotovostní pozice',
      cashTrend: 'Trend hotovosti',
      receivablesPayables: 'Pohledávky a závazky',
      receivablesPayablesDesc: 'Analýza pohledávek a závazků',
      receivables: 'Pohledávky',
      payables: 'Závazky',
      dso: 'DSO (Doba inkasa pohledávek)',
      dpo: 'DPO (Doba splatnosti závazků)',
      agingBreakdown: 'Analýza stáří',
      current: 'Aktuální',
      days30: '1-30 dní',
      days60: '31-60 dní',
      days90Plus: '90+ dní',
      financialStructure: 'Finanční struktura',
      financialStructureDesc: 'Složení rozvahy',
      debtToEquity: 'Dluh k vlastnímu kapitálu',
      totalAssets: 'Celková aktiva',
      totalLiabilities: 'Celková pasiva',
      totalEquity: 'Vlastní kapitál',
      assetComposition: 'Složení aktiv',
      customerAnalysis: 'Analýza zákazníků a dodavatelů',
      customerAnalysisDesc: 'Top zákazníci a dodavatelé podle tržeb',
      topCustomers: 'Top zákazníci',
      topVendors: 'Top dodavatelé',
      customer: 'Zákazník',
      vendor: 'Dodavatel',
      invoiceCount: 'Počet faktur',
      totalValue: 'Celková hodnota',
    },
    settingsPage: {
      title: 'Nastavení',
      subtitle: 'Nastavení firmy a správa integrace',
      companyInfo: 'Informace o firmě',
      companyName: 'Název firmy',
      businessId: 'IČO',
      country: 'Země',
      currency: 'Měna',
      integration: 'Integrace',
      connectedTo: 'Připojeno k',
      connectionStatus: 'Stav připojení',
      connected: 'Připojeno',
      pending: 'Čeká',
      disconnected: 'Odpojeno',
      lastSync: 'Poslední synchronizace',
      syncNow: 'Synchronizovat',
      changeIntegration: 'Změnit integraci',
      dangerZone: 'Nebezpečná zóna',
      deleteCompany: 'Smazat firmu',
      deleteWarning: 'Tuto akci nelze vrátit. Všechna data firmy budou trvale smazána.',
    },
    connectPage: {
      title: 'Připojit účetní software',
      subtitle: 'Vyberte svůj účetní software pro synchronizaci finančních dat',
      selectSoftware: 'Vyberte software',
      popular: 'Oblíbené',
      other: 'Ostatní',
      comingSoon: 'Již brzy',
      connect: 'Připojit',
      requestIntegration: 'Požádat o integraci',
    },
    offersPage: {
      title: 'Nabídky financování',
      subtitle: 'Prohlédněte a porovnejte nabídky financování od našich partnerských věřitelů',
      getOffers: 'Získat nabídky financování',
      viewOffers: 'Zobrazit nabídky',
      noOffers: 'Zatím žádné nabídky',
      noOffersDesc: 'Povolte viditelnost pro věřitele a začněte dostávat personalizované nabídky financování na základě vašeho finančního zdraví.',
      enableVisibility: 'Povolit viditelnost pro věřitele',
      visibilityEnabled: 'Vaše firma je viditelná pro věřitele',
      visibilityDisabled: 'Vaše firma je skrytá před věřiteli',
      financingNeeds: 'Potřeby financování',
      desiredAmount: 'Požadovaná částka',
      purpose: 'Účel',
      purposeOptions: {
        workingCapital: 'Provozní kapitál',
        equipment: 'Nákup vybavení',
        expansion: 'Rozšíření podnikání',
        inventory: 'Zásoby',
        other: 'Jiné',
      },
      savePreferences: 'Uložit preference',
      offerDetails: 'Detaily nabídky',
      lender: 'Věřitel',
      offerType: 'Typ nabídky',
      amount: 'Částka',
      interestRate: 'Úroková sazba',
      term: 'Doba splácení',
      monthlyPayment: 'Měsíční splátka',
      requirements: 'Požadavky',
      expiresAt: 'Platnost do',
      apply: 'Požádat nyní',
      decline: 'Odmítnout',
      offerTypes: {
        loan: 'Podnikatelský úvěr',
        creditLine: 'Úvěrový rámec',
        factoring: 'Faktoring faktur',
        leasing: 'Leasing',
      },
      pendingOffers: 'Čekající nabídky',
      activeOffers: 'Aktivní nabídky',
      expiredOffers: 'Vypršelé nabídky',
      applySuccess: 'Žádost byla úspěšně odeslána',
      preferencesUpdated: 'Preference byly úspěšně aktualizovány',
    },
    common: {
      loading: 'Načítání...',
      error: 'Chyba',
      success: 'Úspěch',
      save: 'Uložit',
      cancel: 'Zrušit',
      delete: 'Smazat',
      edit: 'Upravit',
      back: 'Zpět',
      next: 'Další',
      submit: 'Odeslat',
      close: 'Zavřít',
      search: 'Hledat',
      noData: 'Žádná data k dispozici',
      total: 'Celkem',
      average: 'Průměr',
      monthly: 'Měsíčně',
      yearly: 'Ročně',
      days: 'dní',
      months: 'měsíců',
    },
    months: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
    monthsShort: ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'],
  },
  sk: {
    nav: {
      overview: 'Prehľad',
      data: 'Dáta',
      invoices: 'Faktúry',
      accounts: 'Účtová osnova',
      customers: 'Kontakty',
      bankAccounts: 'Bankové účty',
      inventory: 'Sklad',
      events: 'Aktivita',
      todos: 'Úlohy',
      transactions: 'Transakcie',
      reports: 'Reporty',
      offers: 'Ponuky',
      settings: 'Nastavenia',
      logout: 'Odhlásiť',
      switchCompany: 'Zmeniť firmu',
    },
    dashboard: {
      title: 'Nástenka',
      welcome: 'Vitajte späť',
      yourCompanies: 'Vaše firmy',
      addCompany: 'Pridať firmu',
      tryDemo: 'Vyskúšať demo',
      noCompanies: 'Zatiaľ žiadne firmy',
      createFirst: 'Vytvorte svoju prvú firmu',
      revenue: 'Tržby',
      expenses: 'Náklady',
      netIncome: 'Čistý zisk',
      viewDetails: 'Zobraziť detail',
      lastSync: 'Posledný sync',
      notConnected: 'Nepripojené',
    },
    overview: {
      title: 'Prehľad firmy',
      keyMetrics: 'Kľúčové metriky',
      revenue: 'Tržby',
      expenses: 'Náklady',
      netIncome: 'Čistý zisk',
      cashBalance: 'Hotovosť',
      accountsReceivable: 'Pohľadávky',
      accountsPayable: 'Záväzky',
      financialHealth: 'Finančné zdravie',
      healthScore: 'Skóre zdravia',
      revenueVsExpenses: 'Tržby vs náklady',
      quickLinks: 'Rýchle odkazy',
      viewInvoices: 'Zobraziť faktúry',
      viewAllInvoices: 'Zobraziť všetky faktúry',
      chartOfAccounts: 'Účtová osnova',
      viewAllAccounts: 'Zobraziť všetky účty',
      integrationSettings: 'Nastavenia integrácie',
      last12Months: 'Posledných 12 mesiacov',
      syncNow: 'Synchronizovať',
      lastSyncAt: 'Posledná synchronizácia',
    },
    invoicesPage: {
      title: 'Faktúry',
      subtitle: 'Všetky synchronizované faktúry z vášho účtovného softvéru',
      totalInvoices: 'Celkom faktúr',
      issued: 'Vydané',
      received: 'Prijaté',
      paid: 'Zaplatené',
      unpaid: 'Nezaplatené',
      all: 'Všetky',
      filter: 'Filter',
      invoiceNumber: 'Číslo faktúry',
      customer: 'Zákazník',
      vendor: 'Dodávateľ',
      type: 'Typ',
      issueDate: 'Dátum vystavenia',
      dueDate: 'Dátum splatnosti',
      amount: 'Suma',
      status: 'Stav',
      noInvoices: 'Žiadne faktúry nenájdené',
      filters: 'Filtre',
      dateFrom: 'Dátum od',
      dateTo: 'Dátum do',
      searchCustomer: 'Hľadať zákazníka/dodávateľa',
      clearFilters: 'Vymazať filtre',
      applyFilters: 'Použiť filtre',
      filteredResults: 'Filtrované výsledky',
      showingOf: 'Zobrazených %count% z %total% faktúr',
      totalAmount: 'Celková suma',
      totalBalance: 'Celkový zostatok na úhradu',
      totalPaid: 'Celkom zaplatené',
      totalUnpaid: 'Celkom nezaplatené',
      invoiceList: 'Zoznam faktúr',
      analytics: 'Analýzy',
      hideList: 'Skryť zoznam',
      showList: 'Zobraziť zoznam',
      paymentStatus: 'Stav platieb',
      invoicesByType: 'Faktúry podľa typu',
      topCustomers: 'Top zákazníci',
      topSuppliers: 'Top dodávatelia',
      monthlyOverview: 'Mesačný prehľad',
      avgDaysToPay: 'Priem. dní do zaplatenia',
      days: 'dní',
      overdue: 'Po splatnosti',
      onTime: 'Včas',
      paymentTiming: 'Časovanie platieb',
      invoicesCount: 'faktúr',
      lastMonth: 'Minulý mesiac',
      lastQuarter: 'Minulý štvrťrok',
      lastYear: 'Minulý rok',
      currentMonth: 'Tento mesiac',
      currentQuarter: 'Tento štvrťrok',
      currentYear: 'Tento rok',
      paidOn: 'Zaplatené',
      sentAt: 'Odoslané',
      variableSymbol: 'Var. symbol',
      subtotal: 'Bez DPH',
      paymentMethod: 'Platba',
      documentType: 'Typ dok.',
      invoice: 'Faktúra',
      proforma: 'Proforma',
      correction: 'Opravný',
      taxDocument: 'Daň. dokl.',
      sent: 'Odoslané',
      cancelled: 'Storno',
      open: 'Otvorené',
      amountFrom: 'Suma od',
      amountTo: 'Suma do',
      currency: 'Mena',
      byCurrency: 'Podľa meny',
      nativeAmount: 'Suma (CZK)',
      total: 'Spolu',
      exportCSV: 'Export CSV',
      exportJSON: 'Export JSON',
      export: 'Export',
    },
    accountsPage: {
      title: 'Účtová osnova',
      subtitle: 'Všetky účty synchronizované z vášho účtovného softvéru',
      totalAccounts: 'Celkom účtov',
      totalBalance: 'Celkový zostatok',
      assets: 'Aktíva',
      liabilities: 'Pasíva',
      equity: 'Vlastný kapitál',
      accountNumber: 'Číslo účtu',
      accountName: 'Názov účtu',
      type: 'Typ',
      balance: 'Zostatok',
      noAccounts: 'Žiadne účty nenájdené',
      noAccountsFromIntegration: 'Účtová osnova nie je dostupná z vašej aktuálnej integrácie.',
    },
    customersPage: {
      title: 'Kontakty',
      subtitle: 'Zákazníci a dodávatelia synchronizovaní z vášho účtovného softvéru',
      totalCustomers: 'Zákazníci',
      totalSuppliers: 'Dodávatelia',
      customers: 'Zákazníci',
      suppliers: 'Dodávatelia',
      name: 'Názov',
      registrationNo: 'IČO',
      type: 'Typ',
      noCustomers: 'Žiadni zákazníci ani dodávatelia nenájdení',
    },
    bankAccountsPage: {
      title: 'Bankové účty',
      subtitle: 'Bankové účty synchronizované z vášho účtovného softvéru',
      totalBankAccounts: 'Celkom účtov',
      accountNumber: 'Číslo účtu',
      bankName: 'Názov banky',
      currency: 'Mena',
      balance: 'Zostatok',
      noBankAccounts: 'Žiadne bankové účty nenájdené',
    },
    inventoryPage: {
      title: 'Sklad',
      subtitle: 'Produkty a skladové položky synchronizované z vášho účtovného softvéru',
      totalItems: 'Celkom položiek',
      totalValue: 'Celková hodnota',
      sku: 'SKU',
      name: 'Názov',
      quantity: 'Množstvo',
      unit: 'Jednotka',
      purchasePrice: 'Nákupná cena',
      retailPrice: 'Predajná cena',
      noInventory: 'Žiadne skladové položky nenájdené',
    },
    eventsPage: {
      title: 'História aktivít',
      subtitle: 'Nedávna aktivita a udalosti z vášho účtovného softvéru',
      totalEvents: 'Celkom udalostí',
      event: 'Udalosť',
      user: 'Používateľ',
      date: 'Dátum',
      relatedTo: 'Súvisiace s',
      noEvents: 'Žiadne udalosti nenájdené',
    },
    todosPage: {
      title: 'Úlohy',
      subtitle: 'Úlohy a pripomienky z vášho účtovného softvéru',
      totalTodos: 'Celkom úloh',
      pendingTodos: 'Nevybavené',
      task: 'Úloha',
      status: 'Stav',
      createdAt: 'Vytvorené',
      completedAt: 'Dokončené',
      relatedTo: 'Súvisiace s',
      noTodos: 'Žiadne úlohy nenájdené',
      pending: 'Nevybavené',
      completed: 'Dokončené',
    },
    transactionsPage: {
      title: 'Bankové transakcie',
      subtitle: 'Všetky bankové transakcie synchronizované z vášho účtovného softvéru',
      totalTransactions: 'Celkom transakcií',
      income: 'Príjmy',
      expenses: 'Výdavky',
      netFlow: 'Čistý tok',
      date: 'Dátum',
      description: 'Popis',
      payee: 'Príjemca',
      category: 'Kategória',
      amount: 'Suma',
      noTransactions: 'Žiadne transakcie nenájdené',
    },
    reportsPage: {
      title: 'Reporty a analýzy',
      subtitle: 'Komplexná finančná analýza a prehľady',
      profitability: 'Ziskovosť',
      profitabilityDesc: 'Trendy tržieb a ziskové marže',
      revenueTrend: 'Trend tržieb',
      grossMargin: 'Hrubá marža',
      grossMarginPercent: 'Hrubá marža %',
      netMargin: 'Čistá marža',
      netMarginPercent: 'Čistá marža %',
      liquidity: 'Likvidita a cash flow',
      liquidityDesc: 'Hotovostná pozícia a ukazovatele likvidity',
      currentRatio: 'Bežná likvidita',
      quickRatio: 'Pohotová likvidita',
      cashPosition: 'Hotovostná pozícia',
      cashTrend: 'Trend hotovosti',
      receivablesPayables: 'Pohľadávky a záväzky',
      receivablesPayablesDesc: 'Analýza pohľadávok a záväzkov',
      receivables: 'Pohľadávky',
      payables: 'Záväzky',
      dso: 'DSO (Doba inkasa pohľadávok)',
      dpo: 'DPO (Doba splatnosti záväzkov)',
      agingBreakdown: 'Analýza veku',
      current: 'Aktuálne',
      days30: '1-30 dní',
      days60: '31-60 dní',
      days90Plus: '90+ dní',
      financialStructure: 'Finančná štruktúra',
      financialStructureDesc: 'Zloženie súvahy',
      debtToEquity: 'Dlh k vlastnému kapitálu',
      totalAssets: 'Celkové aktíva',
      totalLiabilities: 'Celkové pasíva',
      totalEquity: 'Vlastný kapitál',
      assetComposition: 'Zloženie aktív',
      customerAnalysis: 'Analýza zákazníkov a dodávateľov',
      customerAnalysisDesc: 'Top zákazníci a dodávatelia podľa tržieb',
      topCustomers: 'Top zákazníci',
      topVendors: 'Top dodávatelia',
      customer: 'Zákazník',
      vendor: 'Dodávateľ',
      invoiceCount: 'Počet faktúr',
      totalValue: 'Celková hodnota',
    },
    settingsPage: {
      title: 'Nastavenia',
      subtitle: 'Nastavenia firmy a správa integrácie',
      companyInfo: 'Informácie o firme',
      companyName: 'Názov firmy',
      businessId: 'IČO',
      country: 'Krajina',
      currency: 'Mena',
      integration: 'Integrácia',
      connectedTo: 'Pripojené k',
      connectionStatus: 'Stav pripojenia',
      connected: 'Pripojené',
      pending: 'Čaká',
      disconnected: 'Odpojené',
      lastSync: 'Posledná synchronizácia',
      syncNow: 'Synchronizovať',
      changeIntegration: 'Zmeniť integráciu',
      dangerZone: 'Nebezpečná zóna',
      deleteCompany: 'Zmazať firmu',
      deleteWarning: 'Túto akciu nemožno vrátiť. Všetky dáta firmy budú trvalo zmazané.',
    },
    connectPage: {
      title: 'Pripojiť účtovný softvér',
      subtitle: 'Vyberte svoj účtovný softvér pre synchronizáciu finančných dát',
      selectSoftware: 'Vyberte softvér',
      popular: 'Obľúbené',
      other: 'Ostatné',
      comingSoon: 'Už čoskoro',
      connect: 'Pripojiť',
      requestIntegration: 'Požiadať o integráciu',
    },
    offersPage: {
      title: 'Ponuky financovania',
      subtitle: 'Prehliadnite a porovnajte ponuky financovania od našich partnerských veriteľov',
      getOffers: 'Získať ponuky financovania',
      viewOffers: 'Zobraziť ponuky',
      noOffers: 'Zatiaľ žiadne ponuky',
      noOffersDesc: 'Povoľte viditeľnosť pre veriteľov a začnite dostávať personalizované ponuky financovania na základe vášho finančného zdravia.',
      enableVisibility: 'Povoliť viditeľnosť pre veriteľov',
      visibilityEnabled: 'Vaša firma je viditeľná pre veriteľov',
      visibilityDisabled: 'Vaša firma je skrytá pred veriteľmi',
      financingNeeds: 'Potreby financovania',
      desiredAmount: 'Požadovaná suma',
      purpose: 'Účel',
      purposeOptions: {
        workingCapital: 'Prevádzkový kapitál',
        equipment: 'Nákup vybavenia',
        expansion: 'Rozšírenie podnikania',
        inventory: 'Zásoby',
        other: 'Iné',
      },
      savePreferences: 'Uložiť preferencie',
      offerDetails: 'Detaily ponuky',
      lender: 'Veriteľ',
      offerType: 'Typ ponuky',
      amount: 'Suma',
      interestRate: 'Úroková sadzba',
      term: 'Doba splácania',
      monthlyPayment: 'Mesačná splátka',
      requirements: 'Požiadavky',
      expiresAt: 'Platnosť do',
      apply: 'Požiadať teraz',
      decline: 'Odmietnuť',
      offerTypes: {
        loan: 'Podnikateľský úver',
        creditLine: 'Úverový rámec',
        factoring: 'Faktoring faktúr',
        leasing: 'Leasing',
      },
      pendingOffers: 'Čakajúce ponuky',
      activeOffers: 'Aktívne ponuky',
      expiredOffers: 'Vypršané ponuky',
      applySuccess: 'Žiadosť bola úspešne odoslaná',
      preferencesUpdated: 'Preferencie boli úspešne aktualizované',
    },
    common: {
      loading: 'Načítava sa...',
      error: 'Chyba',
      success: 'Úspech',
      save: 'Uložiť',
      cancel: 'Zrušiť',
      delete: 'Zmazať',
      edit: 'Upraviť',
      back: 'Späť',
      next: 'Ďalej',
      submit: 'Odoslať',
      close: 'Zavrieť',
      search: 'Hľadať',
      noData: 'Žiadne dáta k dispozícii',
      total: 'Celkom',
      average: 'Priemer',
      monthly: 'Mesačne',
      yearly: 'Ročne',
      days: 'dní',
      months: 'mesiacov',
    },
    months: ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
  },
};

// Helper function to get translations
export function getTranslations(lang: string): Translations {
  if (lang === 'cs' || lang === 'cz') return translations.cs;
  if (lang === 'sk') return translations.sk;
  return translations.en;
}

// Helper to detect language from Accept-Language header
export function detectLanguage(acceptLanguage: string | undefined): Language {
  if (!acceptLanguage) return 'en';

  const langs = acceptLanguage.toLowerCase().split(',').map(l => l.split(';')[0].trim());

  for (const lang of langs) {
    if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cs';
    if (lang.startsWith('sk')) return 'sk';
    if (lang.startsWith('en')) return 'en';
  }

  return 'en';
}
