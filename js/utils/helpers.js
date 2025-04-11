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
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
export const generateUUID = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

/**
 * Generate a random ID for new items
 * @returns {string} A unique random ID
 */
export const generateId = () => {
    // Sử dụng UUID nếu yêu cầu Supabase dùng UUID
    if (window.location.hostname !== 'localhost') {
        return generateUUID();
    }
    // Dùng ID ngẫu nhiên khi phát triển local
    return '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => CURRENCY_FORMATTER.format(amount);

/**
 * Parse shorthand amount notation (1k, 1M, 1B) to number
 * @param {string} value - Input value with possible shorthand notation
 * @returns {number} Parsed amount
 */
export const parseShorthandAmount = (value) => {
    if (!value) return 0;
    
    // Remove any formatting characters
    value = value.replace(/[.,\s]/g, '');
    
    // Check for shorthand notations
    const lowerValue = value.toLowerCase();
    
    if (lowerValue.endsWith('k')) {
        return parseInt(lowerValue.slice(0, -1)) * 1000;
    } else if (lowerValue.endsWith('m')) {
        return parseInt(lowerValue.slice(0, -1)) * 1000000;
    } else if (lowerValue.endsWith('b')) {
        return parseInt(lowerValue.slice(0, -1)) * 1000000000;
    }
    
    return parseInt(value) || 0;
};

/**
 * Format an input value for display in currency input fields
 * @param {string} value - The input value
 * @returns {string} Formatted value
 */
export const formatAmountInput = (value) => { 
    // Check for shorthand notation
    if (/[kmb]$/i.test(value)) {
        // Convert from shorthand to full number
        const amount = parseShorthandAmount(value);
        return INPUT_AMOUNT_FORMATTER.format(amount);
    }
    
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
    // Check for shorthand notation first
    if (/[kmb]$/i.test(formattedValue)) {
        return parseShorthandAmount(formattedValue);
    }
    
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
 * Format a datetime string for display (YYYY-MM-DD HH:MM:SS to DD/MM/YYYY HH:MM)
 * @param {string} datetime - Datetime in YYYY-MM-DD HH:MM:SS format
 * @returns {string} Formatted datetime for display
 */
export const formatDisplayDateTime = (datetime) => {
    if (!datetime) return '';
    
    const parts = datetime.split(' ');
    if (parts.length !== 2) return formatDisplayDate(datetime);
    
    const datePart = formatDisplayDate(parts[0]);
    const timePart = parts[1].substring(0, 5); // Extract HH:MM from HH:MM:SS
    
    return `${datePart} ${timePart}`;
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