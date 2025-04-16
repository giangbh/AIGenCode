/**
 * Main App Class
 * Central controller that integrates all parts of the application
 */

import { ExpenseManager } from './controllers/ExpenseManager.js';
import { GroupFundManager } from './controllers/GroupFundManager.js';
import { MemberManager } from './controllers/MemberManager.js';
import { ExpenseUIController } from './controllers/ExpenseUIController.js';
import { FundUIController } from './controllers/FundUIController.js';
import { MemberUIController } from './controllers/MemberUIController.js';
import { ReportsUIController } from './controllers/ReportsUIController.js';
import { initializeStorage, clearAllData, supabase } from './utils/storage.js';
import { showMessage } from './utils/helpers.js';
import { initAuth, isLoggedIn, getLoggedInUser, isAdmin } from './utils/auth.js';

class App {
    /**
     * Create a new App instance
     */
    constructor() {
        // Default application data
        this.defaultMembers = ["Giang", "Quân", "Toàn", "Quang", "Trung", "Nhật"];
        this.defaultBankAccounts = { 
            "Giang": "8862632015", 
            "Quân": "8765432109", 
            "Toàn": "1240067256", 
            "Quang": "6543210987", 
            "Trung": "5432109876", 
            "Nhật": "4321098765" 
        };
        
        // Supabase initialization status
        this.initialized = false;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize Supabase with default data
            await initializeStorage(this.defaultMembers, this.defaultBankAccounts);
            
            // Initialize managers
            this.memberManager = new MemberManager(this.defaultMembers, this.defaultBankAccounts);
            this.fundManager = new GroupFundManager();
            this.fundManager.setApp(this);
            this.expenseManager = new ExpenseManager(this.fundManager);
            
            // Wait for managers to load data
            await Promise.all([
                this.memberManager.loadData(),
                this.fundManager.loadData()
            ]);
            await this.expenseManager.loadData();
            
            // Make sure member balances are initialized
            this.fundManager.initializeMemberBalances(this.memberManager.getAllMembers());
            
            // Initialize UI controllers
            this.expenseUI = new ExpenseUIController(this);
            this.fundUI = new FundUIController(this);
            this.memberUI = new MemberUIController(this);
            this.reportsUI = new ReportsUIController(this);
            
            // Initialize Lucide icons
            lucide.createIcons();
            
            // Initialize UI components
            this.expenseUI.populateMembers();
            
            // Thiết lập nút làm mới dữ liệu
            this.setupRefreshButton();
            
            // Initialize authentication system
            initAuth();
            
            // Setup the clear all data button
            this.setupClearAllDataButton();
            
            // Render all components
            await this.renderAll();
            
            // Mark as initialized
            this.initialized = true;
            console.log('Ứng dụng đã khởi tạo thành công với Supabase');
        } catch (error) {
            console.error('Lỗi khi khởi tạo ứng dụng:', error);
            this._showInitError(error.message);
        }
    }
    
    /**
     * Render all UI components
     */
    async renderAll() {
        try {
            // Đảm bảo dữ liệu được tải lại từ Supabase
            await Promise.all([
                this.memberManager.loadData(),
                this.fundManager.loadData()
            ]);
            await this.expenseManager.loadData();
            
            // Cập nhật giao diện với dữ liệu mới
            this.renderExpenses();
            this.renderGroupFund();
            this.renderMembers();
            this.renderReports();
            
            // Calculate and render expense results
            const members = this.memberManager.getAllMembers();
            const results = this.expenseManager.calculateResults(members);
            this.expenseUI.renderResults(results);
        } catch (error) {
            console.error('Lỗi khi làm mới giao diện:', error);
            // Thử render với dữ liệu hiện có
            this.renderExpenses();
            this.renderGroupFund();
            this.renderMembers();
        }
    }
    
    /**
     * Render expense-related UI
     */
    renderExpenses() {
        this.expenseUI.renderExpenseList();
    }
    
    /**
     * Render group fund UI
     */
    renderGroupFund() {
        this.fundUI.renderFundStatus();
        this.fundUI.renderFundTransactions();
    }
    
    /**
     * Render members UI
     */
    renderMembers() {
        this.memberUI.renderMembers();
    }
    
    /**
     * Render reports UI
     */
    renderReports() {
        // If we're on the reports tab, initialize the reports UI
        const reportsTab = document.querySelector('.tab-button[data-tab="reports"]');
        if (reportsTab && reportsTab.classList.contains('active')) {
            this.reportsUI.populateMemberSelect();
        }
    }
    
    /**
     * Handle editing a member's bank account
     * @param {string} member - The member to edit
     */
    handleEditMember(member) {
        this.memberUI.handleEditMember(member);
    }
    
    /**
     * Clear all application data
     */
    async clearAllData() {
        clearAllData();
        this.expenseManager = new ExpenseManager(this.fundManager);
        await this.fundManager.clearAllData();
        await this.renderAll();
    }
    
    /**
     * Display initialization error message
     * @private
     * @param {string} message - Error message
     */
    _showInitError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
        
        const errorBox = document.createElement('div');
        errorBox.className = 'bg-white p-6 rounded-lg shadow-lg max-w-lg w-full';
        
        const title = document.createElement('h2');
        title.className = 'text-xl font-bold text-red-600 mb-4';
        title.textContent = 'Lỗi kết nối Supabase';
        
        const content = document.createElement('p');
        content.className = 'mb-4';
        content.textContent = `Không thể kết nối đến cơ sở dữ liệu Supabase. Vui lòng kiểm tra cấu hình và kết nối internet. Chi tiết lỗi: ${message}`;
        
        const hint = document.createElement('p');
        hint.className = 'text-sm text-gray-600 mb-4';
        hint.textContent = 'Bạn cần cập nhật thông tin kết nối Supabase trong file js/utils/supabase.js';
        
        const button = document.createElement('button');
        button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
        button.textContent = 'Đóng';
        button.onclick = () => errorContainer.remove();
        
        errorBox.appendChild(title);
        errorBox.appendChild(content);
        errorBox.appendChild(hint);
        errorBox.appendChild(button);
        errorContainer.appendChild(errorBox);
        
        document.body.appendChild(errorContainer);
    }
    
    /**
     * Get status of Supabase connectivity
     * @returns {boolean} True if connected successfully
     */
    isConnected() {
        return this.initialized;
    }

    /**
     * Thiết lập nút làm mới dữ liệu
     */
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (!refreshBtn) return;
        
        // Lưu trữ nội dung gốc của nút để khôi phục sau khi hoàn tất
        const originalContent = refreshBtn.innerHTML;
        
        // Thêm hiệu ứng ripple khi click
        refreshBtn.addEventListener('click', async (e) => {
            try {
                // Prevent multiple clicks
                if (refreshBtn.disabled) return;
                
                // Add ripple effect
                const rect = refreshBtn.getBoundingClientRect();
                const rippleX = e.clientX - rect.left;
                const rippleY = e.clientY - rect.top;
                
                // Activate ripple effect
                const ripple = refreshBtn.querySelector('.refresh-ripple');
                if (ripple) {
                    ripple.style.left = `${rippleX}px`;
                    ripple.style.top = `${rippleY}px`;
                    refreshBtn.classList.add('clicked');
                    
                    // Remove the clicked class after animation completes
                    setTimeout(() => {
                        refreshBtn.classList.remove('clicked');
                    }, 600);
                }
                
                // Disable button and show loading state
                refreshBtn.disabled = true;
                refreshBtn.classList.remove('success', 'error');
                refreshBtn.classList.add('loading');
                
                // Update button content for loading state
                const isSmallScreen = window.innerWidth < 640;
                refreshBtn.querySelector('div').innerHTML = `
                    <i data-lucide="loader-2" class="w-4 h-4 mr-1.5"></i>
                    ${isSmallScreen ? '' : '<span class="hidden sm:inline">Đang tải...</span>'}
                `;
                
                // Initialize icon
                lucide.createIcons({
                    scope: refreshBtn
                });
                
                // Làm mới dữ liệu từ Supabase
                await Promise.all([
                    this.memberManager.loadData(),
                    this.fundManager.loadData()
                ]);
                await this.expenseManager.loadData();
                
                // Cập nhật giao diện
                await this.renderAll();
                
                // Thông báo thành công
                showMessage('Dữ liệu đã được cập nhật từ Supabase', 'success');
                
                // Show success state
                refreshBtn.classList.remove('loading');
                refreshBtn.classList.add('success');
                
                // Update button content for success state
                refreshBtn.querySelector('div').innerHTML = `
                    <i data-lucide="check-circle" class="w-4 h-4 mr-1.5"></i>
                    ${isSmallScreen ? '' : '<span class="hidden sm:inline">Đã cập nhật</span>'}
                `;
                
                // Initialize success icon
                lucide.createIcons({
                    scope: refreshBtn
                });
                
                // Reset button after delay
                setTimeout(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.classList.remove('success');
                    refreshBtn.querySelector('div').innerHTML = `
                        <i data-lucide="refresh-cw" class="w-4 h-4 mr-1.5"></i>
                        <span class="hidden sm:inline">Làm mới</span>
                    `;
                    lucide.createIcons({
                        scope: refreshBtn
                    });
                }, 2000);
                
            } catch (error) {
                console.error('Lỗi khi làm mới dữ liệu:', error);
                showMessage('Lỗi khi làm mới dữ liệu', 'error');
                
                // Show error state
                refreshBtn.classList.remove('loading');
                refreshBtn.classList.add('error');
                
                // Update button content for error state
                const isSmallScreen = window.innerWidth < 640;
                refreshBtn.querySelector('div').innerHTML = `
                    <i data-lucide="alert-circle" class="w-4 h-4 mr-1.5"></i>
                    ${isSmallScreen ? '' : '<span class="hidden sm:inline">Thất bại</span>'}
                `;
                
                // Initialize error icon
                lucide.createIcons({
                    scope: refreshBtn
                });
                
                // Reset button after delay
                setTimeout(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.classList.remove('error');
                    refreshBtn.querySelector('div').innerHTML = `
                        <i data-lucide="refresh-cw" class="w-4 h-4 mr-1.5"></i>
                        <span class="hidden sm:inline">Làm mới</span>
                    `;
                    lucide.createIcons({
                        scope: refreshBtn
                    });
                }, 2000);
            }
        });
    }

    /**
     * Get the currently logged in user
     * @returns {string|null} Username of logged in user or null if not logged in
     */
    getCurrentUser() {
        return getLoggedInUser();
    }
    
    /**
     * Check if a user is logged in
     * @returns {boolean} True if user is logged in
     */
    isUserLoggedIn() {
        return isLoggedIn();
    }

    /**
     * Setup the Clear All Data button
     */
    setupClearAllDataButton() {
        const clearAllDataBtn = document.getElementById('clear-all-data-btn');
        if (clearAllDataBtn) {
            // Initially hide the button, will show based on role in updateAuthUI
            clearAllDataBtn.classList.add('hidden');
            
            clearAllDataBtn.addEventListener('click', async () => {
                if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
                    try {
                        showMessage('Đang xóa dữ liệu...', 'info');
                        
                        // Clear all data in Supabase
                        await clearAllData();
                        
                        // Reload data for all managers
                        await Promise.all([
                            this.memberManager.loadData(),
                            this.fundManager.loadData(),
                            this.expenseManager.loadData()
                        ]);
                        
                        // Update UI
                        this.renderAll();
                        
                        showMessage('Đã xóa tất cả dữ liệu thành công');
                    } catch (error) {
                        console.error('Lỗi khi xóa dữ liệu:', error);
                        showMessage('Lỗi khi xóa dữ liệu: ' + error.message, 'error');
                    }
                }
            });
        }
    }
}

// Initialize and start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'fixed inset-0 flex items-center justify-center bg-white z-50';
    loadingEl.innerHTML = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Đang kết nối đến Supabase...</p>
        </div>
    `;
    document.body.appendChild(loadingEl);
    
    // Initialize app
    const app = new App();
    await app.init();
    
    // Remove loading indicator
    loadingEl.remove();
    
    // Make app globally accessible for debugging
    window.app = app;
}); 