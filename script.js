// ===== NAV SCROLL =====
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.pageYOffset > 60);
});

// ===== HERO SLIDESHOW =====
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const totalSlides = slides.length;

function showNextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % totalSlides;
  slides[currentSlide].classList.add('active');
}

if (slides.length > 0) {
  setInterval(showNextSlide, 8000); // Change image every 8 seconds
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    }
  });
});

// ===== MOBILE MENU =====
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  menuToggle.classList.toggle('open');
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  menuToggle.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
    closeMobileMenu();
  }
});

// ===== LOCATION CARDS =====
document.querySelectorAll('.location-card').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    const name = card.querySelector('.location-name').textContent;
    alert(`Directions to ${name} — Add your Google Maps link here.`);
  });
});

// ===== BOOKING MODAL =====
const EDGE_FUNCTION_URL = "https://ylbuxylvvqkvvrsxflbc.supabase.co/functions/v1/create-customer-booking";

const ITEMS = [
  { name: "T-Shirt / Polo", price: 900 },
  { name: "Shirt (Long/Short Sleeve)", price: 1300 },
  { name: "Trousers / Jeans", price: 1200 },
  { name: "Native (Senator/2pc)", price: 2200 },
  { name: "Agbada (3-Piece)", price: 3500 },
  { name: "Bedsheet (Double)", price: 1800 },
  { name: "Suit (2-Piece)", price: 3000 },
  { name: "Blazer / Jacket", price: 1800 },
  { name: "Kaftan / Jalabiya", price: 2500 },
  { name: "Evening Gown", price: 3500 },
  { name: "Duvet (Large)", price: 4000 },
  { name: "Tie / Scarf", price: 500 },
];

let quantities = new Array(ITEMS.length).fill(0);

function openBookingModal() {
  quantities = new Array(ITEMS.length).fill(0);
  renderItems();
  updateTotal();
  showStep(1);
  ['b-name', 'b-phone', 'b-address', 'b-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('b-date').value = '';
  document.getElementById('b-error').style.display = 'none';
  document.getElementById('booking-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('b-date').min = tomorrow.toISOString().split('T')[0];
}

function closeBookingModal() {
  document.getElementById('booking-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function showStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`step-${i}`).style.display = i === n ? 'block' : 'none';
  });
  const titles = { 1: 'Select your items', 2: 'Your details', 3: 'All done' };
  document.getElementById('modal-step-title').textContent = titles[n];
}

function renderItems() {
  const list = document.getElementById('items-list');
  list.innerHTML = ITEMS.map((item, i) => `
    <div class="item-row ${quantities[i] > 0 ? 'has-qty' : ''}">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">₦${item.price.toLocaleString()} each</div>
      </div>
      <div class="item-controls">
        <button class="qty-btn" onclick="changeQty(${i}, -1)">−</button>
        <span class="qty-num">${quantities[i]}</span>
        <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
      </div>
    </div>
  `).join('');
}

function changeQty(index, delta) {
  quantities[index] = Math.max(0, quantities[index] + delta);
  renderItems();
  updateTotal();
}

function updateTotal() {
  const total = ITEMS.reduce((sum, item, i) => sum + item.price * quantities[i], 0);
  document.getElementById('booking-total').textContent = '₦' + total.toLocaleString();
}

function goToStep2() {
  const total = ITEMS.reduce((sum, item, i) => sum + item.price * quantities[i], 0);
  if (total === 0) {
    alert('Please select at least one item.');
    return;
  }
  showStep(2);
}

function goToStep1() {
  showStep(1);
}

async function submitBooking() {
  if (document.getElementById('hp-field').value !== '') return;

  const name = document.getElementById('b-name').value.trim();
  const phone = document.getElementById('b-phone').value.trim();
  const address = document.getElementById('b-address').value.trim();
  const date = document.getElementById('b-date').value;
  const notes = document.getElementById('b-notes').value.trim();
  const errorDiv = document.getElementById('b-error');

  errorDiv.style.display = 'none';

  if (!name || !phone || !address || !date) {
    errorDiv.textContent = 'Please fill in all required fields.';
    errorDiv.style.display = 'block';
    return;
  }

  const selectedItems = ITEMS
    .map((item, i) => ({ name: item.name, qty: quantities[i], price: item.price }))
    .filter(item => item.qty > 0);

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name,
        customer_whatsapp: phone,
        pickup_date: date,
        pickup_address: address,
        items: selectedItems,
        notes: notes || null,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showStep(3);
      document.getElementById('success-message').textContent =
        `Booking received, ${name}. We'll reach out to you on ${phone} to confirm your pickup.`;
    } else {
      errorDiv.textContent = data.error || 'Something went wrong. Please try again.';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error. Please check your connection.';
    errorDiv.style.display = 'block';
  } finally {
    btn.textContent = 'Book Pickup';
    btn.disabled = false;
  }
}

// Close on backdrop click
document.getElementById('booking-modal').addEventListener('click', function(e) {
  if (e.target === this) closeBookingModal();
});

// ===== INTERSECTION OBSERVER =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.service-card, .location-card, .step, .price-col').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});