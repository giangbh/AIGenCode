/**
 * FundUIController
 * Handles UI operations related to the group fund
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage } from '../utils/helpers.js';
import { isAdmin } from '../utils/auth.js';
import { supabase } from '../utils/storage.js';

export class FundUIController extends UIController {
    /**
     * Create a new FundUIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        super(app);
        
        // DOM Elements
        this.groupFundBalanceCardSpan = document.getElementById('group-fund-balance-card');
        this.groupFundBalanceInfoSpan = document.getElementById('group-fund-balance-info');
        this.memberBalancesList = document.getElementById('member-balances-list');
        this.depositForm = document.getElementById('deposit-form');
        this.depositMemberSelect = document.getElementById('deposit-member');
        this.depositAmountInput = document.getElementById('deposit-amount');
        this.depositDateInput = document.getElementById('deposit-date');
        this.depositNoteInput = document.getElementById('deposit-note');
        this.groupFundTransactionsLogDiv = document.getElementById('group-fund-transactions-log');
        this.noFundTransactionsMessage = document.getElementById('no-fund-transactions-message');
        
        // Charts
        this.fundPieChart = null;
        this.incomeExpenseChart = null;
        
        // Pagination for fund transactions
        this.transactionsPerPage = 6; // Show 6 transactions per page
        this.currentTransactionPage = 1;
        
        // Initialize UI
        this.initUI();
    }
    
    /**
     * Initialize fund UI
     */
    initUI() {
        // Set initial date to today
        this.depositDateInput.value = getTodayDateString();
        
        // Add event listeners
        this.depositForm.addEventListener('submit', (e) => this.handleDepositSubmit(e));
        this.depositAmountInput.addEventListener('input', (e) => { 
            e.target.value = formatAmountInput(e.target.value);
        });
        
        // Tab switching
        document.querySelectorAll('.tabs .tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
        
        // Initialize notification threshold form 
        const notificationThresholdForm = document.getElementById('notification-threshold-form');
        if (notificationThresholdForm) {
            notificationThresholdForm.addEventListener('submit', (e) => this.handleNotificationThresholdSubmit(e));
            
            // Format threshold amount input
            const thresholdAmountInput = document.getElementById('threshold-amount-input');
            if (thresholdAmountInput) {
                thresholdAmountInput.addEventListener('input', (e) => {
                    e.target.value = formatAmountInput(e.target.value);
                });
            }
        }
        
        // Populate member dropdown for deposits
        this.populateDepositMemberSelect();
        this.populateThresholdMemberSelect();
    }
    
    /**
     * Switch between tabs
     * @param {string} tabId - Tab ID to switch to
     */
    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-pane').forEach(content => {
            content.classList.remove('active');
        });
        
        // Deactivate all tab buttons
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        // Activate the selected tab button
        document.querySelectorAll(`.tab-btn[data-tab="${tabId}"]`).forEach(button => {
            button.classList.add('active');
        });
        
        // Show the selected tab content
        const selectedContent = document.getElementById(`${tabId}-content`);
        if (selectedContent) {
            selectedContent.classList.add('active');
        }
    }
    
    /**
     * Populate deposit member select dropdown
     */
    populateDepositMemberSelect() {
        const members = this.app.memberManager.getAllMembers();
        
        this.depositMemberSelect.innerHTML = '<option value="" disabled selected>-- Chọn người nộp --</option>';
        members.forEach(member => { 
            const option = document.createElement('option'); 
            option.value = member; 
            option.textContent = member; 
            this.depositMemberSelect.appendChild(option); 
        });
    }
    
    /**
     * Populate member dropdown for threshold settings
     */
    populateThresholdMemberSelect() {
        const thresholdMemberSelect = document.getElementById('threshold-member-select');
        if (!thresholdMemberSelect) return;
        
        const members = this.app.memberManager.getAllMembers();
        
        thresholdMemberSelect.innerHTML = '<option value="" disabled selected>-- Chọn thành viên --</option>';
        members.forEach(member => { 
            const option = document.createElement('option'); 
            option.value = member; 
            option.textContent = member; 
            thresholdMemberSelect.appendChild(option); 
        });
        
        // Add change event to load current threshold
        thresholdMemberSelect.addEventListener('change', () => {
            this.loadMemberThreshold(thresholdMemberSelect.value);
        });
    }
    
    /**
     * Load current threshold for member
     * @param {string} memberName - Name of the member
     */
    loadMemberThreshold(memberName) {
        if (!memberName) return;
        
        const thresholdAmountInput = document.getElementById('threshold-amount-input');
        if (!thresholdAmountInput) return;
        
        // Get member balance from database
        const memberBalances = this.app.fundManager.getMemberBalances();
        const balance = memberBalances[memberName] || 0;
        
        // Default threshold is -50,000 or 50% of current balance if negative
        let defaultThreshold = -50000;
        if (balance < 0) {
            defaultThreshold = Math.min(defaultThreshold, Math.floor(balance * 1.5));
        }
        
        // Set threshold in the input
        thresholdAmountInput.value = formatCurrency(defaultThreshold).replace('VNĐ', '').trim();
    }
    
    /**
     * Handle notification threshold form submit
     * @param {Event} e - Submit event
     */
    async handleNotificationThresholdSubmit(e) {
        e.preventDefault();
        
        const memberSelect = document.getElementById('threshold-member-select');
        const thresholdInput = document.getElementById('threshold-amount-input');
        
        if (!memberSelect || !thresholdInput) return;
        
        const memberName = memberSelect.value;
        const threshold = parseFormattedAmount(thresholdInput.value);
        
        if (!memberName) {
            showMessage('Vui lòng chọn thành viên', 'error');
            return;
        }
        
        if (threshold >= 0) {
            showMessage('Ngưỡng nhắc nhở phải là số âm', 'error');
            return;
        }
        
        try {
            // Update threshold in database
            await supabase.updateNotificationThreshold(memberName, threshold);
            
            showMessage(`Đã cập nhật ngưỡng nhắc nhở cho ${memberName} thành ${formatCurrency(threshold)}`, 'success');
            
            // Refresh member notifications
            this.renderMemberNotifications();
        } catch (error) {
            console.error('Lỗi khi cập nhật ngưỡng nhắc nhở:', error);
            showMessage('Lỗi khi cập nhật ngưỡng nhắc nhở', 'error');
        }
    }
    
    /**
     * Render fund status
     */
    renderFundStatus() {
        const balance = this.app.fundManager.getBalance();
        
        // Update all balance displays
        if (this.groupFundBalanceCardSpan) {
            this.groupFundBalanceCardSpan.textContent = formatCurrency(balance);
        }
        
        if (this.groupFundBalanceInfoSpan) {
            this.groupFundBalanceInfoSpan.textContent = formatCurrency(balance);
        }
        
        // Also update the balance on expenses tab
        const expensesGroupFundBalanceSpan = document.getElementById('expenses-group-fund-balance');
        if (expensesGroupFundBalanceSpan) {
            expensesGroupFundBalanceSpan.textContent = formatCurrency(balance);
        }
        
        // Render member balances
        this.renderMemberBalances();
        
        // Update the charts
        this.updateFundPieChart();
        this.updateIncomeExpenseChart();
    }
    
    /**
     * Render member balances
     */
    renderMemberBalances() {
        if (!this.memberBalancesList) return;
        
        this.memberBalancesList.innerHTML = '';
        
        const memberBalances = this.app.fundManager.getMemberBalances();
        const members = this.app.memberManager.getAllMembers();
        
        // Get members sorted by balance (highest to lowest)
        const sortedMembers = [...members].sort((a, b) => 
            (memberBalances[b] || 0) - (memberBalances[a] || 0)
        );
        
        sortedMembers.forEach(member => {
            const balance = memberBalances[member] || 0;
            const li = document.createElement('li');
            li.className = 'py-1 px-1 flex justify-between items-center';
            
            const name = document.createElement('span');
            name.className = 'text-sm';
            name.textContent = member;
            
            const balanceSpan = document.createElement('span');
            balanceSpan.className = balance > 0 ? 'text-green-600 font-medium text-sm' : 
                                    balance < 0 ? 'text-red-600 font-medium text-sm' : 
                                    'text-gray-600 text-sm';
            balanceSpan.textContent = formatCurrency(balance);
            
            li.appendChild(name);
            li.appendChild(balanceSpan);
            
            this.memberBalancesList.appendChild(li);
        });
        
        // Also render notification section
        this.renderMemberNotifications();
    }
    
    /**
     * Render member notifications
     */
    async renderMemberNotifications() {
        const memberNotificationsDiv = document.getElementById('member-notifications');
        if (!memberNotificationsDiv) return;
        
        try {
            // Get members needing notification
            const membersNeedingNotification = await supabase.getMembersNeedingNotification();
            
            if (membersNeedingNotification.length === 0) {
                memberNotificationsDiv.innerHTML = `
                    <div class="text-sm text-gray-500 italic">
                        Không có thành viên nào cần nhắc nhở nộp tiền.
                    </div>
                `;
                return;
            }
            
            // Create notifications for each member
            memberNotificationsDiv.innerHTML = '';
            
            // Sort by balance (most negative first)
            membersNeedingNotification.sort((a, b) => a.balance - b.balance);
            
            membersNeedingNotification.forEach(({ member, balance, threshold }) => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'notification-item bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2';
                
                memberDiv.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium text-yellow-800">${member}</span>
                            <div class="text-sm text-red-600">
                                Số dư: ${formatCurrency(balance)} 
                                <span class="text-xs text-gray-500">(Ngưỡng: ${formatCurrency(threshold)})</span>
                            </div>
                        </div>
                        <div>
                            <button class="text-xs py-1 px-2 bg-green-500 text-white rounded hover:bg-green-600 notify-btn"
                                    data-member="${member}" data-balance="${balance}">
                                <i data-lucide="bell" class="w-3 h-3 mr-1"></i>
                                Đã nhắc
                            </button>
                        </div>
                    </div>
                `;
                
                memberNotificationsDiv.appendChild(memberDiv);
                
                // Add event listener to notify button
                const notifyBtn = memberDiv.querySelector('.notify-btn');
                if (notifyBtn) {
                    notifyBtn.addEventListener('click', (e) => {
                        const memberName = e.currentTarget.getAttribute('data-member');
                        const balance = parseInt(e.currentTarget.getAttribute('data-balance'), 10);
                        this.notifyMember(memberName, balance);
                    });
                }
            });
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
        } catch (error) {
            console.error('Lỗi khi tải thông tin nhắc nhở:', error);
            memberNotificationsDiv.innerHTML = `
                <div class="text-sm text-red-500">
                    Lỗi khi tải thông tin nhắc nhở. Vui lòng thử lại sau.
                </div>
            `;
        }
    }
    
    /**
     * Mark member as notified
     * @param {string} memberName - Name of the member
     * @param {number} balance - Current balance
     */
    async notifyMember(memberName, balance) {
        try {
            // Mark as notified in database
            await supabase.markMemberNotified(memberName);
            
            // Show success message
            showMessage(`Đã đánh dấu thành viên ${memberName} là đã được nhắc nhở`, 'success');
            
            // Refresh the notifications
            this.renderMemberNotifications();
        } catch (error) {
            console.error('Lỗi khi đánh dấu thành viên đã được nhắc nhở:', error);
            showMessage('Lỗi khi đánh dấu thành viên đã được nhắc nhở', 'error');
        }
    }
    
    /**
     * Handle deposit form submission
     * @param {Event} event - The form submission event
     */
    async handleDepositSubmit(e) {
        e.preventDefault();
        
        const amount = parseFormattedAmount(this.depositAmountInput.value);
        const member = this.depositMemberSelect.value;
        const date = this.depositDateInput.value;
        const note = this.depositNoteInput.value;
        
        if (amount <= 0) {
            showMessage('Vui lòng nhập số tiền hợp lệ', 'error');
            return;
        }
        
        if (!member) {
            showMessage('Vui lòng chọn người nộp', 'error');
            return;
        }
        
        try {
            // Hiển thị trạng thái đang xử lý
            const submitBtn = this.depositForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';
            
            // Add deposit
            await this.app.fundManager.addDeposit(member, amount, date, note);
            
            // Làm mới dữ liệu với cơ chế hoàn chỉnh
            try {
                // Refresh dữ liệu
                await this.app.fundManager.loadData();
                
                // Cập nhật giao diện quỹ nhóm
                this.renderFundStatus();
                this.renderFundTransactions();
                
                // Cập nhật số dư quỹ trên tab chi tiêu và thành viên
                this.updateAllFundBalanceDisplays();
            } catch (refreshError) {
                console.error('Lỗi khi làm mới dữ liệu:', refreshError);
            }
            
            // Reset form
            this.depositForm.reset();
            this.depositDateInput.value = getTodayDateString();
            
            showMessage(`${member} đã nộp ${formatCurrency(amount)} vào quỹ nhóm`);
        } catch (error) {
            showMessage(`Lỗi khi thêm khoản nộp quỹ: ${error.message}`, 'error');
        } finally {
            // Khôi phục trạng thái nút
            const submitBtn = this.depositForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Nộp quỹ';
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
        
        // Cập nhật số dư trên tab quỹ nhóm
        if (this.groupFundBalanceCardSpan) {
            this.groupFundBalanceCardSpan.textContent = formatCurrency(balance);
        }
        
        if (this.groupFundBalanceInfoSpan) {
            this.groupFundBalanceInfoSpan.textContent = formatCurrency(balance);
        }
    }
    
    /**
     * Render fund transactions
     */
    renderFundTransactions() {
        if (!this.groupFundTransactionsLogDiv) return;
        
        const transactions = this.app.fundManager.getAllTransactions();
        
        if (transactions.length === 0) {
            if (this.noFundTransactionsMessage) {
                this.noFundTransactionsMessage.classList.remove('hidden');
            }
            this.groupFundTransactionsLogDiv.innerHTML = '';
            if (this.noFundTransactionsMessage) {
                this.groupFundTransactionsLogDiv.appendChild(this.noFundTransactionsMessage);
            }
            return;
        }
        
        if (this.noFundTransactionsMessage) {
            this.noFundTransactionsMessage.classList.add('hidden');
        }
        this.groupFundTransactionsLogDiv.innerHTML = '';
        
        // Sort transactions by date, most recent first
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Pagination setup
        const totalTransactions = sortedTransactions.length;
        const totalPages = Math.ceil(totalTransactions / this.transactionsPerPage);
        
        // Ensure current page is valid
        if (this.currentTransactionPage < 1) this.currentTransactionPage = 1;
        if (this.currentTransactionPage > totalPages) this.currentTransactionPage = totalPages;
        
        // Calculate the range of transactions to display
        const startIndex = (this.currentTransactionPage - 1) * this.transactionsPerPage;
        const endIndex = Math.min(startIndex + this.transactionsPerPage, totalTransactions);
        
        // Get current page transactions
        const currentPageTransactions = sortedTransactions.slice(startIndex, endIndex);
        
        // Create container for transactions
        const transactionsList = document.createElement('div');
        transactionsList.className = 'mb-4';
        
        // Render transactions for current page
        currentPageTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'fund-transaction-item mb-2 pb-2 border-b border-gray-100';
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center';
            
            const dateAmount = document.createElement('div');
            
            const date = document.createElement('span');
            date.className = 'text-xs text-gray-500';
            
            // Format date from YYYY-MM-DD to DD/MM/YYYY
            const dateParts = transaction.date.split('-');
            date.textContent = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            
            const amount = document.createElement('span');
            amount.className = transaction.isDeposit() ? 'ml-2 text-green-600 font-medium' : 'ml-2 text-red-600 font-medium';
            amount.textContent = `${transaction.isDeposit() ? '+' : '-'} ${formatCurrency(transaction.amount)}`;
            
            dateAmount.appendChild(date);
            dateAmount.appendChild(amount);
            
            header.appendChild(dateAmount);
            
            // Add delete button for admin users only
            if (isAdmin() && transaction.isDeposit()) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'text-red-500 hover:text-red-700 text-xs p-1';
                deleteButton.innerHTML = '<i data-lucide="trash-2" class="w-3 h-3"></i>';
                deleteButton.title = 'Xóa giao dịch';
                deleteButton.addEventListener('click', () => {
                    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
                        this.handleDeleteDeposit(transaction.id);
                    }
                });
                
                header.appendChild(deleteButton);
            }
            
            const description = document.createElement('p');
            description.className = 'text-sm text-gray-700';
            
            if (transaction.isDeposit()) {
                description.textContent = `${transaction.member} đã nộp tiền vào quỹ`;
                if (transaction.note) {
                    description.textContent += ` (${transaction.note})`;
                }
            } else if (transaction.isExpense()) {
                description.textContent = `Quỹ chi trả cho "${transaction.expenseName}"`;
            }
            
            item.appendChild(header);
            item.appendChild(description);
            
            transactionsList.appendChild(item);
        });
        
        this.groupFundTransactionsLogDiv.appendChild(transactionsList);
        
        // Add pagination controls if needed
        if (totalPages > 1) {
            const paginationControls = document.createElement('div');
            paginationControls.className = 'flex items-center justify-between border-t border-gray-200 pt-3';
            
            // Page info text
            const pageInfo = document.createElement('div');
            pageInfo.className = 'text-xs text-gray-500';
            pageInfo.textContent = `Trang ${this.currentTransactionPage}/${totalPages}`;
            
            // Pagination buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex space-x-2';
            
            // Previous button
            const prevButton = document.createElement('button');
            prevButton.type = 'button';
            prevButton.className = 'px-2 py-1 text-xs rounded border border-gray-300 ' + 
                                   (this.currentTransactionPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50');
            prevButton.innerHTML = '<i data-lucide="chevron-left" class="w-3 h-3"></i>';
            prevButton.disabled = this.currentTransactionPage === 1;
            
            if (this.currentTransactionPage > 1) {
                prevButton.addEventListener('click', () => {
                    this.currentTransactionPage--;
                    this.renderFundTransactions();
                });
            }
            
            // Next button
            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.className = 'px-2 py-1 text-xs rounded border border-gray-300 ' + 
                                   (this.currentTransactionPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50');
            nextButton.innerHTML = '<i data-lucide="chevron-right" class="w-3 h-3"></i>';
            nextButton.disabled = this.currentTransactionPage === totalPages;
            
            if (this.currentTransactionPage < totalPages) {
                nextButton.addEventListener('click', () => {
                    this.currentTransactionPage++;
                    this.renderFundTransactions();
                });
            }
            
            buttonContainer.appendChild(prevButton);
            buttonContainer.appendChild(nextButton);
            
            paginationControls.appendChild(pageInfo);
            paginationControls.appendChild(buttonContainer);
            
            this.groupFundTransactionsLogDiv.appendChild(paginationControls);
        }
        
        // Apply Lucide icons to any new elements
        lucide.createIcons({
            scope: this.groupFundTransactionsLogDiv
        });
    }
    
    /**
     * Update the fund pie chart
     */
    updateFundPieChart() {
        const fundPieChartCanvas = document.getElementById('fund-pie-chart');
        if (!fundPieChartCanvas) return;
        
        const memberBalances = this.app.fundManager.getMemberBalances();
        const members = this.app.memberManager.getAllMembers();
        
        // Prepare data for the chart
        const labels = [];
        const data = [];
        const backgroundColors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)'
        ];
        
        // Add members with positive balances
        members.forEach((member, index) => {
            const balance = memberBalances[member] || 0;
            if (balance > 0) {
                labels.push(member);
                data.push(balance);
            }
        });
        
        // If no members have positive balances, show a message
        if (labels.length === 0) {
            labels.push('Không có dữ liệu');
            data.push(1);
        }
        
        // If chart exists, destroy it
        if (this.fundPieChart) {
            this.fundPieChart.destroy();
        }
        
        // Create new chart
        this.fundPieChart = new Chart(fundPieChartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Update the income/expense bar chart
     */
    updateIncomeExpenseChart() {
        const incomeExpenseChartCanvas = document.getElementById('income-expense-chart');
        if (!incomeExpenseChartCanvas) return;
        
        const transactions = this.app.fundManager.getAllTransactions();
        
        // Get last 6 months data
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5); // Get the past 6 months including current
        
        // Initialize data structure for the past 6 months
        const months = [];
        const incomeData = [];
        const expenseData = [];
        
        for (let i = 0; i < 6; i++) {
            const month = new Date(sixMonthsAgo);
            month.setMonth(sixMonthsAgo.getMonth() + i);
            
            const monthName = month.toLocaleString('vi-VN', { month: 'short' });
            const yearShort = month.getFullYear().toString().substr(-2);
            const label = `${monthName}/${yearShort}`;
            
            months.push(label);
            incomeData.push(0);
            expenseData.push(0);
        }
        
        // Aggregate transaction data by month
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            // Only consider transactions in the last 6 months
            if (transactionDate >= sixMonthsAgo) {
                const monthIndex = transactionDate.getMonth() - sixMonthsAgo.getMonth() + 
                    (transactionDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12;
                
                if (monthIndex >= 0 && monthIndex < 6) {
                    if (transaction.isDeposit()) {
                        incomeData[monthIndex] += transaction.amount;
                    } else {
                        expenseData[monthIndex] += transaction.amount;
                    }
                }
            }
        });
        
        // If chart exists, destroy it
        if (this.incomeExpenseChart) {
            this.incomeExpenseChart.destroy();
        }
        
        // Create new chart
        this.incomeExpenseChart = new Chart(incomeExpenseChartCanvas, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Thu',
                        data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Chi',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return value / 1000000 + 'M';
                                } else if (value >= 1000) {
                                    return value / 1000 + 'K';
                                }
                                return value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Handle delete deposit transaction
     * @param {string} transactionId - The transaction ID to delete
     */
    async handleDeleteDeposit(transactionId) {
        try {
            // Call to delete deposit will be implemented in the future
            showMessage('Chức năng xóa giao dịch đang được phát triển', 'info');
        } catch (error) {
            console.error('Lỗi khi xóa giao dịch:', error);
            showMessage('Không thể xóa giao dịch: ' + error.message, 'error');
        }
    }
} 