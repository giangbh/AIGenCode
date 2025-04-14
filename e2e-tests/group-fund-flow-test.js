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
    
    // New test cases to verify balance integrity and edge cases
    
    it('should prevent spending more than available balance from group fund', async () => {
        // Add a deposit to the fund
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '100000'); // Just 100k
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('100.000');
        });
        
        // Switch to expenses tab
        helper.switchToTab('expenses');
        
        // Try to create an expense larger than the balance
        helper.fillInput('#expense-name', 'Expensive Dinner');
        helper.fillInput('#expense-amount', '200000'); // 200k > 100k in fund
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        
        // Select participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the error message
        await helper.waitForElement('.error-message');
        
        // Verify error message about insufficient funds is shown
        const errorMessage = helper.getAppDocument().querySelector('.error-message');
        expect(errorMessage.textContent).to.include('không đủ');
        
        // Verify no expense was added
        const expenseElement = helper.getElementByText('.expense-item-title', 'Expensive Dinner');
        expect(expenseElement).to.be.null;
        
        // Switch back to fund tab and verify balance is unchanged
        helper.switchToTab('group-fund');
        const finalBalance = helper.getElementText('#group-fund-balance-info');
        expect(finalBalance).to.include('100.000');
    });
    
    it('should correctly update balances for multiple small deposits and expenses', async () => {
        // Add initial deposit
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '100000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('100.000');
        });
        
        // Add second deposit
        helper.selectOption('#deposit-member', 'Toàn');
        helper.fillInput('#deposit-amount', '50000');
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update again
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('150.000');
        });
        
        // Switch to expenses tab
        helper.switchToTab('expenses');
        
        // Create first small expense
        helper.fillInput('#expense-name', 'Coffee');
        helper.fillInput('#expense-amount', '30000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for expense to be added
        await helper.waitForElement('.expense-item');
        
        // Create second small expense
        helper.fillInput('#expense-name', 'Snacks');
        helper.fillInput('#expense-amount', '20000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for second expense to be added
        await helper.waitFor(() => {
            const expenses = helper.getAppDocument().querySelectorAll('.expense-item');
            return expenses.length === 2;
        });
        
        // Switch back to fund tab
        helper.switchToTab('group-fund');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('100.000'); // 150k - 30k - 20k = 100k
        });
        
        // Verify the final balance
        const finalBalance = helper.getElementText('#group-fund-balance-info');
        expect(finalBalance).to.include('100.000');
        
        // Verify all transactions are recorded
        const transactions = helper.getAppDocument().querySelectorAll('#group-fund-transactions-log .fund-transaction-item');
        expect(transactions.length).to.equal(4); // 2 deposits + 2 expenses
        
        // Verify transaction order (most recent first)
        const transactionTexts = Array.from(transactions).map(item => item.textContent.trim());
        expect(transactionTexts[0]).to.include('Snacks');
        expect(transactionTexts[0]).to.include('-20.000');
        expect(transactionTexts[1]).to.include('Coffee');
        expect(transactionTexts[1]).to.include('-30.000');
    });
    
    it('should handle fractional amounts correctly in fund balance', async () => {
        // Add initial deposit with odd number
        helper.selectOption('#deposit-member', 'Giang');
        helper.fillInput('#deposit-amount', '100001'); // 100.001 VND
        helper.fillInput('#deposit-date', helper.getTodayDateString());
        helper.submitForm('#deposit-form');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('100.001');
        });
        
        // Switch to expenses tab
        helper.switchToTab('expenses');
        
        // Create expense with odd number
        helper.fillInput('#expense-name', 'Odd Expense');
        helper.fillInput('#expense-amount', '33333'); // 33.333 VND
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for expense to be added
        await helper.waitForElement('.expense-item');
        
        // Switch back to fund tab
        helper.switchToTab('group-fund');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('66.668'); // 100.001 - 33.333 = 66.668
        });
        
        // Verify the balance is calculated precisely
        const finalBalance = helper.getElementText('#group-fund-balance-info');
        expect(finalBalance).to.include('66.668');
    });
    
    it('should maintain correct member contribution percentages after expenses', async () => {
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
        
        // Switch to expenses tab
        helper.switchToTab('expenses');
        
        // Create an expense from group fund
        helper.fillInput('#expense-name', 'Group Expense');
        helper.fillInput('#expense-amount', '200000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', '__GROUP_FUND__');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for expense to be added
        await helper.waitForElement('.expense-item');
        
        // Switch back to fund tab
        helper.switchToTab('group-fund');
        
        // Wait for balance to update
        await helper.waitFor(() => {
            const balance = helper.getElementText('#group-fund-balance-info');
            return balance.includes('300.000'); // 500k - 200k = 300k
        });
        
        // Verify member percentages are still calculated correctly
        // Original contribution ratio should be maintained:
        // Giang: 300k/500k = 60%
        // Toàn: 200k/500k = 40%
        
        const memberBalances = helper.getAppDocument().querySelectorAll('#member-balances-list li');
        const giangBalance = Array.from(memberBalances).find(item => item.textContent.includes('Giang'));
        const toanBalance = Array.from(memberBalances).find(item => item.textContent.includes('Toàn'));
        
        // Verify amounts match expected percentages 
        // Giang should still show 60% of remaining 300k = 180k
        // Toàn should still show 40% of remaining 300k = 120k
        expect(giangBalance.textContent).to.include('180.000');
        expect(toanBalance.textContent).to.include('120.000');
    });
}); 