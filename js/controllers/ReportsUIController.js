/**
 * ReportsUIController
 * Controller for reports tab UI operations
 */

import { UIController } from './UIController.js';
import { formatCurrency, formatDisplayDate, getTodayDateString } from '../utils/helpers.js';
import { createPieChart, createBarChart, createLineChart, createMultiLineChart, generatePastelColors } from '../utils/charts.js';
import { supabase } from '../utils/storage.js';
import { CONFIG } from '../config.js'; // Import the configuration

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
        
        // Initialize category cache
        this.initCategoryCache();
        
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
        
        // Add test API button if in development mode
        this.addTestAPIButton();
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
            this.renderGeneralExpenseTable(filteredExpenses);
            
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
     * Categorize expense using Google Gemini AI
     * @param {string} expenseName - The name of the expense to categorize
     * @returns {Promise<string>} - The category assigned by AI
     */
    async categorizeExpenseWithGemini(expenseName) {
        try {
            // Use API key from config
            const API_KEY = CONFIG.API_KEYS.GEMINI;
            const API_ENDPOINT = CONFIG.API_ENDPOINTS.GEMINI;
            const modelSettings = CONFIG.AI_SETTINGS.GEMINI;
            const validCategories = CONFIG.AI_SETTINGS.EXPENSE_CATEGORIES;
            
            console.log(`🤖 Gửi yêu cầu phân loại đến Google AI cho "${expenseName}"`);
            
            // Prepare the request to Gemini API
            const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Please categorize the following expense into exactly one of these categories: ${validCategories.map(c => `"${c}"`).join(', ')}. 
                            Only return the category name, nothing else. No explanations.
                            Expense name: "${expenseName}"`
                        }]
                    }],
                    generationConfig: {
                        temperature: modelSettings.temperature,
                        topK: modelSettings.topK,
                        topP: modelSettings.topP,
                        maxOutputTokens: modelSettings.maxOutputTokens,
                    }
                })
            });

            if (!response.ok) {
                console.error('Gemini API error:', await response.text());
                console.log(`❌ Lỗi API, sử dụng phương pháp dự phòng cho "${expenseName}"`);
                return this.categorizeFallback(expenseName);
            }

            const data = await response.json();
            console.log(`📊 Phản hồi đầy đủ từ Google AI:`, data);
            
            // Extract just the category name from the response
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                const category = data.candidates[0].content.parts[0].text.trim();
                console.log(`✅ Google AI đã phân loại "${expenseName}" thành "${category}"`);
                
                // Validate that we got a valid category
                if (validCategories.includes(category)) {
                    // Cache the result for future use
                    this.addToCache(expenseName, category);
                    
                    return category;
                } else {
                    console.log(`⚠️ Google AI trả về loại không hợp lệ "${category}", sử dụng dự phòng`);
                }
            } else {
                console.log(`⚠️ Không tìm thấy kết quả phân loại trong phản hồi của Google AI`);
            }
            
            return this.categorizeFallback(expenseName);
        } catch (error) {
            console.error('Error categorizing with Gemini:', error);
            console.log(`❌ Lỗi phân loại chi tiêu "${expenseName}": ${error.message}`);
            return this.categorizeFallback(expenseName);
        }
    }
    
    /**
     * Fallback categorization based on keywords in expense name
     * @param {string} expenseName - The expense name to categorize
     * @returns {string} - The category based on keyword matching
     */
    categorizeFallback(expenseName) {
        if (!expenseName) return 'Khác';
        
        // Convert to lowercase for case-insensitive matching
        const name = expenseName.toLowerCase();
        
        // Check for category keywords
        const categoryRules = CONFIG.AI_SETTINGS.CATEGORY_RULES;
        
        // Iterate through categories and check their keywords
        for (const category in categoryRules) {
            const keywords = categoryRules[category];
            
            // If any keyword is found in the expense name, return this category
            if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        
        // Log that we're using fallback categorization
        console.log(`Phân loại "${expenseName}" thành "Khác" (sử dụng fallback)`);
        
        // If no match found, return default category
        return 'Khác';
    }

    /**
     * Bulk categorize expenses with AI
     * @param {Array} expenses - The array of expenses to categorize
     * @returns {Promise<Object>} - Mapping of expenses to categories
     */
    async categorizeExpenses(expenses) {
        console.log(`🤖 Bắt đầu phân loại hàng loạt cho ${expenses.length} chi tiêu`);
        
        // Initialize the categoryCache if not exists
        this.categoryCache = this.categoryCache || {};
        
        // Create a mapping of expense names to their categories
        const categories = {};
        
        // First pass: use cached categories or fallback
        for (const expense of expenses) {
            const expenseName = expense.name.toLowerCase();
            if (this.categoryCache[expenseName]) {
                console.log(`📋 Chi tiêu "${expense.name}" đã có trong cache: "${this.categoryCache[expenseName]}"`);
                categories[expense.id] = this.categoryCache[expenseName];
            } else {
                // Use fallback initially for quick rendering
                categories[expense.id] = this.categorizeFallback(expense.name);
            }
        }
        
        console.log(`📊 Kết quả phân loại ban đầu (cache/dự phòng):`, categories);
        
        // Second pass: asynchronously update with AI categories
        // Use a limited batch to avoid overwhelming the API
        const MAX_BATCH_SIZE = CONFIG.CACHE.MAX_BATCH_SIZE;
        const needCategorization = expenses.filter(e => !this.categoryCache[e.name.toLowerCase()]);
        console.log(`⚙️ Số chi tiêu cần phân loại bằng AI: ${needCategorization.length}/${expenses.length}`);
        
        const toProcess = needCategorization.slice(0, MAX_BATCH_SIZE);
        
        if (toProcess.length === 0) {
            console.log(`ℹ️ Không có chi tiêu nào cần phân loại bằng AI (tất cả đã có trong cache)`);
        } else {
            console.log(`🔄 Đang gửi ${toProcess.length} chi tiêu để phân loại bằng AI`);
            
            for (const expense of toProcess) {
                console.log(`🔍 Đang phân loại "${expense.name}" (ID: ${expense.id})`);
                const aiCategory = await this.categorizeExpenseWithGemini(expense.name);
                // Update the category with AI result
                categories[expense.id] = aiCategory;
                // Update the view if needed
                this.updateCategoryInCharts(expense.id, aiCategory);
            }
        }
        
        console.log(`✅ Hoàn thành phân loại hàng loạt với kết quả cuối cùng:`, categories);
        
        return categories;
    }
    
    /**
     * Update a category in charts if needed
     * @param {string} expenseId - The ID of the expense to update
     * @param {string} category - The new category
     */
    updateCategoryInCharts(expenseId, category) {
        // Log the AI categorization for debugging
        console.log(`AI categorized expense ${expenseId} as "${category}"`);
        
        // Enhanced logging with visual indicators
        const expenseName = this.getExpenseName(expenseId) || 'Unknown Expense';
        console.log(`🏷️ PHÂN LOẠI AI: "${expenseName}" → "${category}"`);
        console.log(`   ID: ${expenseId}`);
        
        // Show AI categorization status message in UI
        const statusElement = document.getElementById('ai-categorization-status');
        if (statusElement) {
            statusElement.textContent = `AI đã phân loại "${this.getExpenseName(expenseId)}" thành "${category}"`;
            statusElement.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
        
        // If the chart exists, update it with the new category data
        if (this.generalCategoryChart) {
            console.log(`📊 Cập nhật biểu đồ với phân loại mới cho "${expenseName}"`);
            
            // Rebuild the category data with the updated category
            if (this.currentGeneralReportData && this.currentGeneralReportData.expenses) {
                // Create a new category mapping using the latest AI results
                const categories = {};
                
                // Use cached categories for all expenses
                this.currentGeneralReportData.expenses.forEach(expense => {
                    const expenseNameLower = expense.name.toLowerCase();
                    if (this.categoryCache && this.categoryCache[expenseNameLower]) {
                        categories[expense.id] = this.categoryCache[expenseNameLower];
                    } else {
                        categories[expense.id] = 'Khác'; // Fallback if not in cache
                    }
                });
                
                // Update category amounts with new mapping
                const updatedCategoryAmounts = this.aggregateByCategory(this.currentGeneralReportData.expenses, categories);
                console.log(`📈 Tổng hợp theo phân loại sau khi cập nhật:`, updatedCategoryAmounts);
                
                // Re-draw chart with updated data
                // Store filtered expenses for the new method if called
                this.filteredExpenses = this.currentGeneralReportData.expenses;
                // Then call with parameters for the old method
                this.drawCategoryChart(updatedCategoryAmounts);
            }
        } else {
            console.log(`ℹ️ Không có biểu đồ để cập nhật cho phân loại "${category}"`);
        }
    }
    
    /**
     * Get expense name by id for display purposes
     * @param {string} expenseId - The expense ID to look up
     * @returns {string} - The expense name or a placeholder
     */
    getExpenseName(expenseId) {
        if (this.currentGeneralReportData && this.currentGeneralReportData.expenses) {
            const expense = this.currentGeneralReportData.expenses.find(e => e.id === expenseId);
            if (expense) {
                return expense.name;
            }
        }
        return 'Chi tiêu';
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
        
        console.log('Rendering charts with expenses:', expenses.length);
        
        // Initialize with fallback categorization
        const initialCategories = {};
        expenses.forEach(expense => {
            const category = this.categorizeFallback(expense.name);
            initialCategories[expense.id] = category;
            console.log(`Categorized "${expense.name}" as "${category}"`);
        });
        
        // Aggregate initial categories
        const categoryAmounts = this.aggregateByCategory(expenses, initialCategories);
        console.log('Category amounts:', categoryAmounts);
        
        // Draw initial chart directly
        // Chuẩn bị dữ liệu cho biểu đồ phân loại
        const categoryLabels = Object.keys(categoryAmounts);
        const categoryData = categoryLabels.map(cat => categoryAmounts[cat]);
        
        // Predefined colors for consistent categories
        const categoryColorMap = {
            'Ăn uống': '#16a34a',
            'Đi lại': '#0ea5e9',
            'Giải trí': '#8b5cf6',
            'Mua sắm': '#f59e0b',
            'Tiện ích': '#ef4444',
            'Khác': '#6366f1'
        };
        
        const colors = categoryLabels.map(category => 
            categoryColorMap[category] || '#10b981');
            
        // Tạo biểu đồ phân loại chi tiêu
        const categoryChartEl = document.getElementById('general-report-category-chart');
        console.log('Chart element found:', categoryChartEl);
        
        if (categoryChartEl) {
            // Xóa biểu đồ cũ nếu có
            if (this.generalCategoryChart) {
                console.log('Destroying old chart');
                this.generalCategoryChart.destroy();
            }
            
            console.log('Creating new chart with data:', {
                labels: categoryLabels,
                data: categoryData,
                colors: colors
            });
            
            try {
                this.generalCategoryChart = createPieChart(
                    'general-report-category-chart', 
                    categoryData, 
                    categoryLabels, 
                    colors, 
                    'Phân loại chi tiêu',
                    true // Kích hoạt tương tác click
                );
                
                console.log('Chart created successfully:', this.generalCategoryChart);
                
                // Thêm sự kiện click cho biểu đồ
                if (this.generalCategoryChart) {
                    categoryChartEl.onclick = (evt) => {
                        const points = this.generalCategoryChart.getElementsAtEventForMode(
                            evt, 'nearest', { intersect: true }, false
                        );
                        
                        if (points.length) {
                            const firstPoint = points[0];
                            const category = categoryLabels[firstPoint.index];
                            this.filterExpenseTable(category);
                        }
                    };
                }
            } catch (error) {
                console.error('Error creating pie chart:', error);
            }
        } else {
            console.error('Category chart element not found');
        }
        
        // Continue with time-based chart which doesn't depend on categories
        this.renderTimeChart(expenses);
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

    /**
     * Test the Gemini API connection
     * This method can be called from the console to verify API functionality
     * @returns {Promise<boolean>} - Whether the API call was successful
     */
    async testGeminiAPI() {
        try {
            console.log('Testing Gemini API connection...');
            
            // Get the configuration
            const API_KEY = CONFIG.API_KEYS.GEMINI;
            const API_ENDPOINT = CONFIG.API_ENDPOINTS.GEMINI;
            const modelSettings = CONFIG.AI_SETTINGS.GEMINI;
            
            console.log('Using API key:', API_KEY.substring(0, 5) + '...' + API_KEY.substring(API_KEY.length - 4));
            console.log('Using endpoint:', API_ENDPOINT);
            
            // Simple test prompt
            const testPrompt = "Categorize this expense: 'Dinner at restaurant' into one of these categories: Ăn uống, Đi lại, Giải trí";
            
            // Make the API call
            const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: testPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: modelSettings.temperature,
                        topK: modelSettings.topK,
                        topP: modelSettings.topP,
                        maxOutputTokens: modelSettings.maxOutputTokens,
                    }
                })
            });
            
            // Check response status
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                return false;
            }
            
            // Parse and log response
            const data = await response.json();
            console.log('API Response:', data);
            
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                const result = data.candidates[0].content.parts[0].text.trim();
                console.log('Gemini API test successful! Result:', result);
                return true;
            } else {
                console.error('Unexpected response format:', data);
                return false;
            }
        } catch (error) {
            console.error('Error testing Gemini API:', error);
            return false;
        }
    }

    /**
     * Clear the category cache
     * @param {string} expenseName - Optional specific expense name to clear from cache (if null, clears all)
     * @returns {number} - Number of items removed from cache
     */
    clearCategoryCache(expenseName = null) {
        if (!this.categoryCache) {
            console.log('Cache chưa được khởi tạo');
            return 0;
        }
        
        let removedCount = 0;
        
        // If expense name provided, remove just that item
        if (expenseName) {
            const key = expenseName.toLowerCase();
            if (this.categoryCache[key]) {
                const oldCategory = this.categoryCache[key];
                delete this.categoryCache[key];
                removedCount = 1;
                console.log(`🗑️ Đã xóa "${expenseName}" (${oldCategory}) khỏi cache`);
            } else {
                console.log(`⚠️ Không tìm thấy "${expenseName}" trong cache`);
            }
        } 
        // Otherwise clear all cache
        else {
            removedCount = Object.keys(this.categoryCache).length;
            this.categoryCache = {};
            console.log(`🗑️ Đã xóa toàn bộ cache (${removedCount} mục)`);
        }
        
        // Save empty cache to localStorage to persist the changes
        if (CONFIG.CACHE.ENABLE_PERSISTENT_CACHE) {
            this.saveCategoryCache();
        }
        
        return removedCount;
    }

    /**
     * Add a test button for Gemini API in development environment
     */
    addTestAPIButton() {
        // Only add in development environments
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const generalReportTab = document.getElementById('general-tab-content');
            if (generalReportTab) {
                const testButtonContainer = document.createElement('div');
                testButtonContainer.className = 'mt-4 mb-2 flex justify-end space-x-2';
                
                // Test API button
                const testButton = document.createElement('button');
                testButton.id = 'test-gemini-api-btn';
                testButton.className = 'px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded border border-purple-300 hover:bg-purple-200 flex items-center';
                testButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Test Gemini API
                `;
                
                testButton.addEventListener('click', async () => {
                    testButton.disabled = true;
                    testButton.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                    `;
                    
                    try {
                        const result = await this.testGeminiAPI();
                        
                        if (result) {
                            alert('Gemini API test successful! Check console for details.');
                            testButton.className = 'px-3 py-1 bg-green-100 text-green-700 text-sm rounded border border-green-300 hover:bg-green-200 flex items-center';
                            testButton.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                API Works!
                            `;
                        } else {
                            alert('Gemini API test failed. Check console for details.');
                            testButton.className = 'px-3 py-1 bg-red-100 text-red-700 text-sm rounded border border-red-300 hover:bg-red-200 flex items-center';
                            testButton.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                API Failed
                            `;
                        }
                    } catch (error) {
                        console.error('Error during API test:', error);
                        alert('Error testing Gemini API: ' + error.message);
                        testButton.className = 'px-3 py-1 bg-red-100 text-red-700 text-sm rounded border border-red-300 hover:bg-red-200 flex items-center';
                        testButton.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Error
                        `;
                    }
                    
                    testButton.disabled = false;
                });
                
                // Clear cache button
                const clearCacheButton = document.createElement('button');
                clearCacheButton.id = 'clear-category-cache-btn';
                clearCacheButton.className = 'px-3 py-1 bg-red-50 text-red-600 text-sm rounded border border-red-200 hover:bg-red-100 flex items-center';
                clearCacheButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa Cache
                `;
                
                clearCacheButton.addEventListener('click', () => {
                    // Ask for confirmation
                    if (confirm('Bạn có chắc chắn muốn xóa cache phân loại chi tiêu không?')) {
                        const removedCount = this.clearCategoryCache();
                        alert(`Đã xóa ${removedCount} mục khỏi cache phân loại chi tiêu.`);
                    }
                });
                
                // Specific expense clear button
                const specificClearButton = document.createElement('button');
                specificClearButton.id = 'clear-specific-cache-btn';
                specificClearButton.className = 'px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded border border-orange-200 hover:bg-orange-100 flex items-center';
                specificClearButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Xóa Chi Tiêu Cụ Thể
                `;
                
                specificClearButton.addEventListener('click', () => {
                    const expenseName = prompt('Nhập tên chi tiêu muốn xóa khỏi cache (ví dụ: "Xem phim"):');
                    if (expenseName) {
                        const removedCount = this.clearCategoryCache(expenseName);
                        if (removedCount > 0) {
                            alert(`Đã xóa "${expenseName}" khỏi cache phân loại chi tiêu.`);
                        } else {
                            alert(`Không tìm thấy "${expenseName}" trong cache.`);
                        }
                    }
                });
                
                // Add all buttons to container
                testButtonContainer.appendChild(testButton);
                testButtonContainer.appendChild(specificClearButton);
                testButtonContainer.appendChild(clearCacheButton);
                
                // Add before the first chart container
                const chartContainer = generalReportTab.querySelector('#category-chart-container');
                if (chartContainer) {
                    generalReportTab.insertBefore(testButtonContainer, chartContainer);
                } else {
                    generalReportTab.appendChild(testButtonContainer);
                }
            }
        }
    }

    /**
     * Initialize category cache - load from localStorage if enabled
     */
    initCategoryCache() {
        // Create an empty cache if not exists
        this.categoryCache = this.categoryCache || {};
        
        // If persistent cache is enabled, try to load from localStorage
        if (CONFIG.CACHE.ENABLE_PERSISTENT_CACHE) {
            try {
                const cachedData = localStorage.getItem(CONFIG.CACHE.CATEGORY_CACHE_KEY);
                if (cachedData) {
                    const parsedCache = JSON.parse(cachedData);
                    
                    // Check cache timestamp if exists
                    if (parsedCache._timestamp) {
                        const cacheAge = (new Date() - new Date(parsedCache._timestamp)) / (1000 * 60 * 60 * 24); // in days
                        
                        // If cache is too old, don't use it
                        if (cacheAge > CONFIG.CACHE.CACHE_MAX_AGE_DAYS) {
                            console.log(`🕒 Cache quá cũ (${Math.round(cacheAge)} ngày), tạo cache mới`);
                            this.saveCategoryCache();
                            return;
                        }
                    }
                    
                    // Remove timestamp from the object we'll use
                    const {_timestamp, ...cacheData} = parsedCache;
                    
                    // Merge with existing cache (prioritize loaded data)
                    this.categoryCache = {...this.categoryCache, ...cacheData};
                    console.log(`📂 Đã tải ${Object.keys(cacheData).length} mục từ cache`);
                }
            } catch (error) {
                console.error('Lỗi khi tải cache từ localStorage:', error);
                // Continue with empty cache
            }
        }
    }

    /**
     * Save category cache to localStorage if enabled
     */
    saveCategoryCache() {
        if (!CONFIG.CACHE.ENABLE_PERSISTENT_CACHE) return;
        
        try {
            // Add timestamp to track cache age
            const cacheWithTimestamp = {
                ...this.categoryCache,
                _timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(CONFIG.CACHE.CATEGORY_CACHE_KEY, JSON.stringify(cacheWithTimestamp));
            console.log(`💾 Đã lưu ${Object.keys(this.categoryCache).length} mục vào cache`);
        } catch (error) {
            console.error('Lỗi khi lưu cache vào localStorage:', error);
        }
    }

    /**
     * Add a category to cache and save to localStorage if enabled
     * @param {string} expenseName - The expense name
     * @param {string} category - The category
     */
    addToCache(expenseName, category) {
        // Initialize cache if needed
        this.categoryCache = this.categoryCache || {};
        
        // Add to in-memory cache
        this.categoryCache[expenseName.toLowerCase()] = category;
        
        // Save to localStorage if enabled
        if (CONFIG.CACHE.ENABLE_PERSISTENT_CACHE) {
            // Use debounced save to avoid too many writes
            this.debouncedSave();
        }
    }

    // Create a debounced version of saveCategoryCache to avoid excessive writes
    debouncedSave() {
        // Clear existing timeout if any
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        
        // Set a new timeout to save cache after 2 seconds of inactivity
        this._saveTimeout = setTimeout(() => {
            this.saveCategoryCache();
        }, 2000);
    }

    /**
     * Draw chart for expenses by category
     */
    drawCategoryChart() {
        // Kiểm tra xem có dữ liệu chi tiêu không
        if (!this.filteredExpenses || this.filteredExpenses.length === 0) {
            const container = document.getElementById('category-chart-container');
            if (container) {
                container.innerHTML = '<p class="text-center text-secondary">Không có dữ liệu chi tiêu để hiển thị biểu đồ</p>';
            } else {
                // Nếu container không tồn tại, sử dụng general-report-category-chart
                const chartCanvas = document.getElementById('general-report-category-chart');
                if (chartCanvas) {
                    // Clear the existing chart if any
                    if (this.generalCategoryChart) {
                        this.generalCategoryChart.destroy();
                    }
                    // Thêm thông báo vào phần tử cha của canvas
                    const parentElement = chartCanvas.parentElement;
                    if (parentElement) {
                        // Lưu lại canvas để khôi phục sau này
                        const canvasHTML = chartCanvas.outerHTML;
                        parentElement.innerHTML = '<p class="text-center text-secondary">Không có dữ liệu chi tiêu để hiển thị biểu đồ</p>';
                    }
                }
            }
            return;
        }

        // Đảm bảo canvas đã được tạo
        let canvas = document.getElementById('category-chart');
        let container = document.getElementById('category-chart-container');
        
        if (!canvas) {
            // Thử sử dụng general-report-category-chart nếu category-chart không tồn tại
            canvas = document.getElementById('general-report-category-chart');
            container = canvas ? canvas.parentElement : null;
            
            if (!canvas && container) {
                container.innerHTML = '<canvas id="category-chart" height="300"></canvas>';
                canvas = document.getElementById('category-chart');
            } else if (!canvas) {
                console.error('Không tìm thấy phần tử canvas cho biểu đồ danh mục');
                return;
            }
        }

        // Phân tích dữ liệu theo danh mục
        const categories = {};
        for (const expense of this.filteredExpenses) {
            const category = expense.category || 'Không phân loại';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += expense.amount;
        }

        // Chuẩn bị dữ liệu cho biểu đồ
        const labels = Object.keys(categories);
        const data = Object.values(categories);
        
        // Tạo mảng màu dựa trên số lượng danh mục
        // Predefined colors for consistent categories
        const categoryColorMap = {
            'Ăn uống': '#16a34a',
            'Đi lại': '#0ea5e9',
            'Giải trí': '#8b5cf6',
            'Mua sắm': '#f59e0b',
            'Tiện ích': '#ef4444',
            'Khác': '#6366f1'
        };
        
        const colors = labels.map(category => 
            categoryColorMap[category] || '#10b981');

        // Lưu trữ dữ liệu danh mục để sử dụng cho việc lọc
        this.categoryData = {
            labels,
            data,
            colors
        };

        // Xác định ID của canvas để sử dụng
        const canvasId = canvas.id; // Sử dụng ID của canvas đã tìm thấy
        
        // Tạo biểu đồ với khả năng tương tác khi nhấp chuột
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        
        this.categoryChart = createPieChart(
            canvasId,
            data,
            labels,
            colors,
            'Phân loại chi tiêu',
            true // Kích hoạt tương tác khi nhấp chuột
        );

        // Thêm xử lý sự kiện click vào biểu đồ
        canvas.onclick = (event) => {
            const points = this.categoryChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
            if (points.length) {
                const clickedIndex = points[0].index;
                const label = this.categoryChart.data.labels[clickedIndex];
                this.filterExpenseTable(label);
            }
        };
    }

    /**
     * Filter expense table by category
     * @param {string|null} category - Category to filter by, or null to show all
     */
    filterExpenseTable(category) {
        if (!this.currentGeneralReportData || !this.currentGeneralReportData.expenses) {
            return;
        }
        
        const expenses = this.currentGeneralReportData.expenses;
        
        // If category is null, show all expenses
        if (category === null || category === 'all') {
            this.renderGeneralExpenseTable(expenses);
            return;
        }
        
        // Filter expenses by the selected category
        const filteredExpenses = expenses.filter(expense => {
            // Get the category for this expense
            const expenseCategory = this.categorizeFallback(expense.name);
            return expenseCategory === category;
        });
        
        // Render the filtered expenses with a filter message
        this.renderGeneralExpenseTable(filteredExpenses, `Đang lọc: ${category}`);
    }

    /**
     * Render bảng báo cáo chi tiêu chung
     * @param {Array} expenses - Dữ liệu chi tiêu để hiển thị
     * @param {string|null} filterMessage - Thông báo lọc để hiển thị (nếu có)
     */
    renderGeneralExpenseTable(expenses, filterMessage = null) {
        const tableBody = document.getElementById('general-report-expenses');
        const tableCaption = document.getElementById('general-expense-table-caption');
        
        if (!tableBody) {
            console.error('Không tìm thấy phần tử bảng chi tiêu với ID "general-report-expenses"');
            return;
        }
        
        console.log(`Rendering expense table with ${expenses ? expenses.length : 0} expenses`);
        
        // Xử lý khi không có chi tiêu
        if (!expenses || expenses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-4 text-sm text-gray-500 text-center italic">Không có dữ liệu chi tiêu trong khoảng thời gian này</td>
                </tr>
            `;
            if (tableCaption) {
                tableCaption.innerHTML = filterMessage || '';
            }
            return;
        }
        
        // Sắp xếp chi tiêu theo ngày, mới nhất lên đầu
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Chuẩn bị dữ liệu HTML cho bảng
        let html = '';
        
        sortedExpenses.forEach((expense, index) => {
            // Định dạng ngày
            const expenseDate = new Date(expense.date);
            const formattedDate = `${expenseDate.getDate()}/${expenseDate.getMonth() + 1}/${expenseDate.getFullYear()}`;
            
            // Định dạng số tiền
            const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount);
            
            // Tạo danh sách người tham gia
            let participantsHtml = '';
            if (expense.participants && expense.participants.length > 0) {
                participantsHtml = expense.participants
                    .map(participant => {
                        // Kiểm tra nếu participant có trường name
                        return participant.name || participant;
                    })
                    .join(', ');
            }
            
            // Xác định màu nền dựa trên index (hàng chẵn/lẻ)
            const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            // Tạo category badge nếu có category
            const category = expense.category || this.categorizeFallback(expense.name);
            const categoryClass = this.getCategoryColorClass(category);
            
            // Xây dựng HTML cho hàng với nhiều styling hơn
            html += `
                <tr class="${rowClass} hover:bg-gray-100 transition duration-150">
                    <td class="px-4 py-3 text-sm whitespace-nowrap font-medium text-gray-700">${formattedDate}</td>
                    <td class="px-4 py-3">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-800">${expense.name || 'Không có tên'}</span>
                            ${category ? `<span class="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryClass}">${category}</span>` : ''}
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${expense.payer || 'Không xác định'}</td>
                    <td class="px-4 py-3 text-sm font-medium text-emerald-600 whitespace-nowrap">${formattedAmount}</td>
                    <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">${participantsHtml || 'Không có người tham gia'}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        console.log('Table HTML rendered:', html.slice(0, 100) + '...');
        
        // Cập nhật caption nếu có thông báo lọc
        if (tableCaption) {
            tableCaption.innerHTML = filterMessage || '';
        }
    }

    /**
     * Helper function to get the color class for a category
     * @param {string} category - The category name
     * @returns {string} - The appropriate Tailwind color class
     */
    getCategoryColorClass(category) {
        const categoryClasses = {
            'Ăn uống': 'bg-green-100 text-green-800',
            'Đi lại': 'bg-blue-100 text-blue-800',
            'Giải trí': 'bg-purple-100 text-purple-800',
            'Mua sắm': 'bg-amber-100 text-amber-800',
            'Tiện ích': 'bg-red-100 text-red-800',
            'Khác': 'bg-indigo-100 text-indigo-800'
        };
        
        return categoryClasses[category] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Generate colors for categories
     * @param {number} count - Number of colors needed
     * @returns {Array} - Array of color hex codes
     */
    generateCategoryColors(count) {
        // Predefined colors for categories
        const baseColors = [
            '#16a34a', // Green
            '#0ea5e9', // Blue
            '#8b5cf6', // Purple
            '#f59e0b', // Orange
            '#ef4444', // Red
            '#6366f1', // Indigo
            '#ec4899', // Pink
            '#14b8a6', // Teal
            '#f97316', // Orange/Red
            '#84cc16', // Lime
            '#a855f7', // Purple
            '#06b6d4'  // Cyan
        ];
        
        // If we have enough base colors, return a slice
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        // Otherwise, reuse colors with slight variations
        const colors = [...baseColors];
        
        // Generate additional colors by adjusting lightness
        while (colors.length < count) {
            const index = colors.length % baseColors.length;
            const baseColor = baseColors[index];
            
            // Convert hex to HSL, adjust lightness, convert back to hex
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            
            // Adjust RGB values slightly
            const newR = Math.min(255, Math.max(0, r + (colors.length * 20) % 40 - 20));
            const newG = Math.min(255, Math.max(0, g + (colors.length * 15) % 30 - 15));
            const newB = Math.min(255, Math.max(0, b + (colors.length * 25) % 50 - 25));
            
            // Convert back to hex
            const newColor = '#' + 
                newR.toString(16).padStart(2, '0') + 
                newG.toString(16).padStart(2, '0') + 
                newB.toString(16).padStart(2, '0');
            
            colors.push(newColor);
        }
        
        return colors;
    }

    /**
     * Aggregate expenses by category
     * @param {Array} expenses - The expenses to aggregate
     * @param {Object} categoriesMap - Mapping of expense IDs to categories
     * @returns {Object} - Categories with amounts
     */
    aggregateByCategory(expenses, categoriesMap) {
        const categoryAmounts = {};
        
        expenses.forEach(expense => {
            const category = categoriesMap[expense.id] || 'Khác';
            
            if (!categoryAmounts[category]) {
                categoryAmounts[category] = 0;
            }
            categoryAmounts[category] += expense.amount;
        });
        
        return categoryAmounts;
    }
    
    /**
     * Render time chart separately
     * @param {Array} expenses - The expenses to render
     */
    renderTimeChart(expenses) {
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