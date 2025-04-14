/**
 * End-to-End tests for expense management flow
 */

import * as helper from './test-helpers.js';

describe('Expense Management Flow', () => {
    beforeEach(async () => {
        // Reset application data before each test
        await helper.resetAppData();
        
        // Make sure we're on the expenses tab
        helper.switchToTab('expenses');
    });
    
    it('should add a new expense with equal split', async () => {
        // Fill out the new expense form
        helper.fillInput('#expense-name', 'Team Lunch');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Check some participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Make sure equal split is on (default)
        helper.setCheckbox('#split-equally-toggle', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear in the list
        await helper.waitForElement('.expense-item');
        
        // Verify the expense was added
        const expenseElement = helper.getElementByText('.expense-item-title', 'Team Lunch');
        expect(expenseElement).to.exist;
        
        // Verify the results were calculated
        const giangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(giangBalance).to.include('Giang');
        expect(giangBalance).to.include('300.000');
        
        // Verify transactions were generated
        const transactions = helper.getAppDocument().querySelectorAll('#transactions li');
        expect(transactions.length).to.be.greaterThan(0);
    });
    
    it('should add an expense with manual split', async () => {
        // Fill out the new expense form
        helper.fillInput('#expense-name', 'Dinner with Drinks');
        helper.fillInput('#expense-amount', '500000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Toàn');
        
        // Check some participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Turn off equal split to enable manual split
        helper.setCheckbox('#split-equally-toggle', false);
        
        // Wait for manual split section to appear
        await helper.waitForElement('#manual-split-section');
        
        // Fill out manual split amounts
        helper.fillInput('input[data-member="Giang"]', '150000');
        helper.fillInput('input[data-member="Toàn"]', '200000');
        helper.fillInput('input[data-member="Quân"]', '150000');
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear in the list
        await helper.waitForElement('.expense-item');
        
        // Verify the expense was added
        const expenseElement = helper.getElementByText('.expense-item-title', 'Dinner with Drinks');
        expect(expenseElement).to.exist;
    });
    
    it('should edit an existing expense', async () => {
        // First add an expense
        helper.fillInput('#expense-name', 'Initial Expense');
        helper.fillInput('#expense-amount', '150000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Quân');
        
        // Check participants
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Click the edit button on the expense
        const editButton = helper.getAppDocument().querySelector('.expense-item .edit-expense-btn');
        editButton.click();
        
        // Wait for form to be in edit mode
        await helper.waitFor(() => {
            return helper.getElementText('#form-title').includes('Sửa');
        });
        
        // Edit the expense
        helper.fillInput('#expense-name', 'Updated Expense Name');
        helper.fillInput('#expense-amount', '200000');
        
        // Submit the edit
        helper.submitForm('#expense-form');
        
        // Wait for the expense to update
        await helper.waitFor(() => {
            return helper.getElementByText('.expense-item-title', 'Updated Expense Name') !== null;
        });
        
        // Verify the expense was updated
        const updatedExpense = helper.getElementByText('.expense-item-title', 'Updated Expense Name');
        expect(updatedExpense).to.exist;
        
        // Verify the amount was updated
        const expenseAmount = helper.getElementText('.expense-item-amount');
        expect(expenseAmount).to.include('200.000');
    });
    
    it('should delete an expense', async () => {
        // First add an expense
        helper.fillInput('#expense-name', 'Expense to Delete');
        helper.fillInput('#expense-amount', '100000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Check participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Verify the expense exists
        let expenseElement = helper.getElementByText('.expense-item-title', 'Expense to Delete');
        expect(expenseElement).to.exist;
        
        // Get the delete button and click it
        const deleteButton = helper.getAppDocument().querySelector('.expense-item .delete-expense-btn');
        
        // Mock the confirm dialog to always return true
        helper.getAppWindow().confirm = () => true;
        
        // Click delete
        deleteButton.click();
        
        // Wait for the expense to be removed
        await helper.waitFor(() => {
            return !helper.getElementByText('.expense-item-title', 'Expense to Delete');
        });
        
        // Verify the expense was deleted
        expenseElement = helper.getElementByText('.expense-item-title', 'Expense to Delete');
        expect(expenseElement).to.be.null;
    });
    
    it('should calculate correct settlement amounts', async () => {
        // Add first expense where Giang pays
        helper.fillInput('#expense-name', 'Lunch Paid by Giang');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Three participants with equal split
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.setCheckbox('#split-equally-toggle', true);
        
        // Submit
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Add second expense where Toàn pays
        helper.fillInput('#expense-name', 'Dinner Paid by Toàn');
        helper.fillInput('#expense-amount', '150000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Toàn');
        
        // Two participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', false);
        
        // Submit
        helper.submitForm('#expense-form');
        
        // Wait for results to update
        await helper.waitFor(() => {
            const summaryItems = helper.getAppDocument().querySelectorAll('#individual-summary li');
            return summaryItems.length >= 3;
        });
        
        // Verify that the balances are correct
        const giangSummary = helper.getElementText('#individual-summary li:nth-child(1)');
        const toanSummary = helper.getElementText('#individual-summary li:nth-child(2)');
        const quanSummary = helper.getElementText('#individual-summary li:nth-child(3)');
        
        // Expected values:
        // Giang paid 300k, owes 100k for Lunch and 75k for Dinner = 175k, net +125k
        // Toàn paid 150k, owes 100k for Lunch and 75k for Dinner = 175k, net -25k
        // Quân paid 0, owes 100k for Lunch, net -100k
        
        expect(giangSummary).to.include('Giang');
        expect(giangSummary).to.include('300.000');
        expect(giangSummary).to.include('175.000');
        expect(giangSummary).to.include('+125.000');
        
        expect(toanSummary).to.include('Toàn');
        expect(toanSummary).to.include('150.000');
        expect(toanSummary).to.include('175.000');
        expect(toanSummary).to.include('-25.000');
        
        expect(quanSummary).to.include('Quân');
        expect(quanSummary).to.include('0');
        expect(quanSummary).to.include('100.000');
        expect(quanSummary).to.include('-100.000');
        
        // Verify transactions are generated
        const transactions = helper.getAppDocument().querySelectorAll('#transactions li');
        expect(transactions.length).to.be.at.least(2);
    });
    
    // New test cases focused on edge cases and money distribution
    
    it('should verify balance update after editing expense amount', async () => {
        // Add an expense
        helper.fillInput('#expense-name', 'Initial Amount Expense');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Add all participants with equal split
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Verify initial settlement calculations
        const initialBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(initialBalance).to.include('Giang');
        expect(initialBalance).to.include('300.000'); // Paid amount
        expect(initialBalance).to.include('100.000'); // Owes amount (1/3 of 300k)
        expect(initialBalance).to.include('+200.000'); // Net balance
        
        // Click the edit button on the expense
        const editButton = helper.getAppDocument().querySelector('.expense-item .edit-expense-btn');
        editButton.click();
        
        // Wait for form to be in edit mode
        await helper.waitFor(() => {
            return helper.getElementText('#form-title').includes('Sửa');
        });
        
        // Change the amount
        helper.fillInput('#expense-amount', '600000'); // Double the amount
        
        // Submit the edit
        helper.submitForm('#expense-form');
        
        // Wait for the expense to update
        await helper.waitFor(() => {
            const expenseAmount = helper.getElementText('.expense-item-amount');
            return expenseAmount.includes('600.000');
        });
        
        // Verify updated settlement calculations
        await helper.waitFor(() => {
            const updatedBalance = helper.getElementText('#individual-summary li:nth-child(1)');
            return updatedBalance.includes('+400.000'); // New net balance
        });
        
        const updatedBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(updatedBalance).to.include('Giang');
        expect(updatedBalance).to.include('600.000'); // New paid amount
        expect(updatedBalance).to.include('200.000'); // New owes amount (1/3 of 600k)
        expect(updatedBalance).to.include('+400.000'); // New net balance
    });
    
    it('should handle uneven manual splits correctly', async () => {
        // Fill out a new expense with manual split
        helper.fillInput('#expense-name', 'Custom Split Expense');
        helper.fillInput('#expense-amount', '500000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Toàn');
        
        // Check all participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Turn off equal split
        helper.setCheckbox('#split-equally-toggle', false);
        
        // Wait for manual split section to appear
        await helper.waitForElement('#manual-split-section');
        
        // Set custom amounts (intentionally not totaling to expense amount)
        helper.fillInput('input[data-member="Giang"]', '100000'); // 20%
        helper.fillInput('input[data-member="Toàn"]', '300000');  // 60%
        helper.fillInput('input[data-member="Quân"]', '100000');  // 20%
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Verify the expense details
        const expenseElement = helper.getElementByText('.expense-item-title', 'Custom Split Expense');
        expect(expenseElement).to.exist;
        
        // Verify settlement calculations are correct
        await helper.waitFor(() => {
            const summaryItems = helper.getAppDocument().querySelectorAll('#individual-summary li');
            return summaryItems.length >= 3;
        });
        
        const toanSummary = helper.getElementText('#individual-summary li:nth-child(2)');
        expect(toanSummary).to.include('Toàn');
        expect(toanSummary).to.include('500.000'); // Paid full amount
        expect(toanSummary).to.include('300.000'); // Owes their share
        expect(toanSummary).to.include('+200.000'); // Net balance
        
        const giangSummary = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(giangSummary).to.include('-100.000'); // Net negative
        
        const quanSummary = helper.getElementText('#individual-summary li:nth-child(3)');
        expect(quanSummary).to.include('-100.000'); // Net negative
    });
    
    it('should verify expense deletion updates balances correctly', async () => {
        // Add two expenses to create a balance situation
        // First expense: Giang pays for everyone
        helper.fillInput('#expense-name', 'Giang Paid Expense');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for the first expense to appear
        await helper.waitForElement('.expense-item');
        
        // Second expense: Toàn pays for everyone
        helper.fillInput('#expense-name', 'Toàn Paid Expense');
        helper.fillInput('#expense-amount', '150000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Toàn');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for both expenses to be listed
        await helper.waitFor(() => {
            const expenses = helper.getAppDocument().querySelectorAll('.expense-item');
            return expenses.length === 2;
        });
        
        // Verify initial balances
        const initialGiangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(initialGiangBalance).to.include('+250.000'); // 300k - (300k/3) - (150k/3)
        
        const initialToanBalance = helper.getElementText('#individual-summary li:nth-child(2)');
        expect(initialToanBalance).to.include('+50.000'); // 150k - (300k/3) - (150k/3)
        
        // Delete the first expense (Giang's)
        const deleteButtons = helper.getAppDocument().querySelectorAll('.expense-item .delete-expense-btn');
        
        // Mock confirm dialog
        helper.getAppWindow().confirm = () => true;
        
        // Click delete on first expense
        deleteButtons[0].click();
        
        // Wait for the first expense to be removed
        await helper.waitFor(() => {
            const expenses = helper.getAppDocument().querySelectorAll('.expense-item');
            return expenses.length === 1;
        });
        
        // Verify updated balances
        await helper.waitFor(() => {
            const updatedGiangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
            return updatedGiangBalance.includes('-50.000');
        });
        
        const updatedGiangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(updatedGiangBalance).to.include('Giang');
        expect(updatedGiangBalance).to.include('-50.000'); // 0 - (150k/3)
        
        const updatedToanBalance = helper.getElementText('#individual-summary li:nth-child(2)');
        expect(updatedToanBalance).to.include('Toàn');
        expect(updatedToanBalance).to.include('+100.000'); // 150k - (150k/3)
    });
    
    it('should handle expense amount of 1 VND correctly', async () => {
        // Add an expense with minimal amount
        helper.fillInput('#expense-name', 'Minimal Amount Expense');
        helper.fillInput('#expense-amount', '1'); // 1 VND
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Add 3 participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Verify expense was added
        const expenseElement = helper.getElementByText('.expense-item-title', 'Minimal Amount Expense');
        expect(expenseElement).to.exist;
        
        // Verify the amount shows correctly with proper formatting
        const expenseAmount = helper.getElementText('.expense-item-amount');
        expect(expenseAmount).to.include('1');
        
        // Verify settlement calculations handle this tiny amount
        const giangSummary = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(giangSummary).to.include('Giang');
        expect(giangSummary).to.include('1'); // Paid 1 VND
        
        // Depending on implementation, might show 0 due to rounding, or an exact fraction
        // We'll check both possibilities
        const netAmount = giangSummary.match(/([+-]\d+(?:\.\d+)?)/)[0];
        const netValue = parseFloat(netAmount.replace(/[^\d.-]/g, ''));
        expect(netValue).to.be.closeTo(0.67, 0.34); // Should be around 0.67 VND (1 - 1/3)
    });
    
    it('should handle changing payer while editing expense', async () => {
        // Add an expense with Giang as payer
        helper.fillInput('#expense-name', 'Initial Payer Expense');
        helper.fillInput('#expense-amount', '300000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        
        // Add participants
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        
        // Submit the form
        helper.submitForm('#expense-form');
        
        // Wait for the expense to appear
        await helper.waitForElement('.expense-item');
        
        // Verify initial balances
        const initialGiangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(initialGiangBalance).to.include('+200.000'); // 300k - (300k/3)
        
        const initialToanBalance = helper.getElementText('#individual-summary li:nth-child(2)');
        expect(initialToanBalance).to.include('-100.000'); // 0 - (300k/3)
        
        // Edit the expense
        const editButton = helper.getAppDocument().querySelector('.expense-item .edit-expense-btn');
        editButton.click();
        
        // Wait for form to be in edit mode
        await helper.waitFor(() => {
            return helper.getElementText('#form-title').includes('Sửa');
        });
        
        // Change the payer
        helper.selectOption('#payer', 'Toàn');
        
        // Submit the edit
        helper.submitForm('#expense-form');
        
        // Wait for the expense to update
        await helper.waitFor(() => {
            return helper.getElementByText('.expense-item .payer-name', 'Toàn') !== null;
        });
        
        // Verify updated balances
        await helper.waitFor(() => {
            const updatedToanBalance = helper.getElementText('#individual-summary li:nth-child(2)');
            return updatedToanBalance.includes('+200.000');
        });
        
        const updatedGiangBalance = helper.getElementText('#individual-summary li:nth-child(1)');
        expect(updatedGiangBalance).to.include('Giang');
        expect(updatedGiangBalance).to.include('-100.000'); // 0 - (300k/3)
        
        const updatedToanBalance = helper.getElementText('#individual-summary li:nth-child(2)');
        expect(updatedToanBalance).to.include('Toàn');
        expect(updatedToanBalance).to.include('+200.000'); // 300k - (300k/3)
    });
    
    it('should suggest expense names and amounts based on history', async () => {
        // First, add some expenses to build history
        // Expense 1: Lunch with a specific amount
        helper.fillInput('#expense-name', 'Ăn trưa văn phòng');
        helper.fillInput('#expense-amount', '250000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for first expense to be added
        await helper.waitForElement('.expense-item');
        
        // Expense 2: Coffee with a specific amount
        helper.fillInput('#expense-name', 'Cà phê họp team');
        helper.fillInput('#expense-amount', '120000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Toàn');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for second expense to be added
        await helper.waitFor(() => {
            const expenses = helper.getAppDocument().querySelectorAll('.expense-item');
            return expenses.length === 2;
        });
        
        // Expense 3: Same lunch expense to increase its frequency
        helper.fillInput('#expense-name', 'Ăn trưa văn phòng');
        helper.fillInput('#expense-amount', '250000');
        helper.fillInput('#expense-date', helper.getTodayDateString());
        helper.selectOption('#payer', 'Giang');
        helper.setCheckbox('input[type="checkbox"][value="Giang"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Toàn"]', true);
        helper.setCheckbox('input[type="checkbox"][value="Quân"]', true);
        helper.submitForm('#expense-form');
        
        // Wait for third expense to be added
        await helper.waitFor(() => {
            const expenses = helper.getAppDocument().querySelectorAll('.expense-item');
            return expenses.length === 3;
        });
        
        // Clear the form by "adding" a new expense (clicking "Add New" or similar button)
        const addNewButton = helper.getAppDocument().querySelector('#add-new-expense');
        addNewButton.click();
        
        // Wait for the form to reset and suggestions to appear
        await helper.waitForElement('.suggestions-container');
        
        // Verify suggestions are shown
        const suggestionItems = helper.getAppDocument().querySelectorAll('.suggestion-item');
        expect(suggestionItems.length).to.be.greaterThan(0);
        
        // Verify the lunch suggestion is present with correct amount
        const lunchSuggestion = Array.from(suggestionItems).find(item => 
            item.querySelector('.suggestion-name').textContent.includes('Ăn trưa văn phòng')
        );
        expect(lunchSuggestion).to.exist;
        expect(lunchSuggestion.querySelector('.suggestion-amount').textContent).to.include('250.000');
        
        // Click on a suggestion
        lunchSuggestion.click();
        
        // Verify the form fields are populated with the suggestion
        const nameInput = helper.getAppDocument().querySelector('#expense-name');
        const amountInput = helper.getAppDocument().querySelector('#expense-amount');
        
        expect(nameInput.value).to.equal('Ăn trưa văn phòng');
        expect(amountInput.value).to.equal('250000');
    });
}); 