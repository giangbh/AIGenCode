/**
 * End-to-End tests for group fund management flow
 */

import * as helper from './test-helpers.js';

describe('Group Fund Management Flow', () => {
    beforeEach(async () => {
        // Reset application data before each test
        await helper.resetAppData();
        
        // Make sure we're on the group fund tab
        helper.switchToTab('group-fund');
    });
    
    it('should add a deposit to the group fund', async () => {
        // Verify starting balance is 0
        const initialBalance = helper.getElementText('#group-fund-balance-info');
        expect(initialBalance).to.include('0');
        
        // Fill out the deposit form
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '500000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.fillInput('#deposit-note', 'Initial deposit');
        
        // Submit the form
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const currentBalance = helper.getElementText('#group-fund-balance-info');
            return currentBalance.includes('500.000');
        });
        
        // Verify new balance
        const newBalance = helper.getElementText('#group-fund-balance-info');
        expect(newBalance).to.include('500.000');
        
        // Verify transaction was recorded
        const transactionElement = helper.getElementByText('#group-fund-transactions-log .fund-transaction-item', 'Giang');
        expect(transactionElement).to.exist;
        expect(transactionElement.textContent).to.include('500.000');
        expect(transactionElement.textContent).to.include('Initial deposit');
    });
    
    it('should record multiple deposits from different members', async () => {
        // Add first deposit
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '300000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for first deposit to be recorded
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('300.000');
        });
        
        // Add second deposit
        helper.selectOption('#deposit-member', 'Toàn');
        helper.fillInput('#deposit-amount', '200000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for second deposit to be recorded
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('500.000');
        });
        
        // Verify final balance
        const finalBalance = helper.getElementText('#group-fund-balance-info');
        expect(finalBalance).to.include('500.000');
        
        // Verify both transactions are recorded
        const transactions = helper.getAppDocument().querySelectorAll('#group-fund-transactions-log .fund-transaction-item');
        expect(transactions.length).to.equal(2);
        
        // Verify member balances are updated
        const memberBalances = helper.getAppDocument().querySelectorAll('#member-balances-list li');
        expect(memberBalances.length).to.be.at.least(2);
        
        // Find Giang's balance
        const giangBalance = Array.from(memberBalances).find(item => item.textContent.includes('Giang'));
        expect(giangBalance).to.exist;
        expect(giangBalance.textContent).to.include('300.000');
        
        // Find Toàn's balance
        const toanBalance = Array.from(memberBalances).find(item => item.textContent.includes('Toàn'));
        expect(toanBalance).to.exist;
        expect(toanBalance.textContent).to.include('200.000');
    });
    
    it('should use group fund to pay for an expense', async () => {
        // First add a deposit to have money in the fund
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '500000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('500.000');
        });
        
        // Switch to expenses tab
        helper.switchToTab('expenses');
        
        // Create a new expense paid by the group fund
        helper.fillInput('#expense-name', 'Group Dinner');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        
        // Select participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for expense to be added
        await helper.waitForElement('.expense-item');
        
        // Verify expense was added
        const expenseElement = helper.getElementByText('.expense-item-title', 'Group Dinner');
        expect(expenseElement).to.exist;
        
        // Switch back to group fund tab
        helper.switchToTab('group-fund');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('200.000');
        });
        
        // Verify the new balance (500k - 300k = 200k)
        const newBalance = helper.getElementText('#group-fund-balance-info');
        expect(newBalance).to.include('200.000');
        
        // Verify expense transaction was recorded
        const transactions = helper.getAppDocument().querySelectorAll('#group-fund-transactions-log .fund-transaction-item');
        expect(transactions.length).to.equal(2); // Deposit + expense
        
        // Find expense transaction
        const expenseTransaction = Array.from(transactions).find(item => item.textContent.includes('Group Dinner'));
        expect(expenseTransaction).to.exist;
        expect(expenseTransaction.textContent).to.include('-300.000');
    });
    
    it('should show correct fund distribution in pie chart', async () => {
        // Add deposits from different members
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '300000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for first deposit
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('300.000');
        });
        
        // Add second deposit
        helper.selectOption('#deposit-member', 'Toàn');
        helper.fillInput('#deposit-amount', '200000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for second deposit
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('500.000');
        });
        
        // Verify pie chart exists
        const pieChartCanvas = helper.getAppDocument().querySelector('#fund-pie-chart');
        expect(pieChartCanvas).to.exist;
        
        // Note: We can't easily test the actual Chart.js rendering,
        // but we can verify the pie chart element exists and
        // that member balances are correct
        
        // Verify member balances
        const giangPercent = 300000 / 500000 * 100; // 60%
        const toanPercent = 200000 / 500000 * 100;  // 40%
        
        const memberBalances = helper.getAppDocument().querySelectorAll('#member-balances-list li');
        const giangBalance = Array.from(memberBalances).find(item => item.textContent.includes('Giang'));
        const toanBalance = Array.from(memberBalances).find(item => item.textContent.includes('Toàn'));
        
        expect(giangBalance.textContent).to.include('300.000');
        expect(toanBalance.textContent).to.include('200.000');
    });
    
    it('should validate deposit amount', async () => {
        // Try to submit with invalid amount
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '0'); // Invalid amount
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Balance should still be 0
        const balance = helper.getElementText('#group-fund-balance-info');
        expect(balance).to.include('0');
        
        // No transactions should be recorded
        const emptyMessage = helper.elementExists('#no-fund-transactions-message');
        expect(emptyMessage).to.be.true;
    });
}); 