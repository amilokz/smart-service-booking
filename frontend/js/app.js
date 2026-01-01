// frontend/js/app.js
// ============================================
// Main Application JavaScript
// Handles: Authentication, Navigation, UI Interactions
// ============================================

// Application State
const AppState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
};

// ============================================
// 1. AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            AppState.user = userData;
            AppState.isAuthenticated = true;
            return userData;
        } else {
            AppState.user = null;
            AppState.isAuthenticated = false;
            return null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        AppState.user = null;
        AppState.isAuthenticated = false;
        return null;
    }
}

/**
 * Update UI based on authentication state
 */
async function updateAuthUI() {
    const authButtons = document.querySelector('.navbar-auth-buttons');
    const userMenu = document.querySelector('.navbar-user-menu');
    const protectedLinks = document.querySelectorAll('.protected-link');
    
    if (authButtons) {
        if (AppState.isAuthenticated && AppState.user) {
            // User is logged in
            authButtons.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle d-flex align-items-center" 
                            type="button" id="userDropdown" data-bs-toggle="dropdown" 
                            aria-expanded="false">
                        <i class="fas fa-user-circle me-2"></i>
                        <span class="d-none d-md-inline">${AppState.user.name || AppState.user.email.split('@')[0]}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="/dashboard"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                        <li><a class="dropdown-item" href="/profile"><i class="fas fa-user me-2"></i>Profile</a></li>
                        <li><a class="dropdown-item" href="/booking-history"><i class="fas fa-history me-2"></i>Booking History</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="/logout" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
            
            // Initialize dropdown
            new bootstrap.Dropdown(document.getElementById('userDropdown'));
            
            // Add logout handler
            document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
        } else {
            // User is not logged in
            authButtons.innerHTML = `
                <div class="d-flex gap-2">
                    <a href="/login" class="btn btn-outline-light">Login</a>
                    <a href="/register" class="btn btn-primary">Sign Up Free</a>
                </div>
            `;
        }
    }
    
    // Update protected links
    protectedLinks.forEach(link => {
        if (link.dataset.href) {
            link.href = AppState.isAuthenticated ? link.dataset.href : '/login';
            
            if (!AppState.isAuthenticated) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    showToast('Please login to access this page', 'info');
                    setTimeout(() => window.location.href = '/login', 1500);
                });
            }
        }
    });
}

/**
 * Handle logout
 */
async function handleLogout(e) {
    if (e) e.preventDefault();
    
    try {
        const response = await fetch('/logout', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            AppState.user = null;
            AppState.isAuthenticated = false;
            
            showToast('Logged out successfully', 'success');
            
            // Redirect based on current page
            setTimeout(() => {
                if (window.location.pathname.includes('dashboard') || 
                    window.location.pathname.includes('profile') ||
                    window.location.pathname.includes('booking')) {
                    window.location.href = '/';
                } else {
                    window.location.reload();
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Logout failed:', error);
        showToast('Logout failed. Please try again.', 'error');
    }
}

// ============================================
// 2. NAVIGATION & UI FUNCTIONS
// ============================================

/**
 * Initialize AOS animations
 */
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            disable: window.innerWidth < 768,
            mirror: false
        });
    }
}

/**
 * Navbar scroll effect
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    const scrollThreshold = 50;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScroll > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show on scroll direction (optional)
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

/**
 * Smooth scrolling for anchor links
 */
function initSmoothScroll() {
    document.addEventListener('click', function(e) {
        // Check if clicked element is an anchor link or inside one
        const anchor = e.target.closest('a[href^="#"]');
        
        if (anchor && anchor.getAttribute('href') !== '#') {
            e.preventDefault();
            
            const targetId = anchor.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - navbarHeight - 20,
                    behavior: 'smooth'
                });
                
                // Update URL without page reload
                history.pushState(null, null, targetId);
                
                // Update active nav link
                updateActiveNavLink(targetId);
                
                // Close mobile navbar if open
                closeMobileNavbar();
            }
        }
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', debounce(function() {
        const sections = document.querySelectorAll('section[id]');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const scrollPosition = window.scrollY + 100;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = '#' + section.getAttribute('id');
            }
        });
        
        if (currentSection) {
            updateActiveNavLink(currentSection);
        }
    }, 100));
}

/**
 * Update active navigation link
 */
function updateActiveNavLink(targetId) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

/**
 * Close mobile navbar
 */
function closeMobileNavbar() {
    const navbarCollapse = document.querySelector('.navbar-collapse.show');
    if (navbarCollapse) {
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        }
    }
}

// ============================================
// 3. SERVICE CARD INTERACTIONS
// ============================================

/**
 * Initialize service card interactions
 */
function initServiceCards() {
    document.querySelectorAll('.service-card').forEach(card => {
        // Click handler
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on button inside
            if (e.target.closest('button')) return;
            
            if (AppState.isAuthenticated) {
                window.location.href = '/booking?service=' + (this.dataset.serviceId || '1');
            } else {
                showToast('Please login to book a service', 'info');
                setTimeout(() => window.location.href = '/login', 1500);
            }
        });
        
        // Keyboard support
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Focus styles
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--primary)';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
        
        // Book now button handler
        const bookBtn = card.querySelector('.btn-primary');
        if (bookBtn) {
            bookBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                
                if (AppState.isAuthenticated) {
                    const serviceId = card.dataset.serviceId || '1';
                    window.location.href = '/booking?service=' + serviceId;
                } else {
                    showToast('Please login to book a service', 'info');
                    setTimeout(() => window.location.href = '/login', 1500);
                }
            });
        }
    });
}

// ============================================
// 4. BUTTON HANDLERS
// ============================================

/**
 * Initialize all button handlers
 */
function initButtonHandlers() {
    // Get Started buttons
    document.querySelectorAll('.btn-primary[href="#register"], .btn-primary[href*="register"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#register') {
                e.preventDefault();
                window.location.href = '/register';
            }
        });
    });
    
    // Login buttons
    document.querySelectorAll('.btn-secondary[href="#login"], .btn-secondary[href*="login"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#login') {
                e.preventDefault();
                window.location.href = '/login';
            }
        });
    });
    
    // Explore Services buttons
    document.querySelectorAll('.btn-outline-light[href="#services"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const servicesSection = document.getElementById('services');
            if (servicesSection) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = servicesSection.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // CTA buttons in footer
    document.querySelectorAll('.cta .btn-primary, .cta .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#register' || href === '#login') {
                e.preventDefault();
                window.location.href = href.replace('#', '/');
            }
        });
    });
}

// ============================================
// 5. UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Remove toast after hide
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

/**
 * Load components dynamically
 */
async function loadComponents() {
    try {
        // Load navbar if container exists
        const navbarContainer = document.getElementById('navbar-container');
        if (navbarContainer) {
            const response = await fetch('../components/navbar.html');
            if (response.ok) {
                navbarContainer.innerHTML = await response.text();
            }
        }
        
        // Load footer if container exists
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            const response = await fetch('../components/footer.html');
            if (response.ok) {
                footerContainer.innerHTML = await response.text();
                
                // Update current year in footer
                const yearElement = footerContainer.querySelector('#current-year');
                if (yearElement) {
                    yearElement.textContent = new Date().getFullYear();
                }
            }
        }
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// ============================================
// 6. PAGE-SPECIFIC FUNCTIONS
// ============================================

/**
 * Initialize page-specific features
 */
function initPageFeatures() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
        case '':
        case '/':
            initHomePage();
            break;
        case 'dashboard.html':
            initDashboardPage();
            break;
        case 'services.html':
            initServicesPage();
            break;
        case 'booking.html':
            initBookingPage();
            break;
        case 'booking-history.html':
            initBookingHistoryPage();
            break;
        case 'profile.html':
            initProfilePage();
            break;
    }
}

function initHomePage() {
    // Parallax effect for hero 3D model
    const hero3d = document.querySelector('.hero-3d');
    if (hero3d && window.innerWidth > 992) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.15;
            hero3d.style.transform = `translateY(calc(-50% + ${rate}px))`;
        });
    }
    
    // Hero stats animation
    const stats = document.querySelectorAll('.hero-stat-number');
    stats.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (!isNaN(finalValue)) {
            animateCounter(stat, finalValue);
        }
    });
}

function animateCounter(element, finalValue, duration = 2000) {
    let startValue = 0;
    const increment = finalValue / (duration / 16); // 60fps
    const timer = setInterval(() => {
        startValue += increment;
        if (startValue >= finalValue) {
            element.textContent = finalValue + (element.textContent.includes('+') ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(startValue) + (element.textContent.includes('+') ? '+' : '');
        }
    }, 16);
}

function initDashboardPage() {
    // Dashboard specific initialization
    console.log('Dashboard page initialized');
}

function initServicesPage() {
    // Services page initialization
    console.log('Services page initialized');
}

function initBookingPage() {
    // Booking page initialization
    console.log('Booking page initialized');
}

function initBookingHistoryPage() {
    // Booking history page initialization
    console.log('Booking history page initialized');
}

function initProfilePage() {
    // Profile page initialization
    console.log('Profile page initialized');
}

// ============================================
// 7. PERFORMANCE OPTIMIZATION
// ============================================

/**
 * Initialize performance optimizations
 */
function initPerformance() {
    // Reduce animations on low-end devices
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
        document.querySelectorAll('.floating').forEach(el => {
            el.style.animation = 'none';
        });
    }
    
    // Lazy load iframes
    const iframe = document.querySelector('.hero-3d iframe');
    if (iframe && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const src = iframe.dataset.src || iframe.src;
                    if (src && iframe.src !== src) {
                        iframe.src = src;
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(iframe);
    }
    
    // Error handling for iframe
    if (iframe) {
        iframe.addEventListener('error', function() {
            console.log('3D model failed to load');
            const hero3d = this.closest('.hero-3d');
            if (hero3d) {
                hero3d.innerHTML = `
                    <div class="loading" style="background: rgba(0,0,0,0.5); border-radius: var(--border-radius-lg);">
                        <p style="color: white; margin-top: 1rem;">3D Model Loading...</p>
                    </div>
                `;
            }
        });
    }
}

// ============================================
// 8. MAIN INITIALIZATION
// ============================================

/**
 * Initialize the entire application
 */
async function initApp() {
    try {
        // Show loading state
        AppState.isLoading = true;
        
        // Load components first
        await loadComponents();
        
        // Check authentication
        await checkAuthStatus();
        
        // Initialize all features
        initAOS();
        initNavbarScroll();
        initSmoothScroll();
        initServiceCards();
        initButtonHandlers();
        initPageFeatures();
        initPerformance();
        
        // Update UI based on auth state
        await updateAuthUI();
        
        // Hide loading state
        AppState.isLoading = false;
        
        // Performance monitoring
        window.addEventListener('load', function() {
            const loadTime = performance.now();
            if (loadTime > 3000) {
                console.log('Page loaded in', Math.round(loadTime), 'ms');
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load application. Please refresh.', 'error');
    }
}

// ============================================
// 9. EVENT LISTENERS & STARTUP
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        checkAuthStatus,
        updateAuthUI,
        handleLogout,
        showToast
    };
}