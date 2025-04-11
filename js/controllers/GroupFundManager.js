/**
 * GroupFundManager Controller
 * Manages the group fund and related transactions
 */

import { FundTransaction } from '../models/FundTransaction.js';
import { saveGroupFund, loadGroupFund } from '../utils/storage.js';

export class GroupFundManager {
    /**
     * Create a new GroupFundManager
     */
    constructor() {
        this.balance = 0;
        this.transactions = [];
        this.memberBalances = {};
        
        // Load data
        this.loadData();
    }
    
    /**
     * Load fund data from storage
     */
    loadData() {
        const fundData = loadGroupFund();
        this.balance = fundData.balance || 0;
        this.transactions = (fundData.transactions || []).map(t => FundTransaction.fromObject(t));
        this.memberBalances = fundData.memberBalances || {};
    }
    
    /**
     * Save fund data to storage
     */
    saveData() {
        const transactionsData = this.transactions.map(t => t.toObject());
        saveGroupFund(this.balance, transactionsData, this.memberBalances);
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
        
        this.saveData();
    }
    
    /**
     * Add a deposit transaction
     * @param {string} member - Member making the deposit
     * @param {number} amount - Amount to deposit
     * @param {string} date - Date of deposit
     * @param {string} [note] - Optional note
     * @returns {FundTransaction} The new transaction
     */
    addDeposit(member, amount, date, note = '') {
        // Create transaction
        const transaction = FundTransaction.createDeposit(member, amount, date, note);
        
        // Update balance
        this.balance += amount;
        
        // Update member balance
        this.memberBalances[member] = (this.memberBalances[member] || 0) + amount;
        
        // Add to transactions
        this.transactions.push(transaction);
        
        // Save changes
        this.saveData();
        
        return transaction;
    }
    
    /**
     * Add a transaction and update balances
     * @param {FundTransaction} transaction - The transaction to add
     * @param {Object} [memberBalanceChanges] - Balance changes per member
     * @returns {FundTransaction} The added transaction
     */
    addTransaction(transaction, memberBalanceChanges = {}) {
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
        
        // Save changes
        this.saveData();
        
        return transaction;
    }
    
    /**
     * Remove an expense transaction
     * @param {string} expenseId - ID of the expense
     * @param {Object} [memberBalanceChanges] - Balance changes per member
     * @returns {boolean} True if successful
     */
    removeExpenseTransaction(expenseId, memberBalanceChanges = {}) {
        const index = this.transactions.findIndex(
            t => t.isExpense() && t.expenseId === expenseId
        );
        
        if (index === -1) return false;
        
        const transaction = this.transactions[index];
        
        // Update fund balance
        this.balance += transaction.amount;
        
        // Apply member balance changes
        Object.entries(memberBalanceChanges).forEach(([member, change]) => {
            this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
        });
        
        // Remove the transaction
        this.transactions.splice(index, 1);
        
        // Save changes
        this.saveData();
        
        return true;
    }
    
    /**
     * Update an expense transaction
     * @param {string} expenseId - ID of the expense
     * @param {string} expenseName - New expense name
     * @param {number} amount - New amount
     * @param {string} date - New date
     * @param {Object} memberBalanceChanges - Balance changes per member
     * @returns {boolean} True if successful
     */
    updateExpenseTransaction(expenseId, expenseName, amount, date, memberBalanceChanges) {
        const index = this.transactions.findIndex(
            t => t.isExpense() && t.expenseId === expenseId
        );
        
        if (index === -1) return false;
        
        const oldTransaction = this.transactions[index];
        
        // Update fund balance
        this.balance = this.balance + oldTransaction.amount - amount;
        
        // Apply member balance changes
        Object.entries(memberBalanceChanges).forEach(([member, change]) => {
            this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
        });
        
        // Update the transaction
        const updatedTransaction = FundTransaction.createExpense(
            expenseId,
            expenseName,
            amount,
            date
        );
        
        this.transactions[index] = updatedTransaction;
        
        // Save changes
        this.saveData();
        
        return true;
    }
    
    /**
     * Recalculate all member balances from transactions history
     * @param {Array<string>} members - List of all members
     */
    recalculateMemberBalances(members) {
        // Reset all balances to 0
        this.memberBalances = {};
        members.forEach(member => {
            this.memberBalances[member] = 0;
        });
        
        // Add deposits to member balances
        this.transactions.forEach(transaction => {
            if (transaction.isDeposit()) {
                this.memberBalances[transaction.member] = 
                    (this.memberBalances[transaction.member] || 0) + transaction.amount;
            }
        });
        
        // Save changes
        this.saveData();
    }
    
    /**
     * Clear all fund data
     */
    clearAllData() {
        this.balance = 0;
        this.transactions = [];
        this.memberBalances = {};
        this.saveData();
    }
} 