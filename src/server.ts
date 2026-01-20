import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as db from './database';

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

// Login
app.get('/login', (req: Request, res: Response) => {
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
  const error = req.query.error as string;

  const content = `
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Create account</h1>
                <p>Start your journey with Lenduck</p>
            </div>
            ${error ? `<div class="flash flash-error">${error}</div>` : ''}
            <form method="POST" action="/signup">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="you@company.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="At least 8 characters" minlength="8">
                </div>
                <div class="form-group">
                    <label for="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required placeholder="Confirm your password">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Create Account</button>
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
  const { email, password, confirm_password } = req.body;

  if (!email || !password) {
    return res.redirect('/signup?error=' + encodeURIComponent('Email and password are required.'));
  }

  if (password !== confirm_password) {
    return res.redirect('/signup?error=' + encodeURIComponent('Passwords do not match.'));
  }

  if (password.length < 8) {
    return res.redirect('/signup?error=' + encodeURIComponent('Password must be at least 8 characters.'));
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.redirect('/signup?error=' + encodeURIComponent('Email already registered.'));
  }

  try {
    db.createUser(email, password);
    res.redirect('/login?success=' + encodeURIComponent('Account created successfully! Please log in.'));
  } catch (e) {
    res.redirect('/signup?error=' + encodeURIComponent('Failed to create account.'));
  }
});

// Logout
app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Dashboard
app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById(req.session.userId!);

  const content = `
    <div class="dashboard-header">
        <div class="container">
            <h1 class="dashboard-title">Welcome, ${user.email}</h1>
            <p class="dashboard-subtitle">Your Lenduck dashboard</p>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="container">
            <div class="data-table">
                <div class="table-header">
                    <h3>Account Information</h3>
                </div>
                <div style="padding: 32px;">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p style="margin-top: 12px;"><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                    <p style="margin-top: 12px;"><strong>Account type:</strong>
                        ${user.is_admin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-user">User</span>'}
                    </p>
                </div>
            </div>
            <div class="data-table">
                <div class="table-header">
                    <h3>Coming Soon</h3>
                </div>
                <div class="empty-state">
                    <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">Feature coming soon</p>
                    <p>Connect your accounting software and get financing offers.</p>
                </div>
            </div>
        </div>
    </div>
  `;

  res.send(renderPage('Dashboard', content, req));
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
            <h1 class="dashboard-title">Admin Dashboard</h1>
            <p class="dashboard-subtitle">Monitor visitors and waiting list signups</p>
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
