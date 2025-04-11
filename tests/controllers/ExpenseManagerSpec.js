import { ExpenseManager } from '../../js/controllers/ExpenseManager.js';
import { Expense } from '../../js/models/Expense.js';

describe('ExpenseManager', () => {
  let expenseManager;
  let mockFundManager;
  
  beforeEach(() => {
    // Mock localStorage to prevent real storage operations during tests
    Object.defineProperty(window, 'localStorage', {
      value: window.getMockStorage()
    });
    
    // Mock the fundManager
    mockFundManager = {
      getBalance: jasmine.createSpy('getBalance').and.returnValue(1000000),
      updateBalance: jasmine.createSpy('updateBalance'),
      createTransaction: jasmine.createSpy('createTransaction')
    };
    
    // Create a fresh ExpenseManager for each test
    expenseManager = new ExpenseManager(mockFundManager);
    
    // Reset the mocks between tests
    window.resetMockStorage();
  });
  
  describe('constructor', () => {
    it('should initialize with empty expenses array', () => {
      expect(expenseManager.expenses).toEqual([]);
      expect(expenseManager.fundManager).toBe(mockFundManager);
    });
    
    it('should load data from storage on initialization', () => {
      // Set up mock storage with test data
      const mockExpenses = [
        {
          id: 'test1', 
          name: 'Dinner', 
          amount: 150000, 
          date: '2025-04-10',
          payer: 'Giang',
          participants: ['Giang', 'Toàn'],
          equalSplit: true,
          splits: {}
        }
      ];
      
      window.localStorage.setItem('cafethu6_expenses', JSON.stringify(mockExpenses));
      
      const newManager = new ExpenseManager(mockFundManager);
      
      expect(newManager.expenses.length).toBe(1);
      expect(newManager.expenses[0] instanceof Expense).toBe(true);
      expect(newManager.expenses[0].name).toBe('Dinner');
    });
  });
  
  describe('addExpense', () => {
    it('should add a new expense to the expenses array', () => {
      const expenseData = {
        name: 'Coffee',
        amount: 100000,
        date: '2025-04-11',
        payer: 'Toàn',
        participants: ['Toàn', 'Giang', 'Quân'],
        equalSplit: true
      };
      
      const newExpense = expenseManager.addExpense(expenseData);
      
      expect(expenseManager.expenses.length).toBe(1);
      expect(expenseManager.expenses[0]).toBe(newExpense);
      expect(newExpense.name).toBe('Coffee');
      expect(newExpense.amount).toBe(100000);
    });
    
    it('should throw error if group fund has insufficient balance', () => {
      // Update mock to return a smaller balance
      mockFundManager.getBalance.and.returnValue(50000);
      
      const expenseData = {
        name: 'Expensive Dinner',
        amount: 100000,
        date: '2025-04-11',
        payer: '__GROUP_FUND__',
        participants: ['Toàn', 'Giang', 'Quân'],
        equalSplit: true
      };
      
      expect(() => {
        expenseManager.addExpense(expenseData);
      }).toThrow();
      
      expect(expenseManager.expenses.length).toBe(0);
    });
    
    it('should update fund balance when group fund is the payer', () => {
      const expenseData = {
        name: 'Group Lunch',
        amount: 500000,
        date: '2025-04-11',
        payer: '__GROUP_FUND__',
        participants: ['Toàn', 'Giang', 'Quân'],
        equalSplit: true
      };
      
      expenseManager.addExpense(expenseData);
      
      expect(mockFundManager.updateBalance).toHaveBeenCalledWith(-500000);
      expect(mockFundManager.createTransaction).toHaveBeenCalled();
    });
  });
  
  describe('updateExpense', () => {
    let existingExpense;
    
    beforeEach(() => {
      // Add a test expense
      existingExpense = expenseManager.addExpense({
        name: 'Initial Expense',
        amount: 300000,
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Reset the spy call counts
      mockFundManager.updateBalance.calls.reset();
      mockFundManager.createTransaction.calls.reset();
    });
    
    it('should update an existing expense', () => {
      const updatedData = {
        name: 'Updated Expense',
        amount: 400000,
        date: '2025-04-11',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      };
      
      const updatedExpense = expenseManager.updateExpense(existingExpense.id, updatedData);
      
      expect(updatedExpense.name).toBe('Updated Expense');
      expect(updatedExpense.amount).toBe(400000);
      expect(updatedExpense.payer).toBe('Toàn');
      expect(updatedExpense.participants).toEqual(['Giang', 'Toàn', 'Quân']);
    });
    
    it('should throw error if expense is not found', () => {
      expect(() => {
        expenseManager.updateExpense('non-existent-id', {});
      }).toThrow();
    });
    
    it('should handle changing payer to group fund', () => {
      const updatedData = {
        name: 'Fund Paid Expense',
        amount: 300000,
        date: '2025-04-10',
        payer: '__GROUP_FUND__',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      };
      
      expenseManager.updateExpense(existingExpense.id, updatedData);
      
      expect(mockFundManager.updateBalance).toHaveBeenCalledWith(-300000);
      expect(mockFundManager.createTransaction).toHaveBeenCalled();
    });
    
    it('should handle changing payer from group fund', () => {
      // First set up an expense paid by group fund
      const fundExpense = expenseManager.addExpense({
        name: 'Fund Expense',
        amount: 200000,
        date: '2025-04-11',
        payer: '__GROUP_FUND__',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Reset the spy call counts
      mockFundManager.updateBalance.calls.reset();
      mockFundManager.createTransaction.calls.reset();
      
      // Now update to change payer
      const updatedData = {
        name: 'Now Paid by Individual',
        amount: 200000,
        date: '2025-04-11',
        payer: 'Quân',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      };
      
      expenseManager.updateExpense(fundExpense.id, updatedData);
      
      expect(mockFundManager.updateBalance).toHaveBeenCalledWith(200000);
      expect(mockFundManager.createTransaction).toHaveBeenCalled();
    });
  });
  
  describe('deleteExpense', () => {
    let existingExpense;
    
    beforeEach(() => {
      // Add a test expense
      existingExpense = expenseManager.addExpense({
        name: 'Expense to Delete',
        amount: 150000,
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Reset the spy call counts
      mockFundManager.updateBalance.calls.reset();
      mockFundManager.createTransaction.calls.reset();
    });
    
    it('should delete an existing expense', () => {
      const result = expenseManager.deleteExpense(existingExpense.id);
      
      expect(result).toBe(true);
      expect(expenseManager.expenses.length).toBe(0);
    });
    
    it('should return false when expense not found', () => {
      const result = expenseManager.deleteExpense('non-existent-id');
      
      expect(result).toBe(false);
      expect(expenseManager.expenses.length).toBe(1); // No change
    });
    
    it('should restore fund balance when deleting expense paid by fund', () => {
      // Add a fund expense
      const fundExpense = expenseManager.addExpense({
        name: 'Fund Expense to Delete',
        amount: 250000,
        date: '2025-04-11',
        payer: '__GROUP_FUND__',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Reset the spy call counts
      mockFundManager.updateBalance.calls.reset();
      mockFundManager.createTransaction.calls.reset();
      
      // Delete the fund expense
      expenseManager.deleteExpense(fundExpense.id);
      
      expect(mockFundManager.updateBalance).toHaveBeenCalledWith(250000);
      expect(mockFundManager.createTransaction).toHaveBeenCalled();
    });
  });
  
  describe('calculateResults', () => {
    it('should return empty results with no expenses', () => {
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      expect(results.hasNonFundExpenses).toBe(false);
      expect(Object.keys(results.balances).length).toBe(3); // One for each member
      expect(results.transactions.length).toBe(0);
    });
    
    it('should calculate correct balances for equal splits', () => {
      // Set up test expenses
      expenseManager.addExpense({
        name: 'Lunch',
        amount: 300000, // 300k VND
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Coffee',
        amount: 150000, // 150k VND
        date: '2025-04-10',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      // Expected values:
      // Giang paid 300k, owes 100k for Lunch and 75k for Coffee = 175k, net +125k
      // Toàn paid 150k, owes 100k for Lunch and 75k for Coffee = 175k, net -25k
      // Quân paid 0, owes 100k for Lunch, net -100k
      
      expect(results.hasNonFundExpenses).toBe(true);
      expect(results.balances['Giang'].paid).toBe(300000);
      expect(results.balances['Giang'].owes).toBe(175000);
      expect(results.balances['Giang'].net).toBe(125000);
      
      expect(results.balances['Toàn'].paid).toBe(150000);
      expect(results.balances['Toàn'].owes).toBe(175000);
      expect(results.balances['Toàn'].net).toBe(-25000);
      
      expect(results.balances['Quân'].paid).toBe(0);
      expect(results.balances['Quân'].owes).toBe(100000);
      expect(results.balances['Quân'].net).toBe(-100000);
      
      // Check transactions (who pays whom)
      expect(results.transactions.length).toBeGreaterThan(0);
    });
    
    it('should ignore expenses paid by group fund for settlement', () => {
      // Add an expense paid by group fund
      expenseManager.addExpense({
        name: 'Group Dinner',
        amount: 400000,
        date: '2025-04-11',
        payer: '__GROUP_FUND__',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      // Add a regular expense
      expenseManager.addExpense({
        name: 'Taxi',
        amount: 150000,
        date: '2025-04-11',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      // The group fund expense should be ignored for settlement
      expect(results.hasNonFundExpenses).toBe(true);
      
      // Each owes 50k for the Taxi, Giang paid 150k
      expect(results.balances['Giang'].paid).toBe(150000);
      expect(results.balances['Giang'].owes).toBe(50000);
      expect(results.balances['Giang'].net).toBe(100000);
      
      expect(results.balances['Toàn'].paid).toBe(0);
      expect(results.balances['Toàn'].owes).toBe(50000);
      expect(results.balances['Toàn'].net).toBe(-50000);
      
      expect(results.balances['Quân'].paid).toBe(0);
      expect(results.balances['Quân'].owes).toBe(50000);
      expect(results.balances['Quân'].net).toBe(-50000);
    });
  });
}); 