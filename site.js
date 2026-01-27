
// Hide navigation on scroll
let lastScrollTop = 0;
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        nav.classList.add('nav-hidden');
    } else {
        // Scrolling up
        nav.classList.remove('nav-hidden');
    }

    lastScrollTop = scrollTop;
});

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.getElementById('navLinks');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${isError
                ? '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>'
                : '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'}
        </svg>
        ${message}
    `;
    toast.style.background = isError ? '#c44536' : '#2d5a3d';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Business form submission (SME waiting list)
const businessForm = document.getElementById('business-form');
if (businessForm) {
    businessForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = this.querySelector('input[name="email"]').value;

        try {
            const response = await fetch('/api/waitlist/sme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: 'From website',
                    email: email
                })
            });
            const data = await response.json();

            if (data.success) {
                showToast('Thanks! We\'ll be in touch soon.');
                this.querySelector('input').value = '';
            } else {
                showToast(data.message || 'Something went wrong.', true);
            }
        } catch (error) {
            showToast('Network error. Please try again.', true);
        }
    });
}

// Lender form submission (Partner waiting list)
const lenderForm = document.getElementById('lender-form');
if (lenderForm) {
    lenderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = this.querySelector('input[name="email"]').value;

        try {
            const response = await fetch('/api/waitlist/partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: 'From website',
                    email: email,
                    partner_type: 'lender'
                })
            });
            const data = await response.json();

            if (data.success) {
                showToast('Thanks! We\'ll reach out within 24 hours.');
                this.querySelector('input').value = '';
            } else {
                showToast(data.message || 'Something went wrong.', true);
            }
        } catch (error) {
            showToast('Network error. Please try again.', true);
        }
    });
}

// Partner form submission (Pricing section)
const partnerForm = document.getElementById('partner-form');
if (partnerForm) {
    partnerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const company = this.querySelector('input[name="company_name"]').value;
        const email = this.querySelector('input[name="email"]').value;

        try {
            const response = await fetch('/api/waitlist/partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: company,
                    email: email,
                    partner_type: 'enterprise'
                })
            });
            const data = await response.json();

            if (data.success) {
                showToast('Thanks! We\'ll be in touch soon.');
                this.querySelectorAll('input').forEach(input => input.value = '');
            } else {
                showToast(data.message || 'Something went wrong.', true);
            }
        } catch (error) {
            showToast('Network error. Please try again.', true);
        }
    });
}

// FAQ Collapsible
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        const faqItem = this.parentElement;
        const wasActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        // Open clicked item if it wasn't already open
        if (!wasActive) {
            faqItem.classList.add('active');
        }
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Nav background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 4px 20px rgba(45, 90, 61, 0.08)';
    } else {
        nav.style.boxShadow = 'none';
    }
});