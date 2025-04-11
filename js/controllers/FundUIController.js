/**
 * FundUIController
 * Handles UI operations related to the group fund
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getTodayDateString, showMessage } from '../utils/helpers.js';

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
    handleDepositSubmit(e) {
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
        
        // Add deposit
        this.app.fundManager.addDeposit(member, amount, date, note);
        
        // Update UI
        this.renderFundStatus();
        this.renderFundTransactions();
        
        // Reset form
        this.depositForm.reset();
        this.depositDateInput.value = getTodayDateString();
        
        showMessage(`${member} đã nộp ${formatCurrency(amount)} vào quỹ nhóm`);
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
        
        sortedTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'fund-transaction-item';
            
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
            
            this.groupFundTransactionsLogDiv.appendChild(item);
        });
        
        // Apply Lucide icons to any new elements
        lucide.createIcons({
            attrs: {
                class: 'w-4 h-4'
            }
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
} 