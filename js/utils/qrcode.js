/**
 * QR Code utilities for the CafeThu6 application
 */

import { formatCurrency } from './helpers.js';

// QR Modal elements
let qrModalBackdrop;
let qrCodeImage;
let qrInstruction;

/**
 * Initialize QR code modal elements
 * Must be called after DOM is loaded
 */
export const initQRCodeModal = () => {
    qrModalBackdrop = document.getElementById('qr-modal-backdrop');
    qrCodeImage = document.getElementById('qr-code-image');
    qrInstruction = document.getElementById('qr-instruction');
    
    // Add event listeners
    document.getElementById('close-qr-modal-btn').addEventListener('click', hideQrModal);
    qrModalBackdrop.addEventListener('click', (event) => {
        if (event.target === qrModalBackdrop) {
            hideQrModal();
        }
    });
};

/**
 * Show the QR code modal
 */
export const showQrModal = () => {
    qrModalBackdrop.classList.add('show');
};

/**
 * Hide the QR code modal
 */
export const hideQrModal = () => {
    qrModalBackdrop.classList.remove('show');
};

/**
 * Display a QR code for bank transfer
 * @param {string} debtor - The person who needs to pay
 * @param {string} creditor - The person who should receive payment
 * @param {number|string} amount - The amount to transfer
 * @param {Object} bankAccounts - The bank account mapping
 * @param {string} bankCode - The bank code (e.g., 'BIDV')
 * @param {string} customDescription - Optional custom description for the transfer
 */
export const displayQrCode = (debtor, creditor, amount, bankAccounts, bankCode = 'BIDV', customDescription = '') => {
    // Parse amount to ensure it's a number
    const amountValue = parseFloat(amount);
    
    // Get account number for creditor
    const accountNumber = creditor in bankAccounts ? bankAccounts[creditor] : '';
    
    // Build instruction text
    const instruction = `${debtor} cần chuyển ${formatCurrency(amountValue)} cho ${creditor}`;
    qrInstruction.textContent = instruction;
    
    // Generate QR Code using the provided endpoint
    if (accountNumber) {
        // Use custom description if provided, otherwise use default
        const description = customDescription || `${debtor} chuyen tien cho ${creditor}`;
        const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amountValue}&des=${encodeURIComponent(description)}&template=compact&download=false`;
        qrCodeImage.src = qrUrl;
    } else {
        // Fallback in case account number is not available
        qrCodeImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=No%20Account%20Number';
    }
    
    showQrModal();
}; 