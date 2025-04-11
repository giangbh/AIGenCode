/**
 * ExpenseManager Controller
 * Manages expenses and expense-related operations
 */

import { Expense } from '../models/Expense.js';
import { FundTransaction } from '../models/FundTransaction.js';
import { formatCurrency, formatDisplayDate, showMessage } from '../utils/helpers.js';
import { loadExpenses, invalidateCache, supabase } from '../utils/storage.js';

export class ExpenseManager {
    /**
     * Create a new ExpenseManager
     * @param {GroupFundManager} fundManager - Reference to the fund manager
     */
    constructor(fundManager) {
        this.expenses = [];
        this.fundManager = fundManager;
        this.GROUP_FUND_PAYER_ID = "__GROUP_FUND__";
        
        // Load expenses
        this.loadData();
    }
    
    /**
     * Load expense data from storage
     */
    async loadData() {
        try {
            const expenseData = await loadExpenses();
            this.expenses = expenseData.map(exp => Expense.fromObject(exp));
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu chi tiêu:', error);
            this.expenses = [];
        }
    }
    
    /**
     * Save expenses to storage
     * Không còn cần thiết khi sử dụng Supabase
     * Mỗi thao tác sẽ cập nhật trực tiếp vào Supabase
     */
    saveData() {
        // Method is kept for compatibility, but implementation is empty
        // as we're now using direct Supabase operations
    }
    
    /**
     * Get all expenses
     * @returns {Array<Expense>} All expenses
     */
    getAllExpenses() {
        return this.expenses;
    }
    
    /**
     * Get an expense by ID
     * @param {string} id - The expense ID
     * @returns {Expense|null} The expense or null if not found
     */
    getExpenseById(id) {
        return this.expenses.find(expense => expense.id === id) || null;
    }
    
    /**
     * Add a new expense
     * @param {Object} expenseData - The expense data
     * @returns {Expense} The newly created expense
     */
    async addExpense(expenseData) {
        // Check if fund has enough balance when it's the payer
        if (expenseData.payer === this.GROUP_FUND_PAYER_ID) {
            const fundBalance = this.fundManager.getBalance();
            if (expenseData.amount > fundBalance) {
                throw new Error(`Số dư quỹ nhóm không đủ để chi trả khoản này. Số dư hiện tại: ${formatCurrency(fundBalance)}`);
            }
        }
        
        try {
            // Add expense to Supabase
            const savedExpense = await supabase.addExpense(expenseData);
            
            // Create new expense
            const expense = Expense.fromObject(savedExpense);
            this.expenses.push(expense);
            
            // If group fund is the payer, update fund balance
            if (expense.payer === this.GROUP_FUND_PAYER_ID) {
                await this._handleGroupFundPayment(expense);
            }
            
            // Invalidate cache
            invalidateCache('expenses');
            
            return expense;
        } catch (error) {
            console.error('Lỗi khi thêm chi tiêu:', error);
            throw error;
        }
    }
    
    /**
     * Update an existing expense
     * @param {string} id - The expense ID
     * @param {Object} newData - The updated expense data
     * @returns {Expense} The updated expense
     */
    async updateExpense(id, newData) {
        const index = this.expenses.findIndex(e => e.id === id);
        
        if (index === -1) {
            throw new Error('Chi tiêu không tồn tại');
        }
        
        const oldExpense = this.expenses[index];
        
        // Check if fund has enough balance when changing payer to group fund
        if (newData.payer === this.GROUP_FUND_PAYER_ID && 
            oldExpense.payer !== this.GROUP_FUND_PAYER_ID) {
            const fundBalance = this.fundManager.getBalance();
            if (newData.amount > fundBalance) {
                throw new Error(`Số dư quỹ nhóm không đủ để chi trả khoản này. Số dư hiện tại: ${formatCurrency(fundBalance)}`);
            }
        }
        
        // If changing from group fund to a higher amount, check balance
        if (newData.payer === this.GROUP_FUND_PAYER_ID && 
            oldExpense.payer === this.GROUP_FUND_PAYER_ID &&
            newData.amount > oldExpense.amount) {
            const fundBalance = this.fundManager.getBalance();
            const difference = newData.amount - oldExpense.amount;
            if (difference > fundBalance) {
                throw new Error(`Số dư quỹ nhóm không đủ để chi trả khoản chênh lệch. Số dư hiện tại: ${formatCurrency(fundBalance)}`);
            }
        }
        
        try {
            // Update fund balance if payer changed
            if (oldExpense.payer === this.GROUP_FUND_PAYER_ID && 
                newData.payer !== this.GROUP_FUND_PAYER_ID) {
                // Old payer was group fund, new payer is not - refund the group fund
                await this._handleGroupFundRefund(oldExpense);
            } 
            else if (oldExpense.payer !== this.GROUP_FUND_PAYER_ID && 
                     newData.payer === this.GROUP_FUND_PAYER_ID) {
                // Create new expense object for payment handling
                const tempExpense = new Expense({
                    ...newData,
                    id: oldExpense.id
                });
                
                // Old payer was not group fund, new payer is - deduct from fund
                await this._handleGroupFundPayment(tempExpense);
            }
            else if (oldExpense.payer === this.GROUP_FUND_PAYER_ID && 
                     newData.payer === this.GROUP_FUND_PAYER_ID) {
                // Both old and new payer are group fund, adjust for amount difference
                await this._handleGroupFundUpdate(oldExpense, newData);
            }
            
            // Update the expense in Supabase
            const updatedExpense = await supabase.updateExpense(id, {
                ...newData,
                id: oldExpense.id
            });
            
            // Update local expense object
            oldExpense.update(newData);
            
            // Invalidate cache
            invalidateCache('expenses');
            
            return oldExpense;
        } catch (error) {
            console.error('Lỗi khi cập nhật chi tiêu:', error);
            throw error;
        }
    }
    
    /**
     * Delete an expense
     * @param {string} id - The expense ID
     * @returns {boolean} True if deleted successfully
     */
    async deleteExpense(id) {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index === -1) return false;
        
        const expense = this.expenses[index];
        
        try {
            // If the expense was paid by the group fund, restore the balance
            if (expense.payer === this.GROUP_FUND_PAYER_ID) {
                await this._handleGroupFundRefund(expense);
            }
            
            // Delete expense from Supabase
            await supabase.deleteExpense(id);
            
            // Remove the expense from local cache
            this.expenses.splice(index, 1);
            
            // Invalidate cache
            invalidateCache('expenses');
            
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa chi tiêu:', error);
            return false;
        }
    }
    
    /**
     * Calculate expense results (who owes whom)
     * @param {Array<string>} members - List of all members
     * @returns {Object} Calculation results
     */
    calculateResults(members) {
        if (this.expenses.length === 0) {
            return {
                balances: {},
                transactions: [],
                hasNonFundExpenses: false
            };
        }
        
        // Calculate how much each person paid and owes
        const balances = {};
        members.forEach(member => balances[member] = { paid: 0, owes: 0, net: 0 });
        
        // Process all expenses
        let hasNonFundExpenses = false;
        
        this.expenses.forEach(expense => {
            const amount = expense.amount;
            
            // Skip group fund expenses for settlement calculations
            if (expense.payer === this.GROUP_FUND_PAYER_ID) {
                return; // Skip this expense - it's paid from the group fund
            }
            
            hasNonFundExpenses = true;
            
            // Add what the payer paid
            balances[expense.payer].paid += amount;
            
            // Add what each participant owes
            if (expense.equalSplit) {
                const equalSplit = amount / expense.participants.length;
                expense.participants.forEach(participant => {
                    balances[participant].owes += equalSplit;
                });
            } else {
                // For manual splits
                Object.entries(expense.splits).forEach(([participant, amount]) => {
                    balances[participant].owes += amount;
                });
            }
        });
        
        // Calculate net balances
        members.forEach(member => {
            balances[member].net = balances[member].paid - balances[member].owes;
        });
        
        // Calculate transactions if there are non-fund expenses
        const transactions = [];
        
        if (hasNonFundExpenses) {
            // Make copies for calculation
            const creditors = members.filter(m => balances[m].net > 0)
                .map(member => ({
                    name: member,
                    amount: balances[member].net
                }))
                .sort((a, b) => b.amount - a.amount);
                
            const debtors = members.filter(m => balances[m].net < 0)
                .map(member => ({
                    name: member,
                    amount: -balances[member].net
                }))
                .sort((a, b) => b.amount - a.amount);
            
            // Calculate settlement transactions
            while (creditors.length > 0 && debtors.length > 0) {
                const creditor = creditors[0];
                const debtor = debtors[0];
                
                const amount = Math.min(creditor.amount, debtor.amount);
                
                transactions.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amount,
                    formattedAmount: formatCurrency(amount)
                });
                
                creditor.amount -= amount;
                debtor.amount -= amount;
                
                if (creditor.amount < 1) creditors.shift();
                if (debtor.amount < 1) debtors.shift();
            }
        }
        
        return {
            balances,
            transactions,
            hasNonFundExpenses
        };
    }
    
    /**
     * Handle group fund payment (when fund is the payer)
     * @private
     * @param {Expense} expense - The expense
     */
    async _handleGroupFundPayment(expense) {
        // Create fund transaction for this expense
        const transaction = FundTransaction.createExpense(
            expense.id,
            expense.name,
            expense.amount,
            expense.date
        );
        
        // Calculate member balances
        const memberBalances = {};
        
        if (expense.equalSplit) {
            // Equal split case
            const splitAmount = expense.amount / expense.participants.length;
            expense.participants.forEach(participant => {
                memberBalances[participant] = -splitAmount;
            });
        } else {
            // Manual split case
            Object.entries(expense.splits).forEach(([participant, splitAmount]) => {
                memberBalances[participant] = -splitAmount;
            });
        }
        
        // Update fund (decreases fund balance and adjusts member balances)
        await this.fundManager.addTransaction(transaction, memberBalances);
    }
    
    /**
     * Handle refund to group fund (when expense paid by fund is deleted or updated)
     * @private
     * @param {Expense} expense - The expense that was paid by the fund
     */
    async _handleGroupFundRefund(expense) {
        // We need to update member balances to remove the expense
        const memberBalances = {};
        
        if (expense.equalSplit) {
            const splitAmount = expense.amount / expense.participants.length;
            expense.participants.forEach(participant => {
                memberBalances[participant] = splitAmount; // Positive to remove negative
            });
        } else {
            Object.entries(expense.splits).forEach(([participant, splitAmount]) => {
                memberBalances[participant] = splitAmount; // Positive to remove negative
            });
        }
        
        // Delete any fund transaction associated with this expense
        await this.fundManager.removeExpenseTransaction(expense.id);
    }
    
    /**
     * Handle group fund update when amount changes but payer stays as group fund
     * @private
     * @param {Expense} oldExpense - The original expense
     * @param {Object} newData - The updated expense data
     */
    async _handleGroupFundUpdate(oldExpense, newData) {
        // First refund the old expense
        await this._handleGroupFundRefund(oldExpense);
        
        // Then create a new expense with the new data
        const tempExpense = new Expense({
            ...newData,
            id: oldExpense.id
        });
        
        // Handle payment with new amount
        await this._handleGroupFundPayment(tempExpense);
    }
} 