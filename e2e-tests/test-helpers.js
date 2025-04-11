/**
 * Test helper functions for CafeThu6 end-to-end tests
 */

// Get the application iframe window
export function getAppWindow() {
    const iframe = document.getElementById('test-iframe');
    return iframe.contentWindow;
}

// Get the application document
export function getAppDocument() {
    return getAppWindow().document;
}

// Reset application data
export async function resetAppData() {
    const appWindow = getAppWindow();
    
    // Clear local storage
    appWindow.localStorage.clear();
    
    // Reload the application
    return new Promise(resolve => {
        iframe.addEventListener('load', () => {
            resolve();
        }, { once: true });
        iframe.src = iframe.src;
    });
}

// Wait for a condition to be true
export function waitFor(conditionFn, timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
        function checkCondition() {
            if (conditionFn()) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
            } else {
                setTimeout(checkCondition, 100);
            }
        }
        
        checkCondition();
    });
}

// Click an element
export function clickElement(selector) {
    const doc = getAppDocument();
    const element = doc.querySelector(selector);
    
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    
    element.click();
}

// Fill an input field
export function fillInput(selector, value) {
    const doc = getAppDocument();
    const input = doc.querySelector(selector);
    
    if (!input) {
        throw new Error(`Input not found: ${selector}`);
    }
    
    // Set the value
    input.value = value;
    
    // Dispatch input and change events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Check a checkbox
export function setCheckbox(selector, checked) {
    const doc = getAppDocument();
    const checkbox = doc.querySelector(selector);
    
    if (!checkbox) {
        throw new Error(`Checkbox not found: ${selector}`);
    }
    
    checkbox.checked = checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

// Select an option from a dropdown
export function selectOption(selector, value) {
    const doc = getAppDocument();
    const select = doc.querySelector(selector);
    
    if (!select) {
        throw new Error(`Select not found: ${selector}`);
    }
    
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
}

// Get element text
export function getElementText(selector) {
    const doc = getAppDocument();
    const element = doc.querySelector(selector);
    
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    
    return element.textContent.trim();
}

// Get element attribute
export function getElementAttribute(selector, attribute) {
    const doc = getAppDocument();
    const element = doc.querySelector(selector);
    
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    
    return element.getAttribute(attribute);
}

// Wait for an element to be visible
export async function waitForElement(selector, timeout = 5000) {
    return waitFor(() => {
        const element = getAppDocument().querySelector(selector);
        return element && element.offsetParent !== null;
    }, timeout);
}

// Switch to a specific tab
export function switchToTab(tabId) {
    const doc = getAppDocument();
    const tabButton = doc.querySelector(`.tab-button[data-tab="${tabId}"]`);
    
    if (!tabButton) {
        throw new Error(`Tab button not found: ${tabId}`);
    }
    
    tabButton.click();
}

// Get a text element by its text content
export function getElementByText(selector, text) {
    const doc = getAppDocument();
    const elements = Array.from(doc.querySelectorAll(selector));
    
    return elements.find(el => el.textContent.trim().includes(text));
}

// Check if an element exists
export function elementExists(selector) {
    const doc = getAppDocument();
    return !!doc.querySelector(selector);
}

// Get today's date in YYYY-MM-DD format (for date inputs)
export function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get display window values (like balances)
export function getBalanceValue(selector) {
    const text = getElementText(selector);
    return parseFloat(text.replace(/[^\d.-]/g, ''));
}

// Submit a form
export function submitForm(formSelector) {
    const doc = getAppDocument();
    const form = doc.querySelector(formSelector);
    
    if (!form) {
        throw new Error(`Form not found: ${formSelector}`);
    }
    
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
} 