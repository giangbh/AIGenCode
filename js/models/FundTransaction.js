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
        EXPENSE: 'expense',
        TRANSFER: 'transfer'
    };
    
    /**
     * Create a new fund transaction
     * @param {Object} data - Transaction data
     * @param {string} data.type - Transaction type ('deposit', 'expense', or 'transfer')
     * @param {number} data.amount - Transaction amount
     * @param {string} data.date - Transaction date (YYYY-MM-DD)
     * @param {string} [data.member] - Member who deposited (for deposit type)
     * @param {string} [data.expenseId] - ID of related expense (for expense type)
     * @param {string} [data.expenseName] - Name of related expense (for expense type)
     * @param {string} [data.fromMember] - Member who sent money (for transfer type)
     * @param {string} [data.toMember] - Member who received money (for transfer type)
     * @param {string} [data.note] - Optional note for the transaction
     * @param {string} [data.id] - Optional ID (generated if not provided)
     * @param {string} [data.created_at] - Creation timestamp from database
     */
    constructor(data) {
        this.id = data.id || generateId();
        this.type = data.type;
        this.amount = data.amount;
        this.date = data.date;
        this.created_at = data.created_at || new Date().toISOString();
        
        // Type-specific properties
        if (this.type === FundTransaction.TYPES.DEPOSIT) {
            this.member = data.member;
            this.note = data.note || '';
        } else if (this.type === FundTransaction.TYPES.EXPENSE) {
            this.expenseId = data.expenseId;
            this.expenseName = data.expenseName;
        } else if (this.type === FundTransaction.TYPES.TRANSFER) {
            this.fromMember = data.fromMember;
            this.toMember = data.toMember;
            this.note = data.note || 'Chuyển tiền thanh toán chi tiêu';
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
     * Create a transfer transaction
     * @param {string} fromMember - Member sending money
     * @param {string} toMember - Member receiving money
     * @param {number} amount - Amount transferred
     * @param {string} date - Date of transfer (YYYY-MM-DD)
     * @param {string} [note] - Optional note
     * @returns {FundTransaction} New transfer transaction
     */
    static createTransfer(fromMember, toMember, amount, date, note = '') {
        return new FundTransaction({
            type: FundTransaction.TYPES.TRANSFER,
            amount: amount,
            date: date,
            fromMember: fromMember,
            toMember: toMember,
            note: note
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
     * Check if this is a transfer transaction
     * @returns {boolean} True if type is transfer
     */
    isTransfer() {
        return this.type === FundTransaction.TYPES.TRANSFER;
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
            date: this.date,
            created_at: this.created_at
        };
        
        if (this.isDeposit()) {
            obj.member = this.member;
            if (this.note) obj.note = this.note;
        } else if (this.isExpense()) {
            obj.expenseId = this.expenseId;
            obj.expenseName = this.expenseName;
        } else if (this.isTransfer()) {
            obj.fromMember = this.fromMember;
            obj.toMember = this.toMember;
            if (this.note) obj.note = this.note;
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