import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as db from './database';
import * as quickbooks from './services/quickbooks';
import * as profit365 from './services/profit365';
import * as fakturoid from './services/fakturoid';
import { Language, Translations, translations, getTranslations, detectLanguage } from './translations';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
    language?: Language;
    // Fakturoid OAuth state
    fakturoidOAuthState?: string;
    fakturoidCompanyId?: number;
  }
}

// Helper to get language from request
function getLang(req: Request): Language {
  // First check session
  if (req.session.language) return req.session.language;
  // Then check Accept-Language header
  return detectLanguage(req.headers['accept-language']);
}

// Helper to get translations for request
function t(req: Request): Translations {
  return getTranslations(getLang(req));
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

// App layout for logged-in users with sidebar navigation
interface AppPageOptions {
  title: string;
  content: string;
  companyId?: number;
  companyName?: string;
  activePage?: 'overview' | 'data' | 'invoices' | 'accounts' | 'transactions' | 'reports' | 'settings';
  req: Request;
}

function renderAppPage(options: AppPageOptions): string {
  const { title, content, companyId, companyName, activePage, req } = options;
  const isAdmin = !!req.session.isAdmin;
  const lang = getLang(req);
  const tr = t(req);

  const navItem = (href: string, icon: string, label: string, page: string) => `
    <a href="${href}" class="nav-item ${activePage === page ? 'active' : ''}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
    </a>
  `;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="apple-touch-icon" href="/logo.png">
    <title>${title} | Lenduck</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --sidebar-width: 260px;
            --header-height: 64px;
            --color-primary: #2d5a3d;
            --color-primary-dark: #1e3d29;
            --color-primary-light: #3d7a52;
            --color-accent: #10b981;
            --color-bg: #f8fafc;
            --color-bg-card: #ffffff;
            --color-sidebar: #1e293b;
            --color-sidebar-hover: #334155;
            --color-sidebar-active: #3b82f6;
            --color-text: #1e293b;
            --color-text-secondary: #64748b;
            --color-text-muted: #94a3b8;
            --color-border: #e2e8f0;
            --color-success: #10b981;
            --color-warning: #f59e0b;
            --color-error: #ef4444;
            --color-info: #3b82f6;
            --font-main: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --radius: 8px;
            --radius-lg: 12px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: var(--font-main); background: var(--color-bg); color: var(--color-text); line-height: 1.5; }

        /* Sidebar */
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--color-sidebar);
            color: white;
            display: flex;
            flex-direction: column;
            z-index: 100;
        }
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: white;
        }
        .sidebar-logo img { width: 36px; height: 36px; }
        .sidebar-logo span { font-size: 1.25rem; font-weight: 700; }

        .sidebar-company {
            padding: 16px 20px;
            background: rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .company-selector {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: rgba(255,255,255,0.1);
            border-radius: var(--radius);
            cursor: pointer;
            transition: background 0.2s;
        }
        .company-selector:hover { background: rgba(255,255,255,0.15); }
        .company-name { font-weight: 600; font-size: 0.9rem; }
        .company-label { font-size: 0.75rem; color: var(--color-text-muted); }

        .sidebar-nav {
            flex: 1;
            padding: 16px 12px;
            overflow-y: auto;
        }
        .nav-section {
            margin-bottom: 24px;
        }
        .nav-section-title {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-muted);
            padding: 0 12px;
            margin-bottom: 8px;
        }
        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            color: #cbd5e1;
            text-decoration: none;
            border-radius: var(--radius);
            margin-bottom: 2px;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .nav-item:hover {
            background: var(--color-sidebar-hover);
            color: white;
        }
        .nav-item.active {
            background: var(--color-sidebar-active);
            color: white;
        }
        .nav-icon { font-size: 1.1rem; width: 20px; text-align: center; }

        .sidebar-footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .user-menu {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .user-info { flex: 1; }
        .user-name { font-size: 0.85rem; font-weight: 600; }
        .user-role { font-size: 0.75rem; color: var(--color-text-muted); }
        .logout-btn {
            color: var(--color-text-muted);
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.2s;
        }
        .logout-btn:hover { color: white; }

        /* Main content */
        .main-wrapper {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
        }
        .top-header {
            height: var(--header-height);
            background: var(--color-bg-card);
            border-bottom: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .page-title {
            font-size: 1.25rem;
            font-weight: 600;
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .lang-switcher {
            display: flex;
            gap: 4px;
            margin-left: 8px;
            padding-left: 12px;
            border-left: 1px solid var(--color-border);
        }
        .lang-option {
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--color-text-secondary);
            text-decoration: none;
            transition: all 0.2s;
        }
        .lang-option:hover {
            background: var(--color-bg);
            color: var(--color-text);
        }
        .lang-option.active {
            background: var(--color-primary);
            color: white;
        }

        .main-content {
            padding: 32px;
        }

        /* Cards */
        .card {
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
        }
        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .card-title {
            font-size: 1rem;
            font-weight: 600;
        }
        .card-body { padding: 20px; }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: var(--radius);
            font-weight: 600;
            font-size: 0.875rem;
            text-decoration: none;
            cursor: pointer;
            border: none;
            font-family: var(--font-main);
            transition: all 0.2s;
        }
        .btn-primary {
            background: var(--color-primary);
            color: white;
        }
        .btn-primary:hover { background: var(--color-primary-dark); }
        .btn-secondary {
            background: white;
            color: var(--color-text);
            border: 1px solid var(--color-border);
        }
        .btn-secondary:hover { background: var(--color-bg); }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
        .btn-icon { padding: 8px; }

        /* Tables */
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--color-border);
            font-size: 0.875rem;
        }
        th {
            font-weight: 600;
            color: var(--color-text-secondary);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: var(--color-bg);
        }
        tr:hover td { background: var(--color-bg); }

        /* Stats */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 20px;
        }
        .stat-label {
            font-size: 0.8rem;
            color: var(--color-text-secondary);
            margin-bottom: 4px;
        }
        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--color-text);
        }
        .stat-change {
            font-size: 0.8rem;
            margin-top: 4px;
        }
        .stat-change.positive { color: var(--color-success); }
        .stat-change.negative { color: var(--color-error); }

        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }

        /* Grid layouts */
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

        /* Alerts */
        .alert {
            padding: 12px 16px;
            border-radius: var(--radius);
            margin-bottom: 20px;
            font-size: 0.875rem;
        }
        .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

        /* Page header */
        .page-header {
            margin-bottom: 24px;
        }
        .page-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .page-header p {
            color: var(--color-text-secondary);
            font-size: 0.9rem;
        }

        /* Tab navigation */
        .tabs {
            display: flex;
            gap: 4px;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 24px;
        }
        .tab {
            padding: 12px 20px;
            font-weight: 500;
            color: var(--color-text-secondary);
            text-decoration: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: all 0.2s;
        }
        .tab:hover { color: var(--color-text); }
        .tab.active {
            color: var(--color-primary);
            border-bottom-color: var(--color-primary);
        }

        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 48px 20px;
            color: var(--color-text-secondary);
        }
        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        /* Mobile */
        @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%); }
            .main-wrapper { margin-left: 0; }
        }
    </style>
</head>
<body>
    <aside class="sidebar">
        <div class="sidebar-header">
            <a href="/dashboard" class="sidebar-logo">
                <img src="/logo.png" alt="Lenduck">
                <span>Lenduck</span>
            </a>
        </div>
        ${companyId ? `
        <div class="sidebar-company">
            <a href="/dashboard" class="company-selector">
                <div>
                    <div class="company-label">${tr.nav.switchCompany}</div>
                    <div class="company-name">${companyName || tr.nav.switchCompany}</div>
                </div>
                <span>&#8595;</span>
            </a>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">${tr.nav.overview}</div>
                ${navItem(`/company/${companyId}/overview`, '&#128200;', tr.nav.overview, 'overview')}
                ${navItem(`/company/${companyId}/reports`, '&#128202;', tr.nav.reports, 'reports')}
            </div>
            <div class="nav-section">
                <div class="nav-section-title">${tr.nav.data}</div>
                ${navItem(`/company/${companyId}/data/invoices`, '&#128196;', tr.nav.invoices, 'invoices')}
                ${navItem(`/company/${companyId}/data/accounts`, '&#128179;', tr.nav.accounts, 'accounts')}
                ${navItem(`/company/${companyId}/data/transactions`, '&#128176;', tr.nav.transactions, 'transactions')}
            </div>
            <div class="nav-section">
                <div class="nav-section-title">${tr.nav.settings}</div>
                ${navItem(`/company/${companyId}/connect`, '&#128279;', tr.nav.settings, 'settings')}
            </div>
        </nav>
        ` : `
        <nav class="sidebar-nav">
            <div class="nav-section">
                ${navItem('/dashboard', '&#127968;', tr.dashboard.yourCompanies, 'overview')}
                ${isAdmin ? navItem('/admin', '&#128736;', 'Admin', 'admin') : ''}
            </div>
        </nav>
        `}
        <div class="sidebar-footer">
            <div class="user-menu">
                <div class="user-avatar">U</div>
                <div class="user-info">
                    <div class="user-name">User</div>
                    <div class="user-role">${isAdmin ? 'Admin' : 'User'}</div>
                </div>
                <a href="/logout" class="logout-btn">${tr.nav.logout}</a>
            </div>
        </div>
    </aside>

    <div class="main-wrapper">
        <header class="top-header">
            <h1 class="page-title">${title}</h1>
            <div class="header-actions">
                ${companyId ? `<a href="/company/${companyId}/sync" class="btn btn-secondary btn-sm">&#8635; ${tr.overview.syncNow}</a>` : ''}
                <div class="lang-switcher">
                    <a href="/set-language/en" class="lang-option ${lang === 'en' ? 'active' : ''}">EN</a>
                    <a href="/set-language/cs" class="lang-option ${lang === 'cs' ? 'active' : ''}">CZ</a>
                    <a href="/set-language/sk" class="lang-option ${lang === 'sk' ? 'active' : ''}">SK</a>
                </div>
            </div>
        </header>
        <main class="main-content">
            ${content}
        </main>
    </div>
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

// Language switching
app.get('/set-language/:lang', (req: Request, res: Response) => {
  const lang = req.params.lang as Language;
  if (['en', 'cs', 'sk'].includes(lang)) {
    req.session.language = lang;
  }
  // Redirect back to referring page or dashboard
  const referer = req.headers.referer || '/dashboard';
  res.redirect(referer);
});

// Dashboard - Shows user's companies
app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById(req.session.userId!);
  const companies = db.getCompaniesByUserId(req.session.userId!);
  const tr = t(req);
  const lang = getLang(req);

  const companyCards = companies.length > 0 ? companies.map(company => {
    const connection = db.getAccountingConnection(company.id);
    const metrics = db.getLatestMetrics(company.id);

    const statusBadge = connection
      ? (connection.status === 'connected'
        ? `<span class="badge badge-success">${tr.settingsPage.connected}</span>`
        : `<span class="badge badge-warning">${tr.settingsPage.pending}</span>`)
      : `<span class="badge badge-error">${tr.dashboard.notConnected}</span>`;

    const formatCurrency = (amount: number | null) => {
      if (!amount) return 'N/A';
      return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: company.currency || 'CZK', maximumFractionDigits: 0 }).format(amount);
    };

    return `
      <div class="card company-card">
        <div class="card-header" style="background: var(--color-bg);">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${company.name}</h3>
            <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${company.country || ''} ${company.business_id ? '| ' + tr.settingsPage.businessId + ': ' + company.business_id : ''}</span>
          </div>
          ${statusBadge}
        </div>
        <div class="card-body">
          ${connection?.status === 'connected' && metrics ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${tr.dashboard.revenue}</div>
                <div style="font-size: 1.1rem; font-weight: 600;">${formatCurrency(metrics.revenue)}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${tr.dashboard.netIncome}</div>
                <div style="font-size: 1.1rem; font-weight: 600; color: ${metrics.net_income >= 0 ? 'var(--color-success)' : 'var(--color-error)'};">${formatCurrency(metrics.net_income)}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${tr.overview.cashBalance}</div>
                <div style="font-size: 1.1rem; font-weight: 600;">${formatCurrency(metrics.cash_balance)}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${tr.overview.healthScore}</div>
                <div style="font-size: 1.1rem; font-weight: 600;">${Math.min(100, 50 + (metrics.current_ratio >= 1.5 ? 15 : 0) + (metrics.net_income > 0 ? 15 : 0) + (metrics.dso_days <= 30 ? 10 : 0) + (metrics.debt_to_equity < 1 ? 10 : 0))}/100</div>
              </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">
              ${connection.software_type} | ${tr.dashboard.lastSync}: ${connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'cs-CZ') : 'Never'}
            </div>
          ` : `
            <div style="text-align: center; padding: 20px; color: var(--color-text-secondary);">
              <p style="margin-bottom: 8px;">${tr.connectPage.subtitle}</p>
            </div>
          `}
        </div>
        <div style="padding: 16px 20px; border-top: 1px solid var(--color-border); display: flex; gap: 12px;">
          ${connection?.status === 'connected'
            ? `<a href="/company/${company.id}/overview" class="btn btn-primary" style="flex: 1;">${tr.dashboard.viewDetails}</a>
               <a href="/company/${company.id}/sync" class="btn btn-secondary btn-icon" title="${tr.overview.syncNow}">&#8635;</a>`
            : `<a href="/company/${company.id}/connect" class="btn btn-primary" style="flex: 1;">${tr.connectPage.connect}</a>`
          }
        </div>
      </div>
    `;
  }).join('') : '';

  const content = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1>${tr.dashboard.yourCompanies}</h1>
        <p>${tr.connectPage.subtitle}</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <form method="POST" action="/company/demo" style="margin: 0;">
          <button type="submit" class="btn btn-secondary">${tr.dashboard.tryDemo}</button>
        </form>
        <a href="/company/new" class="btn btn-primary">+ ${tr.dashboard.addCompany}</a>
      </div>
    </div>

    ${companies.length > 0 ? `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
        ${companyCards}
      </div>
    ` : `
      <div class="card">
        <div class="empty-state" style="padding: 60px 20px;">
          <div class="empty-state-icon">&#127970;</div>
          <h3 style="margin-bottom: 8px;">${tr.dashboard.noCompanies}</h3>
          <p style="margin-bottom: 24px;">${tr.dashboard.createFirst}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <form method="POST" action="/company/demo" style="margin: 0;">
              <button type="submit" class="btn btn-secondary">${tr.dashboard.tryDemo}</button>
            </form>
            <a href="/company/new" class="btn btn-primary">${tr.dashboard.addCompany}</a>
          </div>
        </div>
      </div>
    `}
  `;

  res.send(renderAppPage({
    title: 'Companies',
    content,
    activePage: 'overview',
    req
  }));
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

// Create Demo Company with sample data
app.post('/company/demo', requireAuth, (req: Request, res: Response) => {
  const userId = req.session.userId!;

  try {
    // Create demo company
    const result = db.createCompany({
      user_id: userId,
      name: 'Demo Company s.r.o.',
      business_id: '12345678',
      country: 'CZ',
      currency: 'CZK',
    });

    const companyId = result.lastInsertRowid as number;

    // Create accounting connection (demo/connected)
    db.createAccountingConnection({
      company_id: companyId,
      software_type: 'quickbooks',
      status: 'connected',
    });

    // Update with last sync time
    db.updateAccountingConnection(companyId, {
      last_sync_at: new Date().toISOString(),
    });

    // Create sample accounts
    const accounts = [
      { external_id: 'acc_1', name: 'Business Checking', account_type: 'Bank', account_sub_type: 'Checking', account_number: '1000', current_balance: 2850000 },
      { external_id: 'acc_2', name: 'Savings Account', account_type: 'Bank', account_sub_type: 'Savings', account_number: '1010', current_balance: 1500000 },
      { external_id: 'acc_3', name: 'Accounts Receivable', account_type: 'Accounts Receivable', account_sub_type: 'AccountsReceivable', account_number: '1200', current_balance: 1250000 },
      { external_id: 'acc_4', name: 'Office Equipment', account_type: 'Fixed Asset', account_sub_type: 'FurnitureAndFixtures', account_number: '1500', current_balance: 450000 },
      { external_id: 'acc_5', name: 'Accounts Payable', account_type: 'Accounts Payable', account_sub_type: 'AccountsPayable', account_number: '2000', current_balance: 420000 },
      { external_id: 'acc_6', name: 'Bank Loan', account_type: 'Long Term Liability', account_sub_type: 'NotesPayable', account_number: '2500', current_balance: 800000 },
      { external_id: 'acc_7', name: 'Owner Equity', account_type: 'Equity', account_sub_type: 'OpeningBalanceEquity', account_number: '3000', current_balance: 3500000 },
      { external_id: 'acc_8', name: 'Retained Earnings', account_type: 'Equity', account_sub_type: 'RetainedEarnings', account_number: '3100', current_balance: 1330000 },
    ];

    for (const acc of accounts) {
      db.upsertAccount({
        company_id: companyId,
        external_id: acc.external_id,
        name: acc.name,
        account_type: acc.account_type,
        account_sub_type: acc.account_sub_type,
        account_number: acc.account_number,
        current_balance: acc.current_balance,
        currency: 'CZK',
        is_active: true,
      });
    }

    // Sample customers and vendors
    const customers = ['Škoda Auto a.s.', 'České dráhy, a.s.', 'Alza.cz a.s.', 'Komerční banka', 'O2 Czech Republic'];
    const vendors = ['Microsoft CZ', 'Amazon Web Services', 'T-Mobile CZ', 'PRE Energetika', 'ČSOB Leasing'];

    // Generate invoices for last 12 months
    const today = new Date();
    let invoiceNum = 2024001;

    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      // 3-5 sales invoices per month
      const numSales = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < numSales; i++) {
        const invoiceDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 20) + 1);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        const amount = Math.floor(Math.random() * 350000) + 50000;
        const isPaid = monthsAgo > 1 || Math.random() > 0.4;

        db.upsertInvoice({
          company_id: companyId,
          external_id: `inv_${invoiceNum}`,
          invoice_type: 'issued',
          invoice_number: `FV-${invoiceNum}`,
          customer_name: customers[Math.floor(Math.random() * customers.length)],
          customer_id: `cust_${i}`,
          issue_date: invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          total_amount: amount,
          balance_due: isPaid ? 0 : amount,
          currency: 'CZK',
          status: isPaid ? 'paid' : 'unpaid',
        });
        invoiceNum++;
      }

      // 2-3 purchase invoices per month
      const numPurchases = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numPurchases; i++) {
        const invoiceDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, Math.floor(Math.random() * 20) + 5);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 14);
        const amount = Math.floor(Math.random() * 120000) + 15000;
        const isPaid = monthsAgo > 0 || Math.random() > 0.5;

        db.upsertInvoice({
          company_id: companyId,
          external_id: `bill_${invoiceNum}`,
          invoice_type: 'received',
          invoice_number: `PF-${invoiceNum}`,
          customer_name: vendors[Math.floor(Math.random() * vendors.length)],
          customer_id: `vend_${i}`,
          issue_date: invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          total_amount: amount,
          balance_due: isPaid ? 0 : amount,
          currency: 'CZK',
          status: isPaid ? 'paid' : 'unpaid',
        });
        invoiceNum++;
      }
    }

    // Generate monthly financial metrics
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const metricDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0);
      const growthFactor = 1 + (11 - monthsAgo) * 0.02;

      const revenue = Math.round(1200000 * growthFactor * (0.9 + Math.random() * 0.2));
      const expenses = Math.round(480000 * growthFactor * (0.9 + Math.random() * 0.2));

      db.saveFinancialMetrics({
        company_id: companyId,
        metric_date: metricDate.toISOString().split('T')[0],
        revenue,
        expenses,
        net_income: revenue - expenses,
        gross_profit: revenue * 0.65,
        total_assets: Math.round(6430000 * growthFactor),
        total_liabilities: Math.round(1220000 * growthFactor),
        total_equity: Math.round(5210000 * growthFactor),
        current_assets: Math.round(5600000 * growthFactor),
        current_liabilities: Math.round(420000 * growthFactor),
        accounts_receivable: Math.round(1250000 * growthFactor * (0.7 + Math.random() * 0.3)),
        accounts_payable: Math.round(420000 * growthFactor * (0.7 + Math.random() * 0.3)),
        cash_balance: Math.round(4350000 * growthFactor),
        current_ratio: 13.3,
        quick_ratio: 12.0,
        debt_to_equity: 0.23,
        dso_days: 28 + Math.random() * 8,
        dpo_days: 18 + Math.random() * 6,
      });
    }

    res.redirect(`/company/${companyId}/overview?success=` + encodeURIComponent('Demo company created with sample data!'));
  } catch (e: any) {
    console.error('Demo company creation error:', e);
    res.redirect('/dashboard?error=' + encodeURIComponent('Failed to create demo company.'));
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
    { value: 'fakturoid', name: 'Fakturoid', description: 'Czech invoicing & accounting, OAuth2 API', available: true },
    { value: 'quickbooks', name: 'QuickBooks Online', description: 'Popular in US/UK, REST API with OAuth2', available: true },
    { value: 'profit365', name: 'Profit365', description: 'Slovak/Czech accounting, REST API', available: true },
    { value: 'idoklad', name: 'iDoklad', description: 'Czech invoicing system, REST API', available: false },
    { value: 'flexibee', name: 'ABRA FlexiBee', description: 'Popular in Czech Republic, REST API', available: false },
    { value: 'pohoda', name: 'Pohoda', description: 'Most popular in Czech Republic, XML API', available: false },
    { value: 'xero', name: 'Xero', description: 'Cloud accounting, REST API', available: false },
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

  // Fakturoid uses OAuth2 Client Credentials, redirect to credentials form
  if (software_type === 'fakturoid') {
    return res.redirect(`/company/${companyId}/connect/fakturoid`);
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

// Fakturoid OAuth - redirect to authorization page
app.get('/company/:id/connect/fakturoid', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const error = req.query.error as string;
  const tr = t(req);

  // Check if OAuth credentials are configured
  try {
    fakturoid.getOAuthConfig();
  } catch (e) {
    // OAuth not configured - show error
    const content = `
      <div class="auth-container">
        <div class="auth-card" style="max-width: 540px;">
          <div class="auth-header">
            <h1>${tr.connectPage.connect} Fakturoid</h1>
          </div>
          <div class="flash flash-error">Fakturoid integration is not configured. Please contact support.</div>
          <div class="auth-footer">
            <a href="/company/${companyId}/connect">${tr.common.back}</a>
          </div>
        </div>
      </div>
    `;
    return res.send(renderPage('Connect Fakturoid', content, req));
  }

  if (error) {
    // Show error from callback
    const content = `
      <div class="auth-container">
        <div class="auth-card" style="max-width: 540px;">
          <div class="auth-header">
            <h1>${tr.connectPage.connect} Fakturoid</h1>
          </div>
          <div class="flash flash-error">${error}</div>
          <a href="/company/${companyId}/connect/fakturoid" class="btn btn-primary btn-full" style="margin-top: 16px;">Try Again</a>
          <div class="auth-footer">
            <a href="/company/${companyId}/connect">${tr.common.back}</a>
          </div>
        </div>
      </div>
    `;
    return res.send(renderPage('Connect Fakturoid', content, req));
  }

  // Create or update connection record
  const existingConnection = db.getAccountingConnection(companyId);
  if (!existingConnection) {
    db.createAccountingConnection({
      company_id: companyId,
      software_type: 'fakturoid',
      status: 'pending',
    });
  } else if (existingConnection.software_type !== 'fakturoid') {
    // Delete old connection and create new one with correct type
    db.deleteAccountingConnection(companyId);
    db.createAccountingConnection({
      company_id: companyId,
      software_type: 'fakturoid',
      status: 'pending',
    });
  } else {
    db.updateAccountingConnection(companyId, { status: 'pending' });
  }

  // Generate state parameter with companyId for CSRF protection
  const state = `company_${companyId}_${Date.now()}`;
  req.session.fakturoidOAuthState = state;
  req.session.fakturoidCompanyId = companyId;

  // Redirect to Fakturoid authorization
  const authUrl = fakturoid.getAuthorizationUrl(state);
  res.redirect(authUrl);
});

// Fakturoid OAuth callback
app.get('/api/fakturoid/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const errorMsg = error_description || error;
    const companyId = req.session.fakturoidCompanyId;
    if (companyId) {
      return res.redirect(`/company/${companyId}/connect/fakturoid?error=` + encodeURIComponent(`Authorization denied: ${errorMsg}`));
    }
    return res.redirect('/dashboard?error=' + encodeURIComponent(`Fakturoid authorization failed: ${errorMsg}`));
  }

  if (!code || !state) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid Fakturoid callback.'));
  }

  // Verify state matches to prevent CSRF
  if (state !== req.session.fakturoidOAuthState) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid state parameter. Please try again.'));
  }

  // Extract company ID from state
  const stateMatch = (state as string).match(/^company_(\d+)_/);
  if (!stateMatch) {
    return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid state format.'));
  }

  const companyId = parseInt(stateMatch[1]);

  try {
    // Exchange code for tokens
    const tokens = await fakturoid.exchangeCodeForTokens(code as string);

    // Fetch user's accounts to get the account slug
    const accounts = await fakturoid.fetchUserAccounts(tokens.accessToken);

    if (!accounts || accounts.length === 0) {
      return res.redirect(`/company/${companyId}/connect/fakturoid?error=` + encodeURIComponent('No Fakturoid accounts found for this user.'));
    }

    // Use the first account (or let user choose if multiple)
    const accountSlug = accounts[0].slug;

    // Save the OAuth credentials
    fakturoid.saveOAuthCredentials(
      companyId,
      accountSlug,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn
    );

    // Clear OAuth session state
    delete req.session.fakturoidOAuthState;
    delete req.session.fakturoidCompanyId;

    // Trigger initial sync
    res.redirect(`/company/${companyId}/sync?initial=true`);
  } catch (e: any) {
    console.error('Fakturoid OAuth callback error:', e);
    res.redirect(`/company/${companyId}/connect/fakturoid?error=` + encodeURIComponent('Failed to connect: ' + e.message));
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
    let totalRecords = 0;
    let message = '';

    // Call the appropriate sync function based on software type
    if (connection.software_type === 'fakturoid') {
      const result = await fakturoid.fullSync(companyId);
      totalRecords = result.invoices + result.expenses + result.subjects + result.bankAccounts + result.inventory;
      message = isInitial
        ? `Successfully connected! Synced ${result.invoices} invoices, ${result.expenses} expenses, ${result.subjects} contacts, ${result.bankAccounts} bank accounts, and ${result.inventory} inventory items.`
        : `Sync complete! Updated ${totalRecords} records from Fakturoid.`;
    } else if (connection.software_type === 'profit365') {
      const result = await profit365.fullSync(companyId);
      totalRecords = result.accounts + result.invoices;
      message = isInitial
        ? `Successfully connected! Synced ${result.accounts} accounts and ${result.invoices} invoices.`
        : `Sync complete! Updated ${result.accounts} accounts and ${result.invoices} invoices.`;
    } else if (connection.software_type === 'quickbooks') {
      const result = await quickbooks.fullSync(companyId);
      totalRecords = result.accounts + result.invoices;
      message = isInitial
        ? `Successfully connected! Synced ${result.accounts} accounts and ${result.invoices} invoices.`
        : `Sync complete! Updated ${result.accounts} accounts and ${result.invoices} invoices.`;
    } else {
      throw new Error(`Sync not supported for ${connection.software_type}`);
    }

    res.redirect(`/company/${companyId}/overview?success=` + encodeURIComponent(message));
  } catch (e: any) {
    console.error('Sync error:', e);
    res.redirect(`/company/${companyId}/overview?error=` + encodeURIComponent('Sync failed: ' + e.message));
  }
});

// Company financial overview (Dashboard)
app.get('/company/:id/overview', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const connection = db.getAccountingConnection(companyId);
  const metrics = db.getLatestMetrics(companyId);
  const metricsHistory = db.getMetricsHistory(companyId, 6);
  const invoices = db.getInvoicesByCompany(companyId);
  const recentInvoices = invoices.slice(0, 5);
  const tr = t(req);
  const lang = getLang(req);

  const error = req.query.error as string;
  const success = req.query.success as string;

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: company.currency || 'CZK', maximumFractionDigits: 0 }).format(amount);
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

  // Chart data
  const chartLabels = metricsHistory.map((m: any) => tr.monthsShort[new Date(m.metric_date).getMonth()]);
  const revenueData = metricsHistory.map((m: any) => Math.round((m.revenue || 0) / 1000));
  const expensesData = metricsHistory.map((m: any) => Math.round((m.expenses || 0) / 1000));

  // Invoice counts
  const unpaidReceivables = invoices.filter((i: any) => i.invoice_type === 'issued' && i.status !== 'paid');
  const unpaidPayables = invoices.filter((i: any) => i.invoice_type === 'received' && i.status !== 'paid');
  const totalReceivables = unpaidReceivables.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);
  const totalPayables = unpaidPayables.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);

  const content = `
    ${error ? `<div class="alert alert-error">${error}</div>` : ''}
    ${success ? `<div class="alert alert-success">${success}</div>` : ''}

    <!-- Health Score Banner -->
    <div class="card" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; margin-bottom: 24px;">
      <div class="card-body" style="display: flex; align-items: center; justify-content: space-between; padding: 24px 32px;">
        <div>
          <h2 style="color: white; margin-bottom: 8px;">${tr.overview.healthScore}</h2>
          <p style="color: #94a3b8; margin: 0;">${healthScore >= 70 ? (lang === 'cs' ? 'Výborně! Způsobilý pro konkurenční úrokové sazby.' : lang === 'sk' ? 'Výborne! Spôsobilý pre konkurenčné úrokové sadzby.' : 'Excellent! Eligible for competitive financing rates.') : healthScore >= 50 ? (lang === 'cs' ? 'Dobrý stav. K dispozici více možností financování.' : lang === 'sk' ? 'Dobrý stav. K dispozícii viac možností financovania.' : 'Good standing. Multiple financing options available.') : (lang === 'cs' ? 'Pomůžeme vám zlepšit vaši finanční pozici.' : lang === 'sk' ? 'Pomôžeme vám zlepšiť vašu finančnú pozíciu.' : 'We can help improve your financial position.')}</p>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 3rem; font-weight: 700; color: ${healthScore >= 70 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444'};">${healthScore}</div>
          <div style="font-size: 0.9rem; color: #94a3b8;">${lang === 'cs' ? 'ze 100' : lang === 'sk' ? 'zo 100' : 'out of 100'}</div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.overview.revenue} (YTD)</div>
        <div class="stat-value">${formatCurrency(metrics?.revenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.overview.netIncome}</div>
        <div class="stat-value" style="color: ${(metrics?.net_income || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">${formatCurrency(metrics?.net_income)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.overview.cashBalance}</div>
        <div class="stat-value">${formatCurrency(metrics?.cash_balance)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.receivables}</div>
        <div class="stat-value">${formatCurrency(totalReceivables)}</div>
        <div class="stat-change">${unpaidReceivables.length} ${tr.invoicesPage.unpaid.toLowerCase()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.payables}</div>
        <div class="stat-value">${formatCurrency(totalPayables)}</div>
        <div class="stat-change">${unpaidPayables.length} ${tr.invoicesPage.unpaid.toLowerCase()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.currentRatio}</div>
        <div class="stat-value">${metrics?.current_ratio?.toFixed(2) || 'N/A'}</div>
        <div class="stat-change ${(metrics?.current_ratio || 0) >= 1.5 ? 'positive' : 'negative'}">${(metrics?.current_ratio || 0) >= 1.5 ? (lang === 'cs' ? 'Zdravé' : lang === 'sk' ? 'Zdravé' : 'Healthy') : (lang === 'cs' ? 'Vyžaduje pozornost' : lang === 'sk' ? 'Vyžaduje pozornosť' : 'Needs attention')}</div>
      </div>
    </div>

    <!-- Charts & Recent Activity -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${tr.overview.revenueVsExpenses}</span>
          <a href="/company/${companyId}/reports" class="btn btn-secondary btn-sm">${tr.nav.reports}</a>
        </div>
        <div class="card-body">
          <canvas id="revenueChart" height="200"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">${tr.nav.invoices}</span>
          <a href="/company/${companyId}/data/invoices" class="btn btn-secondary btn-sm">${tr.overview.viewAllInvoices}</a>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>${tr.invoicesPage.invoiceNumber}</th><th>${tr.invoicesPage.customer}</th><th style="text-align:right">${tr.invoicesPage.amount}</th><th>${tr.invoicesPage.status}</th></tr>
            </thead>
            <tbody>
              ${recentInvoices.length > 0 ? recentInvoices.map((inv: any) => `
                <tr>
                  <td>${inv.invoice_number || '-'}</td>
                  <td>${inv.customer_name || '-'}</td>
                  <td style="text-align:right">${formatCurrency(inv.total_amount)}</td>
                  <td><span class="badge ${inv.status === 'paid' ? 'badge-success' : 'badge-error'}">${inv.status === 'paid' ? tr.invoicesPage.paid : tr.invoicesPage.unpaid}</span></td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="empty-state">${tr.invoicesPage.noInvoices}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <h3 style="margin: 32px 0 16px; font-size: 1rem; color: var(--color-text-secondary);">${tr.overview.quickLinks}</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
      <a href="/company/${companyId}/reports" class="card" style="text-decoration: none; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.2s;">
        <span style="font-size: 2rem;">&#128202;</span>
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${tr.nav.reports}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${tr.reportsPage.subtitle}</div>
        </div>
      </a>
      <a href="/company/${companyId}/data/invoices" class="card" style="text-decoration: none; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.2s;">
        <span style="font-size: 2rem;">&#128196;</span>
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${tr.nav.invoices}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${invoices.length} ${tr.common.total.toLowerCase()}</div>
        </div>
      </a>
      <a href="/company/${companyId}/data/accounts" class="card" style="text-decoration: none; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.2s;">
        <span style="font-size: 2rem;">&#128179;</span>
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${tr.accountsPage.title}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${tr.overview.viewAllAccounts}</div>
        </div>
      </a>
      <a href="/company/${companyId}/connect" class="card" style="text-decoration: none; padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.2s;">
        <span style="font-size: 2rem;">&#128279;</span>
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${tr.overview.integrationSettings}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${connection?.software_type || tr.dashboard.notConnected}</div>
        </div>
      </a>
    </div>

    <script>
      new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [
            { label: '${tr.overview.revenue}', data: ${JSON.stringify(revenueData)}, backgroundColor: '#10b981', borderRadius: 4 },
            { label: '${tr.overview.expenses}', data: ${JSON.stringify(expensesData)}, backgroundColor: '#ef4444', borderRadius: 4 }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      });
    </script>
  `;

  res.send(renderAppPage({
    title: 'Dashboard',
    content,
    companyId,
    companyName: company.name,
    activePage: 'overview',
    req
  }));
});

// Data: Invoices listing
app.get('/company/:id/data/invoices', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const invoices = db.getInvoicesByCompany(companyId);
  const tr = t(req);
  const lang = getLang(req);

  // Get filter parameters
  const typeFilter = req.query.type as string || 'all';
  const statusFilter = req.query.status as string || 'all';
  const dateFrom = req.query.dateFrom as string || '';
  const dateTo = req.query.dateTo as string || '';
  const customerSearch = req.query.customer as string || '';
  const currencyFilter = req.query.currency as string || 'all';

  // Quick date preset helper
  const now = new Date();
  const getDatePresets = () => {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastQuarter = new Date(now.getFullYear(), Math.floor((now.getMonth() - 1) / 3) * 3 - 2, 1);
    const lastQuarterEnd = new Date(now.getFullYear(), Math.floor((now.getMonth() - 1) / 3) * 3 + 1, 0);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return {
      lastMonth: { from: fmt(lastMonth), to: fmt(lastMonthEnd) },
      lastQuarter: { from: fmt(lastQuarter), to: fmt(lastQuarterEnd) },
      lastYear: { from: fmt(lastYear), to: fmt(lastYearEnd) },
      currentMonth: { from: fmt(currentMonth), to: fmt(now) },
      currentQuarter: { from: fmt(currentQuarter), to: fmt(now) },
      currentYear: { from: fmt(currentYear), to: fmt(now) },
    };
  };
  const datePresets = getDatePresets();

  // Get unique currencies from all invoices
  const allCurrencies = [...new Set(invoices.map((i: any) => i.currency || 'CZK'))].sort();

  // Check if any filters are active
  const hasFilters = typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || customerSearch || currencyFilter !== 'all';

  // Apply filters
  let filteredInvoices = invoices;

  // Type filter
  if (typeFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter((i: any) => i.invoice_type === typeFilter);
  }

  // Status filter
  if (statusFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter((i: any) => i.status === statusFilter);
  }

  // Date from filter (issue date)
  if (dateFrom) {
    filteredInvoices = filteredInvoices.filter((i: any) => i.issue_date && i.issue_date >= dateFrom);
  }

  // Date to filter (issue date)
  if (dateTo) {
    filteredInvoices = filteredInvoices.filter((i: any) => i.issue_date && i.issue_date <= dateTo);
  }

  // Customer/vendor search
  if (customerSearch) {
    const search = customerSearch.toLowerCase();
    filteredInvoices = filteredInvoices.filter((i: any) =>
      (i.customer_name && i.customer_name.toLowerCase().includes(search)) ||
      (i.invoice_number && i.invoice_number.toLowerCase().includes(search))
    );
  }

  // Currency filter
  if (currencyFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter((i: any) => (i.currency || 'CZK') === currencyFilter);
  }

  // Parse raw_data to get extra fields
  const enrichedInvoices = filteredInvoices.map((inv: any) => {
    let extra: any = {};
    if (inv.raw_data) {
      try {
        extra = JSON.parse(inv.raw_data);
      } catch {}
    }
    return { ...inv, extra };
  });

  const formatCurrency = (amount: number | null, currency?: string) => {
    if (amount === null || amount === undefined) return 'N/A';
    const cur = currency || company.currency || 'CZK';
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amount);
  };

  // Format date based on locale (dd.mm.yyyy for CS/SK, mm/dd/yyyy for EN)
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      if (lang === 'en') {
        return date.toLocaleDateString('en-US');
      } else {
        // Czech/Slovak format: dd.mm.yyyy
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch {
      return dateStr;
    }
  };

  // Calculate totals grouped by currency
  const totalsByCurrency: Record<string, { total: number; balance: number; paid: number; unpaid: number; count: number }> = {};
  filteredInvoices.forEach((i: any) => {
    const cur = i.currency || 'CZK';
    if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { total: 0, balance: 0, paid: 0, unpaid: 0, count: 0 };
    totalsByCurrency[cur].total += i.total_amount || 0;
    totalsByCurrency[cur].balance += i.balance_due || 0;
    totalsByCurrency[cur].count++;
    if (i.status === 'paid') {
      totalsByCurrency[cur].paid += i.total_amount || 0;
    } else {
      totalsByCurrency[cur].unpaid += i.total_amount || 0;
    }
  });
  const currenciesWithTotals = Object.entries(totalsByCurrency).sort((a, b) => b[1].total - a[1].total);

  // For charts, use primary currency (most used) or sum if single currency
  const primaryCurrency = currenciesWithTotals[0]?.[0] || 'CZK';
  const filteredTotalAmount = totalsByCurrency[primaryCurrency]?.total || 0;
  const filteredTotalBalance = totalsByCurrency[primaryCurrency]?.balance || 0;
  const filteredPaidAmount = totalsByCurrency[primaryCurrency]?.paid || 0;
  const filteredUnpaidAmount = totalsByCurrency[primaryCurrency]?.unpaid || 0;

  // Counts for stats
  const filteredIssuedCount = filteredInvoices.filter((i: any) => i.invoice_type === 'issued').length;
  const filteredReceivedCount = filteredInvoices.filter((i: any) => i.invoice_type === 'received').length;
  const filteredPaidCount = filteredInvoices.filter((i: any) => i.status === 'paid').length;
  const filteredUnpaidCount = filteredInvoices.filter((i: any) => i.status !== 'paid').length;

  // Analytics data calculations
  // Top customers (by total amount for issued invoices)
  const customerTotals: Record<string, { name: string; total: number; count: number }> = {};
  filteredInvoices.filter((i: any) => i.invoice_type === 'issued').forEach((inv: any) => {
    const name = inv.customer_name || 'Unknown';
    if (!customerTotals[name]) customerTotals[name] = { name, total: 0, count: 0 };
    customerTotals[name].total += inv.total_amount || 0;
    customerTotals[name].count++;
  });
  const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);

  // Top suppliers (by total amount for received invoices)
  const supplierTotals: Record<string, { name: string; total: number; count: number }> = {};
  filteredInvoices.filter((i: any) => i.invoice_type === 'received').forEach((inv: any) => {
    const name = inv.customer_name || 'Unknown';
    if (!supplierTotals[name]) supplierTotals[name] = { name, total: 0, count: 0 };
    supplierTotals[name].total += inv.total_amount || 0;
    supplierTotals[name].count++;
  });
  const topSuppliers = Object.values(supplierTotals).sort((a, b) => b.total - a.total).slice(0, 5);

  // Monthly overview (last 6 months)
  const monthlyData: Record<string, { issued: number; received: number; issuedCount: number; receivedCount: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { issued: 0, received: 0, issuedCount: 0, receivedCount: 0 };
  }
  filteredInvoices.forEach((inv: any) => {
    if (!inv.issue_date) return;
    const key = inv.issue_date.substring(0, 7);
    if (monthlyData[key]) {
      if (inv.invoice_type === 'issued') {
        monthlyData[key].issued += inv.total_amount || 0;
        monthlyData[key].issuedCount++;
      } else {
        monthlyData[key].received += inv.total_amount || 0;
        monthlyData[key].receivedCount++;
      }
    }
  });
  const monthLabels = Object.keys(monthlyData);
  const monthlyIssued = Object.values(monthlyData).map(m => m.issued);
  const monthlyReceived = Object.values(monthlyData).map(m => m.received);

  // Payment timing analysis (for paid invoices)
  let totalDaysToPay = 0;
  let paidWithTimingCount = 0;
  let overdueCount = 0;
  let onTimeCount = 0;
  filteredInvoices.filter((i: any) => i.status === 'paid').forEach((inv: any) => {
    if (inv.issue_date && inv.due_date) {
      const issueDate = new Date(inv.issue_date);
      const dueDate = new Date(inv.due_date);
      // Estimate paid date as due date for simplicity (or could use actual paid_on if available)
      const paidDate = dueDate; // Simplified - in reality would use paid_on field
      const daysToPay = Math.floor((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToPay >= 0) {
        totalDaysToPay += daysToPay;
        paidWithTimingCount++;
      }
      // Check if paid before/after due date
      if (paidDate <= dueDate) {
        onTimeCount++;
      } else {
        overdueCount++;
      }
    }
  });
  const avgDaysToPay = paidWithTimingCount > 0 ? Math.round(totalDaysToPay / paidWithTimingCount) : 0;

  // Build query string for preserving filters in tabs
  const buildQueryString = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      type: typeFilter,
      status: statusFilter,
      dateFrom,
      dateTo,
      customer: customerSearch,
      ...overrides
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const content = `
    <style>
      .filter-panel {
        background: var(--color-sage-pale);
        border: 1px solid var(--color-sage-light);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
      }
      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--color-sage-light);
      }
      .filter-header h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        align-items: end;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .filter-group label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .filter-group input,
      .filter-group select {
        padding: 10px 12px;
        border: 1px solid var(--color-sage);
        border-radius: 8px;
        font-size: 0.9rem;
        background: white;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .filter-group input:focus,
      .filter-group select:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(139, 168, 138, 0.2);
      }
      .filter-actions {
        display: flex;
        gap: 8px;
        align-items: end;
      }
      .filter-actions .btn {
        height: 42px;
        white-space: nowrap;
      }
      @media (max-width: 768px) {
        .filter-grid {
          grid-template-columns: 1fr 1fr;
        }
        .filter-actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }
      }
      .preset-btn {
        padding: 6px 12px;
        font-size: 0.8rem;
        background: white;
        border: 1px solid var(--color-sage);
        border-radius: 16px;
        color: var(--color-text);
        text-decoration: none;
        transition: all 0.2s;
      }
      .preset-btn:hover {
        background: var(--color-sage-light);
        border-color: var(--color-sage);
      }
      .preset-btn.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }
      .currency-totals {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
      }
      .currency-total-card {
        flex: 1;
        min-width: 200px;
        background: white;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 16px;
      }
      .currency-total-card h4 {
        margin: 0 0 12px;
        font-size: 0.9rem;
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .currency-total-card .amount {
        font-size: 1.5rem;
        font-weight: 700;
      }
      .currency-total-card .sub-amounts {
        display: flex;
        gap: 16px;
        margin-top: 8px;
        font-size: 0.85rem;
      }
    </style>

    <div class="page-header">
      <h1>${tr.invoicesPage.title}</h1>
      <p>${tr.invoicesPage.subtitle}</p>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-header">
        <h3>&#128269; ${tr.invoicesPage.filters}</h3>
        ${hasFilters ? `<a href="/company/${companyId}/data/invoices" class="btn btn-secondary btn-sm">${tr.invoicesPage.clearFilters}</a>` : ''}
      </div>

      <!-- Quick Date Presets -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--color-sage-light);">
        <span style="font-size: 0.8rem; color: var(--color-text-muted); margin-right: 8px; display: flex; align-items: center;">&#128197;</span>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.lastMonth.from}&dateTo=${datePresets.lastMonth.to}" class="preset-btn ${dateFrom === datePresets.lastMonth.from && dateTo === datePresets.lastMonth.to ? 'active' : ''}">${tr.invoicesPage.lastMonth}</a>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.lastQuarter.from}&dateTo=${datePresets.lastQuarter.to}" class="preset-btn ${dateFrom === datePresets.lastQuarter.from && dateTo === datePresets.lastQuarter.to ? 'active' : ''}">${tr.invoicesPage.lastQuarter}</a>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.lastYear.from}&dateTo=${datePresets.lastYear.to}" class="preset-btn ${dateFrom === datePresets.lastYear.from && dateTo === datePresets.lastYear.to ? 'active' : ''}">${tr.invoicesPage.lastYear}</a>
        <span style="color: var(--color-sage); margin: 0 4px;">|</span>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.currentMonth.from}&dateTo=${datePresets.currentMonth.to}" class="preset-btn ${dateFrom === datePresets.currentMonth.from ? 'active' : ''}">${tr.invoicesPage.currentMonth}</a>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.currentQuarter.from}&dateTo=${datePresets.currentQuarter.to}" class="preset-btn ${dateFrom === datePresets.currentQuarter.from ? 'active' : ''}">${tr.invoicesPage.currentQuarter}</a>
        <a href="/company/${companyId}/data/invoices?dateFrom=${datePresets.currentYear.from}&dateTo=${datePresets.currentYear.to}" class="preset-btn ${dateFrom === datePresets.currentYear.from ? 'active' : ''}">${tr.invoicesPage.currentYear}</a>
      </div>

      <form method="GET" action="/company/${companyId}/data/invoices">
        <div class="filter-grid">
          <div class="filter-group">
            <label for="dateFrom">${tr.invoicesPage.dateFrom}</label>
            <input type="date" id="dateFrom" name="dateFrom" value="${dateFrom}">
          </div>
          <div class="filter-group">
            <label for="dateTo">${tr.invoicesPage.dateTo}</label>
            <input type="date" id="dateTo" name="dateTo" value="${dateTo}">
          </div>
          <div class="filter-group">
            <label for="type">${tr.invoicesPage.type}</label>
            <select id="type" name="type">
              <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>${tr.invoicesPage.all}</option>
              <option value="issued" ${typeFilter === 'issued' ? 'selected' : ''}>${tr.invoicesPage.issued}</option>
              <option value="received" ${typeFilter === 'received' ? 'selected' : ''}>${tr.invoicesPage.received}</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="status">${tr.invoicesPage.status}</label>
            <select id="status" name="status">
              <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>${tr.invoicesPage.all}</option>
              <option value="paid" ${statusFilter === 'paid' ? 'selected' : ''}>${tr.invoicesPage.paid}</option>
              <option value="unpaid" ${statusFilter === 'unpaid' ? 'selected' : ''}>${tr.invoicesPage.unpaid}</option>
            </select>
          </div>
          ${allCurrencies.length > 1 ? `
          <div class="filter-group">
            <label for="currency">${tr.invoicesPage.currency}</label>
            <select id="currency" name="currency">
              <option value="all" ${currencyFilter === 'all' ? 'selected' : ''}>${tr.invoicesPage.all}</option>
              ${allCurrencies.map(c => `<option value="${c}" ${currencyFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          ` : ''}
          <div class="filter-group">
            <label for="customer">${tr.invoicesPage.searchCustomer}</label>
            <input type="text" id="customer" name="customer" value="${customerSearch}" placeholder="...">
          </div>
          <div class="filter-actions">
            <button type="submit" class="btn btn-primary">${tr.invoicesPage.applyFilters}</button>
          </div>
        </div>
      </form>
    </div>

    <!-- Stats Summary -->
    <div class="stats-grid" style="margin-bottom: 16px;">
      <div class="stat-card" style="background: linear-gradient(135deg, var(--color-sage-light), var(--color-sage-pale));">
        <div class="stat-label">${hasFilters ? tr.invoicesPage.filteredResults : tr.invoicesPage.totalInvoices}</div>
        <div class="stat-value">${filteredInvoices.length}${hasFilters ? ` <span style="font-size: 0.5em; font-weight: normal;">/ ${invoices.length}</span>` : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.invoicesPage.issued}</div>
        <div class="stat-value">${filteredIssuedCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.invoicesPage.received}</div>
        <div class="stat-value">${filteredReceivedCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.invoicesPage.paid} / ${tr.invoicesPage.unpaid}</div>
        <div class="stat-value">${filteredPaidCount} <span style="font-size: 0.6em; color: var(--color-text-muted);">/</span> <span style="color: var(--color-warning)">${filteredUnpaidCount}</span></div>
      </div>
    </div>

    <!-- Totals by Currency -->
    ${currenciesWithTotals.length > 0 ? `
    <div class="currency-totals">
      ${currenciesWithTotals.map(([cur, totals]) => `
        <div class="currency-total-card">
          <h4><span style="font-size: 1.2em;">&#128176;</span> ${cur} <span style="font-weight: normal; font-size: 0.85em;">(${totals.count} ${tr.invoicesPage.invoicesCount})</span></h4>
          <div class="amount">${formatCurrency(totals.total, cur)}</div>
          <div class="sub-amounts">
            <span><span style="color: var(--color-success);">&#10003;</span> ${formatCurrency(totals.paid, cur)}</span>
            <span><span style="color: var(--color-error);">&#10007;</span> ${formatCurrency(totals.unpaid, cur)}</span>
            <span style="color: var(--color-text-muted);">&#8594; ${formatCurrency(totals.balance, cur)}</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Collapsible Invoice List -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; cursor: pointer;" onclick="document.getElementById('invoiceTableContent').classList.toggle('collapsed'); this.querySelector('.collapse-icon').classList.toggle('rotated');">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="collapse-icon" style="transition: transform 0.2s; display: inline-block;">&#9660;</span>
          <h3 style="margin: 0; font-size: 1rem;">${tr.invoicesPage.invoiceList}</h3>
          <span class="badge badge-info">${filteredInvoices.length}</span>
        </div>
        <div class="tabs" style="border: none; margin: 0;" onclick="event.stopPropagation();">
          <a href="/company/${companyId}/data/invoices${buildQueryString({ type: 'all' })}" class="tab ${typeFilter === 'all' ? 'active' : ''}">${tr.invoicesPage.all} (${invoices.length})</a>
          <a href="/company/${companyId}/data/invoices${buildQueryString({ type: 'issued' })}" class="tab ${typeFilter === 'issued' ? 'active' : ''}">${tr.invoicesPage.issued} (${invoices.filter((i: any) => i.invoice_type === 'issued').length})</a>
          <a href="/company/${companyId}/data/invoices${buildQueryString({ type: 'received' })}" class="tab ${typeFilter === 'received' ? 'active' : ''}">${tr.invoicesPage.received} (${invoices.filter((i: any) => i.invoice_type === 'received').length})</a>
        </div>
      </div>
      <div id="invoiceTableContent" class="collapsible-content">
        <div class="table-wrapper" style="overflow-x: auto;">
          <table style="min-width: 1200px;">
            <thead>
              <tr>
                <th>${tr.invoicesPage.invoiceNumber}</th>
                <th>${tr.invoicesPage.variableSymbol}</th>
                <th>${tr.invoicesPage.documentType}</th>
                <th>${tr.invoicesPage.customer}/${tr.invoicesPage.vendor}</th>
                <th>${tr.invoicesPage.issueDate}</th>
                <th>${tr.invoicesPage.dueDate}</th>
                <th>${tr.invoicesPage.paidOn}</th>
                <th style="text-align:right">${tr.invoicesPage.subtotal}</th>
                <th style="text-align:right">${tr.invoicesPage.amount}</th>
                <th style="text-align:right">${tr.accountsPage.balance}</th>
                <th>${tr.invoicesPage.paymentMethod}</th>
                <th>${tr.invoicesPage.status}</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedInvoices.length > 0 ? enrichedInvoices.map((inv: any) => {
                const docType = inv.extra?.document_type || (inv.invoice_type === 'issued' ? 'invoice' : 'expense');
                const docTypeLabel = docType === 'invoice' ? tr.invoicesPage.invoice :
                  docType === 'proforma' ? tr.invoicesPage.proforma :
                  docType === 'correction' ? tr.invoicesPage.correction :
                  docType === 'tax_document' ? tr.invoicesPage.taxDocument : docType;
                const varSymbol = inv.extra?.variable_symbol || '-';
                const paidOn = inv.extra?.paid_on ? formatDate(inv.extra.paid_on) : '-';
                const subtotal = inv.extra?.native_subtotal || inv.extra?.subtotal;
                const paymentMethod = inv.extra?.payment_method || '-';
                const statusLabel = inv.status === 'paid' ? tr.invoicesPage.paid :
                  inv.extra?.status === 'sent' ? tr.invoicesPage.sent :
                  inv.extra?.status === 'cancelled' ? tr.invoicesPage.cancelled :
                  inv.extra?.status === 'overdue' ? tr.invoicesPage.overdue :
                  inv.extra?.status === 'open' ? tr.invoicesPage.open : tr.invoicesPage.unpaid;
                const statusClass = inv.status === 'paid' ? 'badge-success' :
                  inv.extra?.status === 'overdue' ? 'badge-error' :
                  inv.extra?.status === 'sent' ? 'badge-info' : 'badge-warning';
                return `
                <tr>
                  <td><strong>${inv.invoice_number || '-'}</strong></td>
                  <td style="font-size: 0.85rem; color: var(--color-text-muted);">${varSymbol}</td>
                  <td><span class="badge ${inv.invoice_type === 'issued' ? 'badge-info' : 'badge-warning'}">${docTypeLabel}</span></td>
                  <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${inv.customer_name || ''}">${inv.customer_name || '-'}</td>
                  <td>${formatDate(inv.issue_date)}</td>
                  <td>${formatDate(inv.due_date)}</td>
                  <td>${paidOn}</td>
                  <td style="text-align:right; font-size: 0.85rem; color: var(--color-text-muted);">${subtotal ? formatCurrency(subtotal, inv.currency) : '-'}</td>
                  <td style="text-align:right; font-weight: 600;">${formatCurrency(inv.total_amount, inv.currency)}</td>
                  <td style="text-align:right; color: ${inv.balance_due > 0 ? 'var(--color-warning)' : 'var(--color-success)'};">${formatCurrency(inv.balance_due, inv.currency)}</td>
                  <td style="font-size: 0.85rem;">${paymentMethod}</td>
                  <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                </tr>
              `}).join('') : `<tr><td colspan="12" class="empty-state">${tr.invoicesPage.noInvoices}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div class="page-header" style="margin-top: 32px;">
      <h2 style="font-size: 1.3rem;">${tr.invoicesPage.analytics}</h2>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Payment Status Chart -->
      <div class="card" style="background: linear-gradient(135deg, #fff 0%, #f8faf8 100%);">
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 16px; font-size: 0.9rem; color: var(--color-text-muted); font-weight: 500;">${tr.invoicesPage.paymentStatus}</h3>
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 120px; height: 120px;">
              <canvas id="paymentStatusChart"></canvas>
            </div>
            <div style="flex: 1;">
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(135deg, #7cb77c, #5a9a5a);"></span>
                  <span style="font-size: 0.8rem; color: var(--color-text-muted);">${tr.invoicesPage.paid}</span>
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; color: #5a9a5a;">${formatCurrency(filteredPaidAmount, primaryCurrency)}</div>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(135deg, #ef9a9a, #e57373);"></span>
                  <span style="font-size: 0.8rem; color: var(--color-text-muted);">${tr.invoicesPage.unpaid}</span>
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; color: #e57373;">${formatCurrency(filteredUnpaidAmount, primaryCurrency)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Type Chart -->
      <div class="card" style="background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);">
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 16px; font-size: 0.9rem; color: var(--color-text-muted); font-weight: 500;">${tr.invoicesPage.invoicesByType}</h3>
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 120px; height: 120px;">
              <canvas id="invoiceTypeChart"></canvas>
            </div>
            <div style="flex: 1;">
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(135deg, #90caf9, #42a5f5);"></span>
                  <span style="font-size: 0.8rem; color: var(--color-text-muted);">${tr.invoicesPage.issued}</span>
                </div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #42a5f5;">${filteredIssuedCount}</div>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="width: 10px; height: 10px; border-radius: 2px; background: linear-gradient(135deg, #ffcc80, #ffa726);"></span>
                  <span style="font-size: 0.8rem; color: var(--color-text-muted);">${tr.invoicesPage.received}</span>
                </div>
                <div style="font-size: 1.3rem; font-weight: 600; color: #ffa726;">${filteredReceivedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Avg Days to Pay -->
      <div class="card" style="background: linear-gradient(135deg, #fff 0%, #fafaf8 100%);">
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 16px; font-size: 0.9rem; color: var(--color-text-muted); font-weight: 500;">${tr.invoicesPage.paymentTiming}</h3>
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-sage-pale), var(--color-sage-light)); display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-size: 1.8rem; font-weight: 700; color: var(--color-primary); line-height: 1;">${avgDaysToPay}</div>
              <div style="font-size: 0.65rem; color: var(--color-text-muted);">${tr.invoicesPage.days}</div>
            </div>
            <div style="flex: 1;">
              <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1rem;">&#10003;</span>
                <span style="font-size: 0.85rem;">${tr.invoicesPage.onTime}</span>
                <span style="font-weight: 600; color: var(--color-success); margin-left: auto;">${onTimeCount}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1rem;">&#10007;</span>
                <span style="font-size: 0.85rem;">${tr.invoicesPage.overdue}</span>
                <span style="font-weight: 600; color: var(--color-error); margin-left: auto;">${overdueCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Overview -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <h3 style="margin: 0; font-size: 1rem;">${tr.invoicesPage.monthlyOverview}</h3>
      </div>
      <div style="padding: 20px;">
        <canvas id="monthlyChart" style="width: 100%; height: 250px;"></canvas>
      </div>
    </div>

    <!-- Top Customers & Suppliers -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
      ${topCustomers.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <h3 style="margin: 0; font-size: 1rem;">${tr.invoicesPage.topCustomers}</h3>
        </div>
        <div style="padding: 0;">
          ${topCustomers.map((c, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--color-border); ${idx === topCustomers.length - 1 ? 'border: none;' : ''}">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-sage-light); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600;">${idx + 1}</span>
                <div>
                  <div style="font-weight: 500;">${c.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">${c.count} ${tr.invoicesPage.invoicesCount}</div>
                </div>
              </div>
              <div style="font-weight: 600; color: var(--color-success);">${formatCurrency(c.total)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${topSuppliers.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <h3 style="margin: 0; font-size: 1rem;">${tr.invoicesPage.topSuppliers}</h3>
        </div>
        <div style="padding: 0;">
          ${topSuppliers.map((s, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--color-border); ${idx === topSuppliers.length - 1 ? 'border: none;' : ''}">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--color-sage-light); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600;">${idx + 1}</span>
                <div>
                  <div style="font-weight: 500;">${s.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">${s.count} ${tr.invoicesPage.invoicesCount}</div>
                </div>
              </div>
              <div style="font-weight: 600; color: var(--color-error);">${formatCurrency(s.total)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
      // Collapsible styles
      document.head.insertAdjacentHTML('beforeend', \`
        <style>
          .collapsible-content {
            max-height: 600px;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
          .collapsible-content.collapsed {
            max-height: 0;
          }
          .collapse-icon.rotated {
            transform: rotate(-90deg);
          }
        </style>
      \`);

      // Payment Status Doughnut Chart
      new Chart(document.getElementById('paymentStatusChart'), {
        type: 'doughnut',
        data: {
          labels: ['${tr.invoicesPage.paid}', '${tr.invoicesPage.unpaid}'],
          datasets: [{
            data: [${filteredPaidAmount}, ${filteredUnpaidAmount}],
            backgroundColor: ['#8BA88A', '#E57373'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          cutout: '60%'
        }
      });

      // Invoice Type Doughnut Chart
      new Chart(document.getElementById('invoiceTypeChart'), {
        type: 'doughnut',
        data: {
          labels: ['${tr.invoicesPage.issued}', '${tr.invoicesPage.received}'],
          datasets: [{
            data: [${filteredIssuedCount}, ${filteredReceivedCount}],
            backgroundColor: ['#64B5F6', '#FFB74D'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          cutout: '60%'
        }
      });

      // Monthly Overview Bar Chart
      new Chart(document.getElementById('monthlyChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(monthLabels)},
          datasets: [
            {
              label: '${tr.invoicesPage.issued}',
              data: ${JSON.stringify(monthlyIssued)},
              backgroundColor: '#8BA88A',
              borderRadius: 4
            },
            {
              label: '${tr.invoicesPage.received}',
              data: ${JSON.stringify(monthlyReceived)},
              backgroundColor: '#FFB74D',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 20 }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('${lang === 'en' ? 'en-US' : 'cs-CZ'}', { style: 'currency', currency: '${company.currency || 'CZK'}', maximumFractionDigits: 0 }).format(value);
                }
              }
            }
          }
        }
      });
    </script>
  `;

  res.send(renderAppPage({
    title: tr.invoicesPage.title,
    content,
    companyId,
    companyName: company.name,
    activePage: 'invoices',
    req
  }));
});

// Data: Chart of Accounts
app.get('/company/:id/data/accounts', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const accounts = db.getAccountsByCompany(companyId);
  const tr = t(req);
  const lang = getLang(req);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: company.currency || 'CZK', maximumFractionDigits: 0 }).format(amount);
  };

  // Group accounts by type
  const accountsByType: Record<string, any[]> = {};
  accounts.forEach((acc: any) => {
    const type = acc.account_type || 'Other';
    if (!accountsByType[type]) accountsByType[type] = [];
    accountsByType[type].push(acc);
  });

  const totalAssets = accounts.filter((a: any) => ['Bank', 'Accounts Receivable', 'Fixed Asset', 'Other Current Asset'].includes(a.account_type)).reduce((sum: number, a: any) => sum + (a.current_balance || 0), 0);
  const totalLiabilities = accounts.filter((a: any) => ['Accounts Payable', 'Credit Card', 'Long Term Liability', 'Other Current Liability'].includes(a.account_type)).reduce((sum: number, a: any) => sum + (a.current_balance || 0), 0);

  const content = `
    <div class="page-header">
      <h1>${tr.accountsPage.title}</h1>
      <p>${tr.accountsPage.subtitle}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.accountsPage.totalAccounts}</div>
        <div class="stat-value">${accounts.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.accountsPage.assets}</div>
        <div class="stat-value" style="color: var(--color-success)">${formatCurrency(totalAssets)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.accountsPage.liabilities}</div>
        <div class="stat-value" style="color: var(--color-error)">${formatCurrency(totalLiabilities)}</div>
      </div>
    </div>

    ${Object.entries(accountsByType).map(([type, accs]) => `
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <span class="card-title">${type}</span>
          <span class="badge badge-info">${accs.length}</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>${tr.accountsPage.accountNumber}</th>
                <th>${tr.accountsPage.accountName}</th>
                <th>${tr.accountsPage.type}</th>
                <th style="text-align:right">${tr.accountsPage.balance}</th>
              </tr>
            </thead>
            <tbody>
              ${accs.map((acc: any) => `
                <tr>
                  <td><strong>${acc.account_number || '-'}</strong></td>
                  <td>${acc.name}</td>
                  <td>${acc.account_sub_type || '-'}</td>
                  <td style="text-align:right; font-weight: 600; color: ${acc.current_balance >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${formatCurrency(acc.current_balance)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('')}

    ${accounts.length === 0 ? `<div class="card"><div class="empty-state"><div class="empty-state-icon">&#128179;</div><p>${tr.accountsPage.noAccounts}</p></div></div>` : ''}
  `;

  res.send(renderAppPage({
    title: tr.accountsPage.title,
    content,
    companyId,
    companyName: company.name,
    activePage: 'accounts',
    req
  }));
});

// Data: Transactions
app.get('/company/:id/data/transactions', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const transactions = db.getBankTransactionsByCompany(companyId, 100);
  const tr = t(req);
  const lang = getLang(req);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: company.currency || 'CZK', maximumFractionDigits: 0 }).format(amount);
  };

  const deposits = transactions.filter((t: any) => t.amount > 0);
  const withdrawals = transactions.filter((t: any) => t.amount < 0);
  const totalIn = deposits.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalOut = Math.abs(withdrawals.reduce((sum: number, t: any) => sum + t.amount, 0));

  const content = `
    <div class="page-header">
      <h1>${tr.transactionsPage.title}</h1>
      <p>${tr.transactionsPage.subtitle}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.transactionsPage.totalTransactions}</div>
        <div class="stat-value">${transactions.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.transactionsPage.income}</div>
        <div class="stat-value" style="color: var(--color-success)">${formatCurrency(totalIn)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.transactionsPage.expenses}</div>
        <div class="stat-value" style="color: var(--color-error)">${formatCurrency(totalOut)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.transactionsPage.netFlow}</div>
        <div class="stat-value" style="color: ${totalIn - totalOut >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">${formatCurrency(totalIn - totalOut)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">${tr.transactionsPage.title}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>${tr.transactionsPage.date}</th>
              <th>${tr.transactionsPage.description}</th>
              <th>${tr.transactionsPage.payee}</th>
              <th>${tr.transactionsPage.category}</th>
              <th style="text-align:right">${tr.transactionsPage.amount}</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.length > 0 ? transactions.map((txn: any) => `
              <tr>
                <td>${txn.transaction_date || '-'}</td>
                <td>${txn.description || '-'}</td>
                <td>${txn.payee || '-'}</td>
                <td><span class="badge badge-info">${txn.category || '-'}</span></td>
                <td style="text-align:right; font-weight: 600; color: ${txn.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                  ${txn.amount >= 0 ? '+' : ''}${formatCurrency(txn.amount)}
                </td>
              </tr>
            `).join('') : `<tr><td colspan="5" class="empty-state">${tr.transactionsPage.noTransactions}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  res.send(renderAppPage({
    title: tr.transactionsPage.title,
    content,
    companyId,
    companyName: company.name,
    activePage: 'transactions',
    req
  }));
});

// Reports & Analytics
app.get('/company/:id/reports', requireAuth, (req: Request, res: Response) => {
  const companyId = parseInt(req.params.id);
  const company = db.getCompanyById(companyId);

  if (!company || company.user_id !== req.session.userId) {
    return res.redirect('/dashboard');
  }

  const metrics = db.getLatestMetrics(companyId);
  const metricsHistory = db.getMetricsHistory(companyId, 12);
  const invoices = db.getInvoicesByCompany(companyId);
  const tr = t(req);
  const lang = getLang(req);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'cs-CZ', { style: 'currency', currency: company.currency || 'CZK', maximumFractionDigits: 0 }).format(amount);
  };

  // Calculate additional metrics
  const issuedInvoices = invoices.filter((i: any) => i.invoice_type === 'issued');
  const receivedInvoices = invoices.filter((i: any) => i.invoice_type === 'received');
  const totalRevenue = issuedInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);
  const totalExpenses = receivedInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);

  // Customer analysis
  const customerRevenue: Record<string, number> = {};
  issuedInvoices.forEach((inv: any) => {
    const name = inv.customer_name || 'Unknown';
    customerRevenue[name] = (customerRevenue[name] || 0) + (inv.total_amount || 0);
  });
  const topCustomers = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Vendor analysis
  const vendorExpenses: Record<string, number> = {};
  receivedInvoices.forEach((inv: any) => {
    const name = inv.customer_name || 'Unknown';
    vendorExpenses[name] = (vendorExpenses[name] || 0) + (inv.total_amount || 0);
  });
  const topVendors = Object.entries(vendorExpenses).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Monthly data for charts
  const chartLabels = metricsHistory.map((m: any) => tr.monthsShort[new Date(m.metric_date).getMonth()]);
  const revenueData = metricsHistory.map((m: any) => Math.round((m.revenue || 0) / 1000));
  const expensesData = metricsHistory.map((m: any) => Math.round((m.expenses || 0) / 1000));
  const profitData = metricsHistory.map((m: any) => Math.round((m.net_income || 0) / 1000));
  const cashData = metricsHistory.map((m: any) => Math.round((m.cash_balance || 0) / 1000));

  const content = `
    <div class="page-header">
      <h1>${tr.reportsPage.title}</h1>
      <p>${tr.reportsPage.subtitle}</p>
    </div>

    <!-- Profitability Section -->
    <h2 style="font-size: 1.1rem; margin: 32px 0 16px; color: var(--color-text-secondary);">&#128200; ${tr.reportsPage.profitability}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.common.total} ${tr.overview.revenue}</div>
        <div class="stat-value">${formatCurrency(totalRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.common.total} ${tr.overview.expenses}</div>
        <div class="stat-value">${formatCurrency(totalExpenses)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.overview.netIncome}</div>
        <div class="stat-value" style="color: ${(totalRevenue - totalExpenses) >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">${formatCurrency(totalRevenue - totalExpenses)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.netMarginPercent}</div>
        <div class="stat-value">${totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0}%</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">${tr.overview.revenueVsExpenses}</span></div>
        <div class="card-body"><canvas id="revenueChart" height="200"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${tr.overview.netIncome}</span></div>
        <div class="card-body"><canvas id="profitChart" height="200"></canvas></div>
      </div>
    </div>

    <!-- Liquidity Section -->
    <h2 style="font-size: 1.1rem; margin: 32px 0 16px; color: var(--color-text-secondary);">&#128176; ${tr.reportsPage.liquidity}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.overview.cashBalance}</div>
        <div class="stat-value">${formatCurrency(metrics?.cash_balance)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.currentRatio}</div>
        <div class="stat-value">${metrics?.current_ratio?.toFixed(2) || 'N/A'}</div>
        <div class="stat-change ${metrics?.current_ratio >= 1.5 ? 'positive' : 'negative'}">${metrics?.current_ratio >= 1.5 ? (lang === 'cs' ? 'Zdravé' : lang === 'sk' ? 'Zdravé' : 'Healthy') : (lang === 'cs' ? 'Vyžaduje pozornost' : lang === 'sk' ? 'Vyžaduje pozornosť' : 'Needs attention')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.quickRatio}</div>
        <div class="stat-value">${metrics?.quick_ratio?.toFixed(2) || 'N/A'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${lang === 'cs' ? 'Pracovní kapitál' : lang === 'sk' ? 'Pracovný kapitál' : 'Working Capital'}</div>
        <div class="stat-value">${formatCurrency((metrics?.current_assets || 0) - (metrics?.current_liabilities || 0))}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">${tr.reportsPage.cashTrend}</span></div>
      <div class="card-body"><canvas id="cashChart" height="150"></canvas></div>
    </div>

    <!-- Receivables & Payables Section -->
    <h2 style="font-size: 1.1rem; margin: 32px 0 16px; color: var(--color-text-secondary);">&#128203; ${tr.reportsPage.receivablesPayables}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.overview.accountsReceivable}</div>
        <div class="stat-value">${formatCurrency(metrics?.accounts_receivable)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.dso}</div>
        <div class="stat-value">${metrics?.dso_days?.toFixed(0) || 'N/A'} ${tr.common.days}</div>
        <div class="stat-change ${metrics?.dso_days <= 30 ? 'positive' : 'negative'}">${metrics?.dso_days <= 30 ? (lang === 'cs' ? 'Dobré inkaso' : lang === 'sk' ? 'Dobré inkaso' : 'Good collection') : (lang === 'cs' ? 'Pomalé inkaso' : lang === 'sk' ? 'Pomalé inkaso' : 'Slow collection')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.overview.accountsPayable}</div>
        <div class="stat-value">${formatCurrency(metrics?.accounts_payable)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.dpo}</div>
        <div class="stat-value">${metrics?.dpo_days?.toFixed(0) || 'N/A'} ${tr.common.days}</div>
      </div>
    </div>

    <!-- Leverage Section -->
    <h2 style="font-size: 1.1rem; margin: 32px 0 16px; color: var(--color-text-secondary);">&#9878; ${tr.reportsPage.financialStructure}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.totalAssets}</div>
        <div class="stat-value">${formatCurrency(metrics?.total_assets)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.totalLiabilities}</div>
        <div class="stat-value">${formatCurrency(metrics?.total_liabilities)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.totalEquity}</div>
        <div class="stat-value">${formatCurrency(metrics?.total_equity)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${tr.reportsPage.debtToEquity}</div>
        <div class="stat-value">${metrics?.debt_to_equity?.toFixed(2) || 'N/A'}</div>
        <div class="stat-change ${metrics?.debt_to_equity < 1 ? 'positive' : 'negative'}">${metrics?.debt_to_equity < 1 ? (lang === 'cs' ? 'Nízká páka' : lang === 'sk' ? 'Nízka páka' : 'Low leverage') : (lang === 'cs' ? 'Vysoká páka' : lang === 'sk' ? 'Vysoká páka' : 'High leverage')}</div>
      </div>
    </div>

    <!-- Top Customers & Vendors -->
    <h2 style="font-size: 1.1rem; margin: 32px 0 16px; color: var(--color-text-secondary);">&#128101; ${tr.reportsPage.customerAnalysis}</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">${tr.reportsPage.topCustomers}</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>${tr.reportsPage.customer}</th><th style="text-align:right">${tr.overview.revenue}</th><th style="text-align:right">%</th></tr></thead>
            <tbody>
              ${topCustomers.map(([name, amount]) => `
                <tr>
                  <td>${name}</td>
                  <td style="text-align:right">${formatCurrency(amount)}</td>
                  <td style="text-align:right">${totalRevenue > 0 ? (amount / totalRevenue * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('') || `<tr><td colspan="3" class="empty-state">${tr.common.noData}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${tr.reportsPage.topVendors}</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>${tr.reportsPage.vendor}</th><th style="text-align:right">${tr.overview.expenses}</th><th style="text-align:right">%</th></tr></thead>
            <tbody>
              ${topVendors.map(([name, amount]) => `
                <tr>
                  <td>${name}</td>
                  <td style="text-align:right">${formatCurrency(amount)}</td>
                  <td style="text-align:right">${totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('') || `<tr><td colspan="3" class="empty-state">${tr.common.noData}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <script>
      // Revenue vs Expenses Chart
      new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [
            { label: '${tr.overview.revenue}', data: ${JSON.stringify(revenueData)}, backgroundColor: '#10b981', borderRadius: 4 },
            { label: '${tr.overview.expenses}', data: ${JSON.stringify(expensesData)}, backgroundColor: '#ef4444', borderRadius: 4 }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      });

      // Profit Chart
      new Chart(document.getElementById('profitChart'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [{ label: '${tr.overview.netIncome}', data: ${JSON.stringify(profitData)}, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });

      // Cash Chart
      new Chart(document.getElementById('cashChart'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [{ label: '${tr.overview.cashBalance}', data: ${JSON.stringify(cashData)}, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    </script>
  `;

  res.send(renderAppPage({
    title: tr.reportsPage.title,
    content,
    companyId,
    companyName: company.name,
    activePage: 'reports',
    req
  }));
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
