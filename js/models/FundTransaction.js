/**
 * FundTransaction Model
 * Represents a transaction in the group fund
 */

import { generateId } from '../utils/helpers.js';
import { generateUUID } from '../utils/helpers.js';

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
     * @param {string} [data.datetime] - Transaction datetime (YYYY-MM-DD HH:MM:SS)
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
        this.datetime = data.datetime || this._generateDateTime(data.date);
        
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
     * Generate a datetime string from a date
     * @private
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {string} Date and time in YYYY-MM-DD HH:MM:SS format
     */
    _generateDateTime(date) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${date} ${hours}:${minutes}:${seconds}`;
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
            datetime: FundTransaction._getCurrentDateTime(),
            member: member,
            note: note
        });
    }
    
    /**
     * Check if a string is a valid UUID
     * @param {string} str - String to check
     * @returns {boolean} True if the string is a valid UUID
     */
    static isUUID(str) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regex.test(str);
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
        // Kiểm tra xem expense ID có phải là UUID không
        // Nếu không và nếu đang kết nối Supabase, tạo một UUID mới
        console.log('Tạo giao dịch chi tiêu với ID:', expenseId);
        
        // Tạo UUID mới nếu cần thiết (nếu là môi trường production)
        let safeExpenseId = expenseId;
        if (window.location.hostname !== 'localhost' && !FundTransaction.isUUID(expenseId)) {
            safeExpenseId = generateUUID();
            console.log('Chuyển đổi ID không phải UUID thành UUID:', expenseId, '->', safeExpenseId);
        }
        
        return new FundTransaction({
            type: FundTransaction.TYPES.EXPENSE,
            amount: amount,
            date: date,
            datetime: FundTransaction._getCurrentDateTime(),
            expenseId: safeExpenseId,
            expenseName: expenseName
        });
    }
    
    /**
     * Get current date and time in YYYY-MM-DD HH:MM:SS format
     * @private
     * @returns {string} Current datetime string
     */
    static _getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
            date: this.date,
            datetime: this.datetime
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