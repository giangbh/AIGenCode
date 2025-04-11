/**
 * FundUIController
 * Handles UI operations related to the group fund
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage } from '../utils/helpers.js';
import { isAdmin } from '../utils/auth.js';

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
        
        // Chart
        this.fundPieChart = null;
        
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
        
        // Populate member dropdown for deposits
        this.populateDepositMemberSelect();
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
     * Render fund balance and status
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
        
        // Update the pie chart
        this.updateFundPieChart();
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
        // Get the chart context
        const canvas = document.getElementById('fund-pie-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Prepare the data for the pie chart using memberBalances
        const memberBalances = this.app.fundManager.getMemberBalances();
        const members = this.app.memberManager.getAllMembers();
        
        const chartLabels = [];
        const chartData = [];
        
        // Add only members with positive balances
        members.forEach(member => {
            const balance = memberBalances[member] || 0;
            if (balance > 0) {
                chartLabels.push(member);
                chartData.push(balance);
            }
        });
        
        // Generate colors for each segment (one per member)
        const colors = [
            '#4ade80', // green-400
            '#60a5fa', // blue-400
            '#f87171', // red-400
            '#facc15', // yellow-400
            '#a78bfa', // purple-400
            '#fb923c'  // orange-400
        ];
        
        // If there's no data, show a placeholder
        if (chartLabels.length === 0) {
            chartLabels.push('Chưa có dữ liệu');
            chartData.push(100);
        }
        
        // If there's an existing chart, destroy it before creating a new one
        if (this.fundPieChart) {
            this.fundPieChart.destroy();
        }
        
        // Create a new pie chart
        this.fundPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: colors.slice(0, chartLabels.length),
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                family: 'Roboto, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
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