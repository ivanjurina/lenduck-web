import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(__dirname, '..', 'lenduck.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS waitlist_sme (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    accounting_software TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS waitlist_partner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    partner_type TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    user_agent TEXT,
    page_visited TEXT,
    referrer TEXT,
    visited_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Password hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// User functions
export function createUser(email: string, password: string, isAdmin: boolean = false) {
  const passwordHash = hashPassword(password);
  const stmt = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)');
  return stmt.run(email.toLowerCase(), passwordHash, isAdmin ? 1 : 0);
}

export function createPendingUser(email: string) {
  const stmt = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, NULL, 0)');
  return stmt.run(email.toLowerCase());
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase()) as any;
}

export function getUserById(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as any;
}

export function validateUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return user;
}

export function getUserCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  return (stmt.get() as any).count;
}

// SME Waitlist functions
export function addSMEToWaitlist(data: {
  company_name: string;
  email: string;
  phone?: string;
  accounting_software?: string;
  message?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO waitlist_sme (company_name, email, phone, accounting_software, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(data.company_name, data.email.toLowerCase(), data.phone || null, data.accounting_software || null, data.message || null);
}

export function getSMEByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM waitlist_sme WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

export function getSMEWaitlist(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM waitlist_sme ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getSMECount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM waitlist_sme');
  return (stmt.get() as any).count;
}

// Partner Waitlist functions
export function addPartnerToWaitlist(data: {
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  partner_type?: string;
  message?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO waitlist_partner (company_name, contact_name, email, phone, partner_type, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.company_name, data.contact_name || null, data.email.toLowerCase(), data.phone || null, data.partner_type || null, data.message || null);
}

export function getPartnerByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM waitlist_partner WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

export function getPartnerWaitlist(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM waitlist_partner ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getPartnerCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM waitlist_partner');
  return (stmt.get() as any).count;
}

// Visitor tracking functions
export function trackVisitor(data: {
  ip_address?: string;
  user_agent?: string;
  page_visited: string;
  referrer?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO visitors (ip_address, user_agent, page_visited, referrer)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(data.ip_address || null, data.user_agent || null, data.page_visited, data.referrer || null);
}

export function getRecentVisitors(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM visitors ORDER BY visited_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function getTotalVisitors() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM visitors');
  return (stmt.get() as any).count;
}

export function getTodayVisitors() {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM visitors WHERE date(visited_at) = date('now')`);
  return (stmt.get() as any).count;
}

// Initialize default admin
export function initDefaultAdmin() {
  const admin = getUserByEmail('admin@lenduck.com');
  if (!admin) {
    createUser('admin@lenduck.com', 'admin123', true);
    console.log('Default admin created: admin@lenduck.com / admin123');
  }
}
