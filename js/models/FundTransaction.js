/**
 * FundTransaction Model
 * Represents a transaction in the group fund
 */

import { generateId } from '../utils/helpers.js';

export class FundTransaction {
    /**
     * Transaction types
     * @type {Object}
     */
    static TYPES = {
        DEPOSIT: 'deposit',
        EXPENSE: 'expense'
    };
    
    /**
     * Create a new fund transaction
     * @param {Object} data - Transaction data
     * @param {string} data.type - Transaction type ('deposit' or 'expense')
     * @param {number} data.amount - Transaction amount
     * @param {string} data.date - Transaction date (YYYY-MM-DD)
     * @param {string} [data.member] - Member who deposited (for deposit type)
     * @param {string} [data.expenseId] - ID of related expense (for expense type)
     * @param {string} [data.expenseName] - Name of related expense (for expense type)
     * @param {string} [data.note] - Optional note for the transaction
     * @param {string} [data.id] - Optional ID (generated if not provided)
     */
    constructor(data) {
        this.id = data.id || generateId();
        this.type = data.type;
        this.amount = data.amount;
        this.date = data.date;
        
        // Type-specific properties
        if (this.type === FundTransaction.TYPES.DEPOSIT) {
            this.member = data.member;
            this.note = data.note || '';
        } else if (this.type === FundTransaction.TYPES.EXPENSE) {
            this.expenseId = data.expenseId;
            this.expenseName = data.expenseName;
        }
    }
    
    /**
     * Create a deposit transaction
     * @param {string} member - Member making the deposit
     * @param {number} amount - Amount deposited
     * @param {string} date - Date of deposit (YYYY-MM-DD)
     * @param {string} [note] - Optional note
     * @returns {FundTransaction} New deposit transaction
     */
    static createDeposit(member, amount, date, note = '') {
        return new FundTransaction({
            type: FundTransaction.TYPES.DEPOSIT,
            amount: amount,
            date: date,
            member: member,
            note: note
        });
    }
    
    /**
     * Create an expense transaction
     * @param {string} expenseId - ID of the expense
     * @param {string} expenseName - Name of the expense
     * @param {number} amount - Amount spent
     * @param {string} date - Date of expense (YYYY-MM-DD)
     * @returns {FundTransaction} New expense transaction
     */
    static createExpense(expenseId, expenseName, amount, date) {
        return new FundTransaction({
            type: FundTransaction.TYPES.EXPENSE,
            amount: amount,
            date: date,
            expenseId: expenseId,
            expenseName: expenseName
        });
    }
    
    /**
     * Check if this is a deposit transaction
     * @returns {boolean} True if type is deposit
     */
    isDeposit() {
        return this.type === FundTransaction.TYPES.DEPOSIT;
    }
    
    /**
     * Check if this is an expense transaction
     * @returns {boolean} True if type is expense
     */
    isExpense() {
        return this.type === FundTransaction.TYPES.EXPENSE;
    }
    
    /**
     * Convert to plain object for storage
     * @returns {Object} Plain object representation
     */
    toObject() {
        const obj = {
            id: this.id,
            type: this.type,
            amount: this.amount,
            date: this.date
        };
        
        if (this.isDeposit()) {
            obj.member = this.member;
            if (this.note) obj.note = this.note;
        } else if (this.isExpense()) {
            obj.expenseId = this.expenseId;
            obj.expenseName = this.expenseName;
        }
        
        return obj;
    }
    
    /**
     * Create a FundTransaction instance from a plain object
     * @param {Object} obj - Plain object data
     * @returns {FundTransaction} New FundTransaction instance
     */
    static fromObject(obj) {
        return new FundTransaction(obj);
    }
} 