// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            // Close mobile menu if open
            document.querySelector('.mobile-menu').classList.remove('active');
        }
    });
});

// ===== NAVBAR ON SCROLL =====
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ===== MOBILE MENU TOGGLE =====
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    
    // Animate hamburger icon
    const spans = menuToggle.querySelectorAll('span');
    if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translateY(10px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections for fade-in animation
document.querySelectorAll('.card, .pricing-card, .location-card, .feature-block').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== PRICING CARD INTERACTIONS =====
document.querySelectorAll('.pricing-card button').forEach(button => {
    button.addEventListener('click', function() {
        const plan = this.closest('.pricing-card').querySelector('h3').textContent;
        alert(`You selected the ${plan} plan! This would normally open a signup form or redirect to the app.`);
    });
});

// ===== LOCATION DIRECTIONS =====
document.querySelectorAll('.location-card button').forEach(button => {
    button.addEventListener('click', function() {
        const location = this.closest('.location-card').querySelector('h3').textContent;
        // In production, replace with actual Google Maps links
        alert(`Opening directions to ${location} location. In production, this would open Google Maps.`);
    });
});

// ===== APP DOWNLOAD BUTTONS =====
document.querySelectorAll('.store-button').forEach(button => {
    button.addEventListener('click', function() {
        const store = this.querySelector('strong').textContent;
        alert(`Redirecting to ${store}. In production, this would link to your app store page.`);
    });
});

// ===== FORM VALIDATION (if you add a contact form) =====
// Uncomment and customize if you add a contact form
/*
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.querySelector('#email').value;
        const name = document.querySelector('#name').value;
        const message = document.querySelector('#message').value;
        
        // Basic validation
        if (!email || !name || !message) {
            alert('Please fill all fields');
            return;
        }
        
        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email');
            return;
        }
        
        // Success message
        alert('Thank you! We will contact you soon.');
        contactForm.reset();
    });
}
*/

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('Premium Laundry website loaded successfully! 🧺✨');
