/**
 * MemberManager Controller
 * Manages members and their bank accounts
 */

import { saveMembers, loadMembers, saveBankAccounts, loadBankAccounts } from '../utils/storage.js';

export class MemberManager {
    /**
     * Create a new MemberManager
     * @param {Array<string>} defaultMembers - Default members if none found
     * @param {Object} defaultAccounts - Default bank accounts if none found
     */
    constructor(defaultMembers = [], defaultAccounts = {}) {
        this.members = [];
        this.bankAccounts = {};
        this.defaultMembers = defaultMembers;
        this.defaultAccounts = defaultAccounts;
        
        // Load data
        this.loadData();
    }
    
    /**
     * Load member data from storage
     */
    loadData() {
        // Load members with defaults if none exist
        this.members = loadMembers(this.defaultMembers);
        
        // Load bank accounts with defaults if none exist
        this.bankAccounts = loadBankAccounts(this.defaultAccounts);
        
        // Ensure all default members are included
        let missingDefaultMembers = false;
        
        this.defaultMembers.forEach(defaultMember => {
            if (!this.members.includes(defaultMember)) {
                this.members.push(defaultMember);
                missingDefaultMembers = true;
            }
        });
        
        // Ensure all default members have their bank accounts
        this.defaultMembers.forEach(member => {
            if (this.defaultAccounts[member] && !this.bankAccounts[member]) {
                this.bankAccounts[member] = this.defaultAccounts[member];
            }
        });
        
        // Save if any changes were made
        if (missingDefaultMembers) {
            this.saveData();
        }
    }
    
    /**
     * Save member data to storage
     */
    saveData() {
        saveMembers(this.members);
        saveBankAccounts(this.bankAccounts);
    }
    
    /**
     * Get all members
     * @returns {Array<string>} Array of member names
     */
    getAllMembers() {
        return this.members;
    }
    
    /**
     * Get all bank accounts
     * @returns {Object} Bank account mapping
     */
    getAllBankAccounts() {
        return this.bankAccounts;
    }
    
    /**
     * Get a member's bank account
     * @param {string} member - The member name
     * @returns {string} Bank account number or empty string if not found
     */
    getMemberBankAccount(member) {
        return this.bankAccounts[member] || '';
    }
    
    /**
     * Add a new member
     * @param {string} name - Member name
     * @param {string} [accountNumber] - Optional bank account number
     * @returns {boolean} True if added successfully
     */
    addMember(name, accountNumber = '') {
        // Validate name
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return false;
        }
        
        name = name.trim();
        
        // Check if member already exists
        if (this.members.includes(name)) {
            return false;
        }
        
        // Add member
        this.members.push(name);
        
        // Add bank account if provided
        if (accountNumber) {
            this.bankAccounts[name] = accountNumber;
        }
        
        // Save changes
        this.saveData();
        
        return true;
    }
    
    /**
     * Update a member's bank account
     * @param {string} member - The member name
     * @param {string} accountNumber - New bank account number
     * @returns {boolean} True if updated successfully
     */
    updateMemberAccount(member, accountNumber) {
        // Validate member
        if (!this.members.includes(member)) {
            return false;
        }
        
        // Validate account number (simple validation)
        if (typeof accountNumber !== 'string') {
            return false;
        }
        
        // Update account
        this.bankAccounts[member] = accountNumber;
        
        // Save changes
        this.saveData();
        
        return true;
    }
    
    /**
     * Remove a member
     * @param {string} member - The member to remove
     * @returns {boolean} True if removed successfully
     */
    removeMember(member) {
        const index = this.members.indexOf(member);
        if (index === -1) {
            return false;
        }
        
        // Remove member
        this.members.splice(index, 1);
        
        // Remove bank account
        delete this.bankAccounts[member];
        
        // Save changes
        this.saveData();
        
        return true;
    }
} 