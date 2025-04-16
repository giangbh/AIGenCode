/**
 * ExpenseUIController
 * Handles UI operations related to expenses
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatDisplayDate, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage, formatTimestamp } from '../utils/helpers.js';
import { isAdmin } from '../utils/auth.js';
import { initMap, getAddressFromCoordinates, getCurrentPosition } from '../utils/maps.js';

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
        
        // Location-related elements
        this.saveLocationToggle = document.getElementById('save-location-toggle');
        this.locationCaptureSection = document.getElementById('location-capture-section');
        this.captureLocationBtn = document.getElementById('capture-location-btn');
        this.locationStatus = document.getElementById('location-status');
        this.locationName = document.getElementById('location-name');
        this.locationLat = document.getElementById('location-lat');
        this.locationLng = document.getElementById('location-lng');
        this.mapModal = document.getElementById('map-modal-backdrop');
        this.closeMapModalBtn = document.getElementById('close-map-modal');
        this.mapLocationName = document.getElementById('map-location-name');
        
        // State
        this.editingExpenseId = null;
        this.currentPage = 1;
        this.sortField = 'created_at';
        this.sortDirection = true; // descending
        this.map = null; // Will hold the Google Maps instance
        this.marker = null; // Will hold the map marker
        
        // Make debugging functions available in console
        if (typeof window !== 'undefined') {
            window.debugExpenseLocations = this.debugAllExpenseLocations.bind(this);
        }
        
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
            // Hiển thị gợi ý autocomplete khi nhập số tiền
            this.showAmountAutocomplete();
        });
        
        // Thêm sự kiện focus cho trường nhập tên chi tiêu
        this.expenseNameInput.addEventListener('focus', () => {
            this.showNameAutocomplete();
        });

        // Thêm sự kiện input cho trường nhập tên chi tiêu
        this.expenseNameInput.addEventListener('input', () => {
            this.showNameAutocomplete();
        });
        
        // Add keyboard event listeners for name input
        this.expenseNameInput.addEventListener('keydown', (e) => {
            this.handleNameInputKeypress(e);
        });

        // Thêm sự kiện focus cho trường nhập số tiền
        this.expenseAmountInput.addEventListener('focus', () => {
            this.showAmountAutocomplete();
        });
        
        // Đóng dropdown khi nhấp vào bất kỳ đâu ngoài các dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.matches('#expense-name, #expense-amount, .autocomplete-item')) {
                this.closeAllAutocomplete();
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
        
        // Location-related event listeners
        if (this.saveLocationToggle) {
            this.saveLocationToggle.addEventListener('change', () => {
                if (this.saveLocationToggle.checked) {
                    this.locationCaptureSection.classList.remove('hidden');
                } else {
                    this.locationCaptureSection.classList.add('hidden');
                }
            });
        }
        
        if (this.captureLocationBtn) {
            this.captureLocationBtn.addEventListener('click', () => this.captureCurrentLocation());
        }
        
        if (this.closeMapModalBtn) {
            this.closeMapModalBtn.addEventListener('click', () => {
                this.closeMapModal();
            });
        }
        
        // Setup copy expense modal buttons
        const copyExpenseModal = document.getElementById('copy-expense-modal-backdrop');
        const cancelCopyBtn = document.getElementById('cancel-copy-btn');
        const confirmCopyBtn = document.getElementById('confirm-copy-btn');
        
        if (cancelCopyBtn) {
            cancelCopyBtn.addEventListener('click', () => {
                copyExpenseModal.classList.add('hidden');
            });
        }
        
        if (confirmCopyBtn) {
            confirmCopyBtn.addEventListener('click', () => {
                this.confirmCopyExpense();
            });
        }
        
        if (this.quickDepositBtn) {
            this.quickDepositBtn.addEventListener('click', () => {
                // Assign default member for quick deposit - can be adjusted as needed
                const defaultMember = this.app.memberManager.getAllMembers()[0] || 'Toàn';
                this.showQrCode('', defaultMember, 1000000);
            });
        }
        
        // Hiển thị gợi ý chi tiêu khi trang được khởi tạo
        setTimeout(() => {
            // Chỉ cần tải gợi ý, không hiển thị ngay
            this.app.expenseManager.getExpenseSuggestions();
        }, 500);
    }
    
    /**
     * Populate member dropdowns and participant list
     */
    populateMembers() {
        const members = this.app.memberManager.getAllMembers();
        const GROUP_FUND_PAYER_ID = this.app.expenseManager.GROUP_FUND_PAYER_ID;
        
        // Populate payer dropdown
        const payerSelect = document.getElementById('payer');
        payerSelect.innerHTML = '<option value="" disabled>-- Chọn người trả --</option>';
        
        // Add Quỹ nhóm option first
        const groupFundOption = document.createElement('option');
        groupFundOption.value = GROUP_FUND_PAYER_ID; 
        groupFundOption.textContent = 'Quỹ nhóm';
        groupFundOption.classList.add('font-semibold', 'text-sky-700'); 
        groupFundOption.selected = true; // Set as default selected option
        payerSelect.appendChild(groupFundOption);
        
        // Get current logged in user
        const currentUser = this.app.getCurrentUser();
        
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            payerSelect.appendChild(option);
        });
        
        // Populate participants checklist
        const participantsList = document.getElementById('participants-list');
        participantsList.innerHTML = '';
        
        members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `participant-${member}`;
            checkbox.name = 'participants';
            checkbox.value = member;
            checkbox.checked = true; // Default to checked
            checkbox.className = 'participant-checkbox w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2';
            
            // Add event listener to handle the change event
            checkbox.addEventListener('change', () => this.handleParticipantChange());
            
            const label = document.createElement('label');
            label.htmlFor = `participant-${member}`;
            label.className = 'ml-2 text-sm font-medium text-gray-700';
            label.textContent = member;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            participantsList.appendChild(div);
        });
        
        // Check if toggle all button exists and setup
        const toggleAllBtn = document.getElementById('toggle-all-participants-btn');
        if (toggleAllBtn) {
            toggleAllBtn.classList.remove('select-all');
            toggleAllBtn.classList.add('clear-all');
            toggleAllBtn.textContent = 'Bỏ chọn tất cả';
        }
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
     * @param {Object} existingSplits - Existing splits for editing
     */
    renderManualSplitInputs(existingSplits = {}) {
        this.manualSplitInputsDiv.innerHTML = '';
        
        const selectedParticipants = this.getSelectedParticipants();
        
        if (selectedParticipants.length === 0) {
            this.manualSplitInputsDiv.innerHTML = '<p class="text-sm text-gray-500">Vui lòng chọn ít nhất một người tham gia</p>';
            return;
        }
        
        // Get expense amount to calculate default equal split
        const totalAmount = parseFormattedAmount(this.expenseAmountInput.value) || 0;
        const defaultAmount = totalAmount > 0 ? Math.round(totalAmount / selectedParticipants.length) : 0;
        
        selectedParticipants.forEach(participant => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between';
            
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-gray-700 flex-grow';
            label.textContent = participant;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `split-amount-${participant}`;
            input.className = 'manual-split-input w-32 px-3 py-1 border border-gray-300 rounded-md text-right';
            input.placeholder = '0';
            
            // Nếu có split dữ liệu có sẵn thì dùng, không thì chia đều
            if (existingSplits && existingSplits[participant] !== undefined) {
                input.value = formatAmountInput(existingSplits[participant]);
            } else {
                input.value = formatAmountInput(defaultAmount.toString());
            }
            
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
    async renderExpenseList() {
        this.expenseList.innerHTML = '';
        
        // Show loading indicator 
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'text-center p-4';
        loadingIndicator.innerHTML = `
            <div class="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
            <p class="mt-2 text-gray-600">Đang tải chi tiêu...</p>
        `;
        this.expenseList.appendChild(loadingIndicator);

        // Get paginated expenses from server
        const paginatedData = await this.app.expenseManager.getPaginatedExpensesFromServer(
            this.currentPage,
            5, // items per page
            this.sortField,
            this.sortDirection
        );
        
        // Debug location data for all expenses
        if (paginatedData && paginatedData.items) {
            this.debugLocationData(paginatedData.items);
        }
        
        // LOG RECEIVED DATA FROM API FOR DEBUGGING
        console.log("DEBUG - API response:", paginatedData);
        if (paginatedData.items && paginatedData.items.length > 0) {
            console.log("DEBUG - First expense:", paginatedData.items[0]);
            console.log("DEBUG - Location data:", paginatedData.items[0].location);
        }
        
        // Clear loading indicator
        this.expenseList.innerHTML = '';
        
        // Kiểm tra dữ liệu phân trang
        if (!paginatedData || !paginatedData.items || paginatedData.items.length === 0) {
            this.noExpensesMessage.classList.remove('hidden');
            return;
        }

        this.noExpensesMessage.classList.add('hidden');
        
        // Hiển thị gợi ý chi tiêu nếu không trong chế độ chỉnh sửa
        if (!this.editingExpenseId) {
            this.renderExpenseSuggestions();
        }
        
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
        
        // Sort buttons container
        const sortButtonsContainer = document.createElement('div');
        sortButtonsContainer.className = 'flex flex-wrap gap-2';
        
        const sortOptions = [
            { value: 'created_at', label: 'Mới nhất' },
            { value: 'date', label: 'Ngày' },
            { value: 'amount', label: 'Số tiền' },
            { value: 'name', label: 'Tên chi tiêu' }
        ];
        
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
            
            sortButton.addEventListener('click', async () => {
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
                await this.renderExpenseList();
            });
            
            sortButtonsContainer.appendChild(sortButton);
        });
        
        sortingControls.appendChild(controlsContainer);
        sortingControls.appendChild(sortButtonsContainer);
        this.expenseList.appendChild(sortingControls);
        
        // Get paginated expenses
        const { items: currentPageItems, pagination } = paginatedData;
        const { currentPage, totalPages, startIndex, endIndex, totalItems } = pagination;
        
        // Render current page items
        currentPageItems.forEach(expense => {
            const expenseElement = this.createExpenseListItem(expense);
            this.expenseList.appendChild(expenseElement);
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
     * Debug location data for all expenses
     * @param {Array} expenses - Expenses to debug
     */
    debugLocationData(expenses) {
        console.log("========== LOCATION DEBUG INFO ==========");
        console.log(`Total expenses: ${expenses.length}`);
        
        expenses.forEach(expense => {
            console.log(`\n----- Expense: ${expense.id} (${expense.name}) -----`);
            
            if (!expense.location) {
                console.log("Location: NONE (null or undefined)");
                return;
            }
            
            console.log("Location data type:", typeof expense.location);
            
            if (typeof expense.location === 'string') {
                console.log("Location (raw string):", expense.location);
                try {
                    const parsed = JSON.parse(expense.location);
                    console.log("Location (parsed from string):", parsed);
                    console.log("Has valid coords:", 
                        parsed && 
                        typeof parsed === 'object' && 
                        'lat' in parsed && 
                        'lng' in parsed && 
                        parsed.lat !== null && 
                        parsed.lng !== null
                    );
                } catch (e) {
                    console.log("Could not parse location string:", e.message);
                }
            } else if (typeof expense.location === 'object') {
                console.log("Location (object):", expense.location);
                console.log("Has valid coords:", 
                    expense.location && 
                    'lat' in expense.location && 
                    'lng' in expense.location && 
                    expense.location.lat !== null && 
                    expense.location.lng !== null
                );
            }
        });
        
        console.log("=========================================");
    }
    
    /**
     * Change page in expense list
     * @param {number} page - The page number to change to
     */
    async changePage(page) {
        if (this.currentPage !== page) {
            this.currentPage = page;
            await this.renderExpenseList();
        }
    }
    
    /**
     * Handle form submission
     * @param {Event} event - The submit event
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const name = this.expenseNameInput.value.trim();
        const amount = parseFormattedAmount(this.expenseAmountInput.value);
        const date = this.expenseDateInput.value;
        const payer = this.payerSelect.value;
        const participants = this.getSelectedParticipants();
        const equalSplit = this.splitEquallyToggle.checked;
        
        // Get location data if enabled
        let location = null;
        if (this.saveLocationToggle && this.saveLocationToggle.checked) {
            const lat = parseFloat(this.locationLat.value);
            const lng = parseFloat(this.locationLng.value);
            const locationName = this.locationName.value.trim();
            
            if (lat && lng) {
                location = {
                    lat: lat,
                    lng: lng,
                    name: locationName
                };
                // Debug thông tin location
                console.log('Location data being saved:', location);
            }
        }
        
        // Validate form
        if (!name) {
            showMessage('Vui lòng nhập tên chi tiêu', 'error');
            return;
        }
        
        if (amount <= 0) {
            showMessage('Vui lòng nhập số tiền hợp lệ', 'error');
            return;
        }
        
        if (!payer) {
            showMessage('Vui lòng chọn người trả tiền', 'error');
            return;
        }
        
        if (participants.length === 0) {
            showMessage('Vui lòng chọn ít nhất một người tham gia', 'error');
            return;
        }
        
        let splits = {};
        if (!equalSplit) {
            splits = this.getManualSplits();
            
            const totalSplit = Object.values(splits).reduce((sum, val) => sum + val, 0);
            if (Math.abs(totalSplit - amount) > 1) { // Allow for 1 VND rounding error
                showMessage('Tổng số tiền chia phải bằng tổng chi tiêu', 'error');
                return;
            }
        }
        
        // Disable button to prevent double submission
        this.saveExpenseBtn.disabled = true;
        this.saveBtnText.textContent = this.editingExpenseId ? 'Đang cập nhật...' : 'Đang lưu...';
        
        try {
            const expenseData = {
                name,
                amount,
                date,
                payer,
                participants,
                equalSplit,
                splits,
                location
            };
            
            console.log('Saving expense with data:', expenseData);
            
            if (this.editingExpenseId) {
                // Update existing expense
                await this.app.expenseManager.updateExpense(this.editingExpenseId, expenseData);
                showMessage('Chi tiêu đã được cập nhật thành công');
                
                // Reset edit state
                this.editingExpenseId = null;
                this.formTitle.textContent = 'Thêm chi tiêu mới';
                this.saveBtnText.textContent = 'Lưu chi tiêu';
                this.cancelEditBtn.classList.add('hidden');
            } else {
                // Add new expense
                await this.app.expenseManager.addExpense(expenseData);
                showMessage('Chi tiêu đã được thêm thành công');
            }
            
            // Reset form
            this.resetForm();
            
            // Refresh list and results
            await this.renderExpenseList();
            const results = this.app.expenseManager.calculateResults(this.app.memberManager.getAllMembers());
            this.renderResults(results);
            
            // Update fund balance displays
            this.updateAllFundBalanceDisplays();
        } catch (error) {
            console.error('Lỗi khi lưu chi tiêu:', error);
            showMessage(`Lỗi: ${error.message}`, 'error');
        } finally {
            // Re-enable button
            this.saveExpenseBtn.disabled = false;
            this.saveBtnText.textContent = 'Lưu chi tiêu';
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
     * Handle edit expense
     * @param {string} expenseId - The expense ID to edit
     */
    handleEditExpense(expenseId) {
        const expense = this.app.expenseManager.getExpenseById(expenseId);
        if (!expense) {
            showMessage('Không tìm thấy chi tiêu', 'error');
            return;
        }
        
        console.log('Editing expense with data:', expense);
        
        // Set form values
        this.editExpenseIdInput.value = expense.id;
        this.expenseNameInput.value = expense.name;
        this.expenseAmountInput.value = formatAmountInput(expense.amount);
        this.expenseDateInput.value = expense.date;
        this.payerSelect.value = expense.payer;
        
        // Check participant checkboxes
        const checkboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = expense.participants.includes(checkbox.value);
        });
        
        // Set split method
        this.splitEquallyToggle.checked = expense.equalSplit;
        if (expense.equalSplit) {
            this.manualSplitSection.classList.add('hidden');
        } else {
            this.manualSplitSection.classList.remove('hidden');
            this.renderManualSplitInputs(expense.splits);
        }
        
        // Handle location data
        if (expense.location && expense.location.lat && expense.location.lng && this.saveLocationToggle) {
            // Enable location toggle
            this.saveLocationToggle.checked = true;
            this.locationCaptureSection.classList.remove('hidden');
            
            // Set location values
            this.locationLat.value = expense.location.lat;
            this.locationLng.value = expense.location.lng;
            this.locationName.value = expense.location.name || '';
            
            this.locationStatus.textContent = `Đã lấy vị trí: ${parseFloat(expense.location.lat).toFixed(6)}, ${parseFloat(expense.location.lng).toFixed(6)}`;
            this.locationStatus.classList.add('text-green-600');
            this.locationStatus.classList.remove('text-gray-600', 'text-red-600');
        } else if (this.saveLocationToggle) {
            // Reset location fields
            this.saveLocationToggle.checked = false;
            this.locationCaptureSection.classList.add('hidden');
            this.locationLat.value = '';
            this.locationLng.value = '';
            this.locationName.value = '';
            this.locationStatus.textContent = 'Chưa có vị trí nào được lưu';
            this.locationStatus.classList.remove('text-green-600', 'text-red-600');
            this.locationStatus.classList.add('text-gray-600');
        }
        
        // Update UI state for editing
        this.editingExpenseId = expense.id;
        this.formTitle.textContent = 'Sửa chi tiêu';
        this.saveBtnText.textContent = 'Cập nhật';
        this.cancelEditBtn.classList.remove('hidden');
        
        // Scroll to form
        this.expenseNameInput.focus();
        window.scrollTo({
            top: document.getElementById('expense-form-section').offsetTop - 20,
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
        this.expenseForm.reset();
        this.expenseDateInput.value = getTodayDateString();
        this.editExpenseIdInput.value = '';
        this.editingExpenseId = null;
        this.formTitle.textContent = 'Thêm chi tiêu mới';
        this.saveBtnText.textContent = 'Lưu chi tiêu';
        this.saveExpenseBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        this.saveExpenseBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        this.cancelEditBtn.classList.add('hidden');
        this.splitEquallyToggle.checked = true;
        this.manualSplitSection.classList.add('hidden');
        
        // Check all participants by default for new expense
        const checkboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        this.updateToggleAllButtonState();
        
        // Đóng tất cả autocomplete dropdowns
        this.closeAllAutocomplete();
    }
    
    /**
     * Hiển thị các gợi ý chi tiêu dựa trên lịch sử
     */
    renderExpenseSuggestions() {
        const suggestionsContainer = document.getElementById('expense-suggestions');
        const suggestionList = document.getElementById('suggestion-list');
        
        if (!suggestionsContainer || !suggestionList) return;
        
        // Lấy gợi ý từ ExpenseManager
        const suggestions = this.app.expenseManager.getExpenseSuggestions();
        
        // Nếu không có gợi ý, ẩn container
        if (!suggestions || suggestions.length === 0) {
            suggestionsContainer.classList.add('hidden');
            return;
        }
        
        // Xóa tất cả gợi ý cũ
        suggestionList.innerHTML = '';
        
        // Hiển thị các gợi ý mới
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            
            // Thêm các thuộc tính data để dễ truy xuất giá trị
            suggestionItem.dataset.name = suggestion.name;
            suggestionItem.dataset.amount = suggestion.amount;
            
            const namePart = document.createElement('span');
            namePart.className = 'suggestion-name';
            namePart.textContent = suggestion.name;
            
            const amountPart = document.createElement('span');
            amountPart.className = 'suggestion-amount';
            amountPart.textContent = formatCurrency(suggestion.amount).replace('₫', 'VNĐ');
            
            suggestionItem.appendChild(namePart);
            suggestionItem.appendChild(amountPart);
            
            // Xử lý khi người dùng nhấp vào gợi ý
            suggestionItem.addEventListener('click', () => {
                // Đánh dấu gợi ý được chọn
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.classList.remove('selected');
                });
                suggestionItem.classList.add('selected');
                
                // Điền thông tin vào form
                this.expenseNameInput.value = suggestion.name;
                this.expenseAmountInput.value = formatAmountInput(suggestion.amount.toString());
            });
            
            suggestionList.appendChild(suggestionItem);
        });
        
        // Hiển thị container gợi ý
        suggestionsContainer.classList.remove('hidden');
        
        // Làm nổi bật các gợi ý phù hợp với dữ liệu đang nhập
        this.highlightMatchingSuggestions();
        
        // Khởi tạo lại biểu tượng Lucide
        lucide.createIcons({
            scope: suggestionsContainer
        });
    }
    
    /**
     * Làm nổi bật các gợi ý phù hợp với dữ liệu đang nhập
     */
    highlightMatchingSuggestions() {
        const currentName = this.expenseNameInput.value.trim().toLowerCase();
        const currentAmount = parseFormattedAmount(this.expenseAmountInput.value);
        
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        
        if (suggestionItems.length === 0) return;
        
        let exactMatch = false;
        
        suggestionItems.forEach(item => {
            // Lấy tên và số tiền từ gợi ý
            const suggestionName = item.querySelector('.suggestion-name').textContent.toLowerCase();
            const suggestionAmountText = item.querySelector('.suggestion-amount').textContent;
            const suggestionAmount = parseFormattedAmount(suggestionAmountText);
            
            // Kiểm tra trường hợp phù hợp
            const nameMatches = suggestionName.includes(currentName) && currentName.length > 0;
            const amountMatches = !isNaN(currentAmount) && currentAmount > 0 && currentAmount === suggestionAmount;
            const exactNameMatch = suggestionName === currentName && currentName.length > 0;
            
            // Áp dụng trạng thái hiển thị
            if ((nameMatches && amountMatches) || (exactNameMatch && amountMatches)) {
                // Nếu cả tên và số tiền đều khớp, đánh dấu là khớp chính xác
                item.classList.add('selected');
                exactMatch = true;
            } else if (nameMatches || amountMatches) {
                // Nếu chỉ tên hoặc số tiền khớp, đánh dấu là tương đối khớp
                item.classList.add('bg-blue-50');
                item.classList.remove('selected');
            } else {
                // Nếu không khớp, bỏ tất cả đánh dấu
                item.classList.remove('selected', 'bg-blue-50');
            }
            
            // Auto-complete khi có khớp chính xác về tên
            if (exactNameMatch && !amountMatches && this.expenseAmountInput.value === '') {
                // Tự động điền số tiền nếu tên khớp chính xác và trường số tiền đang trống
                this.expenseAmountInput.value = formatAmountInput(
                    suggestionAmount.toString()
                );
            }
        });
        
        // Hiển thị gợi ý nếu có nhập liệu từ người dùng
        const suggestionContainer = document.getElementById('expense-suggestions');
        if (suggestionContainer && (currentName.length > 0 || (currentAmount && currentAmount > 0))) {
            suggestionContainer.classList.remove('hidden');
        }
    }
    
    /**
     * Handle copying an expense
     * @param {string} expenseId - The ID of the expense to copy
     */
    handleCopyExpense(expenseId) {
        const expense = this.app.expenseManager.getExpenseById(expenseId);
        if (!expense) return;
        
        // Set expense data in the copy modal
        const copyExpenseModal = document.getElementById('copy-expense-modal-backdrop');
        const copyExpenseName = document.getElementById('copy-expense-name');
        const copyExpenseAmount = document.getElementById('copy-expense-amount');
        const copyExpenseDetails = document.getElementById('copy-expense-details');
        
        copyExpenseName.textContent = expense.name;
        copyExpenseAmount.textContent = formatCurrency(expense.amount);
        
        // Hiển thị thông tin chi tiết với ngày chi tiêu
        const payerName = expense.payer === this.app.expenseManager.GROUP_FUND_PAYER_ID ? 'Quỹ nhóm' : expense.payer;
        copyExpenseDetails.textContent = `Người trả: ${payerName}, Ngày: ${formatDisplayDate(expense.date)}`;
        
        // Store the expense ID to use when confirming
        copyExpenseModal.dataset.expenseId = expenseId;
        
        // Show the modal
        copyExpenseModal.classList.remove('hidden');
        
        // Initialize icons in the modal
        lucide.createIcons({
            scope: copyExpenseModal
        });
    }
    
    /**
     * Confirm copying an expense
     */
    confirmCopyExpense() {
        const copyExpenseModal = document.getElementById('copy-expense-modal-backdrop');
        const expenseId = copyExpenseModal.dataset.expenseId;
        const useTodayDate = document.getElementById('use-today-date').checked;
        
        // Get the original expense
        const expense = this.app.expenseManager.getExpenseById(expenseId);
        if (!expense) return;
        
        // Fill form with expense data
        this.expenseNameInput.value = expense.name;
        this.expenseAmountInput.value = formatAmountInput(expense.amount.toString());
        
        // Set date - either today or the original date
        if (useTodayDate) {
            this.expenseDateInput.value = getTodayDateString();
        } else {
            this.expenseDateInput.value = expense.date;
        }
        
        // Set payer
        this.payerSelect.value = expense.payer;
        
        // Set participants
        const participantCheckboxes = this.participantsListDiv.querySelectorAll('.participant-checkbox');
        participantCheckboxes.forEach(checkbox => {
            checkbox.checked = expense.participants.includes(checkbox.value);
        });
        
        // Update toggle all button state
        this.updateToggleAllButtonState();
        
        // Copy split equally setting from original expense
        const hasManualSplits = expense.splits && Object.keys(expense.splits).length > 0;
        this.splitEquallyToggle.checked = !hasManualSplits;
        
        // Handle split settings
        if (hasManualSplits) {
            // If expense has manual splits, turn off split equally toggle
            this.manualSplitSection.classList.remove('hidden');
            this.renderManualSplitInputs();
            
            // Set the manual split values after a short delay to ensure inputs are created
            setTimeout(() => {
                const splitInputs = this.manualSplitInputsDiv.querySelectorAll('.split-amount-input');
                splitInputs.forEach(input => {
                    const participant = input.id.replace('split-amount-', '');
                    if (expense.splits[participant]) {
                        input.value = formatAmountInput(expense.splits[participant].toString());
                    }
                });
                this.updateManualSplitTotal();
            }, 100);
        } else {
            // If expense uses equal split, hide manual split section
            this.manualSplitSection.classList.add('hidden');
        }
        
        // Hide the modal
        copyExpenseModal.classList.add('hidden');
        
        // Scroll to form
        this.expenseForm.scrollIntoView({ behavior: 'smooth' });
        
        // Show success message
        showMessage('Đã sao chép thông tin chi tiêu', 'success');
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

    /**
     * Hiển thị gợi ý tên chi tiêu
     * Tạm thời bị vô hiệu hóa
     * @param {Array} suggestions - Mảng các gợi ý
     * @param {HTMLElement} inputElement - Input element
     */
    showNameAutocomplete(suggestions = [], inputElement = this.expenseNameInput) {
        // Đã tạm thời vô hiệu hóa chức năng này
        return;
        
        /* Mã gốc đã bị comment
        this.closeAllAutocomplete();
        
        const container = document.getElementById('expense-name-suggestions');
        if (!container || !inputElement) return;
        
        // Ensure container is in the same parent div as the input for proper positioning
        const inputParent = inputElement.closest('.relative');
        if (inputParent && !inputParent.contains(container)) {
            inputParent.appendChild(container);
        }
        
        container.innerHTML = '';
        container.classList.remove('hidden');
        
        // Simple absolute positioning within the parent container
        container.style.position = 'absolute';
        container.style.top = `${inputElement.offsetHeight}px`;
        container.style.left = '0';
        container.style.width = '100%';
        container.style.zIndex = '100';
        
        // Get current input value
        const currentValue = this.expenseNameInput.value.trim().toLowerCase();
        
        // If no suggestions were provided, try to get them from the expense manager
        if (!suggestions || suggestions.length === 0) {
            const allSuggestions = this.app.expenseManager.getExpenseSuggestions();
            
            // Filter suggestions based on the current input value
            suggestions = allSuggestions
                .map(s => s.name)
                .filter(name => currentValue === '' || name.toLowerCase().includes(currentValue))
                .slice(0, 6); // Limit to 6 suggestions
        }
        
        if (suggestions.length === 0) {
            container.classList.add('hidden');
            return;
        }
        
        // Add keyboard navigation tip at the top if there are suggestions
        const keyboardTip = document.createElement('div');
        keyboardTip.className = 'text-xs text-gray-500 px-3 py-2 border-b border-gray-100';
        keyboardTip.innerHTML = '<span class="opacity-75">Navigate: <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">↑</kbd> <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">↓</kbd> Select: <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd></span>';
        container.appendChild(keyboardTip);
        
        suggestions.forEach((suggestion, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.setAttribute('data-index', index);
            
            // Highlight matching text if there's input
            if (currentValue && suggestion.toLowerCase().includes(currentValue)) {
                const matchIndex = suggestion.toLowerCase().indexOf(currentValue);
                const beforeMatch = suggestion.substring(0, matchIndex);
                const match = suggestion.substring(matchIndex, matchIndex + currentValue.length);
                const afterMatch = suggestion.substring(matchIndex + currentValue.length);
                
                div.innerHTML = `<span class="autocomplete-item-name">${beforeMatch}<span class="bg-yellow-100 text-yellow-800">${match}</span>${afterMatch}</span>`;
            } else {
                div.innerHTML = `<span class="autocomplete-item-name">${suggestion}</span>`;
            }
            
            // Add a subtle icon to enhance the UI
            const icon = document.createElement('span');
            icon.className = 'text-blue-400';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>';
            div.appendChild(icon);
            
            div.addEventListener('click', () => {
                inputElement.value = suggestion;
                container.classList.add('hidden');
                
                // Trigger custom event để cập nhật giao diện
                const event = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(event);
            });
            
            container.appendChild(div);
        });
        
        // Add mouseover event to highlight items
        const items = container.querySelectorAll('.autocomplete-item');
        items.forEach(item => {
            item.addEventListener('mouseover', () => {
                // Remove active class from all items
                items.forEach(i => i.classList.remove('active'));
                // Add active class to current item
                item.classList.add('active');
            });
        });
        
        // Set the first item as active by default
        if (items.length > 0) {
            items[0].classList.add('active');
        }
        */
    }
    
    /**
     * Hiển thị gợi ý số tiền dưới dạng dropdown
     */
    showAmountAutocomplete() {
        const input = this.expenseAmountInput;
        const currentValue = parseFormattedAmount(input.value);
        const suggestions = this.app.expenseManager.getExpenseSuggestions();
        const container = document.getElementById('expense-amount-suggestions');
        
        if (!container) return;
        
        // Ensure container is in the same parent div as the input for proper positioning
        const inputParent = input.closest('.relative');
        if (inputParent && !inputParent.contains(container)) {
            inputParent.appendChild(container);
        }
        
        // Xóa các gợi ý cũ
        container.innerHTML = '';
        
        // Simple absolute positioning within the parent container
        container.style.position = 'absolute';
        container.style.top = `${input.offsetHeight}px`;
        container.style.left = '0';
        container.style.width = '100%';
        container.style.zIndex = '100';
        
        // Lọc gợi ý phù hợp với giá trị đang nhập
        const matchingSuggestions = suggestions.filter(suggestion => {
            // Nếu đang nhập số tiền và khớp với gợi ý
            return currentValue > 0 && 
                  suggestion.amount.toString().includes(currentValue.toString());
        });
        
        // Nếu đang sửa chi tiêu hoặc không có gợi ý, ẩn dropdown
        if (this.editingExpenseId || matchingSuggestions.length === 0 || !currentValue) {
            container.classList.add('hidden');
            return;
        }
        
        // Add keyboard navigation tip at the top if there are suggestions
        const keyboardTip = document.createElement('div');
        keyboardTip.className = 'text-xs text-gray-500 px-3 py-2 border-b border-gray-100';
        keyboardTip.innerHTML = '<span class="opacity-75">Navigate: <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">↑</kbd> <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">↓</kbd> Select: <kbd class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd></span>';
        container.appendChild(keyboardTip);
        
        // Hiển thị các gợi ý
        matchingSuggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.setAttribute('data-index', index);
            item.setAttribute('data-amount', suggestion.amount);
            item.setAttribute('data-name', suggestion.name);
            
            // Create content with highlighted amount if matching
            const amountString = suggestion.amount.toString();
            const amountSpan = document.createElement('span');
            amountSpan.className = 'autocomplete-item-name';
            
            if (currentValue > 0 && amountString.includes(currentValue.toString())) {
                const matchIndex = amountString.indexOf(currentValue.toString());
                const beforeMatch = amountString.substring(0, matchIndex);
                const match = amountString.substring(matchIndex, matchIndex + currentValue.toString().length);
                const afterMatch = amountString.substring(matchIndex + currentValue.toString().length);
                
                amountSpan.innerHTML = `${beforeMatch}<span class="bg-yellow-100 text-yellow-800">${match}</span>${afterMatch}`;
            } else {
                amountSpan.textContent = amountString;
            }
            
            // Format the amount for display
            amountSpan.innerHTML = formatCurrency(suggestion.amount);
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'autocomplete-item-amount';
            nameSpan.textContent = suggestion.name;
            
            item.appendChild(amountSpan);
            item.appendChild(nameSpan);
            
            // Add a subtle icon to enhance the UI
            const icon = document.createElement('span');
            icon.className = 'text-blue-400 ml-1';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>';
            item.appendChild(icon);
            
            // Xử lý sự kiện khi nhấp vào gợi ý
            item.addEventListener('click', () => {
                input.value = formatAmountInput(suggestion.amount.toString());
                // Nếu tên chi tiêu còn trống, tự động điền
                if (this.expenseNameInput.value.trim() === '') {
                    this.expenseNameInput.value = suggestion.name;
                }
                this.closeAllAutocomplete();
                
                // Focus the next input field for better UX flow
                this.payerSelect.focus();
            });
            
            container.appendChild(item);
        });
        
        // Add mouseover event to highlight items
        const items = container.querySelectorAll('.autocomplete-item');
        items.forEach(item => {
            item.addEventListener('mouseover', () => {
                // Remove active class from all items
                items.forEach(i => i.classList.remove('active'));
                // Add active class to current item
                item.classList.add('active');
            });
        });
        
        // Set the first item as active by default
        if (items.length > 0) {
            items[0].classList.add('active');
        }
        
        // Hiển thị dropdown
        container.classList.remove('hidden');
        
        // Add keyboard event handler for the amount input
        input.addEventListener('keydown', this.handleAmountInputKeypress.bind(this));
    }
    
    /**
     * Handle keyboard navigation for the amount autocomplete
     */
    handleAmountInputKeypress(e) {
        // Only process keyboard events when the dropdown is visible
        const container = document.getElementById('expense-amount-suggestions');
        if (!container || container.classList.contains('hidden')) return;
        
        const items = container.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        let activeItem = container.querySelector('.autocomplete-item.active');
        let activeIndex = activeItem ? parseInt(activeItem.getAttribute('data-index')) : -1;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            
            // Remove active class from current item
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            
            // Calculate next index (with wrap-around)
            activeIndex = (activeIndex + 1) % items.length;
            
            // Add active class to new item
            items[activeIndex].classList.add('active');
            
            // Ensure the active item is visible by scrolling if needed
            items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            
            // Remove active class from current item
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            
            // Calculate previous index (with wrap-around)
            activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
            
            // Add active class to new item
            items[activeIndex].classList.add('active');
            
            // Ensure the active item is visible by scrolling if needed
            items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } 
        else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            
            const amount = activeItem.getAttribute('data-amount');
            const name = activeItem.getAttribute('data-name');
            
            // Update amount input
            this.expenseAmountInput.value = formatAmountInput(amount);
            
            // Update name input if empty
            if (this.expenseNameInput.value.trim() === '') {
                this.expenseNameInput.value = name;
            }
            
            this.closeAllAutocomplete();
            
            // Focus the next input field for better UX
            this.payerSelect.focus();
        } 
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeAllAutocomplete();
        }
        else if (e.key === 'Tab') {
            // Close autocomplete on tab key, but don't prevent default
            this.closeAllAutocomplete();
        }
    }
    
    /**
     * Handle keyboard navigation for the name autocomplete
     */
    handleNameInputKeypress(e) {
        // Đã tạm thời vô hiệu hóa
        return;
        
        /* Mã gốc đã bị comment
        // Only process keyboard events when the dropdown is visible
        const container = document.getElementById('expense-name-suggestions');
        if (!container || container.classList.contains('hidden')) return;
        
        const items = container.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        let activeItem = container.querySelector('.autocomplete-item.active');
        let activeIndex = activeItem ? parseInt(activeItem.getAttribute('data-index')) : -1;
        
        // Xử lý các phím mũi tên và Enter
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            
            // Remove active class from current item
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            
            // Calculate next index (with wrap-around)
            activeIndex = (activeIndex + 1) % items.length;
            
            // Add active class to new item
            items[activeIndex].classList.add('active');
            
            // Ensure the active item is visible by scrolling if needed
            items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            
            // Remove active class from current item
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            
            // Calculate previous index (with wrap-around)
            activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
            
            // Add active class to new item
            items[activeIndex].classList.add('active');
            
            // Ensure the active item is visible by scrolling if needed
            items[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } 
        else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            
            // Get the suggestion text from the active item's name span
            const nameSpan = activeItem.querySelector('.autocomplete-item-name');
            
            // Extract the text content (without any HTML formatting)
            const suggestionText = nameSpan ? this.getTextContentFromElement(nameSpan) : activeItem.textContent.trim();
            
            // Update the input value and close the dropdown
            this.expenseNameInput.value = suggestionText;
            this.closeAllAutocomplete();
            
            // Focus the next input field for better UX
            this.expenseAmountInput.focus();
        } 
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeAllAutocomplete();
        }
        else if (e.key === 'Tab') {
            // Close autocomplete on tab key, but don't prevent default
            this.closeAllAutocomplete();
        }
        */
    }
    
    /**
     * Đóng tất cả các dropdown autocomplete
     */
    closeAllAutocomplete() {
        const nameContainer = document.getElementById('expense-name-suggestions');
        const amountContainer = document.getElementById('expense-amount-suggestions');
        
        if (nameContainer) {
            nameContainer.classList.add('hidden');
            nameContainer.innerHTML = '';
        }
        
        if (amountContainer) {
            amountContainer.classList.add('hidden');
            amountContainer.innerHTML = '';
        }
    }
    
    /**
     * Helper method to extract text content from an element
     * even if it contains HTML markup
     */
    getTextContentFromElement(element) {
        // Create a text node only version of the element
        const clone = element.cloneNode(true);
        
        // Process all child nodes
        const walk = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        let text = '';
        let node;
        
        while (node = walk.nextNode()) {
            text += node.nodeValue;
        }
        
        return text.trim();
    }
    
    /**
     * Capture current location
     */
    captureCurrentLocation() {
        // Show loading state
        this.locationStatus.textContent = 'Đang lấy vị trí...';
        this.captureLocationBtn.disabled = true;
        
        getCurrentPosition()
            .then(position => {
                // Store location in hidden inputs
                this.locationLat.value = position.lat;
                this.locationLng.value = position.lng;
                
                // Display success message
                this.locationStatus.textContent = `Đã lấy vị trí: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
                this.locationStatus.classList.add('text-green-600');
                this.locationStatus.classList.remove('text-gray-600', 'text-red-600');
                
                // Try to get a location name
                return getAddressFromCoordinates(position.lat, position.lng)
                    .then(address => {
                        this.locationName.value = address;
                    })
                    .catch(error => {
                        console.warn('Không thể lấy địa chỉ:', error);
                    });
            })
            .catch(error => {
                this.locationStatus.textContent = error.message;
                this.locationStatus.classList.add('text-red-600');
                this.locationStatus.classList.remove('text-gray-600', 'text-green-600');
            })
            .finally(() => {
                // Re-enable button
                this.captureLocationBtn.disabled = false;
            });
    }
    
    /**
     * Show location on a map
     * @param {Object} location - The location object {lat, lng, name}
     * @param {string} expenseName - The name of the expense
     */
    showLocationOnMap(location, expenseName) {
        console.log('Showing location on map for', expenseName, 'Location:', location);
        
        // Parse location if it's a string
        if (location && typeof location === 'string') {
            try {
                location = JSON.parse(location);
                console.log('Parsed location from string:', location);
            } catch (e) {
                console.error('Failed to parse location string:', e);
                showMessage('Không thể hiển thị vị trí vì dữ liệu không hợp lệ', 'error');
                return;
            }
        }
        
        // Handle nested location objects
        if (location && typeof location === 'object' && location.location && typeof location.location === 'object') {
            location = location.location;
            console.log('Normalized nested location:', location);
        }
        
        // Validate location object has required properties
        if (!location || !('lat' in location) || !('lng' in location) || location.lat === null || location.lng === null) {
            console.error('Invalid location object:', location);
            showMessage('Không có thông tin vị trí hợp lệ cho chi tiêu này', 'error');
            return;
        }
        
        // Set modal title
        const modalTitle = document.getElementById('map-modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = `<i data-lucide="map-pin" class="w-5 h-5 mr-2 text-blue-500"></i> ${expenseName}`;
        }
        
        // Set location name if available
        if (this.mapLocationName) {
            const locationName = location.name || 'Vị trí không có tên';
            this.mapLocationName.innerHTML = `
                <div class="flex items-center">
                    <div class="bg-blue-100 text-blue-800 rounded-full p-1.5 mr-2">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="font-medium">${locationName}</p>
                        <p class="text-xs text-gray-500">
                            ${parseFloat(location.lat).toFixed(6)}, ${parseFloat(location.lng).toFixed(6)}
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Show the modal with fade-in animation
        this.mapModal.classList.remove('hidden');
        this.mapModal.classList.add('animate-fadeIn');
        
        // Initialize map if needed or update existing map
        setTimeout(() => {
            try {
                // Nếu bản đồ đã được khởi tạo trước đó, xóa nó để tránh lỗi
                if (this.map) {
                    this.map.remove();
                    this.map = null;
                    this.marker = null;
                }
                
                // Khởi tạo bản đồ mới
                const { map, marker } = initMap('expense-map', location);
                this.map = map;
                this.marker = marker;
                
                // Thêm custom popup cho marker
                if (location.name) {
                    marker.bindPopup(`<b>${location.name}</b>`).openPopup();
                }
                
                // Cần cập nhật kích thước để Leaflet hiển thị đúng
                this.map.invalidateSize();
                
                // Initialize icons in the modal
                lucide.createIcons({
                    attrs: {
                        'stroke-width': 1.5
                    },
                    bindToElement: this.mapModal
                });
            } catch (error) {
                console.error('Lỗi khi hiển thị bản đồ:', error);
                showMessage('Không thể hiển thị bản đồ: ' + error.message, 'error');
                this.closeMapModal();
            }
        }, 100);
    }

    /**
     * Create expense list item HTML
     * @param {Expense} expense - The expense object
     * @returns {HTMLElement} The created HTML element
     */
    createExpenseListItem(expense) {
        const item = document.createElement('div');
        item.className = 'expense-item bg-white border border-gray-200 rounded-md shadow-sm transition-all duration-200 overflow-hidden hover:shadow-md mb-2';
        item.setAttribute('data-id', expense.id);
        
        // Enhanced debugging for location data
        console.log('Expense:', expense.id, 'Name:', expense.name);
        console.log('Location data type:', typeof expense.location);
        console.log('Location value:', expense.location);
        
        const equalSplit = expense.equalSplit;
        
        // Get formatted values
        const formattedAmount = formatCurrency(expense.amount);
        const formattedDate = formatDisplayDate(expense.date);
        
        // Determine payer display (special case for group fund)
        const isGroupFund = expense.payer === this.app.expenseManager.GROUP_FUND_PAYER_ID;
        const payerDisplayClass = isGroupFund ? 'text-sky-700 font-semibold' : '';
        
        // Get the participant info for displaying split amounts - thêm class min-w-0 để giúp truncate tốt hơn
        const participantsList = expense.participants.map(participant => {
            const splitAmount = expense.getSplitAmountFor(participant);
            return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1">${participant}: ${formatCurrency(splitAmount)}</span>`;
        }).join('');

        // --- Simplified Location Handling ---
        let location = null;
        let rawLocationDisplay = ''; // For debugging

        if (expense.location) {
            // Store raw data for debugging display
            const rawLocationStr = typeof expense.location === 'string'
                ? expense.location
                : JSON.stringify(expense.location);
            rawLocationDisplay = `
                <div class="mt-1 text-xs bg-gray-100 p-1 rounded border border-gray-200">
                    <p class="font-medium text-gray-600 text-xs">Dữ liệu vị trí gốc:</p>
                    <p class="text-xs text-gray-500 break-words">${rawLocationStr}</p>
                </div>
            `;

            // Attempt to parse if it's a string
            if (typeof expense.location === 'string') {
                try {
                    location = JSON.parse(expense.location);
                    console.log(`DEBUG [${expense.id}]: Successfully parsed location from string:`, location);
                } catch (e) {
                    console.error(`DEBUG [${expense.id}]: Failed to parse location string:`, e, 'Raw string:', expense.location);
                    location = null; // Parsing failed
                }
            } else if (typeof expense.location === 'object') {
                location = expense.location; // Assume it's already an object
                console.log(`DEBUG [${expense.id}]: Location is already an object:`, location);
            }
        } else {
             console.log(`DEBUG [${expense.id}]: No location data found (expense.location is falsy).`);
        }

        // Final check for valid location object structure before determining 'hasLocation'
        console.log(`DEBUG [${expense.id}]: Evaluating location object for hasLocation check:`, location);
        const hasLocation = location &&
                         typeof location === 'object' && // Ensure it's an object
                         'lat' in location &&
                         'lng' in location &&
                         location.lat !== null && location.lat !== undefined &&
                         location.lng !== null && location.lng !== undefined;

        console.log(`DEBUG [${expense.id}]: Final 'hasLocation' result:`, hasLocation);
        // --- End Simplified Location Handling ---
        
        // Add location badge to expense header if location exists - thu gọn
        const locationBadge = hasLocation 
            ? `<span class="inline-flex items-center ml-1 px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm border border-blue-200">
                <i data-lucide="map-pin" class="w-2.5 h-2.5 mr-0.5 text-blue-500"></i>
               </span>` 
            : '';
            
        // Location button for detailed view
        const locationBtn = hasLocation 
            ? `<button class="view-location-btn text-blue-600 hover:text-blue-800 flex items-center mr-2 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200" data-id="${expense.id}">
                <i data-lucide="map-pin" class="w-3 h-3 mr-1"></i>
                Vị trí
               </button>` 
            : '';
            
        // Location details if available - thu gọn phần này
        const locationDetails = hasLocation 
            ? `<div class="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                <div class="flex items-center text-xs">
                  <i data-lucide="map-pin" class="w-3 h-3 mr-1 text-blue-500"></i>
                  <p class="text-gray-600 font-medium truncate">${location.name || 'Không có tên địa điểm'}</p>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span class="inline-flex items-center px-1 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                    <i data-lucide="compass" class="w-2.5 h-2.5 mr-0.5"></i>
                    ${parseFloat(location.lat).toFixed(6)}, ${parseFloat(location.lng).toFixed(6)}
                  </span>
                </p>
               </div>` 
            : rawLocationDisplay; // Fall back to raw display if parsed location isn't available
        
        // Thu gọn các nút
        const editButton = `<button class="edit-expense-btn text-blue-600 hover:text-blue-800 mr-1 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200" data-id="${expense.id}" title="Chỉnh sửa">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i>
        </button>`;
        
        const deleteButton = `<button class="delete-expense-btn text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors duration-200" data-id="${expense.id}" title="Xóa">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>`;
        
        const copyButton = `<button class="copy-expense-btn text-green-600 hover:text-green-800 mr-1 p-1 rounded-full hover:bg-green-50 transition-colors duration-200" data-id="${expense.id}" title="Sao chép">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
        </button>`;
        
        // Create a separate badge for the unexpanded view
        const locationBadgeOutside = hasLocation 
            ? `<span class="inline-flex items-center px-1.5 py-0 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1 shadow-sm border border-blue-200">
                <i data-lucide="map-pin" class="w-2.5 h-2.5 text-blue-500"></i>
               </span>` 
            : '';
        
        item.innerHTML = `
            <div class="p-2">
                <div class="flex justify-between items-start">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center">
                            <h3 class="text-sm font-medium text-gray-900 truncate mr-1">${expense.name}</h3>
                            ${locationBadge}
                        </div>
                        <div class="flex items-center text-xs text-gray-600 mt-0.5">
                            <i data-lucide="calendar" class="w-2.5 h-2.5 mr-0.5 text-gray-400"></i>
                            <span class="mr-2">${formattedDate}</span>
                            <i data-lucide="user" class="w-2.5 h-2.5 mr-0.5 text-gray-400"></i>
                            <span class="${payerDisplayClass} truncate">${expense.payer}</span>
                        </div>
                    </div>
                    <div class="text-right ml-2">
                        <p class="text-md font-bold text-green-600">${formattedAmount}</p>
                        <p class="text-xs text-gray-500 inline-flex items-center justify-end">
                            <i data-lucide="${equalSplit ? 'split' : 'calculator'}" class="w-2.5 h-2.5 mr-0.5 ${equalSplit ? 'text-green-500' : 'text-orange-500'}"></i>
                            ${equalSplit ? 'Chia đều' : 'Chia tay'}
                        </p>
                    </div>
                </div>
                
                <!-- Location preview - chỉ hiển thị icon nhỏ -->
                ${hasLocation ? `
                <div class="mt-1 text-xs text-blue-600 flex items-center bg-blue-50 py-0.5 px-1 rounded border border-blue-100 w-fit hover:bg-blue-100 transition-colors cursor-pointer">
                    <i data-lucide="map-pin" class="w-2.5 h-2.5 mr-0.5 text-blue-500"></i>
                    <span class="truncate" style="max-width: 180px;">${location.name || 'Địa điểm chi tiêu'}</span>
                </div>
                ` : ''}
                
                <div class="expense-details hidden mt-2 border-t border-gray-100 pt-1.5">
                    <div class="text-xs font-medium text-gray-700 mb-0.5 flex items-center">
                        <i data-lucide="list-checks" class="w-2.5 h-2.5 mr-0.5 text-gray-500"></i>
                        Chi tiết chia tiền:
                    </div>
                    <div class="flex flex-wrap gap-0.5">
                        ${participantsList}
                    </div>
                    ${locationDetails}
                    <div class="flex justify-between items-center mt-1.5 pt-1.5 border-t border-gray-100">
                        <div class="flex items-center">
                            ${locationBtn}
                            ${copyButton}
                            ${editButton}
                            ${deleteButton}
                        </div>
                        <button class="collapse-btn text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200">
                            <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                <button class="expand-btn text-gray-600 hover:text-gray-800 w-full flex justify-center p-0.5 hover:bg-gray-50 rounded transition-colors duration-200">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            // Initialize Lucide icons in the newly created element
            lucide.createIcons({
                attrs: {
                    'stroke-width': 1.5
                },
                bindToElement: item
            });
            
            // Expand/collapse functionality
            const expandBtn = item.querySelector('.expand-btn');
            const collapseBtn = item.querySelector('.collapse-btn');
            const detailsSection = item.querySelector('.expense-details');
            
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    detailsSection.classList.remove('hidden');
                    expandBtn.classList.add('hidden');
                    
                    // REMOVED: Auto-show map if expense has location
                    // Không tự động mở map khi mở rộng chi tiêu nữa
                });
            }
            
            if (collapseBtn) {
                collapseBtn.addEventListener('click', () => {
                    detailsSection.classList.add('hidden');
                    expandBtn.classList.remove('hidden');
                });
            }
            
            // Edit button
            const editBtn = item.querySelector('.edit-expense-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.handleEditExpense(expense.id);
                });
            }
            
            // Delete button
            const deleteBtn = item.querySelector('.delete-expense-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.handleDeleteExpense(expense.id);
                });
            }
            
            // Copy button
            const copyBtn = item.querySelector('.copy-expense-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.handleCopyExpense(expense.id);
                });
            }
            
            // View location button
            const viewLocationBtn = item.querySelector('.view-location-btn');
            if (viewLocationBtn && expense.location) {
                viewLocationBtn.addEventListener('click', () => {
                    let loc = expense.location;
                    // Parse location if it's a string
                    if (typeof loc === 'string') {
                        try {
                            loc = JSON.parse(loc);
                        } catch (e) {
                            console.error('Không thể phân tích dữ liệu vị trí:', e);
                            showMessage('Không thể hiển thị vị trí', 'error');
                            return;
                        }
                    }
                    this.showLocationOnMap(loc, expense.name);
                });
            }
            
            // Add click event to location preview
            const locationPreview = item.querySelector('.mt-1.text-xs.text-blue-600');
            if (locationPreview && expense.location) {
                locationPreview.style.cursor = 'pointer';
                locationPreview.title = 'Nhấp để xem vị trí trên bản đồ';
                locationPreview.addEventListener('click', () => {
                    let loc = expense.location;
                    // Parse location if it's a string
                    if (typeof loc === 'string') {
                        try {
                            loc = JSON.parse(loc);
                        } catch (e) {
                            console.error('Không thể phân tích dữ liệu vị trí:', e);
                            showMessage('Không thể hiển thị vị trí', 'error');
                            return;
                        }
                    }
                    this.showLocationOnMap(loc, expense.name);
                });
            }
            
        }, 0);
        
        return item;
    }

    /**
     * Added debug method to directly show location info on all expenses
     * This is a temporary fix to diagnose the issue
     */
    showDebugLocationInfo() {
        console.log("DEBUG - Only logging location data to console (no UI badge)");
        
        // Find all expense items in the DOM
        const expenseItems = document.querySelectorAll('.expense-item');
        expenseItems.forEach(item => {
            const expenseId = item.getAttribute('data-id');
            if (!expenseId) return;
            
            // Find the expense object
            const expense = this.app.expenseManager.getExpenseById(expenseId);
            if (!expense) return;
            
            console.log(`DEBUG - Expense ${expenseId} (${expense.name}):`, {
                hasLocation: !!expense.location,
                locationType: typeof expense.location,
                locationValue: expense.location
            });
            
            // NO LONGER ADDING DEBUG BADGES TO UI
        });
    }

    /**
     * Close the map modal
     */
    closeMapModal() {
        // Hide the modal
        this.mapModal.classList.add('hidden');
        
        // If map exists, remove it to free resources
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.marker = null;
        }
    }

    /**
     * Debug all expenses' location data (for console use)
     */
    debugAllExpenseLocations() {
        const expenses = this.app.expenseManager.getAllExpenses();
        this.debugLocationData(expenses);
        
        console.log("=== Debug commands for expense locations ===");
        console.log("To force showing the location debug badges on all expense items:");
        console.log("window.debugExpenseLocations.showBadges()");
        
        console.log("\nTo test showing a specific expense location on map:");
        console.log("window.debugExpenseLocations.showLocationOnMap('expenseId')");
        
        console.log("\nTo fix location data for all expenses in memory (not saved to DB):");
        console.log("window.debugExpenseLocations.fixLocationData()");
        
        return {
            expenses: expenses,
            showBadges: () => this.showDebugLocationInfo(),
            showLocationOnMap: (expenseId) => {
                const expense = this.app.expenseManager.getExpenseById(expenseId);
                if (expense) {
                    this.showLocationOnMap(expense.location, expense.name);
                    return "Showing location for " + expense.name;
                } else {
                    return "Expense not found with ID " + expenseId;
                }
            },
            fixLocationData: () => {
                let fixedCount = 0;
                expenses.forEach(expense => {
                    if (expense.location && typeof expense.location === 'string') {
                        try {
                            expense.location = JSON.parse(expense.location);
                            fixedCount++;
                        } catch (e) {
                            console.error(`Could not parse location for expense ${expense.id}:`, e);
                        }
                    }
                });
                return `Fixed ${fixedCount} expenses with string location data`;
            }
        };
    }

    /**
     * Phương thức này chỉ log debug info về location vào console, không hiển thị UI
     */
    showDebugLocationInfo() {
        console.log("DEBUG - Checking location data for expenses (console only)");
        
        // Find all expense items in the DOM
        const expenseItems = document.querySelectorAll('.expense-item');
        expenseItems.forEach(item => {
            const expenseId = item.getAttribute('data-id');
            if (!expenseId) return;
            
            // Find the expense object
            const expense = this.app.expenseManager.getExpenseById(expenseId);
            if (!expense) return;
            
            // Log location info to console only
            if (expense.location) {
                console.log(`Expense ${expenseId} (${expense.name}) has location:`, 
                    typeof expense.location === 'string' 
                        ? `String format: ${expense.location.substring(0, 30)}...`
                        : `Object format: lat=${expense.location.lat}, lng=${expense.location.lng}, name=${expense.location.name || 'N/A'}`
                );
            }
        });
    }
}
