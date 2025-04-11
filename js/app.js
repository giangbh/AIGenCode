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
import { clearAllData } from './utils/storage.js';

class App {
    /**
     * Create a new App instance
     */
    constructor() {
        // Default application data
        this.defaultMembers = ["Giang", "Quân", "Toàn", "Quang", "Trung", "Nhật"];
        this.defaultBankAccounts = { 
            "Giang": "9876543210", 
            "Quân": "8765432109", 
            "Toàn": "1240067256", 
            "Quang": "6543210987", 
            "Trung": "5432109876", 
            "Nhật": "4321098765" 
        };
        
        // Initialize managers
        this.memberManager = new MemberManager(this.defaultMembers, this.defaultBankAccounts);
        this.fundManager = new GroupFundManager();
        this.expenseManager = new ExpenseManager(this.fundManager);
        
        // Make sure member balances are initialized
        this.fundManager.initializeMemberBalances(this.memberManager.getAllMembers());
        
        // Initialize UI controllers
        this.expenseUI = new ExpenseUIController(this);
        this.fundUI = new FundUIController(this);
        this.memberUI = new MemberUIController(this);
        
        // Initialize Lucide icons
        lucide.createIcons();
    }
    
    /**
     * Initialize the application
     */
    init() {
        // Initialize UI components
        this.expenseUI.populateMembers();
        
        // Render all components
        this.renderAll();
    }
    
    /**
     * Render all UI components
     */
    renderAll() {
        this.renderExpenses();
        this.renderGroupFund();
        this.renderMembers();
        
        // Calculate and render expense results
        const members = this.memberManager.getAllMembers();
        const results = this.expenseManager.calculateResults(members);
        this.expenseUI.renderResults(results);
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
     * Handle editing a member's bank account
     * @param {string} member - The member to edit
     */
    handleEditMember(member) {
        this.memberUI.handleEditMember(member);
    }
    
    /**
     * Clear all application data
     */
    clearAllData() {
        this.expenseManager = new ExpenseManager(this.fundManager);
        this.fundManager.clearAllData();
        this.renderAll();
    }
}

// Initialize and start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // Make app globally accessible for debugging
    window.app = app;
}); 