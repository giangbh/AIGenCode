/**
 * GroupFundManager Controller
 * Manages the group fund and related transactions
 */

import { FundTransaction } from '../models/FundTransaction.js';
import { loadFundTransactions, invalidateCache, supabase, getCurrentBalance, updateFundBalance, recalculateBalance, getMemberBalance, updateMemberBalance } from '../utils/storage.js';

export class GroupFundManager {
    /**
     * Create a new GroupFundManager
     */
    constructor() {
        this.balance = 0;
        this.transactions = [];
        this.memberBalances = {};
        this.app = null;
        
        // Load data
        this.loadData();
    }
    
    /**
     * Set app reference 
     * @param {App} app - The main application instance
     */
    setApp(app) {
        this.app = app;
    }
    
    /**
     * Load fund data from storage
     */
    async loadData() {
        try {
            // Lấy số dư quỹ hiện tại từ bảng fund_balance
            const fundBalance = await getCurrentBalance();
            this.balance = fundBalance;
            
            // Vẫn tải transactions để hiển thị lịch sử và tính số dư thành viên
            const transactionsData = await loadFundTransactions();
            this.transactions = transactionsData.map(t => FundTransaction.fromObject(t));
            
            // Lấy danh sách thành viên nếu app đã được khởi tạo
            let members = [];
            if (this.app && this.app.memberManager) {
                members = this.app.memberManager.getAllMembers();
            }
            
            // Tải số dư của từng thành viên
            await this.loadMemberBalances(members);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu quỹ:', error);
            this.balance = 0;
            this.transactions = [];
            this.memberBalances = {};
        }
    }
    
    /**
     * Tải số dư thành viên từ database
     * @param {Array<string>} members - Danh sách thành viên
     */
    async loadMemberBalances(members = []) {
        try {
            // Khởi tạo đối tượng memberBalances
            this.memberBalances = {};
            
            // Tải số dư của từng thành viên từ bảng member_balances
            await Promise.all(members.map(async (member) => {
                this.memberBalances[member] = await getMemberBalance(member);
            }));
        } catch (error) {
            console.error('Lỗi khi tải số dư thành viên:', error);
            // Dùng phương pháp tính từ giao dịch nếu gặp lỗi
            this.recalculateMemberBalances(members);
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
            
            // Cập nhật số dư quỹ trong database
            await updateFundBalance(this.balance, transaction.id);
            
            // Update member balance locally
            this.memberBalances[member] = (this.memberBalances[member] || 0) + amount;
            
            // Cập nhật số dư thành viên trong database
            await updateMemberBalance(member, this.memberBalances[member], transaction.id);
            
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
                    transaction.date
                );
            }
            
            // Update the transaction with Supabase ID
            transaction.id = savedTransaction.id;
            
            // Update fund balance locally
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
            
            // Cập nhật số dư quỹ trong database
            await updateFundBalance(this.balance, transaction.id);
            
            // Apply member balance changes locally
            Object.entries(memberBalanceChanges).forEach(([member, change]) => {
                this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
            });
            
            // Cập nhật số dư thành viên trong database
            await Promise.all(Object.entries(memberBalanceChanges).map(async ([member, change]) => {
                await updateMemberBalance(member, this.memberBalances[member], transaction.id);
            }));
            
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
            
            // Update fund balance locally
            this.balance += transaction.amount;
            
            // Cập nhật số dư quỹ trong database
            await updateFundBalance(this.balance, null);
            
            // Apply member balance changes locally
            Object.entries(memberBalanceChanges).forEach(([member, change]) => {
                this.memberBalances[member] = (this.memberBalances[member] || 0) + change;
            });
            
            // Cập nhật số dư thành viên trong database
            await Promise.all(Object.entries(memberBalanceChanges).map(async ([member, change]) => {
                await updateMemberBalance(member, this.memberBalances[member], null);
            }));
            
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
     * Recalculate member balances from transactions
     * @param {Array<string>} [members] - Optional list of members to ensure in balances
     */
    recalculateMemberBalances(members = []) {
        // Reset balances
        this.memberBalances = {};
        
        // Initialize members
        members.forEach(member => {
            this.memberBalances[member] = 0;
        });
        
        // Calculate balances from transactions
        this.transactions.forEach(transaction => {
            if (transaction.isDeposit() && transaction.member) {
                // Add deposit to member balance
                this.memberBalances[transaction.member] = 
                    (this.memberBalances[transaction.member] || 0) + transaction.amount;
            } 
            else if (transaction.isExpense() && transaction.expenseData) {
                // For expenses, distribute costs according to the expense data
                try {
                    const expenseData = JSON.parse(transaction.expenseData);
                    if (expenseData && expenseData.balanceChanges) {
                        Object.entries(expenseData.balanceChanges).forEach(([member, change]) => {
                            this.memberBalances[member] = 
                                (this.memberBalances[member] || 0) + change;
                        });
                    }
                } catch (error) {
                    console.error('Lỗi khi phân tích dữ liệu chi tiêu:', error);
                }
            }
        });
    }
    
    /**
     * Đồng bộ số dư từ database (chạy định kỳ hoặc khi phát hiện khác biệt)
     */
    async synchronizeBalance() {
        try {
            // Lấy số dư từ database
            const databaseBalance = await getCurrentBalance();
            
            // So sánh với số dư cục bộ
            if (databaseBalance !== this.balance) {
                console.log(`Phát hiện khác biệt số dư: Cục bộ=${this.balance}, Database=${databaseBalance}`);
                
                // Cập nhật số dư cục bộ
                this.balance = databaseBalance;
                
                // Cập nhật UI nếu app đã được khởi tạo
                if (this.app && this.app.fundUIController) {
                    this.app.fundUIController.renderFundStatus();
                    this.app.fundUIController.updateAllFundBalanceDisplays();
                }
            }
        } catch (error) {
            console.error('Lỗi khi đồng bộ số dư:', error);
        }
    }
    
    /**
     * Tính toán lại số dư quỹ và đồng bộ với database (chỉ dùng khi cần)
     */
    async forceRecalculateBalance() {
        try {
            // Sử dụng hàm tính toán lại từ database
            const recalculatedBalance = await recalculateBalance();
            
            // Cập nhật số dư cục bộ
            this.balance = recalculatedBalance;
            
            // Cập nhật UI nếu app đã được khởi tạo
            if (this.app && this.app.fundUIController) {
                this.app.fundUIController.renderFundStatus();
                this.app.fundUIController.updateAllFundBalanceDisplays();
            }
            
            console.log(`Đã tính lại số dư quỹ: ${this.balance}`);
            return this.balance;
        } catch (error) {
            console.error('Lỗi khi tính lại số dư quỹ:', error);
            throw error;
        }
    }
    
    /**
     * Tải giao dịch quỹ theo trang
     * @param {number} page Số trang
     * @param {number} pageSize Số lượng giao dịch mỗi trang
     * @returns {Promise<Array>} Danh sách giao dịch
     */
    async loadTransactionsByPage(page = 1, pageSize = 20) {
        try {
            const { data, error } = await supabase.from('fund_transactions')
                .select('*')
                .order('date', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);
            
            if (error) {
                console.error('Lỗi khi tải giao dịch quỹ theo trang:', error);
                return [];
            }
            
            return data.map(t => FundTransaction.fromObject(t));
        } catch (error) {
            console.error('Lỗi khi tải giao dịch quỹ theo trang:', error);
            return [];
        }
    }
    
    /**
     * Clear all fund data
     */
    async clearAllData() {
        this.balance = 0;
        this.transactions = [];
        this.memberBalances = {};
        
        // No need to save, as balances are calculated from transactions now
        // and all transactions have been deleted from Supabase
        invalidateCache('fundTransactions');
    }
} 