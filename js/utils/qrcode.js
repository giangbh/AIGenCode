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
 */
export const displayQrCode = (debtor, creditor, amount, bankAccounts, bankCode = 'BIDV') => {
    // Parse amount to ensure it's a number
    const amountValue = parseFloat(amount);
    
    // Always use Toan.LV's account number regardless of creditor
    const accountNumber = '1240067256';
    
    // Build instruction text
    const instruction = `${debtor} cần chuyển ${formatCurrency(amountValue)} cho ${creditor}`;
    qrInstruction.textContent = instruction;
    
    // Generate QR Code using the provided endpoint
    const description = `${debtor} chuyen tien cho ${creditor}`;
    const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amountValue}&des=${encodeURIComponent(description)}&template=compact&download=false`;
    qrCodeImage.src = qrUrl;
    
    showQrModal();
}; 