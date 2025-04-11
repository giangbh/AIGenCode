/**
 * MemberManager Controller
 * Manages members and their bank accounts
 */

import { loadMembers, loadBankAccounts, invalidateCache, supabase } from '../utils/storage.js';

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
    async loadData() {
        try {
            // Load members with defaults if none exist
            this.members = await loadMembers(this.defaultMembers);
            
            // Load bank accounts with defaults if none exist
            this.bankAccounts = await loadBankAccounts(this.defaultAccounts);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu thành viên:', error);
            // Fall back to default members if loading fails
            this.members = [...this.defaultMembers];
            this.bankAccounts = {...this.defaultAccounts};
        }
    }
    
    /**
     * Save member data to storage
     * Không còn cần thiết khi sử dụng Supabase
     * Mỗi thao tác sẽ cập nhật trực tiếp vào Supabase
     */
    saveData() {
        // Method is kept for compatibility, but implementation is empty
        // as we're now using direct Supabase operations
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
    async addMember(name, accountNumber = '') {
        // Validate name
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return false;
        }
        
        name = name.trim();
        
        // Check if member already exists
        if (this.members.includes(name)) {
            return false;
        }
        
        try {
            // Add member to Supabase
            await supabase.addMember(name, accountNumber);
            
            // Update local cache
            this.members.push(name);
            if (accountNumber) {
                this.bankAccounts[name] = accountNumber;
            }
            
            // Invalidate cache to ensure fresh data on next load
            invalidateCache('members');
            
            return true;
        } catch (error) {
            console.error('Lỗi khi thêm thành viên:', error);
            return false;
        }
    }
    
    /**
     * Update a member's bank account
     * @param {string} member - The member name
     * @param {string} accountNumber - New bank account number
     * @returns {boolean} True if updated successfully
     */
    async updateMemberAccount(member, accountNumber) {
        // Validate member
        if (!this.members.includes(member)) {
            return false;
        }
        
        // Validate account number (simple validation)
        if (typeof accountNumber !== 'string') {
            return false;
        }
        
        try {
            // Update account in Supabase
            await supabase.updateMember(member, accountNumber);
            
            // Update local cache
            this.bankAccounts[member] = accountNumber;
            
            // Invalidate cache to ensure fresh data on next load
            invalidateCache('members');
            
            return true;
        } catch (error) {
            console.error('Lỗi khi cập nhật tài khoản thành viên:', error);
            return false;
        }
    }
    
    /**
     * Remove a member
     * @param {string} member - The member to remove
     * @returns {boolean} True if removed successfully
     */
    async removeMember(member) {
        const index = this.members.indexOf(member);
        if (index === -1) {
            return false;
        }
        
        try {
            // Remove member from Supabase
            await supabase.deleteMember(member);
            
            // Update local cache
            this.members.splice(index, 1);
            delete this.bankAccounts[member];
            
            // Invalidate cache to ensure fresh data on next load
            invalidateCache('members');
            
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa thành viên:', error);
            return false;
        }
    }
} 