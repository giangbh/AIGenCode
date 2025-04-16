/**
 * ReportsUIController
 * Controller for reports tab UI operations
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatDisplayDate, getTodayDateString } from '../utils/helpers.js';
import { createPieChart, createBarChart, createLineChart, createMultiLineChart, generatePastelColors } from '../utils/charts.js';
import { supabase } from '../utils/storage.js';

export class ReportsUIController extends UIController {
    /**
     * Create a new ReportsUIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        super(app);
        
        // Fund Report Elements
        this.fundReportFromDate = document.getElementById('fund-report-from-date');
        this.fundReportToDate = document.getElementById('fund-report-to-date');
        this.generateFundReportBtn = document.getElementById('generate-fund-report-btn');
        this.exportFundReportCSVBtn = document.getElementById('export-fund-report-csv');
        this.exportFundReportPDFBtn = document.getElementById('export-fund-report-pdf');
        
        // General Report Elements
        this.generalReportFromDate = document.getElementById('general-report-from-date');
        this.generalReportToDate = document.getElementById('general-report-to-date');
        this.generateGeneralReportBtn = document.getElementById('generate-general-report-btn');
        
        // Member Report Elements
        this.memberReportUser = document.getElementById('member-report-user');
        this.memberReportFromDate = document.getElementById('member-report-from-date');
        this.memberReportToDate = document.getElementById('member-report-to-date');
        this.generateMemberReportBtn = document.getElementById('generate-member-report-btn');
        
        // Lưu trữ dữ liệu báo cáo hiện tại
        this.currentFundReportData = null;
        this.currentGeneralReportData = null;
        
        // Initialize UI
        this.initReportsUI();
    }
    
    /**
     * Initialize reports UI
     */
    initReportsUI() {
        // Set default dates (current month)
        this.setDefaultDates();
        
        // Initialize tabs switching
        this.initSubTabs();
        
        // Add event listeners for generate report buttons
        this.addReportButtonListeners();
        
        // Populate member dropdown for member report
        this.populateMemberSelect();
    }
    
    /**
     * Set default dates for report filters (first day of current month to today)
     */
    setDefaultDates() {
        const today = new Date();
        // Lấy ngày 1 tháng trước thay vì ngày đầu tháng
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const todayString = getTodayDateString();
        const oneMonthAgoString = formatDateForInput(oneMonthAgo);
        
        // Set dates for all report types
        this.fundReportFromDate.value = oneMonthAgoString;
        this.fundReportToDate.value = todayString;
        
        this.generalReportFromDate.value = oneMonthAgoString;
        this.generalReportToDate.value = todayString;
        
        this.memberReportFromDate.value = oneMonthAgoString;
        this.memberReportToDate.value = todayString;
    }
    
    /**
     * Initialize sub-tabs within the reports tab
     */
    initSubTabs() {
        document.querySelectorAll('.tabs .tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Lấy tabId từ button, không phải từ target của sự kiện
                // Target có thể là phần tử con bên trong button (icon, text)
                const tabId = button.getAttribute('data-tab');
                this.switchReportTab(tabId);
            });
        });
    }
    
    /**
     * Switch between report tabs
     * @param {string} tabId - Tab ID to switch to
     */
    switchReportTab(tabId) {
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
     * Add event listeners for generate report buttons
     */
    addReportButtonListeners() {
        if (this.generateFundReportBtn) {
            this.generateFundReportBtn.addEventListener('click', () => this.generateFundReport());
        }
        
        if (this.generateGeneralReportBtn) {
            this.generateGeneralReportBtn.addEventListener('click', () => this.generateGeneralReport());
        }
        
        if (this.generateMemberReportBtn) {
            this.generateMemberReportBtn.addEventListener('click', () => this.generateMemberReport());
        }
        
        // Thêm event listeners cho các nút xuất báo cáo
        if (this.exportFundReportCSVBtn) {
            this.exportFundReportCSVBtn.addEventListener('click', () => this.exportFundReportAsCSV());
        }
        
        if (this.exportFundReportPDFBtn) {
            this.exportFundReportPDFBtn.addEventListener('click', () => this.exportFundReportAsPDF());
        }
    }
    
    /**
     * Populate member select dropdown for member reports
     */
    populateMemberSelect() {
        if (!this.memberReportUser) return;
        
        // Clear existing options except "All members"
        while (this.memberReportUser.options.length > 1) {
            this.memberReportUser.remove(1);
        }
        
        // Add options for each member
        const members = this.app.memberManager.getAllMembers();
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;  // Tên thành viên là ID
            option.textContent = member;
            this.memberReportUser.appendChild(option);
        });
    }
    
    /**
     * Generate fund report based on selected date range
     */
    async generateFundReport() {
        const fromDate = this.fundReportFromDate.value;
        const toDate = this.fundReportToDate.value;
        
        if (!fromDate || !toDate) {
            alert('Vui lòng chọn khoảng thời gian cho báo cáo');
            return;
        }
        
        try {
            // Hiển thị trạng thái đang tải
            document.getElementById('fund-report-loading').classList.remove('hidden');
            
            // Sử dụng hàm getFundTransactions từ utility supabase thay vì gọi trực tiếp
            const transactions = await supabase.getFundTransactions();
            
            // Lọc theo khoảng thời gian
            const filteredTransactions = transactions.filter(transaction => {
                return transaction.date >= fromDate && transaction.date <= toDate;
            });
            
            console.log('Đã tải', transactions.length, 'giao dịch quỹ');
            console.log('Có', filteredTransactions.length, 'giao dịch trong khoảng thời gian đã chọn');
            
            // Lưu dữ liệu báo cáo hiện tại
            this.currentFundReportData = {
                transactions: filteredTransactions,
                fromDate: fromDate,
                toDate: toDate,
                fromDateFormatted: new Date(fromDate).toLocaleDateString('vi-VN'),
                toDateFormatted: new Date(toDate).toLocaleDateString('vi-VN')
            };
            
            // Kích hoạt nút xuất báo cáo nếu có dữ liệu
            this.toggleExportButtons(filteredTransactions.length > 0);
            
            // Render báo cáo với dữ liệu thực
            this.renderFundReportCharts(filteredTransactions, fromDate, toDate);
            this.renderFundTransactionTable(filteredTransactions, fromDate, toDate);
            
            // Ẩn trạng thái đang tải
            document.getElementById('fund-report-loading').classList.add('hidden');
        } catch (err) {
            console.error('Lỗi khi tạo báo cáo quỹ:', err);
            alert('Đã xảy ra lỗi khi tạo báo cáo. Vui lòng thử lại sau.');
            document.getElementById('fund-report-loading').classList.add('hidden');
            
            // Vô hiệu hóa nút xuất báo cáo khi có lỗi
            this.toggleExportButtons(false);
        }
    }
    
    /**
     * Toggle export buttons based on data availability
     * @param {boolean} enable - Whether to enable the buttons
     */
    toggleExportButtons(enable) {
        if (this.exportFundReportCSVBtn) {
            this.exportFundReportCSVBtn.disabled = !enable;
        }
        if (this.exportFundReportPDFBtn) {
            this.exportFundReportPDFBtn.disabled = !enable;
        }
    }
    
    /**
     * Generate general expense report based on selected date range
     */
    async generateGeneralReport() {
        const fromDate = this.generalReportFromDate.value;
        const toDate = this.generalReportToDate.value;
        
        if (!fromDate || !toDate) {
            alert('Vui lòng chọn khoảng thời gian cho báo cáo');
            return;
        }
        
        try {
            // Hiển thị trạng thái đang tải nếu có
            const loadingElement = document.getElementById('general-report-loading');
            if (loadingElement) {
                loadingElement.classList.remove('hidden');
            }
            
            // Lấy dữ liệu chi tiêu từ Supabase
            const expenses = await supabase.getExpenses();
            
            // Lọc theo khoảng thời gian
            const filteredExpenses = expenses.filter(expense => {
                return expense.date >= fromDate && expense.date <= toDate;
            });
            
            console.log('Đã tải', expenses.length, 'chi tiêu');
            console.log('Có', filteredExpenses.length, 'chi tiêu trong khoảng thời gian đã chọn');
            
            // Lưu dữ liệu báo cáo hiện tại
            this.currentGeneralReportData = {
                expenses: filteredExpenses,
                fromDate: fromDate,
                toDate: toDate,
                fromDateFormatted: new Date(fromDate).toLocaleDateString('vi-VN'),
                toDateFormatted: new Date(toDate).toLocaleDateString('vi-VN')
            };
            
            // Render báo cáo với dữ liệu thực
            this.renderGeneralReportCharts(filteredExpenses, fromDate, toDate);
            this.renderGeneralReportSummary(filteredExpenses, fromDate, toDate);
            this.renderGeneralExpenseTable(filteredExpenses, fromDate, toDate);
            
            // Ẩn trạng thái đang tải
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        } catch (err) {
            console.error('Lỗi khi tạo báo cáo chi tiêu chung:', err);
            alert('Đã xảy ra lỗi khi tạo báo cáo. Vui lòng thử lại sau.');
            
            // Ẩn trạng thái đang tải nếu có lỗi
            const loadingElement = document.getElementById('general-report-loading');
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }
    }
    
    /**
     * Generate member expense report based on selected member and date range
     */
    async generateMemberReport() {
        const memberId = this.memberReportUser.value;
        const fromDate = this.memberReportFromDate.value;
        const toDate = this.memberReportToDate.value;
        
        if (!fromDate || !toDate) {
            alert('Vui lòng chọn khoảng thời gian cho báo cáo');
            return;
        }
        
        // TODO: Implement member report generation
        console.log('Generating member expense report for:', memberId, 'period:', fromDate, 'to', toDate);
        
        // Placeholder for actual implementation
        this.renderMemberReportCharts([], memberId, fromDate, toDate);
        this.renderMemberSummaryCards([], memberId, fromDate, toDate);
        this.renderMemberExpenseTable([], memberId, fromDate, toDate);
    }
    
    /**
     * Render fund report charts
     */
    renderFundReportCharts(transactions, fromDate, toDate) {
        // Tính toán tổng nộp quỹ và chi tiêu
        let totalDeposits = 0;
        let totalExpenses = 0;
        
        // Tính toán số tiền nộp quỹ và chi tiêu theo ngày
        const dailyData = {};
        
        transactions.forEach(transaction => {
            if (transaction.type === 'deposit') {
                totalDeposits += transaction.amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += transaction.amount;
            }
            
            // Phân loại theo ngày cho biểu đồ xu hướng
            const date = transaction.date; // Format: YYYY-MM-DD
            if (!dailyData[date]) {
                dailyData[date] = { deposits: 0, expenses: 0 };
            }
            
            if (transaction.type === 'deposit') {
                dailyData[date].deposits += transaction.amount;
            } else if (transaction.type === 'expense') {
                dailyData[date].expenses += transaction.amount;
            }
        });
        
        // Dữ liệu cho biểu đồ tròn
        const pieLabels = ['Nộp quỹ', 'Chi tiêu từ quỹ'];
        const pieData = [totalDeposits, totalExpenses];
        const pieColors = ['#0ea5e9', '#ef4444'];
        
        // Tạo biểu đồ phân bổ quỹ
        const pieChartEl = document.getElementById('fund-report-pie-chart');
        if (pieChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.fundPieChart) {
                this.fundPieChart.destroy();
            }
            
            this.fundPieChart = createPieChart(
                'fund-report-pie-chart', 
                pieData, 
                pieLabels, 
                pieColors, 
                'Tỷ lệ thu chi quỹ'
            );
        }
        
        // Xử lý dữ liệu cho biểu đồ xu hướng theo ngày
        const sortedDates = Object.keys(dailyData).sort();
        const trendLabels = sortedDates.map(date => {
            const [year, month, day] = date.split('-');
            return `${day}/${month}`;
        });
        
        const depositsData = sortedDates.map(date => dailyData[date].deposits);
        const expensesData = sortedDates.map(date => dailyData[date].expenses);
        
        // Tạo biểu đồ xu hướng
        const trendChartEl = document.getElementById('fund-report-trend-chart');
        if (trendChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.fundTrendChart) {
                this.fundTrendChart.destroy();
            }
            
            const datasets = [
                {
                    label: 'Nộp quỹ',
                    data: depositsData,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.2)',
                    fill: true
                },
                {
                    label: 'Chi tiêu',
                    data: expensesData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    fill: true
                }
            ];
            
            this.fundTrendChart = createMultiLineChart(
                'fund-report-trend-chart',
                datasets,
                trendLabels,
                'Xu hướng thu chi quỹ theo ngày'
            );
        }
        
        // Hiện thông báo thống kê
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        console.log(`Đã tạo báo cáo quỹ từ ${fromDateObj.toLocaleDateString('vi-VN')} đến ${toDateObj.toLocaleDateString('vi-VN')}`);
    }
    
    /**
     * Render fund transaction table
     */
    renderFundTransactionTable(transactions, fromDate, toDate) {
        const tableBody = document.getElementById('fund-report-transactions');
        if (!tableBody) return;
        
        // Nếu không có dữ liệu, hiển thị thông báo
        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-3 text-center text-gray-500">
                        Không có giao dịch nào trong khoảng thời gian này
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        transactions.forEach(transaction => {
            const isDeposit = transaction.type === 'deposit';
            const amountValue = isDeposit ? transaction.amount : -transaction.amount;
            const formattedAmount = Math.abs(amountValue).toLocaleString('vi-VN') + ' VNĐ';
            const amountClass = isDeposit ? 'text-blue-600' : 'text-red-600';
            const formattedDate = new Date(transaction.date).toLocaleDateString('vi-VN');
            const displayType = isDeposit ? 'Nộp quỹ' : 'Chi tiêu';
            
            // Xử lý hiển thị thành viên - chuyển __GROUP_FUND__ thành "Group Fund"
            let member = transaction.member || (isDeposit ? '' : transaction.expenseName || '');
            if (member === '__GROUP_FUND__') {
                member = 'Group Fund';
            }
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${formattedDate}</td>
                    <td class="px-4 py-3 text-sm">${member}</td>
                    <td class="px-4 py-3 text-sm">${displayType}</td>
                    <td class="px-4 py-3 text-sm font-medium ${amountClass}">${isDeposit ? '+' : '-'} ${formattedAmount}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${transaction.note || ''}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    /**
     * Render general report charts
     */
    renderGeneralReportCharts(expenses, fromDate, toDate) {
        if (!expenses || expenses.length === 0) {
            // Hiển thị thông báo không có dữ liệu
            const categoryChartEl = document.getElementById('general-report-category-chart');
            const timeChartEl = document.getElementById('general-report-time-chart');
            
            if (categoryChartEl) {
                categoryChartEl.getContext('2d').clearRect(0, 0, categoryChartEl.width, categoryChartEl.height);
                categoryChartEl.getContext('2d').font = '14px Arial';
                categoryChartEl.getContext('2d').fillText('Không có dữ liệu trong khoảng thời gian này', 50, 100);
            }
            
            if (timeChartEl) {
                timeChartEl.getContext('2d').clearRect(0, 0, timeChartEl.width, timeChartEl.height);
                timeChartEl.getContext('2d').font = '14px Arial';
                timeChartEl.getContext('2d').fillText('Không có dữ liệu trong khoảng thời gian này', 50, 100);
            }
            
            return;
        }
        
        // Phân loại chi tiêu theo các nhóm
        const categories = {};
        expenses.forEach(expense => {
            // Đơn giản hóa, phân loại dựa trên tên chi tiêu
            // Trong thực tế, bạn có thể thêm trường category vào model chi tiêu
            let category = 'Khác';
            const expenseName = expense.name.toLowerCase();
            
            if (expenseName.includes('ăn') || expenseName.includes('cafe') || 
                expenseName.includes('cà phê') || expenseName.includes('trà') || 
                expenseName.includes('đồ uống') || expenseName.includes('nhà hàng')) {
                category = 'Ăn uống';
            } else if (expenseName.includes('xe') || expenseName.includes('taxi') || 
                       expenseName.includes('grab') || expenseName.includes('di chuyển') || 
                       expenseName.includes('đi lại') || expenseName.includes('xăng')) {
                category = 'Đi lại';
            } else if (expenseName.includes('giải trí') || expenseName.includes('phim') || 
                       expenseName.includes('game') || expenseName.includes('du lịch') || 
                       expenseName.includes('chơi') || expenseName.includes('tiệc')) {
                category = 'Giải trí';
            }
            
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += expense.amount;
        });
        
        // Chuẩn bị dữ liệu cho biểu đồ phân loại
        const categoryLabels = Object.keys(categories);
        const categoryData = categoryLabels.map(cat => categories[cat]);
        const categoryColors = ['#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];
        
        // Tạo biểu đồ phân loại chi tiêu
        const categoryChartEl = document.getElementById('general-report-category-chart');
        if (categoryChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.generalCategoryChart) {
                this.generalCategoryChart.destroy();
            }
            
            this.generalCategoryChart = createPieChart(
                'general-report-category-chart', 
                categoryData, 
                categoryLabels, 
                categoryColors.slice(0, categoryLabels.length), 
                'Phân loại chi tiêu'
            );
        }
        
        // Phân loại theo thời gian - theo tháng
        const timeData = {};
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`;
            
            if (!timeData[monthYear]) {
                timeData[monthYear] = 0;
            }
            timeData[monthYear] += expense.amount;
        });
        
        // Sắp xếp theo thời gian
        const timeLabels = Object.keys(timeData).sort((a, b) => {
            const [monthA, yearA] = a.split('/').map(Number);
            const [monthB, yearB] = b.split('/').map(Number);
            
            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
        });
        
        const expenseData = timeLabels.map(time => timeData[time]);
        
        // Tạo biểu đồ chi tiêu theo thời gian
        const timeChartEl = document.getElementById('general-report-time-chart');
        if (timeChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.generalTimeChart) {
                this.generalTimeChart.destroy();
            }
            
            this.generalTimeChart = createBarChart(
                'general-report-time-chart',
                expenseData,
                timeLabels,
                'Chi tiêu',
                '#10b981',
                'Chi tiêu theo tháng'
            );
        }
        
        // Hiện thông báo thống kê
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        console.log(`Đã tạo báo cáo chi tiêu chung từ ${fromDateObj.toLocaleDateString('vi-VN')} đến ${toDateObj.toLocaleDateString('vi-VN')}`);
    }
    
    /**
     * Render general report summary
     */
    renderGeneralReportSummary(expenses, fromDate, toDate) {
        const totalExpenseEl = document.getElementById('general-report-total-expense');
        const avgExpenseEl = document.getElementById('general-report-avg-expense');
        const maxExpenseEl = document.getElementById('general-report-max-expense');
        
        if (!expenses || expenses.length === 0) {
            if (totalExpenseEl) totalExpenseEl.textContent = '0 VNĐ';
            if (avgExpenseEl) avgExpenseEl.textContent = '0 VNĐ';
            if (maxExpenseEl) maxExpenseEl.textContent = '0 VNĐ';
            return;
        }
        
        // Tính tổng chi tiêu
        const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Tính trung bình chi tiêu
        const avgExpense = Math.round(totalExpense / expenses.length);
        
        // Tìm chi tiêu lớn nhất
        const maxExpense = Math.max(...expenses.map(expense => expense.amount));
        
        // Hiển thị các giá trị
        if (totalExpenseEl) totalExpenseEl.textContent = `${totalExpense.toLocaleString('vi-VN')} VNĐ`;
        if (avgExpenseEl) avgExpenseEl.textContent = `${avgExpense.toLocaleString('vi-VN')} VNĐ`;
        if (maxExpenseEl) maxExpenseEl.textContent = `${maxExpense.toLocaleString('vi-VN')} VNĐ`;
    }
    
    /**
     * Render general expense table
     */
    renderGeneralExpenseTable(expenses, fromDate, toDate) {
        const tableBody = document.getElementById('general-report-expenses');
        if (!tableBody) return;
        
        // Nếu không có dữ liệu, hiển thị thông báo
        if (!expenses || expenses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-4 text-sm text-gray-500 text-center italic">
                        Không có dữ liệu chi tiêu trong khoảng thời gian đã chọn
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sắp xếp chi tiêu theo ngày, mới nhất lên đầu
        const sortedExpenses = [...expenses].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        let html = '';
        sortedExpenses.forEach(expense => {
            const formattedAmount = expense.amount.toLocaleString('vi-VN') + ' VNĐ';
            const formattedDate = new Date(expense.date).toLocaleDateString('vi-VN');
            
            // Display "Group Fund" instead of "__GROUP_FUND__"
            const payerName = expense.payer === "__GROUP_FUND__" ? "Group Fund" : expense.payer;
            
            // Xử lý danh sách người tham gia
            let participantsStr = '';
            if (Array.isArray(expense.participants)) {
                // Replace "__GROUP_FUND__" with "Group Fund" in the participants array if needed
                participantsStr = expense.participants.map(p => p === "__GROUP_FUND__" ? "Group Fund" : p).join(', ');
            } else if (typeof expense.participants === 'string') {
                participantsStr = expense.participants === "__GROUP_FUND__" ? "Group Fund" : expense.participants;
            } else if (typeof expense.participants === 'object') {
                // Nếu là object với các keys là tên người tham gia
                const keys = Object.keys(expense.participants);
                participantsStr = keys.map(k => k === "__GROUP_FUND__" ? "Group Fund" : k).join(', ');
            }
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${formattedDate}</td>
                    <td class="px-4 py-3 text-sm font-medium">${expense.name}</td>
                    <td class="px-4 py-3 text-sm">${payerName}</td>
                    <td class="px-4 py-3 text-sm font-medium text-emerald-600">${formattedAmount}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${participantsStr}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    /**
     * Render member report charts
     */
    renderMemberReportCharts(data, memberId, fromDate, toDate) {
        // Tạo dữ liệu mẫu cho biểu đồ so sánh
        const comparisonLabels = ['Giang', 'Quân', 'Toàn', 'Quang', 'Trung', 'Nhật'];
        const comparisonData = [1200000, 800000, 1500000, 600000, 900000, 700000];
        const comparisonColors = generatePastelColors(comparisonLabels.length);
        
        // Tạo biểu đồ so sánh chi tiêu
        const comparisonChartEl = document.getElementById('member-report-comparison-chart');
        if (comparisonChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.memberComparisonChart) {
                this.memberComparisonChart.destroy();
            }
            
            this.memberComparisonChart = createBarChart(
                'member-report-comparison-chart',
                comparisonData,
                comparisonLabels,
                'Chi tiêu',
                '#8b5cf6',
                'So sánh chi tiêu theo thành viên'
            );
        }
        
        // Tạo dữ liệu mẫu cho biểu đồ xu hướng
        const trendLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
        const memberNames = ['Giang', 'Quân', 'Toàn'];
        const datasets = [
            {
                label: memberNames[0],
                data: [300000, 400000, 350000, 500000, 450000, 400000],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
            },
            {
                label: memberNames[1],
                data: [250000, 300000, 200000, 350000, 300000, 250000],
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)'
            },
            {
                label: memberNames[2],
                data: [400000, 350000, 450000, 400000, 500000, 450000],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)'
            }
        ];
        
        // Tạo biểu đồ xu hướng chi tiêu
        const trendChartEl = document.getElementById('member-report-trend-chart');
        if (trendChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.memberTrendChart) {
                this.memberTrendChart.destroy();
            }
            
            this.memberTrendChart = createMultiLineChart(
                'member-report-trend-chart',
                datasets,
                trendLabels,
                'Xu hướng chi tiêu theo thành viên'
            );
        }
        
        // Hiện thông báo thống kê
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const memberName = memberId === 'all' ? 'tất cả thành viên' : this.getMemberNameById(memberId);
        console.log(`Đã tạo báo cáo chi tiêu thành viên cho ${memberName} từ ${fromDateObj.toLocaleDateString('vi-VN')} đến ${toDateObj.toLocaleDateString('vi-VN')}`);
    }
    
    /**
     * Render member summary cards
     */
    renderMemberSummaryCards(data, memberId, fromDate, toDate) {
        const container = document.getElementById('member-summary-cards');
        if (!container) return;
        
        // Tạo dữ liệu mẫu cho các thẻ tổng hợp
        const memberData = [
            { name: 'Giang', totalExpense: 1200000, avgExpense: 40000, count: 12 },
            { name: 'Quân', totalExpense: 800000, avgExpense: 50000, count: 8 },
            { name: 'Toàn', totalExpense: 1500000, avgExpense: 65000, count: 10 }
        ];
        
        let html = '';
        if (memberId === 'all') {
            // Hiển thị tất cả thành viên
            html = `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">`;
            memberData.forEach(member => {
                html += this.getMemberSummaryCardHTML(member);
            });
            html += `</div>`;
        } else {
            // Hiển thị chỉ một thành viên được chọn
            const member = memberData.find(m => m.name === this.getMemberNameById(memberId)) || memberData[0];
            html = this.getMemberSummaryCardHTML(member, true);
        }
        
        container.innerHTML = html;
    }
    
    /**
     * Tạo HTML cho thẻ tổng hợp thành viên
     */
    getMemberSummaryCardHTML(member, isFullWidth = false) {
        const className = isFullWidth ? '' : '';
        return `
            <div class="${className} bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 class="text-lg font-bold text-purple-700 mb-2">${member.name}</h4>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Tổng chi tiêu:</span>
                        <span class="font-semibold text-purple-600">${member.totalExpense.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Chi tiêu trung bình:</span>
                        <span class="font-semibold text-purple-600">${member.avgExpense.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Số lần chi tiêu:</span>
                        <span class="font-semibold text-purple-600">${member.count} lần</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Lấy tên thành viên từ ID
     */
    getMemberNameById(memberId) {
        // ID là chính tên thành viên nên trả về luôn
        return memberId;
    }
    
    /**
     * Render member expense table
     */
    renderMemberExpenseTable(expenses, memberId, fromDate, toDate) {
        const tableBody = document.getElementById('member-report-expenses');
        if (!tableBody) return;
        
        // Tạo dữ liệu mẫu cho bảng chi tiêu thành viên
        const sampleExpenses = [
            {
                date: '2023-08-08',
                member: 'Giang',
                expense: 'Ăn trưa 5/8',
                role: 'Người trả',
                amount: 350000
            },
            {
                date: '2023-08-15',
                member: 'Giang',
                expense: 'Cafe buổi sáng',
                role: 'Người tham gia',
                amount: 80000
            },
            {
                date: '2023-08-22',
                member: 'Quân',
                expense: 'Tiệc sinh nhật',
                role: 'Người tham gia',
                amount: 200000
            },
            {
                date: '2023-08-30',
                member: 'Toàn',
                expense: 'Xem phim',
                role: 'Người trả',
                amount: 600000
            },
            {
                date: '2023-09-05',
                member: 'Quân',
                expense: 'Đi chơi cuối tuần',
                role: 'Người tham gia',
                amount: 210000
            }
        ];
        
        // Lọc theo thành viên nếu cần
        let filteredExpenses = sampleExpenses;
        if (memberId !== 'all') {
            const memberName = this.getMemberNameById(memberId);
            filteredExpenses = sampleExpenses.filter(expense => expense.member === memberName);
        }
        
        let html = '';
        filteredExpenses.forEach(expense => {
            const formattedAmount = expense.amount.toLocaleString('vi-VN') + ' VNĐ';
            const formattedDate = new Date(expense.date).toLocaleDateString('vi-VN');
            const roleClass = expense.role === 'Người trả' ? 'text-red-600' : 'text-blue-600';
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${formattedDate}</td>
                    <td class="px-4 py-3 text-sm font-medium">${expense.member}</td>
                    <td class="px-4 py-3 text-sm">${expense.expense}</td>
                    <td class="px-4 py-3 text-sm ${roleClass}">${expense.role}</td>
                    <td class="px-4 py-3 text-sm font-medium text-purple-600">${formattedAmount}</td>
                </tr>
            `;
        });
        
        if (filteredExpenses.length === 0) {
            html = `<tr>
                <td colspan="5" class="px-4 py-4 text-sm text-gray-500 text-center italic">
                    Không có dữ liệu chi tiêu cho thành viên trong khoảng thời gian đã chọn
                </td>
            </tr>`;
        }
        
        tableBody.innerHTML = html;
    }
    
    /**
     * Export fund report as CSV
     */
    exportFundReportAsCSV() {
        if (!this.currentFundReportData || !this.currentFundReportData.transactions.length) {
            alert('Không có dữ liệu báo cáo để xuất');
            return;
        }
        
        try {
            // Tạo header cho file CSV
            let csvContent = 'Ngày,Thành viên,Loại,Số tiền,Ghi chú\n';
            
            // Thêm dữ liệu từng dòng
            this.currentFundReportData.transactions.forEach(transaction => {
                const isDeposit = transaction.type === 'deposit';
                const amountValue = isDeposit ? transaction.amount : -transaction.amount;
                const formattedAmount = amountValue.toString();
                const displayType = isDeposit ? 'Nộp quỹ' : 'Chi tiêu';
                
                // Xử lý hiển thị thành viên - chuyển __GROUP_FUND__ thành "Group Fund"
                let member = transaction.member || (isDeposit ? '' : transaction.expenseName || '');
                if (member === '__GROUP_FUND__') {
                    member = 'Group Fund';
                }
                
                const note = transaction.note || '';
                
                // Escape các ký tự đặc biệt và đảm bảo định dạng CSV đúng
                const escapedNote = note.replace(/"/g, '""');
                
                // Thêm dòng dữ liệu, bọc text trong dấu nháy kép để xử lý dấu phẩy trong nội dung
                csvContent += `${transaction.date},"${member}","${displayType}",${formattedAmount},"${escapedNote}"\n`;
            });
            
            // Tạo Blob và tạo link tải xuống
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // Tạo link tải xuống
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `bao-cao-quy-${this.currentFundReportData.fromDate}-den-${this.currentFundReportData.toDate}.csv`);
            link.style.display = 'none';
            
            // Thêm link vào DOM, click và xóa
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Đã xuất báo cáo CSV thành công');
        } catch (error) {
            console.error('Lỗi khi xuất báo cáo CSV:', error);
            alert('Đã xảy ra lỗi khi xuất báo cáo CSV. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Export fund report as PDF
     */
    exportFundReportAsPDF() {
        if (!this.currentFundReportData || !this.currentFundReportData.transactions.length) {
            alert('Không có dữ liệu báo cáo để xuất');
            return;
        }
        
        try {
            // Check if jsPDF is loaded
            if (!window.jspdf) {
                this.loadJsPDF().then(() => {
                    this.generatePDF();
                }).catch(error => {
                    console.error('Không thể tải thư viện jsPDF:', error);
                    alert('Không thể tải thư viện PDF. Vui lòng thử lại sau.');
                });
                return;
            }
            
            this.generatePDF();
        } catch (error) {
            console.error('Lỗi khi xuất báo cáo PDF:', error);
            alert('Đã xảy ra lỗi khi xuất báo cáo PDF. Vui lòng thử lại sau.');
        }
    }
    
    /**
     * Load jsPDF and jsPDF-AutoTable libraries dynamically
     * @returns {Promise} Promise that resolves when libraries are loaded
     */
    loadJsPDF() {
        return new Promise((resolve, reject) => {
            // Load jsPDF first
            const jsPDFScript = document.createElement('script');
            jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPDFScript.onload = () => {
                // Then load AutoTable
                const autoTableScript = document.createElement('script');
                autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
                autoTableScript.onload = () => {
                    // Load Vietnamese font (Source Sans Pro)
                    const fontScript = document.createElement('script');
                    fontScript.textContent = `
                        if (window.jspdf) {
                            const { jsPDF } = window.jspdf;
                            
                            // Define Source Sans Pro as standard font
                            jsPDF.API.events.push(['addFonts', function() {
                                this.addFont('SourceSansPro-Regular.ttf', 'SourceSansPro', 'normal');
                                this.addFont('SourceSansPro-Bold.ttf', 'SourceSansPro', 'bold');
                            }]);
                        }
                    `;
                    document.head.appendChild(fontScript);
                    
                    // Load Source Sans Pro font from Google Fonts if not already loaded
                    if (!document.querySelector('link[href*="Source+Sans+Pro"]')) {
                        const fontLink = document.createElement('link');
                        fontLink.rel = 'stylesheet';
                        fontLink.href = 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;700&display=swap';
                        document.head.appendChild(fontLink);
                    }
                    
                    resolve();
                };
                autoTableScript.onerror = reject;
                document.head.appendChild(autoTableScript);
            };
            jsPDFScript.onerror = reject;
            document.head.appendChild(jsPDFScript);
        });
    }
    
    /**
     * Generate PDF with jsPDF
     */
    generatePDF() {
        // Tính tổng nộp và tổng chi
        let totalDeposit = 0;
        let totalExpense = 0;
        
        this.currentFundReportData.transactions.forEach(transaction => {
            if (transaction.type === 'deposit') {
                totalDeposit += transaction.amount;
            } else if (transaction.type === 'expense') {
                totalExpense += transaction.amount;
            }
        });
        
        const balance = totalDeposit - totalExpense;
        
        // Tạo nội dung PDF với thư viện jsPDF
        const { jsPDF } = window.jspdf;
        
        // Tạo PDF với hỗ trợ Unicode
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16 // or "smart", preserves precision for calculations
        });
        
        try {
            // Sử dụng font hỗ trợ tiếng Việt - Roboto là font mặc định trong ứng dụng
            doc.setFont('Helvetica'); // Dùng font mặc định trong jsPDF nếu không thể nạp font tùy chỉnh
            
            // Thêm tiêu đề báo cáo
            doc.setFontSize(18);
            doc.setFont('Helvetica', 'bold');
            doc.text('BÁO CÁO GIAO DỊCH QUỸ', 105, 20, { align: 'center' });
            
            // Thêm thông tin khoảng thời gian
            doc.setFontSize(11);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Từ ngày: ${this.currentFundReportData.fromDateFormatted} đến ngày: ${this.currentFundReportData.toDateFormatted}`, 105, 30, { align: 'center' });
            
            // Thêm thông tin tổng hợp
            doc.setFontSize(14);
            doc.setFont('Helvetica', 'bold');
            doc.text('Tổng hợp:', 20, 40);
            
            // Tạo bảng tổng hợp
            const summaryData = [
                ['Tổng nộp quỹ:', `${totalDeposit.toLocaleString('vi-VN')} VNĐ`],
                ['Tổng chi tiêu:', `${totalExpense.toLocaleString('vi-VN')} VNĐ`],
                ['Số dư:', `${balance.toLocaleString('vi-VN')} VNĐ`]
            ];
            
            doc.autoTable({
                startY: 45,
                body: summaryData,
                theme: 'plain',
                styles: { 
                    fontSize: 11, 
                    cellPadding: 3,
                    font: 'Helvetica'
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 60 }
                },
                margin: { left: 30 }
            });
            
            // Tạo bảng giao dịch
            doc.setFontSize(14);
            doc.setFont('Helvetica', 'bold');
            doc.text('Chi tiết giao dịch:', 20, 75);
            
            // Tạo header cho bảng
            const headers = [['STT', 'Ngày', 'Thành viên', 'Loại', 'Số tiền', 'Ghi chú']];
            
            // Tạo dữ liệu cho bảng với định dạng tiếng Việt
            const data = this.currentFundReportData.transactions.map((transaction, index) => {
                const isDeposit = transaction.type === 'deposit';
                const amountValue = isDeposit ? transaction.amount : -transaction.amount;
                const displayType = isDeposit ? 'Nộp quỹ' : 'Chi tiêu';
                
                // Xử lý hiển thị thành viên - chuyển __GROUP_FUND__ thành "Group Fund"
                let member = transaction.member || (isDeposit ? '' : transaction.expenseName || '');
                if (member === '__GROUP_FUND__') {
                    member = 'Group Fund';
                }
                
                return [
                    (index + 1).toString(),
                    new Date(transaction.date).toLocaleDateString('vi-VN'),
                    member,
                    displayType,
                    `${isDeposit ? '+' : '-'} ${Math.abs(amountValue).toLocaleString('vi-VN')} VNĐ`,
                    transaction.note || ''
                ];
            });
            
            // Vẽ bảng với thiết lập nâng cao
            doc.autoTable({
                head: headers,
                body: data,
                startY: 80,
                theme: 'grid',
                headStyles: { 
                    fillColor: [255, 193, 7], // Vàng đậm
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 10,
                    font: 'Helvetica'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 3,
                    font: 'Helvetica',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },  // STT
                    1: { cellWidth: 25, halign: 'center' },  // Ngày
                    2: { cellWidth: 35 },  // Thành viên
                    3: { cellWidth: 20, halign: 'center' },  // Loại
                    4: { cellWidth: 30, halign: 'right' },   // Số tiền
                    5: { cellWidth: 'auto' } // Ghi chú
                },
                margin: { left: 15, right: 15 },
                didDrawCell: (data) => {
                    // Highlight thêm các dòng của giao dịch nộp tiền với màu xanh nhạt
                    if (data.section === 'body' && data.column.index === 3) {
                        const text = data.cell.text[0];
                        if (text === 'Nộp quỹ') {
                            doc.setFillColor(220, 242, 255); // Xanh nhạt
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            doc.setTextColor(0, 0, 0);
                            doc.text(text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                                align: 'center',
                                baseline: 'middle'
                            });
                        }
                    }
                }
            });
            
            // Thêm chân trang
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setFont('Helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                
                const footerLine = `Trang ${i} / ${pageCount}`;
                const footerDateLine = `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`;
                
                doc.text(footerLine, 105, doc.internal.pageSize.height - 10, { align: 'center' });
                doc.text(footerDateLine, 105, doc.internal.pageSize.height - 5, { align: 'center' });
                
                // Thêm thông tin app
                doc.setFontSize(8);
                doc.text('Được tạo bởi CafeThu6 App', 20, doc.internal.pageSize.height - 5);
            }
        } catch (error) {
            console.error('Lỗi khi tạo PDF:', error);
            // Nếu có lỗi, thử phương pháp dự phòng với font mặc định
            doc.save(`bao-cao-quy-${this.currentFundReportData.fromDate}-den-${this.currentFundReportData.toDate}.pdf`);
            return;
        }
        
        // Lưu file PDF
        doc.save(`bao-cao-quy-${this.currentFundReportData.fromDate}-den-${this.currentFundReportData.toDate}.pdf`);
        
        console.log('Đã xuất báo cáo PDF thành công');
    }
}

/**
 * Format date for input field
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
} 