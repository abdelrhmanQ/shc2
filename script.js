/**
 * Animated Navbar Controller
 * Handles scroll behavior, mobile menu, and dark mode toggle
 */

class NavbarController {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('nav-menu');
        this.hamburger = document.getElementById('hamburger');
        this.themeToggle = document.getElementById('theme-toggle');
        
        this.scrollThreshold = 100;
        this.isScrolled = false;
        this.isMobileMenuOpen = false;
        
        this.init();
    }

    init() {
        // Set initial scroll state
        this.handleScroll();
        
        // Add event listeners
        this.addEventListeners();
        
        // Set initial ARIA attributes
        this.updateAriaAttributes();
    }

    addEventListeners() {
        // Throttled scroll event
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 80));
        
        // Mobile menu toggle
        this.hamburger.addEventListener('click', this.toggleMobileMenu.bind(this));
        
        // Dark mode toggle
        this.themeToggle.addEventListener('click', this.toggleDarkMode.bind(this));
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', this.handleClickOutside.bind(this));
        
        // Close mobile menu on escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Handle resize for responsive behavior
        window.addEventListener('resize', this.throttle(this.handleResize.bind(this), 100));
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const shouldBeScrolled = scrollY > this.scrollThreshold;

        if (shouldBeScrolled !== this.isScrolled) {
            this.isScrolled = shouldBeScrolled;
            this.updateNavbarState();
        }
    }

    updateNavbarState() {
        if (this.isScrolled) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
            // Close mobile menu when returning to top on mobile
            if (window.innerWidth <= 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        }
    }

    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.navMenu.classList.add('active');
        this.hamburger.classList.add('active');
        this.hamburger.setAttribute('aria-expanded', 'true');
        this.isMobileMenuOpen = true;
    }

    closeMobileMenu() {
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
        this.hamburger.setAttribute('aria-expanded', 'false');
        this.isMobileMenuOpen = false;
    }

    toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark');
        
        // Save preference to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update ARIA label for theme toggle
        this.themeToggle.setAttribute('aria-label', 
            `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }

    handleClickOutside(event) {
        // Close mobile menu if click is outside
        if (this.isMobileMenuOpen && 
            !this.hamburger.contains(event.target) && 
            !this.navMenu.contains(event.target)) {
            this.closeMobileMenu();
        }
    }

    handleKeydown(event) {
        // Close mobile menu on Escape key
        if (event.key === 'Escape' && this.isMobileMenuOpen) {
            this.closeMobileMenu();
            this.hamburger.focus();
        }
    }

    handleResize() {
        // Close mobile menu when switching to desktop
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    updateAriaAttributes() {
        // Set initial ARIA attributes
        this.hamburger.setAttribute('aria-expanded', 'false');
        this.hamburger.setAttribute('aria-controls', 'nav-menu');
        
        const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
        this.themeToggle.setAttribute('aria-label', 
            `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`);
    }

    /**
     * Throttle function to limit how often a function can be called
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * Load saved theme preference from localStorage
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark');
        }
    }
}

/**
 * Hero Carousel Controller
 * Handles slide navigation, touch/swipe, and animations
 */
class HeroCarousel {
    constructor() {
        this.slides = document.getElementById('hero-slides');
        this.slideElements = document.querySelectorAll('.hero-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        this.currentSlide = 0;
        this.totalSlides = this.slideElements.length;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        
        this.init();
    }

    init() {
        // Add event listeners
        this.addEventListeners();
        
        // Start autoplay
        this.startAutoPlay();
        
        // Update ARIA attributes
        this.updateAriaAttributes();
    }

    addEventListeners() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Indicator clicks
        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
        
        // Touch/swipe support
        this.addSwipeSupport();
        
        // Pause autoplay on hover
        this.slides.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.slides.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Pause autoplay when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoPlay();
            } else {
                this.startAutoPlay();
            }
        });
    }

    addSwipeSupport() {
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50;

        this.slides.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.slides.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX, swipeThreshold);
        }, { passive: true });
    }

    handleSwipe(startX, endX, threshold) {
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide(); // Swipe left
            } else {
                this.prevSlide(); // Swipe right
            }
        }
    }

    nextSlide() {
        if (this.isAnimating) return;
        
        const nextSlide = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextSlide);
    }

    prevSlide() {
        if (this.isAnimating) return;
        
        const prevSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevSlide);
    }

    goToSlide(slideIndex) {
        if (this.isAnimating || slideIndex === this.currentSlide) return;
        
        this.isAnimating = true;
        
        // Reset animation classes
        this.slideElements.forEach(slide => {
            slide.classList.remove('active', 'prev');
        });
        
        this.indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Update current slide
        const previousSlide = this.currentSlide;
        this.currentSlide = slideIndex;
        
        // Add animation classes
        this.slideElements[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
        
        // Add prev class for directional animation
        if (slideIndex < previousSlide) {
            this.slideElements[this.currentSlide].classList.add('prev');
        }
        
        // Update ARIA attributes
        this.updateAriaAttributes();
        
        // Reset animation flag
        setTimeout(() => {
            this.isAnimating = false;
        }, 600); // Match CSS transition duration
    }

    startAutoPlay() {
        this.stopAutoPlay(); // Clear existing interval
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    updateAriaAttributes() {
        // Update slide ARIA attributes
        this.slideElements.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index !== this.currentSlide);
            slide.setAttribute('aria-label', `Slide ${index + 1} of ${this.totalSlides}`);
        });
        
        // Update indicator ARIA attributes
        this.indicators.forEach((indicator, index) => {
            indicator.setAttribute('aria-current', index === this.currentSlide);
            indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        });
        
        // Update navigation button labels
        this.prevBtn.setAttribute('aria-label', 'Previous slide');
        this.nextBtn.setAttribute('aria-label', 'Next slide');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const navbar = new NavbarController();
    const heroCarousel = new HeroCarousel();
    
    navbar.loadThemePreference();
});

// Handle prefers-color-scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        document.body.classList.toggle('dark', e.matches);
    }
});

/**
 * Features Section Controller
 * Handles entrance animations and interactions for the features section
 */
class FeaturesSectionController {
    constructor() {
        this.featureButtons = document.querySelectorAll('.feature-btn');
        this.init();
    }

    init() {
        this.addEventListeners();
        this.setupIntersectionObserver();
    }

    addEventListeners() {
        // Add click handlers for feature buttons
        this.featureButtons.forEach(button => {
            button.addEventListener('click', this.handleFeatureClick.bind(this));
            
            // Enhanced focus management
            button.addEventListener('focus', this.handleFeatureFocus.bind(this));
            button.addEventListener('blur', this.handleFeatureBlur.bind(this));
        });
    }

    setupIntersectionObserver() {
        // Animate features section when it comes into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });

        const featuresSection = document.getElementById('features-section');
        if (featuresSection) {
            observer.observe(featuresSection);
        }
    }

    handleFeatureClick(event) {
        // Add ripple effect on click
        const button = event.currentTarget;
        this.createRippleEffect(button, event);
        
        // You can add additional click handling logic here
        console.log('Feature clicked:', button.querySelector('.feature-text').textContent);
    }

    handleFeatureFocus(event) {
        const button = event.currentTarget;
        button.style.zIndex = '10';
    }

    handleFeatureBlur(event) {
        const button = event.currentTarget;
        button.style.zIndex = '1';
    }

    createRippleEffect(button, event) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Add ripple animation to CSS
const rippleStyles = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Inject ripple styles
const styleSheet = document.createElement('style');
styleSheet.textContent = rippleStyles;
document.head.appendChild(styleSheet);

// Update the existing initialization to include features section
document.addEventListener('DOMContentLoaded', () => {
    const navbar = new NavbarController();
    const heroCarousel = new HeroCarousel();
    const featuresSection = new FeaturesSectionController();
    
    navbar.loadThemePreference();
});

/**
 * Footer Controller
 * Handles footer entrance animations and scroll behavior
 */
class FooterController {
    constructor() {
        this.footer = document.getElementById('footer');
        this.hasAnimated = false;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.addEventListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.animateFooter();
                    this.hasAnimated = true;
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px'
        });

        if (this.footer) {
            observer.observe(this.footer);
        }
    }

    animateFooter() {
        this.footer.classList.add('visible');
        
        // Add staggered animation to footer columns
        const columns = this.footer.querySelectorAll('.footer-column');
        columns.forEach((column, index) => {
            column.style.opacity = '0';
            column.style.transform = 'translateY(30px)';
            column.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${0.3 + index * 0.2}s`;
            
            setTimeout(() => {
                column.style.opacity = '1';
                column.style.transform = 'translateY(0)';
            }, 100);
        });

        // Animate contact items
        const contactItems = this.footer.querySelectorAll('.contact-item, .footer-address');
        contactItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${0.8 + index * 0.1}s`;
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 100);
        });
    }

    addEventListeners() {
        // Add click handlers for contact links
        const contactLinks = this.footer.querySelectorAll('.contact-link');
        contactLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Add ripple effect
                this.createRippleEffect(e.target);
                
                // Simulate actual link behavior after animation
                setTimeout(() => {
                    // Uncomment the line below to enable actual navigation
                    // window.location.href = link.href;
                    console.log('Contact link clicked:', link.href);
                }, 300);
            });
        });
    }

    createRippleEffect(element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = rect.left + rect.width / 2 - size / 2;
        const y = rect.top + rect.height / 2 - size / 2;

        ripple.style.cssText = `
            position: fixed;
            border-radius: 50%;
            background: rgba(0, 104, 181, 0.3);
            transform: scale(0);
            animation: contactRipple 0.6s ease-out;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 1000;
        `;

        document.body.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Add contact ripple animation to CSS
const contactRippleStyles = `
@keyframes contactRipple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;

// Inject contact ripple styles
const contactStyleSheet = document.createElement('style');
contactStyleSheet.textContent = contactRippleStyles;
document.head.appendChild(contactStyleSheet);

// Update the existing initialization to include footer
document.addEventListener('DOMContentLoaded', () => {
    const navbar = new NavbarController();
    const heroCarousel = new HeroCarousel();
    const featuresSection = new FeaturesSectionController();
    const footer = new FooterController();
    
    navbar.loadThemePreference();
});

/**
 * Advanced 3D Stats Controller
 * Handles counting animations with different behaviors for known/unknown numbers
 */
class AdvancedStats3DController {
    constructor() {
        this.statsSection = document.getElementById('stats-3d-section');
        this.statNumbers = document.querySelectorAll('.stat-3d-number');
        this.hasAnimated = false;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupTiltEffect();
        this.addEventListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.animateAllStats();
                    this.hasAnimated = true;
                }
            });
        }, { 
            threshold: 0.3,
            rootMargin: '100px'
        });

        if (this.statsSection) {
            observer.observe(this.statsSection);
        }
    }

    setupTiltEffect() {
        // Vanilla JS tilt effect for 3D cards
        this.statCards = document.querySelectorAll('.stat-3d-card');
        this.statCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                if (window.innerWidth > 768) {
                    this.tiltCard(e, card);
                }
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetTilt(card);
            });
        });
    }

    tiltCard(e, card) {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (mouseY / cardRect.height) * -10;
        const rotateY = (mouseX / cardRect.width) * 10;
        
        card.style.transform = `
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            translateZ(50px)
        `;
    }

    resetTilt(card) {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    }

    animateAllStats() {
        this.statNumbers.forEach((stat, index) => {
            const target = parseInt(stat.getAttribute('data-count'));
            const isKnown = stat.getAttribute('data-known') === 'true';
            
            setTimeout(() => {
                if (isKnown) {
                    this.animateKnownNumber(stat, target);
                } else {
                    this.animateUnknownNumber(stat, target);
                }
            }, index * 300);
        });
    }

    animateKnownNumber(element, target) {
        const duration = 2000;
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            const current = Math.round(target * easeOut);

            element.textContent = current.toLocaleString();
            element.classList.add('counting');

            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = target.toLocaleString();
                element.classList.remove('counting');
                element.classList.add('finalizing');
                
                setTimeout(() => {
                    element.classList.remove('finalizing');
                }, 500);
            }
        }, frameDuration);
    }

    animateUnknownNumber(element, target) {
        const duration = 3000; // Longer duration for unknown numbers
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        // Add random fluctuation for more realistic effect
        const randomFluctuation = () => Math.random() * 100 - 50;

        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            
            if (progress < 0.7) {
                // Random counting phase
                const randomValue = Math.round(target * progress + randomFluctuation());
                element.textContent = Math.max(0, randomValue).toLocaleString();
            } else {
                // Final approach phase
                const easeOut = 1 - Math.pow(1 - ((progress - 0.7) / 0.3), 3);
                const current = Math.round(target * easeOut);
                element.textContent = current.toLocaleString();
            }

            element.classList.add('counting');

            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = target.toLocaleString();
                element.classList.remove('counting');
                element.classList.add('finalizing');
                
                setTimeout(() => {
                    element.classList.remove('finalizing');
                }, 500);
            }
        }, frameDuration);
    }

    addEventListeners() {
        this.statCards.forEach(card => {
            card.addEventListener('click', this.handleCardClick.bind(this));
        });

        // Reset animation on section re-enter
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.hasAnimated) {
                setTimeout(() => {
                    this.animateAllStats();
                }, 1000);
            }
        });
    }

    handleCardClick(e) {
        const card = e.currentTarget;
        this.createRippleEffect(e);
        
        // Restart animation for clicked card
        const numberElement = card.querySelector('.stat-3d-number');
        const target = parseInt(numberElement.getAttribute('data-count'));
        const isKnown = numberElement.getAttribute('data-known') === 'true';
        
        if (isKnown) {
            this.animateKnownNumber(numberElement, target);
        } else {
            this.animateUnknownNumber(numberElement, target);
        }
    }

    createRippleEffect(e) {
        const card = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
            transform: scale(0);
            animation: ripple3d 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 100;
        `;

        card.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Add 3D ripple animation
const ripple3dStyles = `
@keyframes ripple3d {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

const rippleStyleSheet = document.createElement('style');
rippleStyleSheet.textContent = ripple3dStyles;
document.head.appendChild(rippleStyleSheet);

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    const advancedStats = new AdvancedStats3DController();
    const navbar = new NavbarController();
    const heroCarousel = new HeroCarousel();
    const featuresSection = new FeaturesSectionController();
    const footer = new FooterController();
    
    navbar.loadThemePreference();
});

/**
 * 3D Features Controller
 * Handles tilt effects and interactions for features section
 */
class Features3DController {
    constructor() {
        this.featureButtons = document.querySelectorAll('.feature-btn');
        this.featuresSection = document.getElementById('features-section');
        this.init();
    }

    init() {
        this.setupTiltEffect();
        this.setupIntersectionObserver();
        this.addEventListeners();
    }

    setupTiltEffect() {
        this.featureButtons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                if (window.innerWidth > 768) {
                    this.tiltFeature(e, button);
                }
            });
            
            button.addEventListener('mouseleave', () => {
                this.resetTilt(button);
            });
        });
    }

    tiltFeature(e, button) {
        const buttonRect = button.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (mouseY / buttonRect.height) * -8;
        const rotateY = (mouseX / buttonRect.width) * 8;
        
        button.style.transform = `
            translateY(-10px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            translateZ(30px)
        `;
    }

    resetTilt(button) {
        button.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });

        if (this.featuresSection) {
            observer.observe(this.featuresSection);
        }
    }

    addEventListeners() {
        this.featureButtons.forEach(button => {
            button.addEventListener('click', this.handleFeatureClick.bind(this));
            
            // Add focus management for accessibility
            button.addEventListener('focus', this.handleFeatureFocus.bind(this));
            button.addEventListener('blur', this.handleFeatureBlur.bind(this));
        });
    }

    handleFeatureClick(e) {
        e.preventDefault();
        const button = e.currentTarget;
        this.createRippleEffect(e);
        
        // Add active state
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 300);
        
        console.log('Feature clicked:', button.querySelector('.feature-text').textContent);
    }

    handleFeatureFocus(e) {
        const button = e.currentTarget;
        button.style.zIndex = '10';
    }

    handleFeatureBlur(e) {
        const button = e.currentTarget;
        button.style.zIndex = '1';
    }

    createRippleEffect(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
            transform: scale(0);
            animation: featureRipple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 100;
        `;

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Add feature ripple animation
const featureRippleStyles = `
@keyframes featureRipple {
    to {
        transform: scale(3);
        opacity: 0;
    }
}

.feature-btn.active .card-front {
    transform: scale(0.95);
    transition: transform 0.2s ease;
}
`;

const featureStyleSheet = document.createElement('style');
featureStyleSheet.textContent = featureRippleStyles;
document.head.appendChild(featureStyleSheet);

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    const advancedStats = new AdvancedStats3DController();
    const features3D = new Features3DController();
    const navbar = new NavbarController();
    const heroCarousel = new HeroCarousel();
    const footer = new FooterController();
    
    navbar.loadThemePreference();
});
// Auth integration for navigation
class AuthNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.updateNavigation();
        this.setupEventListeners();
    }

    updateNavigation() {
        const authManager = window.authManager;
        if (!authManager) return;

        const loginLink = document.getElementById('login-nav-link');
        const userMenu = document.getElementById('user-menu');
        const adminLink = document.getElementById('admin-link');

        if (authManager.currentUser) {
            if (loginLink) loginLink.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            
            // Show admin link if user is admin
            if (authManager.currentUser.role === 'admin' && adminLink) {
                adminLink.style.display = 'block';
            }
        } else {
            if (loginLink) loginLink.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.handleLogout();
                }
            });
        }
    }
}

// Initialize auth navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthNavigation();
});