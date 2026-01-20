"""
Lenduck Web Application
SME Financing Marketplace
"""

import os
import hashlib
import secrets
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lenduck.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        salt = secrets.token_hex(16)
        self.password_hash = salt + ':' + hashlib.sha256((salt + password).encode()).hexdigest()

    def check_password(self, password):
        salt, hash_val = self.password_hash.split(':')
        return hash_val == hashlib.sha256((salt + password).encode()).hexdigest()


class WaitingListSME(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    accounting_software = db.Column(db.String(100))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WaitingListPartner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), nullable=False)
    contact_name = db.Column(db.String(200))
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    partner_type = db.Column(db.String(100))  # lender, accountant, software_provider
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Visitor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    page_visited = db.Column(db.String(200))
    referrer = db.Column(db.String(500))
    visited_at = db.Column(db.DateTime, default=datetime.utcnow)


# Decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('Admin access required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


# Track visitors middleware
@app.before_request
def track_visitor():
    # Skip tracking for static files and API endpoints
    if request.path.startswith('/static') or request.path.startswith('/api'):
        return
    if request.path in ['/favicon.ico', '/robots.txt']:
        return

    visitor = Visitor(
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500],
        page_visited=request.path,
        referrer=request.referrer[:500] if request.referrer else None
    )
    db.session.add(visitor)
    try:
        db.session.commit()
    except:
        db.session.rollback()


# Routes
@app.route('/')
def index():
    return app.send_static_file('index8.html')


@app.route('/cz')
def index_cz():
    return app.send_static_file('index8-cz.html')


@app.route('/waitlist/sme')
def waitlist_sme():
    return render_template('waitlist_sme.html')


@app.route('/waitlist/partner')
def waitlist_partner():
    return render_template('waitlist_partner.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not email or not password:
            flash('Email and password are required.', 'error')
            return redirect(url_for('signup'))

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return redirect(url_for('signup'))

        if len(password) < 8:
            flash('Password must be at least 8 characters.', 'error')
            return redirect(url_for('signup'))

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered.', 'error')
            return redirect(url_for('signup'))

        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin
            flash('Logged in successfully!', 'success')
            if user.is_admin:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('dashboard'))

        flash('Invalid email or password.', 'error')
        return redirect(url_for('login'))

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('index'))


@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)


@app.route('/admin')
@admin_required
def admin_dashboard():
    # Get statistics
    total_visitors = Visitor.query.count()
    today = datetime.utcnow().date()
    today_visitors = Visitor.query.filter(
        db.func.date(Visitor.visited_at) == today
    ).count()

    sme_signups = WaitingListSME.query.count()
    partner_signups = WaitingListPartner.query.count()
    total_users = User.query.count()

    # Get recent data
    recent_visitors = Visitor.query.order_by(Visitor.visited_at.desc()).limit(50).all()
    recent_sme = WaitingListSME.query.order_by(WaitingListSME.created_at.desc()).limit(20).all()
    recent_partners = WaitingListPartner.query.order_by(WaitingListPartner.created_at.desc()).limit(20).all()

    return render_template('admin.html',
        total_visitors=total_visitors,
        today_visitors=today_visitors,
        sme_signups=sme_signups,
        partner_signups=partner_signups,
        total_users=total_users,
        recent_visitors=recent_visitors,
        recent_sme=recent_sme,
        recent_partners=recent_partners
    )


# API Endpoints for waiting lists
@app.route('/api/waitlist/sme', methods=['POST'])
def api_waitlist_sme():
    data = request.get_json() if request.is_json else request.form

    company_name = data.get('company_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    accounting_software = data.get('accounting_software', '').strip()
    message = data.get('message', '').strip()

    if not company_name or not email:
        return jsonify({'success': False, 'message': 'Company name and email are required.'}), 400

    existing = WaitingListSME.query.filter_by(email=email).first()
    if existing:
        return jsonify({'success': False, 'message': 'This email is already on the waiting list.'}), 400

    entry = WaitingListSME(
        company_name=company_name,
        email=email,
        phone=phone,
        accounting_software=accounting_software,
        message=message
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Successfully added to the waiting list!'})


@app.route('/api/waitlist/partner', methods=['POST'])
def api_waitlist_partner():
    data = request.get_json() if request.is_json else request.form

    company_name = data.get('company_name', '').strip()
    contact_name = data.get('contact_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    partner_type = data.get('partner_type', '').strip()
    message = data.get('message', '').strip()

    if not company_name or not email:
        return jsonify({'success': False, 'message': 'Company name and email are required.'}), 400

    existing = WaitingListPartner.query.filter_by(email=email).first()
    if existing:
        return jsonify({'success': False, 'message': 'This email is already on the partner waiting list.'}), 400

    entry = WaitingListPartner(
        company_name=company_name,
        contact_name=contact_name,
        email=email,
        phone=phone,
        partner_type=partner_type,
        message=message
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Successfully added to the partner waiting list!'})


# Initialize database and create admin user
def init_db():
    with app.app_context():
        db.create_all()
        # Create default admin if not exists
        admin = User.query.filter_by(email='admin@lenduck.com').first()
        if not admin:
            admin = User(email='admin@lenduck.com', is_admin=True)
            admin.set_password('admin123')  # Change this in production!
            db.session.add(admin)
            db.session.commit()
            print('Default admin created: admin@lenduck.com / admin123')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
