/**
 * Expense Model
 * Represents a single expense in the application
 */
 
import { generateId } from '../utils/helpers.js';

export class Expense {
    /**
     * Create a new expense
     * @param {Object} data - Expense data
     * @param {string} data.name - Name of the expense
     * @param {number} data.amount - Amount of the expense
     * @param {string} data.date - Date of the expense (YYYY-MM-DD)
     * @param {string} data.payer - Person who paid
     * @param {Array<string>} data.participants - People participating in the expense
     * @param {boolean} data.equalSplit - Whether the expense is split equally
     * @param {Object} data.splits - Manual split amounts per person (if !equalSplit)
     * @param {string} data.id - Optional ID (generated if not provided)
     * @param {string} data.created_at - Optional creation date (YYYY-MM-DD HH:MM:SS)
     * @param {Object} data.location - Optional location data {lat, lng, name}
     */
    constructor(data) {
        this.id = data.id || generateId();
        this.name = data.name;
        this.amount = data.amount;
        this.date = data.date;
        this.payer = data.payer;
        this.participants = data.participants;
        this.equalSplit = data.equalSplit;
        this.splits = data.equalSplit ? {} : data.splits;
        this.created_at = data.created_at || null;
        this.location = data.location || null;
    }
    
    /**
     * Get the split amount for a participant
     * @param {string} participant - The participant
     * @returns {number} The split amount
     */
    getSplitAmountFor(participant) {
        if (this.equalSplit) {
            return this.amount / this.participants.length;
        } else {
            return this.splits[participant] || 0;
        }
    }
    
    /**
     * Check if a participant is part of this expense
     * @param {string} participant - The participant to check
     * @returns {boolean} True if participant is included
     */
    includesParticipant(participant) {
        return this.participants.includes(participant);
    }
    
    /**
     * Update this expense
     * @param {Object} newData - New expense data
     */
    update(newData) {
        this.name = newData.name;
        this.amount = newData.amount;
        this.date = newData.date;
        this.payer = newData.payer;
        this.participants = newData.participants;
        this.equalSplit = newData.equalSplit;
        this.splits = newData.equalSplit ? {} : newData.splits;
        this.location = newData.location || this.location;
    }
    
    /**
     * Convert to plain object for storage
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            amount: this.amount,
            date: this.date,
            payer: this.payer,
            participants: this.participants,
            equalSplit: this.equalSplit,
            splits: this.splits,
            created_at: this.created_at,
            location: this.location
        };
    }
    
    /**
     * Create an Expense instance from a plain object
     * @param {Object} obj - Plain object data
     * @returns {Expense} New Expense instance
     */
    static fromObject(obj) {
        // console.log("DEBUG - Expense.fromObject input:", {
        //     id: obj.id,
        //     name: obj.name,
        //     hasLocation: !!obj.location,
        //     locationType: typeof obj.location,
        //     locationValue: obj.location
        // });
        
        // Make a deep copy of the object to avoid reference issues
        const expenseData = {
            ...obj,
            // Ensure location is properly preserved
            location: obj.location ? (typeof obj.location === 'string' ? obj.location : {...obj.location}) : null
        };
        
        const expense = new Expense(expenseData);
        
        // console.log("DEBUG - Expense.fromObject output:", {
        //     id: expense.id,
        //     name: expense.name,
        //     hasLocation: !!expense.location,
        //     locationType: typeof expense.location,
        //     locationValue: expense.location
        // });
        
        return expense;
    }
} 