/**
 * UIController
 * Base controller for UI operations
 */

import { formatCurrency, formatDisplayDate, getTodayDateString, showMessage } from '../utils/helpers.js';
import { initQRCodeModal, displayQrCode } from '../utils/qrcode.js';

export class UIController {
    /**
     * Create a new UIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        this.app = app;
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Initialize UI
        this.initTabSwitching();
        this.setupCopyrightYear();
        this.setupClearAllDataButton();
        
        // Initialize QR code modal
        initQRCodeModal();
    }
    
    /**
     * Initialize the tab switching functionality
     */
    initTabSwitching() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab; // e.g., 'expenses' or 'group-fund'

                // Update button active states
                this.tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update content active states
                this.tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                document.getElementById(`tab-content-${targetTab}`).classList.add('active');
                
                // Re-render specific tab content
                if (targetTab === 'expenses') {
                    this.app.renderExpenses();
                } else if (targetTab === 'group-fund') {
                    this.app.renderGroupFund();
                } else if (targetTab === 'members') {
                    this.app.renderMembers();
                } else if (targetTab === 'reports') {
                    this.app.renderReports();
                }
            });
        });
    }
    
    /**
     * Set up the current year in the copyright notice
     */
    setupCopyrightYear() {
        const copyrightYearSpan = document.getElementById('copyright-year');
        if (copyrightYearSpan) {
            copyrightYearSpan.textContent = new Date().getFullYear();
        }
    }
    
    /**
     * Set up the clear all data button
     */
    setupClearAllDataButton() {
        const clearAllDataBtn = document.getElementById('clear-all-data-btn');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => {
                this.handleClearAllData();
            });
        }
    }
    
    /**
     * Handle clear all data action
     */
    handleClearAllData() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
            this.app.clearAllData();
            showMessage('Tất cả dữ liệu đã được xóa');
        }
    }
    
    /**
     * Switch to a specific tab
     * @param {string} tabId - The tab ID to switch to
     */
    switchToTab(tabId) {
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
    
    /**
     * Display a QR code for payment
     * @param {string} debtor - The person who needs to pay
     * @param {string} creditor - The person who should receive payment
     * @param {number} amount - The amount to transfer
     */
    showQrCode(debtor, creditor, amount) {
        const bankAccounts = this.app.memberManager.getAllBankAccounts();
        displayQrCode(debtor, creditor, amount, bankAccounts);
    }
} 