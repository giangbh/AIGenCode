/**
 * FundUIController
 * Handles UI operations related to the group fund
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage, formatDisplayDate, formatDisplayDateTime } from '../utils/helpers.js';

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
        
        // Pagination
        this.currentPage = 1;
        this.transactionsPerPage = 5; // Hiển thị 5 giao dịch mỗi trang
        this.totalTransactions = 0;
        
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
     * Render fund transactions with pagination
     * @param {number} [page=1] - Page number to display
     */
    renderFundTransactions(page = 1) {
        if (!this.groupFundTransactionsLogDiv) return;
        
        const transactions = this.app.fundManager.getAllTransactions();
        this.totalTransactions = transactions.length;
        
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
        
        // Sort transactions by datetime, most recent first
        const sortedTransactions = [...transactions].sort((a, b) => {
            // First try to sort by datetime if available
            if (a.datetime && b.datetime) {
                return new Date(b.datetime) - new Date(a.datetime);
            }
            // Fall back to date sorting
            return new Date(b.date) - new Date(a.date);
        });
        
        // Calculate pagination
        this.currentPage = page;
        const totalPages = Math.ceil(sortedTransactions.length / this.transactionsPerPage);
        
        // Adjust current page if needed
        if (this.currentPage < 1) this.currentPage = 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        
        // Get current page transactions
        const startIndex = (this.currentPage - 1) * this.transactionsPerPage;
        const endIndex = Math.min(startIndex + this.transactionsPerPage, sortedTransactions.length);
        const currentTransactions = sortedTransactions.slice(startIndex, endIndex);
        
        // Render transactions for the current page
        currentTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'fund-transaction-item mb-4 bg-white p-4 rounded-lg shadow-sm';
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-2';
            
            const dateTime = document.createElement('div');
            dateTime.className = 'text-sm text-gray-500';
            // Use datetime if available, otherwise fall back to date
            dateTime.textContent = transaction.datetime ? 
                formatDisplayDateTime(transaction.datetime) : 
                formatDisplayDate(transaction.date);
            
            const amount = document.createElement('div');
            amount.className = transaction.isDeposit() ? 
                'text-lg font-bold text-green-600' : 
                'text-lg font-bold text-red-600';
            amount.textContent = transaction.isDeposit() ? 
                `+${formatCurrency(transaction.amount)}` : 
                `-${formatCurrency(transaction.amount)}`;
            
            header.appendChild(dateTime);
            header.appendChild(amount);
            
            const content = document.createElement('div');
            
            if (transaction.isDeposit()) {
                const depositInfo = document.createElement('p');
                depositInfo.className = 'text-gray-800';
                depositInfo.textContent = `${transaction.member} đã nộp quỹ`;
                
                if (transaction.note) {
                    const note = document.createElement('p');
                    note.className = 'text-sm text-gray-500 mt-1';
                    note.textContent = `Ghi chú: ${transaction.note}`;
                    content.appendChild(depositInfo);
                    content.appendChild(note);
                } else {
                    content.appendChild(depositInfo);
                }
            } else if (transaction.isExpense()) {
                const expenseInfo = document.createElement('p');
                expenseInfo.className = 'text-gray-800';
                expenseInfo.textContent = `Chi tiêu: ${transaction.expenseName || 'Không có tên'}`;
                content.appendChild(expenseInfo);
            }
            
            item.appendChild(header);
            item.appendChild(content);
            
            this.groupFundTransactionsLogDiv.appendChild(item);
        });
        
        // Add pagination controls if needed
        if (totalPages > 1) {
            this.renderPaginationControls(totalPages);
        }
    }
    
    /**
     * Render pagination controls
     * @param {number} totalPages - Total number of pages
     */
    renderPaginationControls(totalPages) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'flex justify-center items-center mt-4 space-x-2';
        
        // First page button
        const firstButton = document.createElement('button');
        firstButton.className = 'px-3 py-1 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300';
        firstButton.textContent = '««';
        firstButton.disabled = this.currentPage === 1;
        if (this.currentPage > 1) {
            firstButton.addEventListener('click', () => this.renderFundTransactions(1));
        } else {
            firstButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Previous page button
        const prevButton = document.createElement('button');
        prevButton.className = 'px-3 py-1 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300';
        prevButton.textContent = '«';
        prevButton.disabled = this.currentPage === 1;
        if (this.currentPage > 1) {
            prevButton.addEventListener('click', () => this.renderFundTransactions(this.currentPage - 1));
        } else {
            prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-sm text-gray-600';
        pageInfo.textContent = `Trang ${this.currentPage} / ${totalPages}`;
        
        // Next page button
        const nextButton = document.createElement('button');
        nextButton.className = 'px-3 py-1 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300';
        nextButton.textContent = '»';
        nextButton.disabled = this.currentPage === totalPages;
        if (this.currentPage < totalPages) {
            nextButton.addEventListener('click', () => this.renderFundTransactions(this.currentPage + 1));
        } else {
            nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Last page button
        const lastButton = document.createElement('button');
        lastButton.className = 'px-3 py-1 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300';
        lastButton.textContent = '»»';
        lastButton.disabled = this.currentPage === totalPages;
        if (this.currentPage < totalPages) {
            lastButton.addEventListener('click', () => this.renderFundTransactions(totalPages));
        } else {
            lastButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        paginationContainer.appendChild(firstButton);
        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextButton);
        paginationContainer.appendChild(lastButton);
        
        this.groupFundTransactionsLogDiv.appendChild(paginationContainer);
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
} 