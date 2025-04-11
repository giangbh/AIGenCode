/**
 * ExpenseUIController
 * Handles UI operations related to expenses
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatDisplayDate, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage } from '../utils/helpers.js';

export class ExpenseUIController extends UIController {
    /**
     * Create a new ExpenseUIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        super(app);
        
        // DOM Elements
        this.expenseForm = document.getElementById('expense-form');
        this.expenseDateInput = document.getElementById('expense-date');
        this.expenseNameInput = document.getElementById('expense-name');
        this.expenseAmountInput = document.getElementById('expense-amount');
        this.editExpenseIdInput = document.getElementById('edit-expense-id');
        this.payerSelect = document.getElementById('payer');
        this.participantsListDiv = document.getElementById('participants-list');
        this.formTitle = document.getElementById('form-title');
        this.saveBtnText = document.getElementById('save-btn-text');
        this.saveExpenseBtn = document.getElementById('save-expense-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.splitEquallyToggle = document.getElementById('split-equally-toggle');
        this.manualSplitSection = document.getElementById('manual-split-section');
        this.manualSplitInputsDiv = document.getElementById('manual-split-inputs');
        this.manualSplitError = document.getElementById('manual-split-error');
        this.toggleAllParticipantsBtn = document.getElementById('toggle-all-participants-btn');
        this.expenseList = document.getElementById('expense-list');
        this.noExpensesMessage = document.getElementById('no-expenses-message');
        this.quickDepositBtn = document.getElementById('quick-deposit-btn');
        
        // State
        this.editingExpenseId = null;
        
        // Initialize UI
        this.initUI();
    }
    
    /**
     * Initialize expense UI
     */
    initUI() {
        // Set initial date to today
        this.expenseDateInput.value = getTodayDateString();
        
        // Add event listeners
        this.expenseForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.expenseAmountInput.addEventListener('input', (e) => { 
            e.target.value = formatAmountInput(e.target.value);
            if (!this.splitEquallyToggle.checked) {
                this.updateManualSplitTotal();
            }
        });
        
        this.splitEquallyToggle.addEventListener('change', () => { 
            if (this.splitEquallyToggle.checked) {
                this.manualSplitSection.classList.add('hidden');
            } else {
                this.manualSplitSection.classList.remove('hidden');
                this.renderManualSplitInputs();
            }
        });
        
        this.toggleAllParticipantsBtn.addEventListener('click', () => { 
            const checkboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox');
            const allChecked = [...checkboxes].every(cb => cb.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            this.updateToggleAllButtonState();
            this.renderManualSplitInputs();
        });
        
        this.cancelEditBtn.addEventListener('click', () => this.resetForm());
        
        if (this.quickDepositBtn) {
            this.quickDepositBtn.addEventListener('click', () => {
                // Assign default member for quick deposit - can be adjusted as needed
                const defaultMember = this.app.memberManager.getAllMembers()[0] || 'Toàn';
                this.showQrCode('', defaultMember, 1000000);
            });
        }
    }
    
    /**
     * Populate member dropdowns and participant list
     */
    populateMembers() {
        const members = this.app.memberManager.getAllMembers();
        const GROUP_FUND_PAYER_ID = this.app.expenseManager.GROUP_FUND_PAYER_ID;
        
        // Payer dropdown
        this.payerSelect.innerHTML = '<option value="" disabled selected>-- Chọn người trả --</option>';
        const groupFundOption = document.createElement('option');
        groupFundOption.value = GROUP_FUND_PAYER_ID; 
        groupFundOption.textContent = 'Quỹ nhóm';
        groupFundOption.classList.add('font-semibold', 'text-sky-700'); 
        this.payerSelect.appendChild(groupFundOption);
        
        members.forEach(member => { 
            const option = document.createElement('option'); 
            option.value = member; 
            option.textContent = member; 
            this.payerSelect.appendChild(option); 
        });

        // Participant checkboxes
        this.participantsListDiv.innerHTML = '';
        members.forEach(member => { 
            const div = document.createElement('div');
            div.className = 'flex items-center';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'participants';
            checkbox.value = member;
            checkbox.id = `participant-${member}`;
            checkbox.className = 'participant-checkbox w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500';
            checkbox.checked = true;
            
            const label = document.createElement('label');
            label.htmlFor = `participant-${member}`;
            label.className = 'ml-2 block text-gray-700';
            label.textContent = member;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            this.participantsListDiv.appendChild(div);
        });
        
        this.participantsListDiv.querySelectorAll('.participant-checkbox').forEach(checkbox => { 
            checkbox.addEventListener('change', () => this.handleParticipantChange()); 
        });
        
        this.updateToggleAllButtonState();
    }
    
    /**
     * Handle participant checkbox change
     */
    handleParticipantChange() { 
        this.updateToggleAllButtonState();
        this.renderManualSplitInputs();
    }
    
    /**
     * Update toggle all button state based on checkboxes
     */
    updateToggleAllButtonState() {
        const checkboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox');
        const checkedCount = [...checkboxes].filter(cb => cb.checked).length;
        
        if (checkedCount === checkboxes.length) {
            this.toggleAllParticipantsBtn.textContent = 'Bỏ chọn tất cả';
            this.toggleAllParticipantsBtn.classList.remove('select-all');
            this.toggleAllParticipantsBtn.classList.add('clear-all');
        } else if (checkedCount === 0) {
            this.toggleAllParticipantsBtn.textContent = 'Chọn tất cả';
            this.toggleAllParticipantsBtn.classList.remove('clear-all');
            this.toggleAllParticipantsBtn.classList.add('select-all');
        } else {
            this.toggleAllParticipantsBtn.textContent = 'Bỏ chọn tất cả';
            this.toggleAllParticipantsBtn.classList.remove('select-all');
            this.toggleAllParticipantsBtn.classList.add('clear-all');
        }
    }
    
    /**
     * Render manual split inputs
     */
    renderManualSplitInputs() {
        const selectedParticipants = this.getSelectedParticipants();
        this.manualSplitInputsDiv.innerHTML = '';
        
        selectedParticipants.forEach(participant => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between';
            
            const label = document.createElement('label');
            label.htmlFor = `split-amount-${participant}`;
            label.className = 'text-sm font-medium text-gray-700';
            label.textContent = participant;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `split-amount-${participant}`;
            input.name = `split-amount-${participant}`;
            input.className = 'split-amount-input w-32 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500';
            input.placeholder = '0';
            input.inputMode = 'numeric';
            input.addEventListener('input', (e) => {
                e.target.value = formatAmountInput(e.target.value);
                this.updateManualSplitTotal();
            });
            
            div.appendChild(label);
            div.appendChild(input);
            this.manualSplitInputsDiv.appendChild(div);
        });
        
        this.updateManualSplitTotal();
    }
    
    /**
     * Update manual split total
     */
    updateManualSplitTotal() {
        const totalExpense = parseFormattedAmount(this.expenseAmountInput.value);
        const inputs = this.manualSplitInputsDiv.querySelectorAll('.split-amount-input');
        let currentTotal = 0;
        
        inputs.forEach(input => {
            currentTotal += parseFormattedAmount(input.value);
        });
        
        const manualSplitCurrentTotalSpan = document.getElementById('manual-split-current-total');
        const manualSplitRequiredTotalSpan = document.getElementById('manual-split-required-total');
        
        manualSplitCurrentTotalSpan.textContent = formatCurrency(currentTotal).replace(' ₫', '');
        manualSplitRequiredTotalSpan.textContent = formatCurrency(totalExpense).replace(' ₫', '');
        
        if (currentTotal !== totalExpense) {
            this.manualSplitError.classList.remove('hidden');
        } else {
            this.manualSplitError.classList.add('hidden');
        }
    }
    
    /**
     * Get selected participants
     * @returns {Array<string>} Array of selected participant names
     */
    getSelectedParticipants() {
        const checkboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox:checked');
        return [...checkboxes].map(cb => cb.value);
    }
    
    /**
     * Get manual splits
     * @returns {Object} Manual split amounts per participant
     */
    getManualSplits() {
        const result = {};
        const selectedParticipants = this.getSelectedParticipants();
        
        selectedParticipants.forEach(participant => {
            const input = document.getElementById(`split-amount-${participant}`);
            result[participant] = parseFormattedAmount(input.value);
        });
        
        return result;
    }
    
    /**
     * Render expense list
     */
    renderExpenseList() {
        this.expenseList.innerHTML = '';
        const expenses = this.app.expenseManager.getAllExpenses();
        
        if (expenses.length === 0) {
            this.noExpensesMessage.classList.remove('hidden');
            return;
        }
        
        this.noExpensesMessage.classList.add('hidden');
        
        // Sort expenses by date, most recent first
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedExpenses.forEach(expense => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-4';
            card.dataset.expenseId = expense.id;
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-2';
            
            const titleDate = document.createElement('div');
            
            const title = document.createElement('h3');
            title.className = 'text-lg font-medium text-gray-800';
            title.textContent = expense.name;
            
            const date = document.createElement('p');
            date.className = 'text-sm text-gray-500';
            date.textContent = formatDisplayDate(expense.date);
            
            titleDate.appendChild(title);
            titleDate.appendChild(date);
            
            const actions = document.createElement('div');
            actions.className = 'flex space-x-2';
            
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'text-blue-600 hover:text-blue-800';
            editBtn.innerHTML = '<i data-lucide="edit" class="w-4 h-4"></i>';
            editBtn.addEventListener('click', () => this.handleEditExpense(expense.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'text-red-600 hover:text-red-800';
            deleteBtn.innerHTML = '<i data-lucide="trash" class="w-4 h-4"></i>';
            deleteBtn.addEventListener('click', () => this.handleDeleteExpense(expense.id));
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            header.appendChild(titleDate);
            header.appendChild(actions);
            
            const body = document.createElement('div');
            
            const amount = document.createElement('p');
            amount.className = 'text-xl font-bold text-green-600 mb-1';
            amount.textContent = formatCurrency(expense.amount);
            
            const payer = document.createElement('p');
            payer.className = 'text-sm text-gray-700';
            
            if (expense.payer === this.app.expenseManager.GROUP_FUND_PAYER_ID) {
                payer.innerHTML = `Người trả: <span class="font-semibold text-sky-700">Quỹ nhóm</span>`;
            } else {
                payer.innerHTML = `Người trả: <span class="font-semibold">${expense.payer}</span>`;
            }
            
            const participants = document.createElement('p');
            participants.className = 'text-sm text-gray-700';
            participants.textContent = `Người tham gia: ${expense.participants.join(', ')}`;
            
            body.appendChild(amount);
            body.appendChild(payer);
            body.appendChild(participants);
            
            card.appendChild(header);
            card.appendChild(body);
            
            this.expenseList.appendChild(card);
        });
        
        // Initialize icons for the newly created buttons
        lucide.createIcons({
            attrs: {
                class: 'w-4 h-4'
            }
        });
    }
    
    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    handleFormSubmit(event) {
        event.preventDefault();
        
        const name = this.expenseNameInput.value.trim();
        const amount = parseFormattedAmount(this.expenseAmountInput.value);
        const date = this.expenseDateInput.value;
        const payer = this.payerSelect.value;
        const participants = this.getSelectedParticipants();
        
        if (participants.length === 0) {
            showMessage('Vui lòng chọn ít nhất một người tham gia', 'error');
            return;
        }
        
        const equalSplit = this.splitEquallyToggle.checked;
        let splits = {};
        
        if (!equalSplit) {
            splits = this.getManualSplits();
            
            // Validate that manual splits sum to the expense amount
            const totalSplit = Object.values(splits).reduce((sum, val) => sum + val, 0);
            if (Math.abs(totalSplit - amount) > 0.01) {
                showMessage('Tổng số tiền phân chia không khớp với tổng chi tiêu', 'error');
                return;
            }
        }
        
        try {
            if (this.editingExpenseId) {
                // Edit existing expense
                this.app.expenseManager.updateExpense(this.editingExpenseId, {
                    name,
                    amount,
                    date,
                    payer,
                    participants,
                    equalSplit,
                    splits: equalSplit ? {} : splits,
                });
                
                showMessage('Chi tiêu đã được cập nhật');
            } else {
                // Create new expense
                this.app.expenseManager.addExpense({
                    name,
                    amount,
                    date,
                    payer,
                    participants,
                    equalSplit,
                    splits: equalSplit ? {} : splits,
                });
                
                showMessage('Chi tiêu mới đã được thêm');
            }
            
            // Update UI
            this.app.renderAll();
            this.resetForm();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
    
    /**
     * Handle edit expense action
     * @param {string} expenseId - The expense ID
     */
    handleEditExpense(expenseId) {
        const expense = this.app.expenseManager.getExpenseById(expenseId);
        if (!expense) return;
        
        // Set editing state
        this.editingExpenseId = expenseId;
        this.editExpenseIdInput.value = expenseId;
        
        // Update form UI
        this.formTitle.textContent = 'Sửa chi tiêu';
        this.saveBtnText.textContent = 'Cập nhật';
        this.saveExpenseBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        this.saveExpenseBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        this.cancelEditBtn.classList.remove('hidden');
        
        // Populate form data
        this.expenseNameInput.value = expense.name;
        this.expenseAmountInput.value = formatAmountInput(expense.amount.toString());
        this.expenseDateInput.value = expense.date;
        this.payerSelect.value = expense.payer;
        
        // Set participant checkboxes
        this.participantsListDiv.querySelectorAll('.participant-checkbox').forEach(checkbox => {
            checkbox.checked = expense.participants.includes(checkbox.value);
        });
        this.updateToggleAllButtonState();
        
        // Set split equally toggle
        this.splitEquallyToggle.checked = expense.equalSplit;
        
        // Handle manual split section visibility
        if (!expense.equalSplit) {
            this.manualSplitSection.classList.remove('hidden');
            this.renderManualSplitInputs();
            
            // Populate split amounts
            Object.entries(expense.splits).forEach(([participant, splitAmount]) => {
                const input = document.getElementById(`split-amount-${participant}`);
                if (input) {
                    input.value = formatAmountInput(splitAmount.toString());
                }
            });
            
            this.updateManualSplitTotal();
        } else {
            this.manualSplitSection.classList.add('hidden');
        }
        
        // Scroll to form
        document.getElementById('expense-form-section').scrollIntoView({
            behavior: 'smooth'
        });
    }
    
    /**
     * Handle delete expense action
     * @param {string} expenseId - The expense ID
     */
    handleDeleteExpense(expenseId) {
        if (confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) {
            if (this.app.expenseManager.deleteExpense(expenseId)) {
                this.app.renderAll();
                showMessage('Chi tiêu đã được xóa');
            }
        }
    }
    
    /**
     * Reset the expense form
     */
    resetForm() {
        // Reset expense form
        this.expenseForm.reset();
        this.editingExpenseId = null; 
        this.editExpenseIdInput.value = '';
        this.formTitle.textContent = 'Thêm chi tiêu mới'; 
        this.saveBtnText.textContent = 'Lưu chi tiêu';
        this.saveExpenseBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600'); 
        this.saveExpenseBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        this.cancelEditBtn.classList.add('hidden');
        this.expenseDateInput.value = getTodayDateString();
        this.participantsListDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        this.splitEquallyToggle.checked = true;
        this.manualSplitSection.classList.add('hidden'); 
        this.manualSplitInputsDiv.innerHTML = ''; 
        this.manualSplitError.classList.add('hidden');
        this.splitEquallyToggle.dispatchEvent(new Event('change'));
        this.handleParticipantChange();
        this.expenseAmountInput.value = '';
        this.updateToggleAllButtonState();
    }
    
    /**
     * Render the results section
     * @param {Object} results - Calculation results
     */
    renderResults(results) {
        const individualSummaryEl = document.getElementById('individual-summary');
        const transactionsEl = document.getElementById('transactions');
        
        // Update fund balance display
        const fundBalanceEl = document.getElementById('expenses-group-fund-balance');
        if (fundBalanceEl) {
            fundBalanceEl.textContent = formatCurrency(this.app.fundManager.getBalance());
        }
        
        if (!results || !results.balances) {
            individualSummaryEl.innerHTML = '<li class="text-gray-500 italic">Chưa có dữ liệu để tính toán.</li>';
            transactionsEl.innerHTML = '<li class="text-gray-500 italic">Chưa có dữ liệu để tính toán.</li>';
            return;
        }
        
        // Render individual summary
        individualSummaryEl.innerHTML = '';
        
        const members = this.app.memberManager.getAllMembers();
        members.forEach(member => {
            const balance = results.balances[member];
            if (!balance) return;
            
            const li = document.createElement('li');
            li.className = 'py-1 border-b border-gray-100 flex justify-between';
            
            const name = document.createElement('span');
            name.textContent = member;
            
            const summary = document.createElement('span');
            summary.className = balance.net > 0 ? 'text-green-600 font-semibold' : 
                               balance.net < 0 ? 'text-red-600 font-semibold' : '';
            summary.textContent = formatCurrency(balance.net);
            
            li.appendChild(name);
            li.appendChild(summary);
            individualSummaryEl.appendChild(li);
        });
        
        // Render transactions
        transactionsEl.innerHTML = '';
        
        if (!results.hasNonFundExpenses) {
            transactionsEl.innerHTML = '<li class="text-gray-500 italic">Tất cả chi tiêu đều từ quỹ nhóm, không cần chuyển tiền.</li>';
            return;
        }
        
        if (results.transactions.length === 0) {
            transactionsEl.innerHTML = '<li class="text-gray-500 italic">Không có giao dịch cần thực hiện.</li>';
            return;
        }
        
        results.transactions.forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'py-1 border-b border-gray-100';
            
            const qrBtn = document.createElement('button');
            qrBtn.type = 'button';
            qrBtn.className = 'qr-link ml-2 text-blue-600 hover:text-blue-800 text-xs';
            qrBtn.dataset.debtor = transaction.from;
            qrBtn.dataset.creditor = transaction.to;
            qrBtn.dataset.amount = transaction.amount;
            qrBtn.innerHTML = '<i data-lucide="qr-code" class="w-3 h-3 mr-1"></i>QR';
            qrBtn.addEventListener('click', () => {
                this.showQrCode(transaction.from, transaction.to, transaction.amount);
            });
            
            // Check if QR code is available for this transaction
            const bankAccounts = this.app.memberManager.getAllBankAccounts();
            if (!(transaction.to in bankAccounts)) {
                qrBtn.disabled = true;
                qrBtn.setAttribute('disabled', 'disabled');
            }
            
            li.innerHTML = `<span class="font-medium">${transaction.from}</span> chuyển <span class="font-semibold text-green-600">${formatCurrency(transaction.amount)}</span> cho <span class="font-medium">${transaction.to}</span>`;
            li.appendChild(qrBtn);
            
            transactionsEl.appendChild(li);
        });
        
        // Initialize icons for the QR buttons
        lucide.createIcons({
            attrs: {
                class: 'w-3 h-3'
            }
        });
    }
} 