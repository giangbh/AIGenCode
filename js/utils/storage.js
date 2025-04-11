/**
 * Storage utility for the CafeThu6 application
 * Handles data persistence with localStorage
 */

// Storage keys
export const STORAGE_KEYS = {
    EXPENSES: 'ezsplit_expenses_v2',
    FUND: 'ezsplit_groupfund_v2',
    MEMBERS: 'ezsplit_members_v2',
    BANK_ACCOUNTS: 'ezsplit_bankaccounts_v2'
};

/**
 * Save data to localStorage
 * @param {string} key - The storage key
 * @param {any} data - The data to save
 */
export const saveData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving data to localStorage: ${error}`);
    }
};

/**
 * Load data from localStorage
 * @param {string} key - The storage key
 * @param {any} defaultValue - Default value if no data is found
 * @returns {any} The loaded data or default value
 */
export const loadData = (key, defaultValue = null) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading data from localStorage: ${error}`);
        return defaultValue;
    }
};

/**
 * Save expenses data
 * @param {Array} expenses - The expenses array
 */
export const saveExpenses = (expenses) => {
    saveData(STORAGE_KEYS.EXPENSES, expenses);
};

/**
 * Load expenses data
 * @returns {Array} The expenses array or empty array if none
 */
export const loadExpenses = () => {
    return loadData(STORAGE_KEYS.EXPENSES, []);
};

/**
 * Save group fund data
 * @param {number} balance - The current fund balance
 * @param {Array} transactions - The fund transactions
 * @param {Object} memberBalances - Member balances in the fund
 */
export const saveGroupFund = (balance, transactions, memberBalances) => {
    const fundData = { 
        balance: balance, 
        transactions: transactions,
        memberBalances: memberBalances
    };
    saveData(STORAGE_KEYS.FUND, fundData);
};

/**
 * Load group fund data
 * @returns {Object} The fund data object
 */
export const loadGroupFund = () => {
    return loadData(STORAGE_KEYS.FUND, {
        balance: 0,
        transactions: [],
        memberBalances: {}
    });
};

/**
 * Save members list
 * @param {Array} members - The members array
 */
export const saveMembers = (members) => {
    saveData(STORAGE_KEYS.MEMBERS, members);
};

/**
 * Load members list
 * @param {Array} defaultMembers - Default members if none found
 * @returns {Array} The members array
 */
export const loadMembers = (defaultMembers = []) => {
    return loadData(STORAGE_KEYS.MEMBERS, defaultMembers);
};

/**
 * Save bank accounts data
 * @param {Object} bankAccounts - The bank accounts object
 */
export const saveBankAccounts = (bankAccounts) => {
    saveData(STORAGE_KEYS.BANK_ACCOUNTS, bankAccounts);
};

/**
 * Load bank accounts data
 * @param {Object} defaultAccounts - Default accounts if none found
 * @returns {Object} The bank accounts object
 */
export const loadBankAccounts = (defaultAccounts = {}) => {
    return loadData(STORAGE_KEYS.BANK_ACCOUNTS, defaultAccounts);
};

/**
 * Save all application data at once
 * @param {Object} appData - Object containing all app data
 */
export const saveAllData = (appData) => {
    saveExpenses(appData.expenses);
    saveGroupFund(appData.groupFundBalance, appData.groupFundTransactions, appData.memberBalances);
    saveMembers(appData.members);
    saveBankAccounts(appData.bankAccounts);
};

/**
 * Clear all application data from localStorage
 */
export const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.FUND);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.BANK_ACCOUNTS);
}; 