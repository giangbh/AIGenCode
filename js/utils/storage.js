/**
 * Storage Utility
 * Provides storage operations for the application
 * Originally based on localStorage, now uses Supabase
 */

import * as supabaseClient from './supabase.js';

// Dữ liệu cache để giảm số lượng request đến Supabase
let expensesCache = null;
let fundTransactionsCache = null;
let membersCache = null;

/**
 * Khởi tạo bộ nhớ
 * @param {Array} defaultMembers - Danh sách thành viên mặc định
 * @param {Object} defaultBankAccounts - Tài khoản ngân hàng mặc định
 */
export async function initializeStorage(defaultMembers, defaultBankAccounts) {
    try {
        await supabaseClient.initializeDefaultData(defaultMembers, defaultBankAccounts);
    } catch (error) {
        console.error('Lỗi khi khởi tạo dữ liệu:', error);
    }
}

/**
 * Lưu danh sách chi tiêu
 * @param {Array} expenses - Danh sách chi tiêu
 */
export async function saveExpenses(expenses) {
    expensesCache = [...expenses];
    // Không cần làm gì, vì chúng ta sẽ sử dụng hàm CRUD trực tiếp
}

/**
 * Tải danh sách chi tiêu
 * @returns {Array} Danh sách chi tiêu
 */
export async function loadExpenses() {
    try {
        if (!expensesCache) {
            expensesCache = await supabaseClient.getExpenses();
        }
        return expensesCache;
    } catch (error) {
        console.error('Lỗi khi tải chi tiêu:', error);
        return [];
    }
}

/**
 * Lưu danh sách giao dịch quỹ
 * @param {Array} transactions - Danh sách giao dịch
 */
export async function saveFundTransactions(transactions) {
    fundTransactionsCache = [...transactions];
    // Không cần làm gì, vì chúng ta sẽ sử dụng hàm CRUD trực tiếp
}

/**
 * Tải danh sách giao dịch quỹ
 * @returns {Array} Danh sách giao dịch
 */
export async function loadFundTransactions() {
    try {
        if (!fundTransactionsCache) {
            fundTransactionsCache = await supabaseClient.getFundTransactions();
        }
        return fundTransactionsCache;
    } catch (error) {
        console.error('Lỗi khi tải giao dịch quỹ:', error);
        return [];
    }
}

/**
 * Lưu danh sách thành viên
 * @param {Array} members - Danh sách thành viên
 */
export async function saveMembers(members) {
    membersCache = [...members];
    // Không cần làm gì, vì chúng ta sẽ sử dụng hàm CRUD trực tiếp
}

/**
 * Tải danh sách thành viên
 * @returns {Array} Danh sách thành viên
 */
export async function loadMembers() {
    try {
        if (!membersCache) {
            const membersData = await supabaseClient.getMembers();
            // Convert từ định dạng Supabase sang định dạng ứng dụng
            membersCache = membersData.map(m => m.name);
        }
        return membersCache;
    } catch (error) {
        console.error('Lỗi khi tải thành viên:', error);
        return [];
    }
}

/**
 * Lưu tài khoản ngân hàng của các thành viên
 * @param {Object} bankAccounts - Đối tượng chứa tài khoản ngân hàng
 */
export async function saveBankAccounts(bankAccounts) {
    // Không cần làm gì, vì chúng ta sẽ cập nhật trực tiếp khi thay đổi thành viên
}

/**
 * Tải tài khoản ngân hàng của các thành viên
 * @returns {Object} Đối tượng chứa tài khoản ngân hàng
 */
export async function loadBankAccounts() {
    try {
        const membersData = await supabaseClient.getMembers();
        const bankAccounts = {};
        
        // Convert từ định dạng Supabase sang định dạng ứng dụng
        membersData.forEach(member => {
            bankAccounts[member.name] = member.bank_account || '';
        });
        
        return bankAccounts;
    } catch (error) {
        console.error('Lỗi khi tải tài khoản ngân hàng:', error);
        return {};
    }
}

/**
 * Xóa tất cả dữ liệu
 */
export function clearAllData() {
    // Khi chuyển sang Supabase, chúng ta sẽ không xóa dữ liệu từ database
    // Thay vào đó, chỉ xóa cache
    expensesCache = null;
    fundTransactionsCache = null;
    membersCache = null;
}

/**
 * Cập nhật dữ liệu cache
 * @param {string} type - Loại dữ liệu ('expenses', 'fundTransactions', 'members')
 */
export function invalidateCache(type) {
    switch (type) {
        case 'expenses':
            expensesCache = null;
            break;
        case 'fundTransactions':
            fundTransactionsCache = null;
            break;
        case 'members':
            membersCache = null;
            break;
        default:
            expensesCache = null;
            fundTransactionsCache = null;
            membersCache = null;
            break;
    }
}

/**
 * API Supabase cho controllers
 */
export const supabase = supabaseClient; 