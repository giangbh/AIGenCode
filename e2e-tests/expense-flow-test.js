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
}); 