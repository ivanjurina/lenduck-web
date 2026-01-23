// App translations for LenDuck

export type Language = 'en' | 'cs' | 'sk';

export interface Translations {
  // Navigation
  nav: {
    overview: string;
    data: string;
    invoices: string;
    accounts: string;
    transactions: string;
    reports: string;
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
      transactions: 'Transactions',
      reports: 'Reports',
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
      accounts: 'Účty',
      transactions: 'Transakce',
      reports: 'Reporty',
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
      accounts: 'Účty',
      transactions: 'Transakcie',
      reports: 'Reporty',
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
