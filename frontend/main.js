// Global utilities and navigation functionality
class RetailAnalyticsApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Page navigation
        const menuItems = document.querySelectorAll('.menu-item');
        const pages = document.querySelectorAll('.page');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.getAttribute('data-page');
                this.navigateToPage(pageId);
                
                // Close sidebar on mobile after selection
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
        
        // Mobile menu toggle
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Toggle buttons
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const parent = this.closest('.toggle-buttons');
                if (parent) {
                    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                }
                this.classList.add('active');
            });
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !e.target.closest('.mobile-menu-btn')) {
                sidebar.classList.remove('active');
            }
        });
    }

    navigateToPage(pageId) {
        const menuItems = document.querySelectorAll('.menu-item');
        const pages = document.querySelectorAll('.page');
        
        // Update active menu item
        menuItems.forEach(i => i.classList.remove('active'));
        document.querySelector(`.menu-item[data-page="${pageId}"]`).classList.add('active');
        
        // Show corresponding page
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        
        // Update header title
        const headerTitle = document.querySelector('.header-left h1');
        if (headerTitle) {
            headerTitle.textContent = this.getPageTitle(pageId);
        }
        
        this.currentPage = pageId;
        
        // Trigger page change event for page-specific initialization
        this.onPageChange(pageId);
    }

    getPageTitle(pageId) {
        const titles = {
            'home': 'Business Overview',
            'customers': 'Customer Segmentation',
            'sales': 'Sales Analysis',
            'forecasts': 'Sales Forecast'
        };
        return titles[pageId] || 'Retail Analytics';
    }

    onPageChange(pageId) {
        // This method can be overridden by page-specific scripts
        console.log(`Navigated to page: ${pageId}`);
        
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts(pageId);
        }
    }

    // API Utility Functions
    async fetchData(endpoint, options = {}) {
        const baseURL = 'http://localhost:3000/api'; // Update with your backend URL
        const url = `${baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            this.showNotification('Error fetching data. Please try again.', 'error');
            throw error;
        }
    }

    async getKPIData() {
        return this.fetchData('/kpis');
    }

    async getCustomerSegmentation() {
        return this.fetchData('/customers/segmentation');
    }

    async getSalesData(timeframe = '30d') {
        return this.fetchData(`/sales?timeframe=${timeframe}`);
    }

    async getForecastData() {
        return this.fetchData('/forecasts');
    }

    // UI Utility Functions
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 1000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                }
                .notification-info { border-left: 4px solid var(--accent); }
                .notification-success { border-left: 4px solid #27ae60; }
                .notification-warning { border-left: 4px solid #f39c12; }
                .notification-error { border-left: 4px solid #e74c3c; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-light);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    formatPercentage(number) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(number / 100);
    }

    // Chart initialization (basic structure - to be extended per page)
    initializeCharts(pageId) {
        // This will be implemented in page-specific scripts
        // Each page can extend this method or provide its own chart initialization
    }

    // Loading state management
    showLoading(container) {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-spinner';
        loadingEl.innerHTML = `
            <div class="spinner"></div>
            <p>Loading data...</p>
        `;

        // Add styles if not already added
        if (!document.querySelector('#loading-styles')) {
            const styles = document.createElement('style');
            styles.id = 'loading-styles';
            styles.textContent = `
                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    color: var(--text-light);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--border);
                    border-left: 4px solid var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }

        container.appendChild(loadingEl);
        return loadingEl;
    }

    hideLoading(loadingEl) {
        if (loadingEl && loadingEl.parentNode) {
            loadingEl.parentNode.removeChild(loadingEl);
        }
    }
}

// Initialize the app when the script loads
const retailApp = new RetailAnalyticsApp();

// Make app globally available for page-specific scripts
window.retailApp = retailApp;