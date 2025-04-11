/**
 * Utility functions for the CafeThu6 application
 */

// Formatters for currency and amounts
export const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
});

export const INPUT_AMOUNT_FORMATTER = new Intl.NumberFormat('vi-VN');

/**
 * Generate a random ID for new items
 * @returns {string} A unique random ID
 */
export const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => CURRENCY_FORMATTER.format(amount);

/**
 * Format an input value for display in currency input fields
 * @param {string} value - The input value
 * @returns {string} Formatted value
 */
export const formatAmountInput = (value) => { 
    // Remove non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    // Parse to number and format
    const number = parseInt(numericValue, 10);
    return INPUT_AMOUNT_FORMATTER.format(number);
};

/**
 * Parse a formatted amount back to a number
 * @param {string} formattedValue - The formatted input value
 * @returns {number} The parsed amount as a number
 */
export const parseFormattedAmount = (formattedValue) => { 
    // Remove all non-numeric characters
    const numberString = formattedValue.replace(/[^\d]/g, '');
    return parseInt(numberString, 10) || 0;
};

/**
 * Format an ISO date for display (YYYY-MM-DD to DD/MM/YYYY)
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns {string} Formatted date for display
 */
export const formatDisplayDate = (isoDate) => { 
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Get today's date as an ISO string (YYYY-MM-DD)
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => { 
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Show a message to the user
 * @param {string} message - The message to display
 * @param {string} type - Message type ('success' or 'error')
 * @param {number} duration - Duration to show the message in ms
 */
export const showMessage = (message, type = 'success', duration = 3000) => {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    
    // Set message content and type
    messageText.textContent = message;
    messageBox.className = 'show';
    messageBox.classList.add(type);
    
    // Show the message
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.opacity = '1';
    }, 10);
    
    // Hide the message after duration
    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageBox.classList.remove(type);
        }, 300);
    }, duration);
}; 