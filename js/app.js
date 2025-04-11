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
import { initializeStorage, clearAllData } from './utils/storage.js';
import { showMessage } from './utils/helpers.js';
import { checkConnection } from './utils/supabase.js';

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

            // Check Supabase connection
            const isConnected = await checkConnection();
            if (!isConnected) {
                showMessage('Không thể kết nối đến cơ sở dữ liệu Supabase. Vui lòng kiểm tra cấu hình và kết nối internet.', 'error');
                loadingEl.remove();
                return;
            }

            // Initialize Supabase with default data
            await initializeStorage(this.defaultMembers, this.defaultBankAccounts);
            
            // Initialize and load member data first
            this.memberManager = new MemberManager();
            await this.memberManager.loadData();
            
            if (!this.memberManager.getAllMembers || this.memberManager.getAllMembers().length === 0) {
                throw new Error('Không thể tải danh sách thành viên');
            }

            // Initialize other managers
            this.expenseManager = new ExpenseManager();
            this.groupFundManager = new GroupFundManager(this.expenseManager);
            
            // Load other managers' data
            await Promise.all([
                this.groupFundManager.loadData()
            ]);
            await this.expenseManager.loadData();
            
            // Make sure member balances are initialized
            this.groupFundManager.initializeMemberBalances(this.memberManager.getAllMembers());
            
            // Initialize UI controllers
            this.memberUIController = new MemberUIController(this.memberManager);
            this.expenseUIController = new ExpenseUIController(this.expenseManager, this.memberManager, this.groupFundManager);
            this.fundUIController = new FundUIController(this.groupFundManager, this.memberManager);
            
            // Initialize Lucide icons
            lucide.createIcons();
            
            // Initialize UI components
            this.expenseUIController.populateMembers();
            
            // Setup refresh button
            this.setupRefreshButton();

            // Remove loading indicator
            loadingEl.remove();

            // Make app globally accessible for debugging
            window.app = this;

            // Mark as initialized
            this.initialized = true;
            console.log('Ứng dụng đã khởi tạo thành công');
        } catch (error) {
            console.error('Lỗi khi khởi tạo ứng dụng:', error);
            showMessage('Có lỗi xảy ra khi khởi tạo ứng dụng. Vui lòng thử lại sau.', 'error');
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
                this.groupFundManager.loadData()
            ]);
            await this.expenseManager.loadData();
            
            // Cập nhật giao diện với dữ liệu mới
            this.renderExpenses();
            this.renderGroupFund();
            this.renderMembers();
            
            // Calculate and render expense results
            const members = this.memberManager.getAllMembers();
            const results = this.expenseManager.calculateResults(members);
            this.expenseUIController.renderResults(results);
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
        this.expenseUIController.renderExpenseList();
    }
    
    /**
     * Render group fund UI
     */
    renderGroupFund() {
        this.fundUIController.renderFundStatus();
        this.fundUIController.renderFundTransactions();
    }
    
    /**
     * Render members UI
     */
    renderMembers() {
        this.memberUIController.renderMembers();
    }
    
    /**
     * Handle editing a member's bank account
     * @param {string} member - The member to edit
     */
    handleEditMember(member) {
        this.memberUIController.handleEditMember(member);
    }
    
    /**
     * Clear all application data
     */
    async clearAllData() {
        clearAllData();
        this.expenseManager = new ExpenseManager();
        await this.groupFundManager.clearAllData();
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
        const refreshButton = document.getElementById('refresh-data-btn');
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                refreshButton.disabled = true;
                const originalHTML = refreshButton.innerHTML;
                refreshButton.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>';
                lucide.createIcons({
                    scope: refreshButton
                });

                try {
                    // Reload data from Supabase
                    await Promise.all([
                        this.memberManager.loadData(),
                        this.groupFundManager.loadData()
                    ]);
                    await this.expenseManager.loadData();

                    // Update UI with new data
                    this.expenseUIController.renderExpenseList();
                    this.fundUIController.renderFundStatus();
                    this.fundUIController.renderFundTransactions();
                    this.memberUIController.renderMembers();

                    // Calculate and render expense results
                    const members = this.memberManager.getAllMembers();
                    const results = this.expenseManager.calculateResults(members);
                    this.expenseUIController.renderResults(results);

                    showMessage('Dữ liệu đã được làm mới');
                } catch (error) {
                    console.error('Lỗi khi làm mới dữ liệu:', error);
                    showMessage('Có lỗi xảy ra khi làm mới dữ liệu', 'error');
                } finally {
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = originalHTML;
                    lucide.createIcons({
                        scope: refreshButton
                    });
                }
            });
        }
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
}); 