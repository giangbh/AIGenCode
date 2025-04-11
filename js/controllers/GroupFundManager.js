/**
 * GroupFundManager Controller
 * Manages the group fund and related transactions
 */

import { FundTransaction } from '../models/FundTransaction.js';
import { formatCurrency, formatDisplayDate, showMessage } from '../utils/helpers.js';
import { loadFundTransactions, saveFundTransactions, invalidateCache, supabase } from '../utils/storage.js';

export class GroupFundManager {
    /**
     * Create a new GroupFundManager
     */
    constructor(expenseManager) {
        this.balance = 0;
        this.transactions = [];
        this.memberBalances = {};
        this.expenseManager = expenseManager;
        
        // Load data
        this.loadData();
    }
    
    /**
     * Load fund data from storage
     */
    async loadData() {
        try {
            // Load transactions from Supabase
            const transactionsData = await loadFundTransactions();
            this.transactions = transactionsData.map(t => FundTransaction.fromObject(t));
            
            // Calculate balance from transactions
            this.balance = this.transactions.reduce((sum, transaction) => {
                return sum + (transaction.isDeposit() ? transaction.amount : -transaction.amount);
            }, 0);
            
            // Calculate member balances from transactions
            this.recalculateMemberBalances();
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu quỹ:', error);
            this.balance = 0;
            this.transactions = [];
            this.memberBalances = {};
        }
    }
    
    /**
     * Save fund data to storage
     * Không còn cần thiết khi sử dụng Supabase
     * Mỗi thao tác sẽ cập nhật trực tiếp vào Supabase
     */
    saveData() {
        // Method is kept for compatibility, but implementation is empty
        // as we're now using direct Supabase operations
    }
    
    /**
     * Get the current fund balance
     * @returns {number} Current balance
     */
    getBalance() {
        return this.balance;
    }
    
    /**
     * Get all fund transactions
     * @returns {Array<FundTransaction>} All transactions
     */
    getAllTransactions() {
        return this.transactions;
    }
    
    /**
     * Get member balances
     * @returns {Object} Member balances
     */
    getMemberBalances() {
        return this.memberBalances;
    }
    
    /**
     * Get balance for a specific member
     * @param {string} member - The member
     * @returns {number} Member's balance
     */
    getMemberBalance(member) {
        return this.memberBalances[member] || 0;
    }
    
    /**
     * Initialize member balances for a list of members
     * @param {Array<string>} members - List of members
     */
    initializeMemberBalances(members) {
        // Initialize any members that don't have balances yet
        members.forEach(member => {
            if (this.memberBalances[member] === undefined) {
                this.memberBalances[member] = 0;
            }
        });
        
        // No need to save, as balances are calculated from transactions now
    }
    
    /**
     * Add a deposit transaction
     * @param {string} member - Member making the deposit
     * @param {number} amount - Amount to deposit
     * @param {string} date - Date of deposit
     * @param {string} [note] - Optional note
     * @returns {FundTransaction} The new transaction
     */
    async addDeposit(member, amount, date, note = '') {
        try {
            // Add deposit to Supabase
            const savedTransaction = await supabase.addDeposit(member, amount, date, note);
            
            // Create transaction object
            const transaction = FundTransaction.fromObject(savedTransaction);
            
            // Update local balance
            this.balance += amount;
            
            // Update member balance
            this.memberBalances[member] = (this.memberBalances[member] || 0) + amount;
            
            // Add to local transactions
            this.transactions.push(transaction);
            
            // Invalidate cache
            invalidateCache('fundTransactions');
            
            return transaction;
        } catch (error) {
            console.error('Lỗi khi thêm khoản nộp quỹ:', error);
            throw error;
        }
    }
    
    /**
     * Add a transaction and update balances
     * @param {FundTransaction} transaction - The transaction to add
     * @param {Object} [memberBalanceChanges] - Balance changes per member
     * @returns {FundTransaction} The added transaction
     */
    async addTransaction(transaction, memberBalanceChanges = {}) {
        try {
            let savedTransaction;
            
            if (transaction.isDeposit()) {
                // Add deposit to Supabase
                savedTransaction = await supabase.addDeposit(
                    transaction.member,
                    transaction.amount,
                    transaction.date,
                    transaction.note
                );
            } else if (transaction.isExpense()) {
                // Add expense transaction to Supabase
                savedTransaction = await supabase.addExpenseTransaction(
                    transaction.expenseId,
                    transaction.expenseName,
                    transaction.amount,
                    transaction.date,
                    transaction.expenseData
                );
            }
            
            // Update the transaction with Supabase ID
            transaction.id = savedTransaction.id;
            
            // Update fund balance
            if (transaction.isDeposit()) {
                this.balance += transaction.amount;
                
                // Update member balance for deposit
                if (transaction.member) {
                    this.memberBalances[transaction.member] = 
                        (this.memberBalances[transaction.member] || 0) + transaction.amount;
                }
            } else if (transaction.isExpense()) {
                this.balance -= transaction.amount;
            }
            
            // Apply member balance changes
            Object.entries(memberBalanceChanges).forEach(([member, change]) => {
                this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
            });
            
            // Add to transactions
            this.transactions.push(transaction);
            
            // Invalidate cache
            invalidateCache('fundTransactions');
            
            return transaction;
        } catch (error) {
            console.error('Lỗi khi thêm giao dịch quỹ:', error);
            throw error;
        }
    }
    
    /**
     * Remove an expense transaction
     * @param {string} expenseId - ID of the expense
     * @param {Object} [memberBalanceChanges] - Balance changes per member
     * @returns {boolean} True if successful
     */
    async removeExpenseTransaction(expenseId, memberBalanceChanges = {}) {
        const index = this.transactions.findIndex(
            t => t.isExpense() && t.expenseId === expenseId
        );
        
        if (index === -1) return false;
        
        const transaction = this.transactions[index];
        
        try {
            // Delete the transaction from Supabase
            await supabase.deleteExpenseTransactions(expenseId);
            
            // Update fund balance
            this.balance += transaction.amount;
            
            // Apply member balance changes
            Object.entries(memberBalanceChanges).forEach(([member, change]) => {
                this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
            });
            
            // Remove the transaction
            this.transactions.splice(index, 1);
            
            // Invalidate cache
            invalidateCache('fundTransactions');
            
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa giao dịch chi tiêu:', error);
            return false;
        }
    }
    
    /**
     * Update an expense transaction
     * This method is no longer used directly, as we prefer to delete and recreate transactions
     * @param {string} expenseId - ID of the expense
     * @param {string} expenseName - New expense name
     * @param {number} amount - New amount
     * @param {string} date - New date
     * @param {Object} memberBalanceChanges - Balance changes per member
     * @returns {boolean} True if successful
     */
    async updateExpenseTransaction(expenseId, expenseName, amount, date, memberBalanceChanges) {
        // This method is deprecated in the Supabase implementation
        // Instead, we now use removeExpenseTransaction followed by addTransaction
        
        return false;
    }
    
    /**
     * Recalculate member balances based on transactions
     * @param {Array<string>} members - List of members
     */
    async recalculateMemberBalances(members = []) {
        // Initialize balances
        this.initializeMemberBalances(members);
        
        // Process each transaction
        for (const transaction of this.transactions) {
            if (transaction.type === FundTransaction.TYPES.DEPOSIT) {
                // For deposits, simply add to member's balance
                this.memberBalances[transaction.member] += transaction.amount;
            } else if (transaction.type === FundTransaction.TYPES.EXPENSE) {
                // For expenses, we need to get the expense details
                const expenseId = transaction.expenseId;
                if (expenseId) {
                    try {
                        // Get expense details from ExpenseManager
                        const expense = await this.expenseManager.getExpenseById(expenseId);
                        if (expense) {
                            // Update balances based on expense distribution
                            const distribution = expense.distribution || {};
                            for (const [member, amount] of Object.entries(distribution)) {
                                if (this.memberBalances.hasOwnProperty(member)) {
                                    this.memberBalances[member] -= amount;
                                }
                            }
                        } else {
                            console.warn('Không tìm thấy dữ liệu phân bổ chi tiêu cho:', transaction);
                            // If expense not found, distribute equally among all members
                            const equalShare = transaction.amount / members.length;
                            for (const member of members) {
                                this.memberBalances[member] -= equalShare;
                            }
                        }
                    } catch (error) {
                        console.error('Lỗi khi tìm kiếm chi tiêu:', error);
                        // Fallback to equal distribution if there's an error
                        const equalShare = transaction.amount / members.length;
                        for (const member of members) {
                            this.memberBalances[member] -= equalShare;
                        }
                    }
                }
            }
        }
        
        console.log('Số dư thành viên sau khi tính toán lại:', this.memberBalances);
    }
    
    /**
     * Xóa toàn bộ dữ liệu quỹ
     */
    async clearAllData() {
        try {
            await supabase.clearAllFundTransactions();
            this.balance = 0;
            this.transactions = [];
            this.memberBalances = {};
            invalidateCache('fundTransactions');
        } catch (error) {
            console.error('Lỗi khi xóa dữ liệu quỹ:', error);
        }
    }
} 