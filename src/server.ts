import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as db from './database';
import * as quickbooks from './services/quickbooks';
import * as profit365 from './services/profit365';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'lenduck-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// Track visitors middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip tracking for static files and API endpoints
  if (req.path.startsWith('/api') ||
      req.path.includes('.') ||
      req.path === '/favicon.ico') {
    return next();
  }

  try {
    db.trackVisitor({
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']?.substring(0, 500),
      page_visited: req.path,
      referrer: req.headers.referer?.substring(0, 500)
    });
  } catch (e) {
    // Silently fail tracking
  }
  next();
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.redirect('/login');
  }
  next();
}

// Helper to render HTML pages
function renderPage(title: string, content: string, req: Request): string {
  const isLoggedIn = !!req.session.userId;
  const isAdmin = !!req.session.isAdmin;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="apple-touch-icon" href="/logo.png">
    <title>${title} | Lenduck</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-forest: #2d5a3d;
            --color-forest-dark: #1e3d29;
            --color-forest-light: #3d7a52;
            --color-sage: #7c9a82;
            --color-sage-light: #a8c4ad;
            --color-sage-pale: #d4e4d7;
            --color-cream: #faf8f3;
            --color-cream-dark: #f0ebe0;
            --color-brown: #5c4d3c;
            --color-brown-light: #8b7355;
            --color-text: #3d3d3d;
            --color-text-light: #6b6b6b;
            --color-border: #d4d4c4;
            --color-error: #c44536;
            --color-success: #2d5a3d;
            --font-main: 'Nunito', sans-serif;
            --shadow-soft: 0 4px 20px rgba(45, 90, 61, 0.08);
            --shadow-medium: 0 8px 30px rgba(45, 90, 61, 0.12);
            --radius-soft: 20px;
            --radius-round: 50px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: var(--font-main); background: var(--color-cream); color: var(--color-text); line-height: 1.7; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        h1, h2, h3 { font-weight: 700; color: var(--color-forest-dark); }
        nav { padding: 20px 0; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250, 248, 243, 0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(124, 154, 130, 0.2); }
        .nav-inner { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon { width: 40px; height: 40px; }
        .logo-text { font-size: 1.5rem; font-weight: 800; color: var(--color-forest); }
        .nav-links { display: flex; gap: 24px; align-items: center; }
        .nav-links a { color: var(--color-text-light); text-decoration: none; font-size: 0.95rem; font-weight: 600; transition: color 0.3s; }
        .nav-links a:hover { color: var(--color-forest); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px; border-radius: var(--radius-round); font-weight: 700; font-size: 0.95rem; text-decoration: none; transition: all 0.3s; cursor: pointer; border: none; font-family: var(--font-main); }
        .btn-primary { background: linear-gradient(135deg, var(--color-forest), #4a7c59); color: white; box-shadow: 0 4px 15px rgba(45, 90, 61, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45, 90, 61, 0.4); }
        .btn-secondary { background: var(--color-cream); color: var(--color-forest); border: 2px solid var(--color-sage); }
        .btn-secondary:hover { background: var(--color-sage-pale); }
        .btn-full { width: 100%; }
        main { padding-top: 100px; min-height: calc(100vh - 100px); }
        .auth-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 100px); padding: 40px 20px; }
        .auth-card { background: white; border-radius: var(--radius-soft); box-shadow: var(--shadow-medium); padding: 48px; width: 100%; max-width: 440px; }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header h1 { font-size: 1.75rem; margin-bottom: 8px; }
        .auth-header p { color: var(--color-text-light); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 14px 18px; border: 2px solid var(--color-border); border-radius: 12px; font-size: 1rem; font-family: var(--font-main); transition: all 0.3s; background: var(--color-cream); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-forest); background: white; }
        .flash { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; font-weight: 500; }
        .flash-error { background: #fef2f2; color: var(--color-error); border: 1px solid #fecaca; }
        .flash-success { background: #f0fdf4; color: var(--color-success); border: 1px solid #bbf7d0; }
        .auth-footer { text-align: center; margin-top: 24px; color: var(--color-text-light); }
        .auth-footer a { color: var(--color-forest); text-decoration: none; font-weight: 600; }
        .auth-footer a:hover { text-decoration: underline; }
        .dashboard-header { background: linear-gradient(135deg, var(--color-forest), #4a7c59); color: white; padding: 60px 0; margin-top: -20px; }
        .dashboard-title { color: white; font-size: 2rem; }
        .dashboard-subtitle { color: var(--color-sage-light); margin-top: 8px; }
        .dashboard-content { padding: 40px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .stat-card { background: white; border-radius: var(--radius-soft); box-shadow: var(--shadow-soft); padding: 28px; text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: 800; color: var(--color-forest); }
        .stat-label { color: var(--color-text-light); font-weight: 600; margin-top: 4px; }
        .data-table { background: white; border-radius: var(--radius-soft); box-shadow: var(--shadow-soft); overflow: hidden; margin-bottom: 32px; }
        .table-header { background: var(--color-sage-pale); padding: 20px 24px; }
        .table-header h3 { font-size: 1.1rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 14px 20px; text-align: left; border-bottom: 1px solid var(--color-border); }
        th { background: var(--color-cream); font-weight: 700; color: var(--color-forest-dark); font-size: 0.85rem; text-transform: uppercase; }
        tr:hover td { background: var(--color-cream); }
        td { font-size: 0.9rem; }
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--color-border); }
        .tab { padding: 12px 24px; background: none; border: none; font-family: var(--font-main); font-weight: 600; color: var(--color-text-light); cursor: pointer; position: relative; }
        .tab:hover { color: var(--color-forest); }
        .tab.active { color: var(--color-forest); }
        .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: var(--color-forest); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .empty-state { padding: 48px; text-align: center; color: var(--color-text-light); }
        .truncate { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .badge-admin { background: var(--color-forest); color: white; }
        .badge-user { background: var(--color-sage-pale); color: var(--color-forest-dark); }
        @media (max-width: 768px) {
            .auth-card { padding: 32px 24px; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .nav-links { gap: 16px; }
        }
    </style>
</head>
<body>
    <nav>
        <div class="container">
            <div class="nav-inner">
                <a href="/" class="logo">
                    <img src="/logo.png" alt="Lenduck" class="logo-icon">
                    <span class="logo-text">Lenduck</span>
                </a>
                <div class="nav-links">
                    <a href="/">Home</a>
                    ${isLoggedIn ? `
                        ${isAdmin ? '<a href="/admin">Admin</a>' : ''}
                        <a href="/dashboard">Dashboard</a>
                        <a href="/logout" class="btn btn-secondary">Logout</a>
                    ` : `
                        <a href="/login">Login</a>
                        <a href="/signup" class="btn btn-primary">Sign Up</a>
                    `}
                </div>
            </div>
        </div>
    </nav>
    <main>
        ${content}
    </main>
</body>
</html>`;
}

// Routes

// Home
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'index8.html'));
});

app.get('/cz', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'index8-cz.html'));
});

// SEO files
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, '..', 'robots.txt'));
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, '..', 'sitemap.xml'));
});

// Login
app.get('/login', (req: Request, res: Response) => {
  // Redirect logged-in users to dashboard
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }

  const error = req.query.error as string;
  const success = req.query.success as string;

  const content = `
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Welcome back</h1>
                <p>Log in to your Lenduck account</p>
            </div>
            ${error ? `<div class="flash flash-error">${error}</div>` : ''}
            ${success ? `<div class="flash flash-success">${success}</div>` : ''}
            <form method="POST" action="/login">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="you@company.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="Enter your password">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Log In</button>
            </form>
            <div class="auth-footer">
                Don't have an account? <a href="/signup">Sign up</a>
            </div>
        </div>
    </div>
  `;

  res.send(renderPage('Login', content, req));
});

app.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/login?error=' + encodeURIComponent('Email and password are required.'));
  }

  const user = db.validateUser(email, password);
  if (!user) {
    return res.redirect('/login?error=' + encodeURIComponent('Invalid email or password.'));
  }

  req.session.userId = user.id;
  req.session.isAdmin = user.is_admin === 1;

  if (user.is_admin) {
    return res.redirect('/admin');
  }
  res.redirect('/dashboard');
});

// Signup
app.get('/signup', (req: Request, res: Response) => {
  // Redirect logged-in users to dashboard
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }

  const error = req.query.error as string;
  const success = req.query.success as string;

  const content = `
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Get Early Access</h1>
                <p>Join Lenduck and we'll send you login details</p>
            </div>
            ${error ? `<div class="flash flash-error">${error}</div>` : ''}
            ${success ? `<div class="flash flash-success">${success}</div>` : ''}
            <form method="POST" action="/signup">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="you@company.com">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Sign Up</button>
            </form>
            <div class="auth-footer">
                Already have an account? <a href="/login">Log in</a>
            </div>
        </div>
    </div>
  `;

  res.send(renderPage('Sign Up', content, req));
});

app.post('/signup', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.redirect('/signup?error=' + encodeURIComponent('Email is required.'));
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.redirect('/signup?error=' + encodeURIComponent('Email already registered.'));
  }

  try {
    db.createPendingUser(email);
    res.redirect('/signup?success=' + encodeURIComponent('Thanks for signing up! We will send you your login details soon.'));
  } catch (e) {
    res.redirect('/signup?error=' + encodeURIComponent('Failed to sign up. Please try again.'));
  }
});

// Logout
app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Dashboard - Shows user's companies
app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById(req.session.userId!);
  const companies = db.getCompaniesByUserId(req.session.userId!);

  const companyCards = companies.length > 0 ? companies.map(company => {
    const connection = db.getAccountingConnection(company.id);
    const statusBadge = connection
      ? (connection.status === 'connected'
        ? '<span class="badge badge-success">Connected</span>'
        : '<span class="badge badge-warning">Pending</span>')
      : '<span class="badge badge-error">Not Connected</span>';

    return `
      <div class="company-card">
        <div class="company-card-header">
          <h3>${company.name}</h3>
          ${statusBadge}
        </div>
        <div class="company-card-body">
          <p><strong>Country:</strong> ${company.country || 'N/A'}</p>
          <p><strong>Currency:</strong> ${company.currency || 'N/A'}</p>
          ${connection ? `<p><strong>Software:</strong> ${connection.software_type}</p>` : ''}
          ${connection?.last_sync_at ? `<p><strong>Last Sync:</strong> ${new Date(connection.last_sync_at).toLocaleString()}</p>` : ''}
        </div>
        <div class="company-card-actions">
          ${connection?.status === 'connected'
            ? `<a href="/company/${company.id}/overview" class="btn btn-primary">View Financial Data</a>
               <a href="/company/${company.id}/sync" class="btn btn-secondary">Sync Now</a>`
            : `<a href="/company/${company.id}/connect" class="btn btn-primary">Connect Accounting</a>`
          }
        </div>
      </div>
    `;
  }).join('') : `
    <div class="empty-state" style="padding: 48px;">
      <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 12px;">No companies yet</p>
      <p style="margin-bottom: 24px;">Add your first company to connect your accounting software and get financing offers.</p>
      <a href="/company/new" class="btn btn-primary">Add Company</a>
    </div>
  `;

  const content = `
    <div class="dashboard-header">
        <div class="container">
            <h1 class="dashboard-title">Welcome, ${user.email}</h1>
            <p class="dashboard-subtitle">Manage your companies and financing</p>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="container">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Your Companies</h2>
                <a href="/company/new" class="btn btn-primary">+ Add Company</a>
            </div>
            <div class="companies-grid">
                ${companyCards}
            </div>
        </div>
    </div>
    <style>
      .companies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
      .company-card { background: white; border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; }
      .company-card-header { padding: 20px; background: var(--color-sage-pale); display: flex; justify-content: space-between; align-items: center; }
      .company-card-header h3 { margin: 0; color: var(--color-forest-dark); }
      .company-card-body { padding: 20px; }
      .company-card-body p { margin: 8px 0; color: var(--color-text-light); }
      .company-card-actions { padding: 20px; border-top: 1px solid var(--color-border); display: flex; gap: 12px; }
      .badge-success { background: #22c55e; color: white; }
      .badge-warning { background: #f59e0b; color: white; }
      .badge-error { background: #ef4444; color: white; }
      .section-header h2 { margin: 0; color: var(--color-forest-dark); }
    </style>
  `;

  res.send(renderPage('Dashboard', content, req));
});

// Add new company form
app.get('/company/new', requireAuth, (req: Request, res: Response) => {
  const error = req.query.error as string;

  const content = `
    <div class="auth-container">
      <div class="auth-card" style="max-width: 500px;">
        <div class="auth-header">
          <h1>Add New Company</h1>
          <p>Enter your company details to get started</p>
        </div>
        ${error ? `<div class="flash flash-error">${error}</div>` : ''}
        <form method="POST" action="/company/new">
          <div class="form-group">
            <label for="name">Company Name *</label>
            <input type="text" id="name" name="name" required placeholder="Your Company Ltd.">
          </div>
          <div class="form-group">
            <label for="business_id">Business ID (ICO)</label>
            <input type="text" id="business_id" name="business_id" placeholder="12345678">
          </div>
          <div class="form-group">
            <label for="country">Country</label>
            <select id="country" name="country">
              <option value="CZ">Czech Republic</option>
              <option value="SK">Slovakia</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
            </select>
          </div>
          <div class="form-group">
            <label for="currency">Currency</label>
            <select id="currency" name="currency">
              <option value="CZK">CZK - Czech Koruna</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Create Company</button>
        </form>
        <div class="auth-footer">
          <a href="/dashboard">Back to Dashboard</a>
        </div>
      </div>
    </div>
  `;

  res.send(renderPage('Add Company', content, req));
});

app.post('/company/new', requireAuth, (req: Request, res: Response) => {
  const { name, business_id, country, currency } = req.body;

  if (!name) {
    return res.redirect('/company/new?error=' + encodeURIComponent('Company name is required.'));
  }

  try {
    const result = db.createCompany({
      user_id: req.session.userId!,
      name,
      business_id,
      country,
      currency,
    });
    res.redirect(`/company/${result.lastInsertRowid}/connect`);
  } catch (e) {
    res.redirect('/company/new?error=' + encodeURIComponent('Failed to create company.'));
  }
});

// Connect accounting software
app.get('/company/:id/connect', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const error = req.query.error as string;
  const success = req.query.success as string;

  const softwareOptions = [
    { value: 'quickbooks', name: 'QuickBooks Online', description: 'Popular in US/UK, REST API with OAuth2', available: true },
    { value: 'xero', name: 'Xero', description: 'Cloud accounting, REST API', available: false },
    { value: 'flexibee', name: 'ABRA FlexiBee', description: 'Popular in Czech Republic, REST API', available: false },
    { value: 'pohoda', name: 'Pohoda', description: 'Most popular in Czech Republic, XML API', available: false },
    { value: 'idoklad', name: 'iDoklad', description: 'Czech invoicing system, REST API', available: false },
    { value: 'profit365', name: 'Profit365', description: 'Slovak/Czech accounting, REST API', available: true },
    { value: 'other', name: 'Other', description: 'Tell us what you use', available: true },
  ];

  const softwareCards = softwareOptions.map(sw => `
    <div class="software-card ${sw.available ? '' : 'disabled'}">
      <div class="software-card-content">
        <h3>${sw.name}</h3>
        <p>${sw.description}</p>
        ${!sw.available ? '<span class="badge badge-coming">Coming Soon</span>' : ''}
      </div>
      ${sw.available ? `
        <form method="POST" action="/company/${companyId}/connect">
          <input type="hidden" name="software_type" value="${sw.value}">
          <button type="submit" class="btn btn-primary">Connect</button>
        </form>
      ` : ''}
    </div>
  `).join('');

  const content = `
    <div class="dashboard-header">
      <div class="container">
        <h1 class="dashboard-title">Connect Accounting Software</h1>
        <p class="dashboard-subtitle">for ${company.name}</p>
      </div>
    </div>
    <div class="dashboard-content">
      <div class="container" style="max-width: 800px;">
        ${error ? `<div class="flash flash-error">${error}</div>` : ''}
        ${success ? `<div class="flash flash-success">${success}</div>` : ''}
        <p style="margin-bottom: 24px; color: var(--color-text-light);">
          Select your accounting software to connect. We'll securely access your financial data to provide you with the best financing options.
        </p>
        <div class="software-grid">
          ${softwareCards}
        </div>
        <div style="margin-top: 32px; text-align: center;">
          <a href="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
        </div>
      </div>
    </div>
    <style>
      .software-grid { display: grid; gap: 16px; }
      .software-card { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: white; border: 1px solid var(--color-border); border-radius: 12px; }
      .software-card.disabled { opacity: 0.6; }
      .software-card-content h3 { margin: 0 0 4px 0; color: var(--color-forest-dark); }
      .software-card-content p { margin: 0; color: var(--color-text-light); font-size: 0.9rem; }
      .badge-coming { background: var(--color-sage); color: white; font-size: 0.75rem; margin-left: 8px; }
    </style>
  `;

  res.send(renderPage('Connect Accounting', content, req));
});

app.post('/company/:id/connect', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);
  const { software_type, software_name, additional_info } = req.body;

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  // Handle "Other" software request
  if (software_type === 'other') {
    return res.redirect(`/company/${companyId}/connect/other`);
  }

  // Create connection record
  db.createAccountingConnection({
    company_id: companyId,
    software_type: software_type as db.SoftwareType,
    status: 'pending',
  });

  // Redirect to appropriate OAuth flow or credentials form
  if (software_type === 'quickbooks') {
    const authUrl = quickbooks.getAuthorizationUrl(companyId);
    return res.redirect(authUrl);
  }

  // Profit365 uses API key authentication, redirect to credentials form
  if (software_type === 'profit365') {
    return res.redirect(`/company/${companyId}/connect/profit365`);
  }

  // For other software types (not yet implemented)
  res.redirect(`/company/${companyId}/connect?error=` + encodeURIComponent('This integration is coming soon.'));
});

// Other software request form
app.get('/company/:id/connect/other', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const content = `
    <div class="auth-container">
      <div class="auth-card" style="max-width: 500px;">
        <div class="auth-header">
          <h1>Request New Integration</h1>
          <p>Tell us what accounting software you use</p>
        </div>
        <form method="POST" action="/company/${companyId}/connect/other">
          <div class="form-group">
            <label for="software_name">Software Name *</label>
            <input type="text" id="software_name" name="software_name" required placeholder="e.g., Money S3, ABRA Gen, etc.">
          </div>
          <div class="form-group">
            <label for="additional_info">Additional Information</label>
            <textarea id="additional_info" name="additional_info" rows="3" placeholder="Any additional details about your setup..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Submit Request</button>
        </form>
        <div class="auth-footer">
          <a href="/company/${companyId}/connect">Back to Software Selection</a>
        </div>
      </div>
    </div>
  `;

  res.send(renderPage('Request Integration', content, req));
});

app.post('/company/:id/connect/other', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);
  const { software_name, additional_info } = req.body;

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  db.createAccountingConnection({
    company_id: companyId,
    software_type: 'other',
    status: 'requested',
  });

  db.createSoftwareRequest({
    company_id: companyId,
    software_name,
    additional_info,
  });

  res.redirect('/company/' + companyId + '/connect?success=' + encodeURIComponent('Thank you! We\'ll notify you when this integration is available.'));
});

// Profit365 API credentials setup
app.get('/company/:id/connect/profit365', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const error = req.query.error as string;

  const content = `
    <div class="auth-container">
      <div class="auth-card" style="max-width: 540px;">
        <div class="auth-header">
          <h1>Connect Profit365</h1>
          <p>Enter your Profit365 API credentials</p>
        </div>
        ${error ? `<div class="flash flash-error">${error}</div>` : ''}
        <div class="info-box" style="background: var(--color-sage-pale); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 0.9rem; color: var(--color-text);">
            <strong>Where to find your API credentials:</strong><br>
            In Profit365, go to <strong>Company &gt; Security &gt; API Keys</strong> to generate your Client ID and Client Secret.
            The Company ID can be found in your account settings.
          </p>
        </div>
        <form method="POST" action="/company/${companyId}/connect/profit365">
          <div class="form-group">
            <label for="client_id">Client ID *</label>
            <input type="text" id="client_id" name="client_id" required placeholder="Your Profit365 Client ID">
          </div>
          <div class="form-group">
            <label for="client_secret">Client Secret *</label>
            <input type="password" id="client_secret" name="client_secret" required placeholder="Your Profit365 Client Secret">
          </div>
          <div class="form-group">
            <label for="profit365_company_id">Profit365 Company ID *</label>
            <input type="text" id="profit365_company_id" name="profit365_company_id" required placeholder="Your company ID in Profit365">
          </div>
          <button type="submit" class="btn btn-primary btn-full">Connect</button>
        </form>
        <div class="auth-footer">
          <a href="/company/${companyId}/connect">Back to Software Selection</a>
        </div>
      </div>
    </div>
  `;

  res.send(renderPage('Connect Profit365', content, req));
});

app.post('/company/:id/connect/profit365', requireAuth, async (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);
  const { client_id, client_secret, profit365_company_id } = req.body;

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  if (!client_id || !client_secret || !profit365_company_id) {
    return res.redirect(`/company/${companyId}/connect/profit365?error=` + encodeURIComponent('All fields are required.'));
  }

  try {
    // Check if connection already exists
    const existingConnection = db.getAccountingConnection(companyId);
    if (!existingConnection) {
      db.createAccountingConnection({
        company_id: companyId,
        software_type: 'profit365',
        status: 'pending',
      });
    }

    // Save credentials
    profit365.saveCredentials(companyId, client_id, client_secret, profit365_company_id);

    // Test the connection
    const isValid = await profit365.testConnection(companyId);

    if (!isValid) {
      return res.redirect(`/company/${companyId}/connect/profit365?error=` + encodeURIComponent('Could not connect to Profit365. Please check your credentials.'));
    }

    // Trigger initial sync
    res.redirect(`/company/${companyId}/sync?initial=true`);
  } catch (e: any) {
    console.error('Profit365 connection error:', e);
    res.redirect(`/company/${companyId}/connect/profit365?error=` + encodeURIComponent('Failed to connect: ' + e.message));
  }
});

// QuickBooks OAuth callback
app.get('/api/quickbooks/callback', async (req: Request, res: Response) => {
  const { code, state, realmId, error } = req.query;

  if (error) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('QuickBooks authorization was denied.'));
  }

  if (!code || !realmId || !state) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid QuickBooks callback.'));
  }

  // Extract company ID from state
  const companyId = parseInt((state as string).replace('company_', ''));

  try {
    // Exchange code for tokens
    const tokens = await quickbooks.exchangeCodeForTokens(code as string);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update connection with tokens
    db.updateAccountingConnection(companyId, {
      status: 'connected',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      realm_id: realmId as string,
    });

    // Trigger initial sync
    res.redirect(`/company/${companyId}/sync?initial=true`);
  } catch (e: any) {
    console.error('QuickBooks callback error:', e);
    res.redirect('/dashboard?error=' + encodeURIComponent('Failed to connect QuickBooks: ' + e.message));
  }
});

// Sync company data
app.get('/company/:id/sync', requireAuth, async (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);
  const isInitial = req.query.initial === 'true';

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const connection = db.getAccountingConnection(companyId);
  if (!connection || connection.status !== 'connected') {
    return res.redirect(`/company/${companyId}/connect`);
  }

  try {
    let result: { accounts: number; invoices: number; metrics: any };

    // Call the appropriate sync function based on software type
    if (connection.software_type === 'profit365') {
      result = await profit365.fullSync(companyId);
    } else if (connection.software_type === 'quickbooks') {
      result = await quickbooks.fullSync(companyId);
    } else {
      throw new Error(`Sync not supported for ${connection.software_type}`);
    }

    const message = isInitial
      ? `Successfully connected! Synced ${result.accounts} accounts and ${result.invoices} invoices.`
      : `Sync complete! Updated ${result.accounts} accounts and ${result.invoices} invoices.`;

    res.redirect(`/company/${companyId}/overview?success=` + encodeURIComponent(message));
  } catch (e: any) {
    console.error('Sync error:', e);
    res.redirect(`/company/${companyId}/overview?error=` + encodeURIComponent('Sync failed: ' + e.message));
  }
});

// Company financial overview
app.get('/company/:id/overview', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const connection = db.getAccountingConnection(companyId);
  const metrics = db.getLatestMetrics(companyId);
  const metricsHistory = db.getMetricsHistory(companyId, 12);
  const allInvoices = db.getInvoicesByCompany(companyId);
  const recentInvoices = allInvoices.slice(0, 15);
  const accounts = db.getAccountsByCompany(companyId);
  const transactions = db.getBankTransactionsByCompany(companyId, 20);

  const error = req.query.error as string;
  const success = req.query.success as string;

  // Format currency helper
  const formatCurrency = (amount: number | null, currency: string = 'CZK') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  // Calculate health score
  let healthScore = 50;
  if (metrics) {
    if (metrics.current_ratio >= 1.5) healthScore += 15;
    else if (metrics.current_ratio >= 1) healthScore += 5;
    if (metrics.dso_days <= 30) healthScore += 10;
    if (metrics.net_income > 0) healthScore += 15;
    if (metrics.debt_to_equity < 1) healthScore += 10;
  }
  healthScore = Math.min(100, healthScore);

  // Prepare chart data
  const chartLabels = metricsHistory.map((m: any) => {
    const date = new Date(m.metric_date);
    return date.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' });
  });
  const revenueData = metricsHistory.map((m: any) => Math.round((m.revenue || 0) / 1000));
  const expensesData = metricsHistory.map((m: any) => Math.round((m.expenses || 0) / 1000));
  const cashData = metricsHistory.map((m: any) => Math.round((m.cash_balance || 0) / 1000));
  const arData = metricsHistory.map((m: any) => Math.round((m.accounts_receivable || 0) / 1000));
  const apData = metricsHistory.map((m: any) => Math.round((m.accounts_payable || 0) / 1000));

  // Invoice statistics
  const issuedInvoices = allInvoices.filter((i: any) => i.invoice_type === 'issued');
  const receivedInvoices = allInvoices.filter((i: any) => i.invoice_type === 'received');
  const unpaidReceivables = issuedInvoices.filter((i: any) => i.status !== 'paid');
  const unpaidPayables = receivedInvoices.filter((i: any) => i.status !== 'paid');

  const totalReceivables = unpaidReceivables.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);
  const totalPayables = unpaidPayables.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);

  // Top customers by revenue
  const customerRevenue: Record<string, number> = {};
  issuedInvoices.forEach((inv: any) => {
    const name = inv.customer_name || 'Unknown';
    customerRevenue[name] = (customerRevenue[name] || 0) + (inv.total_amount || 0);
  });
  const topCustomers = Object.entries(customerRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const content = `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <div class="dashboard-header">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 class="dashboard-title">${company.name}</h1>
            <p class="dashboard-subtitle">Financial Overview | ${company.business_id ? 'ICO: ' + company.business_id : ''} ${connection?.software_type ? '| Connected to ' + connection.software_type.charAt(0).toUpperCase() + connection.software_type.slice(1) : ''}</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <a href="/company/${companyId}/sync" class="btn btn-secondary">Sync Data</a>
            <a href="/dashboard" class="btn btn-secondary">Back</a>
          </div>
        </div>
      </div>
    </div>
    <div class="dashboard-content">
      <div class="container">
        ${error ? `<div class="flash flash-error">${error}</div>` : ''}
        ${success ? `<div class="flash flash-success">${success}</div>` : ''}

        <!-- Health Score & Key Metrics Row -->
        <div class="overview-grid">
          <div class="health-score-card">
            <div class="health-score-header">
              <h2>Financial Health</h2>
              <div class="health-score-badge score-${healthScore >= 70 ? 'good' : healthScore >= 50 ? 'medium' : 'low'}">
                ${healthScore}/100
              </div>
            </div>
            <div class="health-score-bar">
              <div class="health-score-fill" style="width: ${healthScore}%"></div>
            </div>
            <p class="health-score-description">
              ${healthScore >= 70 ? 'Excellent financial health. Eligible for competitive financing.'
                : healthScore >= 50 ? 'Moderate health. Financing options available.'
                : 'Needs improvement. We can help find solutions.'}
            </p>
            <div class="health-factors">
              <div class="factor ${metrics?.current_ratio >= 1.5 ? 'good' : metrics?.current_ratio >= 1 ? 'medium' : 'bad'}">
                <span class="factor-icon">${metrics?.current_ratio >= 1 ? '&#10003;' : '&#10007;'}</span>
                <span>Liquidity Ratio</span>
              </div>
              <div class="factor ${metrics?.net_income > 0 ? 'good' : 'bad'}">
                <span class="factor-icon">${metrics?.net_income > 0 ? '&#10003;' : '&#10007;'}</span>
                <span>Profitability</span>
              </div>
              <div class="factor ${metrics?.dso_days <= 30 ? 'good' : metrics?.dso_days <= 45 ? 'medium' : 'bad'}">
                <span class="factor-icon">${metrics?.dso_days <= 45 ? '&#10003;' : '&#10007;'}</span>
                <span>Collection Speed</span>
              </div>
              <div class="factor ${metrics?.debt_to_equity < 1 ? 'good' : metrics?.debt_to_equity < 2 ? 'medium' : 'bad'}">
                <span class="factor-icon">${metrics?.debt_to_equity < 2 ? '&#10003;' : '&#10007;'}</span>
                <span>Debt Level</span>
              </div>
            </div>
          </div>

          <div class="key-metrics-card">
            <h3>Key Metrics</h3>
            <div class="key-metric">
              <span class="key-metric-label">Revenue (YTD)</span>
              <span class="key-metric-value">${formatCurrency(metrics?.revenue, company.currency)}</span>
            </div>
            <div class="key-metric">
              <span class="key-metric-label">Net Income</span>
              <span class="key-metric-value ${metrics?.net_income >= 0 ? 'positive' : 'negative'}">${formatCurrency(metrics?.net_income, company.currency)}</span>
            </div>
            <div class="key-metric">
              <span class="key-metric-label">Cash Balance</span>
              <span class="key-metric-value">${formatCurrency(metrics?.cash_balance, company.currency)}</span>
            </div>
            <div class="key-metric">
              <span class="key-metric-label">Current Ratio</span>
              <span class="key-metric-value">${metrics?.current_ratio?.toFixed(2) || 'N/A'}</span>
            </div>
            <div class="key-metric">
              <span class="key-metric-label">DSO (Days)</span>
              <span class="key-metric-value">${metrics?.dso_days?.toFixed(0) || 'N/A'} days</span>
            </div>
            <div class="key-metric">
              <span class="key-metric-label">Debt to Equity</span>
              <span class="key-metric-value">${metrics?.debt_to_equity?.toFixed(2) || 'N/A'}</span>
            </div>
            ${connection?.last_sync_at ? `<p class="sync-time">Last synced: ${new Date(connection.last_sync_at).toLocaleString('cs-CZ')}</p>` : ''}
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Revenue vs Expenses (in thousands ${company.currency})</h3>
            <canvas id="revenueChart"></canvas>
          </div>
          <div class="chart-card">
            <h3>Cash Flow Trend (in thousands ${company.currency})</h3>
            <canvas id="cashFlowChart"></canvas>
          </div>
        </div>

        <!-- Receivables & Payables -->
        <div class="ar-ap-grid">
          <div class="ar-ap-card">
            <div class="ar-ap-header">
              <h3>Accounts Receivable</h3>
              <span class="ar-ap-total">${formatCurrency(totalReceivables, company.currency)}</span>
            </div>
            <div class="ar-ap-stats">
              <div class="ar-ap-stat">
                <span class="stat-num">${issuedInvoices.length}</span>
                <span class="stat-label">Total Invoices</span>
              </div>
              <div class="ar-ap-stat">
                <span class="stat-num">${unpaidReceivables.length}</span>
                <span class="stat-label">Unpaid</span>
              </div>
              <div class="ar-ap-stat">
                <span class="stat-num">${metrics?.dso_days?.toFixed(0) || '-'}</span>
                <span class="stat-label">Avg DSO</span>
              </div>
            </div>
            <canvas id="arChart" height="120"></canvas>
          </div>
          <div class="ar-ap-card">
            <div class="ar-ap-header">
              <h3>Accounts Payable</h3>
              <span class="ar-ap-total negative">${formatCurrency(totalPayables, company.currency)}</span>
            </div>
            <div class="ar-ap-stats">
              <div class="ar-ap-stat">
                <span class="stat-num">${receivedInvoices.length}</span>
                <span class="stat-label">Total Bills</span>
              </div>
              <div class="ar-ap-stat">
                <span class="stat-num">${unpaidPayables.length}</span>
                <span class="stat-label">Unpaid</span>
              </div>
              <div class="ar-ap-stat">
                <span class="stat-num">${metrics?.dpo_days?.toFixed(0) || '-'}</span>
                <span class="stat-label">Avg DPO</span>
              </div>
            </div>
            <canvas id="apChart" height="120"></canvas>
          </div>
        </div>

        <!-- Top Customers & Recent Transactions -->
        <div class="bottom-grid">
          <div class="data-card">
            <div class="card-header"><h3>Top Customers by Revenue</h3></div>
            <table class="compact-table">
              <thead><tr><th>Customer</th><th style="text-align:right">Revenue</th></tr></thead>
              <tbody>
                ${topCustomers.map(([name, amount]) => `
                  <tr>
                    <td>${name}</td>
                    <td style="text-align:right; font-weight: 600;">${formatCurrency(amount, company.currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="data-card">
            <div class="card-header"><h3>Recent Transactions</h3></div>
            <table class="compact-table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Number</th><th>Party</th><th style="text-align:right">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${recentInvoices.slice(0, 8).map((inv: any) => `
                  <tr>
                    <td>${inv.issue_date || '-'}</td>
                    <td><span class="type-badge ${inv.invoice_type}">${inv.invoice_type === 'issued' ? 'Invoice' : 'Bill'}</span></td>
                    <td>${inv.invoice_number || '-'}</td>
                    <td class="truncate-cell">${inv.customer_name || '-'}</td>
                    <td style="text-align:right; font-weight: 600;">${formatCurrency(inv.total_amount, company.currency)}</td>
                    <td><span class="status-badge ${inv.status}">${inv.status || '-'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Chart of Accounts -->
        <div class="data-card" style="margin-top: 24px;">
          <div class="card-header"><h3>Chart of Accounts</h3></div>
          <table class="compact-table">
            <thead>
              <tr><th>Account #</th><th>Name</th><th>Type</th><th style="text-align:right">Balance</th></tr>
            </thead>
            <tbody>
              ${accounts.map((acc: any) => `
                <tr>
                  <td>${acc.account_number || '-'}</td>
                  <td>${acc.name}</td>
                  <td>${acc.account_type}</td>
                  <td style="text-align:right; font-weight: 600; color: ${acc.current_balance >= 0 ? 'var(--color-forest)' : '#991b1b'}">
                    ${formatCurrency(acc.current_balance, company.currency)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <style>
      .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
      .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
      .ar-ap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
      .bottom-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }

      @media (max-width: 900px) {
        .overview-grid, .charts-grid, .ar-ap-grid, .bottom-grid { grid-template-columns: 1fr; }
      }

      .health-score-card, .key-metrics-card, .chart-card, .ar-ap-card, .data-card {
        background: white; border: 1px solid var(--color-border); border-radius: 16px; padding: 24px;
      }
      .health-score-card h2, .key-metrics-card h3, .chart-card h3, .ar-ap-card h3, .data-card h3 {
        margin: 0 0 16px 0; color: var(--color-forest-dark); font-size: 1.1rem;
      }

      .health-score-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .health-score-badge { padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 1.2rem; }
      .score-good { background: #dcfce7; color: #166534; }
      .score-medium { background: #fef3c7; color: #92400e; }
      .score-low { background: #fee2e2; color: #991b1b; }
      .health-score-bar { height: 8px; background: var(--color-cream-dark); border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
      .health-score-fill { height: 100%; background: linear-gradient(90deg, var(--color-forest), var(--color-sage)); border-radius: 4px; }
      .health-score-description { color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 16px; }

      .health-factors { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .factor { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; }
      .factor.good { background: #dcfce7; color: #166534; }
      .factor.medium { background: #fef3c7; color: #92400e; }
      .factor.bad { background: #fee2e2; color: #991b1b; }
      .factor-icon { font-weight: bold; }

      .key-metric { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
      .key-metric:last-of-type { border-bottom: none; }
      .key-metric-label { color: var(--color-text-light); }
      .key-metric-value { font-weight: 700; color: var(--color-forest-dark); }
      .key-metric-value.positive { color: #166534; }
      .key-metric-value.negative { color: #991b1b; }
      .sync-time { margin-top: 16px; font-size: 0.8rem; color: var(--color-text-light); text-align: right; }

      .ar-ap-header { display: flex; justify-content: space-between; align-items: center; }
      .ar-ap-total { font-size: 1.5rem; font-weight: 700; color: var(--color-forest); }
      .ar-ap-total.negative { color: #991b1b; }
      .ar-ap-stats { display: flex; gap: 24px; margin: 16px 0; }
      .ar-ap-stat { text-align: center; }
      .stat-num { display: block; font-size: 1.5rem; font-weight: 700; color: var(--color-forest-dark); }
      .stat-label { font-size: 0.8rem; color: var(--color-text-light); }

      .card-header { border-bottom: 1px solid var(--color-border); margin: -24px -24px 16px -24px; padding: 16px 24px; background: var(--color-sage-pale); border-radius: 16px 16px 0 0; }
      .card-header h3 { margin: 0; }

      .compact-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
      .compact-table th, .compact-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
      .compact-table th { font-weight: 600; color: var(--color-text-light); font-size: 0.8rem; text-transform: uppercase; }
      .compact-table tr:last-child td { border-bottom: none; }
      .compact-table tr:hover td { background: var(--color-cream); }
      .truncate-cell { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .type-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
      .type-badge.issued { background: #dbeafe; color: #1e40af; }
      .type-badge.received { background: #fef3c7; color: #92400e; }

      .status-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
      .status-badge.paid { background: #dcfce7; color: #166534; }
      .status-badge.unpaid { background: #fee2e2; color: #991b1b; }
    </style>

    <script>
      // Revenue vs Expenses Chart
      new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [
            {
              label: 'Revenue',
              data: ${JSON.stringify(revenueData)},
              borderColor: '#2d5a3d',
              backgroundColor: 'rgba(45, 90, 61, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Expenses',
              data: ${JSON.stringify(expensesData)},
              borderColor: '#c44536',
              backgroundColor: 'rgba(196, 69, 54, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true } }
        }
      });

      // Cash Flow Chart
      new Chart(document.getElementById('cashFlowChart'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [{
            label: 'Cash Balance',
            data: ${JSON.stringify(cashData)},
            borderColor: '#2d5a3d',
            backgroundColor: 'rgba(45, 90, 61, 0.2)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });

      // AR Trend Chart
      new Chart(document.getElementById('arChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(chartLabels.slice(-6))},
          datasets: [{
            label: 'Receivables',
            data: ${JSON.stringify(arData.slice(-6))},
            backgroundColor: 'rgba(45, 90, 61, 0.6)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });

      // AP Trend Chart
      new Chart(document.getElementById('apChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(chartLabels.slice(-6))},
          datasets: [{
            label: 'Payables',
            data: ${JSON.stringify(apData.slice(-6))},
            backgroundColor: 'rgba(196, 69, 54, 0.6)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    </script>
  `;

  res.send(renderPage('Company Overview', content, req));
});

// Admin Dashboard
app.get('/admin', requireAdmin, (req: Request, res: Response) => {
  const totalVisitors = db.getTotalVisitors();
  const todayVisitors = db.getTodayVisitors();
  const smeSignups = db.getSMECount();
  const partnerSignups = db.getPartnerCount();
  const totalUsers = db.getUserCount();

  const recentVisitors = db.getRecentVisitors(50) as any[];
  const recentSME = db.getSMEWaitlist(20) as any[];
  const recentPartners = db.getPartnerWaitlist(20) as any[];

  const visitorsRows = recentVisitors.map(v => `
    <tr>
        <td>${new Date(v.visited_at).toLocaleString()}</td>
        <td>${v.page_visited}</td>
        <td>${v.ip_address || '-'}</td>
        <td class="truncate" title="${v.referrer || 'Direct'}">${v.referrer || 'Direct'}</td>
        <td class="truncate" title="${v.user_agent || ''}">${(v.user_agent || '').substring(0, 50)}...</td>
    </tr>
  `).join('');

  const smeRows = recentSME.map(s => `
    <tr>
        <td>${new Date(s.created_at).toLocaleString()}</td>
        <td>${s.company_name}</td>
        <td>${s.email}</td>
        <td>${s.phone || '-'}</td>
        <td>${s.accounting_software || '-'}</td>
        <td class="truncate" title="${s.message || ''}">${s.message || '-'}</td>
    </tr>
  `).join('');

  const partnerRows = recentPartners.map(p => `
    <tr>
        <td>${new Date(p.created_at).toLocaleString()}</td>
        <td>${p.company_name}</td>
        <td>${p.contact_name || '-'}</td>
        <td>${p.email}</td>
        <td>${p.phone || '-'}</td>
        <td>${p.partner_type || '-'}</td>
        <td class="truncate" title="${p.message || ''}">${p.message || '-'}</td>
    </tr>
  `).join('');

  const content = `
    <div class="dashboard-header">
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 class="dashboard-title">Admin Dashboard</h1>
                    <p class="dashboard-subtitle">Monitor visitors and waiting list signups</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <a href="/dashboard" class="btn btn-secondary">My Companies</a>
                    <a href="/company/new" class="btn btn-primary">+ Add Company</a>
                </div>
            </div>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalVisitors}</div>
                    <div class="stat-label">Total Page Views</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${todayVisitors}</div>
                    <div class="stat-label">Today's Views</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${smeSignups}</div>
                    <div class="stat-label">SME Signups</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${partnerSignups}</div>
                    <div class="stat-label">Partner Signups</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalUsers}</div>
                    <div class="stat-label">Registered Users</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="showTab('visitors')">Recent Visitors</button>
                <button class="tab" onclick="showTab('sme')">SME Waiting List</button>
                <button class="tab" onclick="showTab('partners')">Partner Waiting List</button>
            </div>

            <div id="visitors" class="tab-content active">
                <div class="data-table">
                    <div class="table-header"><h3>Recent Page Views (Last 50)</h3></div>
                    <div style="overflow-x: auto;">
                        ${recentVisitors.length ? `
                        <table>
                            <thead><tr><th>Time</th><th>Page</th><th>IP</th><th>Referrer</th><th>User Agent</th></tr></thead>
                            <tbody>${visitorsRows}</tbody>
                        </table>` : '<div class="empty-state">No visitors recorded yet</div>'}
                    </div>
                </div>
            </div>

            <div id="sme" class="tab-content">
                <div class="data-table">
                    <div class="table-header"><h3>SME Waiting List (${smeSignups} total)</h3></div>
                    <div style="overflow-x: auto;">
                        ${recentSME.length ? `
                        <table>
                            <thead><tr><th>Date</th><th>Company</th><th>Email</th><th>Phone</th><th>Accounting SW</th><th>Message</th></tr></thead>
                            <tbody>${smeRows}</tbody>
                        </table>` : '<div class="empty-state">No SME signups yet</div>'}
                    </div>
                </div>
            </div>

            <div id="partners" class="tab-content">
                <div class="data-table">
                    <div class="table-header"><h3>Partner Waiting List (${partnerSignups} total)</h3></div>
                    <div style="overflow-x: auto;">
                        ${recentPartners.length ? `
                        <table>
                            <thead><tr><th>Date</th><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Type</th><th>Message</th></tr></thead>
                            <tbody>${partnerRows}</tbody>
                        </table>` : '<div class="empty-state">No partner signups yet</div>'}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
  `;

  res.send(renderPage('Admin Dashboard', content, req));
});

// API Endpoints
app.post('/api/waitlist/sme', (req: Request, res: Response) => {
  const { company_name, email, phone, accounting_software, message } = req.body;

  if (!company_name || !email) {
    return res.status(400).json({ success: false, message: 'Company name and email are required.' });
  }

  const existing = db.getSMEByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'This email is already on the waiting list.' });
  }

  try {
    db.addSMEToWaitlist({ company_name, email, phone, accounting_software, message });
    res.json({ success: true, message: 'Successfully added to the waiting list!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to add to waiting list.' });
  }
});

app.post('/api/waitlist/partner', (req: Request, res: Response) => {
  const { company_name, contact_name, email, phone, partner_type, message } = req.body;

  if (!company_name || !email) {
    return res.status(400).json({ success: false, message: 'Company name and email are required.' });
  }

  const existing = db.getPartnerByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'This email is already on the partner waiting list.' });
  }

  try {
    db.addPartnerToWaitlist({ company_name, contact_name, email, phone, partner_type, message });
    res.json({ success: true, message: 'Successfully added to the partner waiting list!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to add to waiting list.' });
  }
});

// Initialize and start
db.initDefaultAdmin();

app.listen(PORT, () => {
  console.log(`Lenduck server running on http://localhost:${PORT}`);
  console.log(`Admin login: admin@lenduck.com / admin123`);
});
