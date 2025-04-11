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
        this.currentPage = 1;
        this.sortField = 'date';
        this.sortDirection = true; // descending
        
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
        this.payerSelect.innerHTML = '<option value="" disabled>-- Chọn người trả --</option>';
        const groupFundOption = document.createElement('option');
        groupFundOption.value = GROUP_FUND_PAYER_ID; 
        groupFundOption.textContent = 'Quỹ nhóm';
        groupFundOption.classList.add('font-semibold', 'text-sky-700'); 
        groupFundOption.selected = true; // Set as default selected option
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
        
        // Add sorting controls
        const sortingControls = document.createElement('div');
        sortingControls.className = 'flex flex-wrap items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg';
        
        // Control buttons container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'flex items-center';
        
        const sortingLabel = document.createElement('span');
        sortingLabel.className = 'text-sm text-gray-600 mr-2';
        sortingLabel.textContent = 'Sắp xếp theo:';
        
        // Add expand/collapse all button
        const toggleAllBtn = document.createElement('button');
        toggleAllBtn.type = 'button';
        toggleAllBtn.className = 'ml-4 flex items-center text-sm bg-white text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50';
        toggleAllBtn.innerHTML = '<i data-lucide="chevrons-down" class="w-3 h-3 mr-1"></i> Mở rộng tất cả';
        toggleAllBtn.dataset.expanded = 'false';
        
        toggleAllBtn.addEventListener('click', () => {
            const isExpanded = toggleAllBtn.dataset.expanded === 'true';
            const expenseItems = this.expenseList.querySelectorAll('[data-expense-id]');
            
            expenseItems.forEach(item => {
                const header = item.querySelector('div:first-child');
                const body = item.querySelector('div:nth-child(2)');
                const collapseIcon = header.querySelector('.collapse-icon');
                
                if (isExpanded) {
                    // Collapse all
                    body.style.maxHeight = null;
                    collapseIcon.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
                    toggleAllBtn.innerHTML = '<i data-lucide="chevrons-down" class="w-3 h-3 mr-1"></i> Mở rộng tất cả';
                } else {
                    // Expand all
                    body.style.maxHeight = body.scrollHeight + "px";
                    collapseIcon.innerHTML = '<i data-lucide="chevron-up" class="w-4 h-4"></i>';
                    toggleAllBtn.innerHTML = '<i data-lucide="chevrons-up" class="w-3 h-3 mr-1"></i> Thu gọn tất cả';
                }
            });
            
            toggleAllBtn.dataset.expanded = isExpanded ? 'false' : 'true';
            
            // Initialize icons in the new elements
            lucide.createIcons({
                scope: toggleAllBtn
            });
        });
        
        controlsContainer.appendChild(sortingLabel);
        controlsContainer.appendChild(toggleAllBtn);
        
        const sortOptions = [
            { value: 'date', label: 'Ngày' },
            { value: 'amount', label: 'Số tiền' },
            { value: 'name', label: 'Tên chi tiêu' }
        ];
        
        const sortButtonsContainer = document.createElement('div');
        sortButtonsContainer.className = 'flex flex-wrap gap-2';
        
        sortOptions.forEach(option => {
            const sortButton = document.createElement('button');
            sortButton.type = 'button';
            
            const isActive = this.sortField === option.value;
            
            if (isActive) {
                sortButton.className = 'flex items-center text-sm bg-green-600 text-white px-3 py-1 rounded';
                const iconName = this.sortDirection ? 'arrow-down' : 'arrow-up';
                sortButton.innerHTML = `${option.label} <i data-lucide="${iconName}" class="w-3 h-3 ml-1"></i>`;
            } else {
                sortButton.className = 'flex items-center text-sm bg-white text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50';
                sortButton.textContent = option.label;
            }
            
            sortButton.addEventListener('click', () => {
                if (this.sortField === option.value) {
                    // Toggle direction if sorting by same field
                    this.sortDirection = !this.sortDirection;
                } else {
                    // New field, use default direction (descending)
                    this.sortField = option.value;
                    this.sortDirection = true;
                }
                
                // Reset to first page when changing sort
                this.currentPage = 1;
                this.renderExpenseList();
            });
            
            sortButtonsContainer.appendChild(sortButton);
        });
        
        sortingControls.appendChild(controlsContainer);
        sortingControls.appendChild(sortButtonsContainer);
        this.expenseList.appendChild(sortingControls);
        
        // Get paginated expenses
        const paginatedData = this.app.expenseManager.getPaginatedExpenses(
            this.currentPage, 
            5, // items per page
            this.sortField, 
            this.sortDirection
        );
        
        const { items: currentPageItems, pagination } = paginatedData;
        const { currentPage, totalPages, startIndex, endIndex, totalItems } = pagination;
        
        // Render current page items
        currentPageItems.forEach(expense => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md mb-3 border border-gray-100 hover:border-green-200 transition-all duration-200 overflow-hidden';
            card.dataset.expenseId = expense.id;
            
            // Create collapsible header
            const header = document.createElement('div');
            header.className = 'p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors';
            header.onclick = function() {
                const body = this.nextElementSibling;
                if (body.style.maxHeight) {
                    body.style.maxHeight = null;
                    this.querySelector('.collapse-icon').innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
                } else {
                    body.style.maxHeight = body.scrollHeight + "px";
                    this.querySelector('.collapse-icon').innerHTML = '<i data-lucide="chevron-up" class="w-4 h-4"></i>';
                }
            };

            // Left side of header with name and amount
            const headerLeft = document.createElement('div');
            headerLeft.className = 'flex items-center space-x-3';
            
            const amount = document.createElement('span');
            amount.className = 'text-lg font-bold text-green-600';
            amount.textContent = formatCurrency(expense.amount);

            const title = document.createElement('span');
            title.className = 'font-medium text-gray-800';
            title.textContent = expense.name;
            
            // Add payer badge
            const payerBadge = document.createElement('span');
            if (expense.payer === this.app.expenseManager.GROUP_FUND_PAYER_ID) {
                payerBadge.className = 'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800';
                payerBadge.innerHTML = '<i data-lucide="piggy-bank" class="w-3 h-3 mr-1"></i>Quỹ nhóm';
            } else {
                payerBadge.className = 'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800';
                payerBadge.innerHTML = `<i data-lucide="user" class="w-3 h-3 mr-1"></i>${expense.payer}`;
            }
            
            // Add participants count badge
            const participantsBadge = document.createElement('span');
            participantsBadge.className = 'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800';
            participantsBadge.innerHTML = `<i data-lucide="users" class="w-3 h-3 mr-1"></i>${expense.participants.length}`;
            
            headerLeft.appendChild(amount);
            headerLeft.appendChild(title);
            headerLeft.appendChild(payerBadge);
            headerLeft.appendChild(participantsBadge);
            
            // Right side of header with date and collapse icon
            const headerRight = document.createElement('div');
            headerRight.className = 'flex items-center';
            
            const date = document.createElement('span');
            date.className = 'text-sm text-gray-500 mr-2';
            date.textContent = formatDisplayDate(expense.date);
            
            const collapseIcon = document.createElement('span');
            collapseIcon.className = 'collapse-icon';
            collapseIcon.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
            
            headerRight.appendChild(date);
            headerRight.appendChild(collapseIcon);
            
            header.appendChild(headerLeft);
            header.appendChild(headerRight);
            
            // Create collapsible body
            const body = document.createElement('div');
            body.className = 'overflow-hidden transition-all duration-300';
            body.style.maxHeight = "0";
            body.style.transition = "max-height 0.3s ease-out";
            
            const bodyContent = document.createElement('div');
            bodyContent.className = 'p-3 pt-0 border-t border-gray-100';
            
            // Add details
            const details = document.createElement('div');
            details.className = 'mb-3';
            
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
            
            details.appendChild(payer);
            details.appendChild(participants);
            
            // Add actions
            const actions = document.createElement('div');
            actions.className = 'flex justify-end space-x-2 pt-2 border-t border-gray-100';
            
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors flex items-center text-sm';
            editBtn.innerHTML = '<i data-lucide="edit" class="w-4 h-4 mr-1"></i> Sửa';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggling collapse
                this.handleEditExpense(expense.id);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors flex items-center text-sm';
            deleteBtn.innerHTML = '<i data-lucide="trash" class="w-4 h-4 mr-1"></i> Xóa';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggling collapse
                this.handleDeleteExpense(expense.id);
            });
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            bodyContent.appendChild(details);
            bodyContent.appendChild(actions);
            body.appendChild(bodyContent);
            
            // Assemble card
            card.appendChild(header);
            card.appendChild(body);
            
            this.expenseList.appendChild(card);
        });
        
        // Create pagination controls if needed
        if (totalPages > 1) {
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm';
            
            // Add page info text
            const pageInfo = document.createElement('div');
            pageInfo.className = 'flex flex-1 justify-between sm:hidden';
            pageInfo.innerHTML = `
                <p class="text-sm text-gray-700">
                    Hiển thị <span class="font-medium">${startIndex + 1}</span> - 
                    <span class="font-medium">${endIndex}</span> trên 
                    <span class="font-medium">${totalItems}</span> chi tiêu
                </p>
            `;
            
            // Desktop pagination
            const desktopPagination = document.createElement('div');
            desktopPagination.className = 'hidden sm:flex sm:flex-1 sm:items-center sm:justify-between';
            
            const paginationText = document.createElement('div');
            paginationText.innerHTML = `
                <p class="text-sm text-gray-700 flex items-center">
                    <i data-lucide="list" class="w-4 h-4 mr-2 text-gray-400"></i>
                    Hiển thị <span class="font-medium mx-1">${startIndex + 1}</span> - 
                    <span class="font-medium mx-1">${endIndex}</span> trên 
                    <span class="font-medium mx-1">${totalItems}</span> chi tiêu
                </p>
            `;
            
            const paginationNav = document.createElement('div');
            paginationNav.className = 'flex items-center justify-center';
            
            const buttonClass = 'relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none';
            const activeButtonClass = buttonClass + ' bg-green-600 text-white hover:bg-green-700';
            const inactiveButtonClass = buttonClass + ' text-gray-700 bg-white hover:bg-gray-50 border border-gray-300';
            const disabledButtonClass = buttonClass + ' text-gray-300 bg-white border border-gray-200 cursor-not-allowed';
            
            // Previous button
            const prevButton = document.createElement('button');
            if (currentPage > 1) {
                prevButton.className = inactiveButtonClass + ' rounded-l-md';
                prevButton.innerHTML = '<i data-lucide="chevron-left" class="w-4 h-4"></i>';
                prevButton.addEventListener('click', () => this.changePage(currentPage - 1));
            } else {
                prevButton.className = disabledButtonClass + ' rounded-l-md';
                prevButton.innerHTML = '<i data-lucide="chevron-left" class="w-4 h-4"></i>';
                prevButton.disabled = true;
            }
            
            // Page buttons
            const paginationList = document.createElement('div');
            paginationList.className = 'hidden md:flex';
            
            // Calculate visible page range
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            // Adjust if we're near the end
            if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
            }
            
            // First page button if not in range
            if (startPage > 1) {
                const firstPageBtn = document.createElement('button');
                firstPageBtn.className = inactiveButtonClass;
                firstPageBtn.textContent = '1';
                firstPageBtn.addEventListener('click', () => this.changePage(1));
                paginationList.appendChild(firstPageBtn);
                
                if (startPage > 2) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white';
                    ellipsis.textContent = '...';
                    paginationList.appendChild(ellipsis);
                }
            }
            
            // Page number buttons
            for (let i = startPage; i <= endPage; i++) {
                const pageButton = document.createElement('button');
                if (i === currentPage) {
                    pageButton.className = activeButtonClass;
                } else {
                    pageButton.className = inactiveButtonClass;
                }
                pageButton.textContent = i;
                pageButton.addEventListener('click', () => this.changePage(i));
                paginationList.appendChild(pageButton);
            }
            
            // Last page button if not in range
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white';
                    ellipsis.textContent = '...';
                    paginationList.appendChild(ellipsis);
                }
                
                const lastPageBtn = document.createElement('button');
                lastPageBtn.className = inactiveButtonClass;
                lastPageBtn.textContent = totalPages;
                lastPageBtn.addEventListener('click', () => this.changePage(totalPages));
                paginationList.appendChild(lastPageBtn);
            }
            
            // Next button
            const nextButton = document.createElement('button');
            if (currentPage < totalPages) {
                nextButton.className = inactiveButtonClass + ' rounded-r-md';
                nextButton.innerHTML = '<i data-lucide="chevron-right" class="w-4 h-4"></i>';
                nextButton.addEventListener('click', () => this.changePage(currentPage + 1));
            } else {
                nextButton.className = disabledButtonClass + ' rounded-r-md';
                nextButton.innerHTML = '<i data-lucide="chevron-right" class="w-4 h-4"></i>';
                nextButton.disabled = true;
            }
            
            // Mobile pagination
            const mobilePagination = document.createElement('div');
            mobilePagination.className = 'flex flex-1 justify-between sm:hidden mt-3';
            
            const prevMobileBtn = document.createElement('button');
            if (currentPage > 1) {
                prevMobileBtn.className = 'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50';
                prevMobileBtn.innerHTML = 'Trước';
                prevMobileBtn.addEventListener('click', () => this.changePage(currentPage - 1));
            } else {
                prevMobileBtn.className = 'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 cursor-not-allowed';
                prevMobileBtn.innerHTML = 'Trước';
                prevMobileBtn.disabled = true;
            }
            
            const nextMobileBtn = document.createElement('button');
            if (currentPage < totalPages) {
                nextMobileBtn.className = 'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50';
                nextMobileBtn.innerHTML = 'Sau';
                nextMobileBtn.addEventListener('click', () => this.changePage(currentPage + 1));
            } else {
                nextMobileBtn.className = 'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 cursor-not-allowed';
                nextMobileBtn.innerHTML = 'Sau';
                nextMobileBtn.disabled = true;
            }
            
            mobilePagination.appendChild(prevMobileBtn);
            mobilePagination.appendChild(nextMobileBtn);
            
            // Assemble pagination controls
            paginationNav.appendChild(prevButton);
            paginationNav.appendChild(paginationList);
            paginationNav.appendChild(nextButton);
            
            desktopPagination.appendChild(paginationText);
            desktopPagination.appendChild(paginationNav);
            
            paginationContainer.appendChild(pageInfo);
            paginationContainer.appendChild(desktopPagination);
            paginationContainer.appendChild(mobilePagination);
            
            this.expenseList.appendChild(paginationContainer);
        }
        
        // Initialize all Lucide icons in the expense list
        lucide.createIcons({
            scope: this.expenseList
        });
    }
    
    /**
     * Change current page
     * @param {number} page Page number to navigate to
     */
    changePage(page) {
        this.currentPage = page;
        this.renderExpenseList();
        
        // Reset expand/collapse all button to collapsed state
        const toggleAllBtn = this.expenseList.querySelector('[data-expanded]');
        if (toggleAllBtn) {
            toggleAllBtn.dataset.expanded = 'false';
            toggleAllBtn.innerHTML = '<i data-lucide="chevrons-down" class="w-3 h-3 mr-1"></i> Mở rộng tất cả';
            // Re-initialize icon
            lucide.createIcons({
                scope: toggleAllBtn
            });
        }
        
        // Scroll back to the top of the expense list
        document.getElementById('expense-list-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    async handleFormSubmit(event) {
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
            // Hiển thị trạng thái đang xử lý
            this.saveExpenseBtn.disabled = true;
            this.saveBtnText.textContent = this.editingExpenseId ? 'Đang cập nhật...' : 'Đang lưu...';
            
            if (this.editingExpenseId) {
                // Edit existing expense
                await this.app.expenseManager.updateExpense(this.editingExpenseId, {
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
                await this.app.expenseManager.addExpense({
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
            
            // Reset to first page after adding/editing
            this.currentPage = 1;
            
            // Update UI với cơ chế làm mới hoàn chỉnh
            try {
                // Làm mới dữ liệu từ Supabase
                await Promise.all([
                    this.app.fundManager.loadData(),
                    this.app.expenseManager.loadData()
                ]);
                
                // Cập nhật UI
                this.app.renderExpenses();
                this.app.renderGroupFund();
                
                // Cập nhật phần kết quả tính toán
                const members = this.app.memberManager.getAllMembers();
                const results = this.app.expenseManager.calculateResults(members);
                this.renderResults(results);
                
                // Cập nhật số dư quỹ trên tất cả các tab
                this.updateAllFundBalanceDisplays();
            } catch (error) {
                console.error('Lỗi khi cập nhật giao diện:', error);
            }
            
            this.resetForm();
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            // Khôi phục trạng thái nút
            this.saveExpenseBtn.disabled = false;
            this.saveBtnText.textContent = this.editingExpenseId ? 'Cập nhật' : 'Lưu chi tiêu';
        }
    }
    
    /**
     * Cập nhật hiển thị số dư quỹ trên tất cả các tab
     */
    updateAllFundBalanceDisplays() {
        const balance = this.app.fundManager.getBalance();
        
        // Cập nhật số dư quỹ trên tab chi tiêu
        const expensesGroupFundBalanceSpan = document.getElementById('expenses-group-fund-balance');
        if (expensesGroupFundBalanceSpan) {
            expensesGroupFundBalanceSpan.textContent = formatCurrency(balance);
        }
        
        // Cập nhật số dư trên các tab khác
        const fundBalanceCardSpan = document.getElementById('group-fund-balance-card');
        if (fundBalanceCardSpan) {
            fundBalanceCardSpan.textContent = formatCurrency(balance);
        }
        
        const fundBalanceInfoSpan = document.getElementById('group-fund-balance-info');
        if (fundBalanceInfoSpan) {
            fundBalanceInfoSpan.textContent = formatCurrency(balance);
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
    async handleDeleteExpense(expenseId) {
        if (confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) {
            try {
                // Hiển thị thông báo đang xử lý
                showMessage('Đang xử lý...', 'info');
                
                // Xóa chi tiêu
                if (await this.app.expenseManager.deleteExpense(expenseId)) {
                    // Làm mới dữ liệu với cơ chế hoàn chỉnh
                    try {
                        // Refresh dữ liệu
                        await Promise.all([
                            this.app.fundManager.loadData(),
                            this.app.expenseManager.loadData()
                        ]);
                        
                        // Cập nhật UI
                        this.app.renderExpenses();
                        this.app.renderGroupFund();
                        
                        // Cập nhật phần kết quả tính toán
                        const members = this.app.memberManager.getAllMembers();
                        const results = this.app.expenseManager.calculateResults(members);
                        this.renderResults(results);
                        
                        // Cập nhật số dư quỹ trên tất cả các tab
                        this.updateAllFundBalanceDisplays();
                        
                        showMessage('Chi tiêu đã được xóa');
                    } catch (refreshError) {
                        console.error('Lỗi khi làm mới dữ liệu:', refreshError);
                        showMessage('Chi tiêu đã được xóa nhưng không thể cập nhật giao diện. Vui lòng làm mới trang.');
                    }
                }
            } catch (error) {
                showMessage(`Lỗi khi xóa chi tiêu: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Reset the form to initial state
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
        this.saveExpenseBtn.disabled = false;
        
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