/**
 * ExpenseManager Controller
 * Manages expenses and expense-related operations
 */

import { Expense } from '../models/Expense.js';
import { FundTransaction } from '../models/FundTransaction.js';
import { formatCurrency, formatDisplayDate, showMessage } from '../utils/helpers.js';
import { saveExpenses, loadExpenses } from '../utils/storage.js';

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
    loadData() {
        const expenseData = loadExpenses();
        this.expenses = expenseData.map(exp => Expense.fromObject(exp));
    }
    
    /**
     * Save expenses to storage
     */
    saveData() {
        const expenseData = this.expenses.map(exp => exp.toObject());
        saveExpenses(expenseData);
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
    addExpense(expenseData) {
        // Check if fund has enough balance when it's the payer
        if (expenseData.payer === this.GROUP_FUND_PAYER_ID) {
            const fundBalance = this.fundManager.getBalance();
            if (expenseData.amount > fundBalance) {
                throw new Error(`Số dư quỹ nhóm không đủ để chi trả khoản này. Số dư hiện tại: ${formatCurrency(fundBalance)}`);
            }
        }
        
        // Create new expense
        const expense = new Expense(expenseData);
        this.expenses.push(expense);
        
        // If group fund is the payer, update fund balance
        if (expense.payer === this.GROUP_FUND_PAYER_ID) {
            this._handleGroupFundPayment(expense);
        }
        
        // Save changes
        this.saveData();
        return expense;
    }
    
    /**
     * Update an existing expense
     * @param {string} id - The expense ID
     * @param {Object} newData - The updated expense data
     * @returns {Expense} The updated expense
     */
    updateExpense(id, newData) {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index === -1) {
            throw new Error('Chi tiêu không tồn tại');
        }
        
        const oldExpense = this.expenses[index];
        
        // Check if fund has enough balance when changing payer to fund
        if (oldExpense.payer !== this.GROUP_FUND_PAYER_ID && 
            newData.payer === this.GROUP_FUND_PAYER_ID) {
            const fundBalance = this.fundManager.getBalance();
            if (newData.amount > fundBalance) {
                throw new Error(`Số dư quỹ nhóm không đủ để chi trả khoản này. Số dư hiện tại: ${formatCurrency(fundBalance)}`);
            }
        }
        
        // Update fund balance if payer changed
        if (oldExpense.payer === this.GROUP_FUND_PAYER_ID && 
            newData.payer !== this.GROUP_FUND_PAYER_ID) {
            // Old payer was group fund, new payer is not - refund the group fund
            this._handleGroupFundRefund(oldExpense);
        } 
        else if (oldExpense.payer !== this.GROUP_FUND_PAYER_ID && 
                 newData.payer === this.GROUP_FUND_PAYER_ID) {
            // Create new expense object for payment handling
            const tempExpense = new Expense({
                ...newData,
                id: oldExpense.id
            });
            
            // Old payer was not group fund, new payer is - deduct from fund
            this._handleGroupFundPayment(tempExpense);
        }
        else if (oldExpense.payer === this.GROUP_FUND_PAYER_ID && 
                 newData.payer === this.GROUP_FUND_PAYER_ID) {
            // Both old and new payer are group fund, adjust for amount difference
            this._handleGroupFundUpdate(oldExpense, newData);
        }
        
        // Update the expense data
        oldExpense.update(newData);
        
        // Save changes
        this.saveData();
        return oldExpense;
    }
    
    /**
     * Delete an expense
     * @param {string} id - The expense ID
     * @returns {boolean} True if deleted successfully
     */
    deleteExpense(id) {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index === -1) return false;
        
        const expense = this.expenses[index];
        
        // If the expense was paid by the group fund, restore the balance
        if (expense.payer === this.GROUP_FUND_PAYER_ID) {
            this._handleGroupFundRefund(expense);
        }
        
        // Remove the expense
        this.expenses.splice(index, 1);
        
        // Save changes
        this.saveData();
        return true;
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
            const debtors = members.filter(member => balances[member].net < 0)
                .sort((a, b) => balances[a].net - balances[b].net);
            const creditors = members.filter(member => balances[member].net > 0)
                .sort((a, b) => balances[b].net - balances[a].net);
            
            // Generate simplified transactions
            let totalMoved = 0;
            
            let debtorIndex = 0;
            let creditorIndex = 0;
            
            while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
                const debtor = debtors[debtorIndex];
                const creditor = creditors[creditorIndex];
                
                const debtAmount = Math.abs(balances[debtor].net);
                const creditAmount = balances[creditor].net;
                
                const transferAmount = Math.min(debtAmount, creditAmount);
                
                totalMoved += transferAmount;
                transactions.push({
                    from: debtor,
                    to: creditor,
                    amount: Math.round(transferAmount)
                });
                
                balances[debtor].net += transferAmount;
                balances[creditor].net -= transferAmount;
                
                if (Math.abs(balances[debtor].net) < 1) {
                    debtorIndex++;
                }
                
                if (Math.abs(balances[creditor].net) < 1) {
                    creditorIndex++;
                }
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
    _handleGroupFundPayment(expense) {
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
        this.fundManager.addTransaction(transaction, memberBalances);
    }
    
    /**
     * Handle group fund refund (when removing or changing an expense)
     * @private
     * @param {Expense} expense - The expense
     */
    _handleGroupFundRefund(expense) {
        // Calculate member balances to be restored
        const memberBalances = {};
        
        if (expense.equalSplit) {
            const splitAmount = expense.amount / expense.participants.length;
            expense.participants.forEach(participant => {
                memberBalances[participant] = splitAmount; // positive = refund
            });
        } else {
            Object.entries(expense.splits).forEach(([participant, splitAmount]) => {
                memberBalances[participant] = splitAmount; // positive = refund
            });
        }
        
        // Remove the expense transaction and refund the balance
        this.fundManager.removeExpenseTransaction(expense.id, memberBalances);
    }
    
    /**
     * Handle group fund update (when updating an expense paid by group fund)
     * @private
     * @param {Expense} oldExpense - The old expense
     * @param {Object} newData - The new expense data
     */
    _handleGroupFundUpdate(oldExpense, newData) {
        // First refund the old amounts (add back to member balances)
        const refundBalances = {};
        
        if (oldExpense.equalSplit) {
            const oldSplitAmount = oldExpense.amount / oldExpense.participants.length;
            oldExpense.participants.forEach(participant => {
                refundBalances[participant] = oldSplitAmount; // positive = refund
            });
        } else {
            Object.entries(oldExpense.splits).forEach(([participant, splitAmount]) => {
                refundBalances[participant] = splitAmount; // positive = refund
            });
        }
        
        // Then calculate the new amounts to deduct
        const newDeductionBalances = {};
        
        if (newData.equalSplit) {
            const newSplitAmount = newData.amount / newData.participants.length;
            newData.participants.forEach(participant => {
                newDeductionBalances[participant] = -newSplitAmount; // negative = deduction
            });
        } else {
            Object.entries(newData.splits).forEach(([participant, splitAmount]) => {
                newDeductionBalances[participant] = -splitAmount; // negative = deduction
            });
        }
        
        // Combine the balances (refunds + new deductions)
        const combinedBalances = {};
        
        // Add all refunds
        Object.entries(refundBalances).forEach(([participant, amount]) => {
            combinedBalances[participant] = amount;
        });
        
        // Add all new deductions
        Object.entries(newDeductionBalances).forEach(([participant, amount]) => {
            combinedBalances[participant] = (combinedBalances[participant] || 0) + amount;
        });
        
        // Update the transaction in the fund
        this.fundManager.updateExpenseTransaction(
            oldExpense.id,
            newData.name,
            newData.amount,
            newData.date,
            combinedBalances
        );
    }
} 