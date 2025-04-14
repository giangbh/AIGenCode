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
      
      // Delete the expense
      expenseManager.deleteExpense(fundExpense.id);
      
      // Should restore the amount to fund
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
    
    // New test cases for balance and calculation verification
    
    it('should handle fractional amounts in expense splits', () => {
      // Add an expense with an amount that doesn't divide evenly
      expenseManager.addExpense({
        name: 'Odd Amount Expense',
        amount: 100001, // 100.001 VND - not divisible by 3
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      // Each participant should owe 33,333.67 VND (rounded)
      // But the total should still add up to the original amount
      const totalOwed = results.balances['Giang'].owes + 
                        results.balances['Toàn'].owes + 
                        results.balances['Quân'].owes;
      
      expect(totalOwed).toBe(100001); // Should match exact amount
      expect(results.balances['Giang'].paid).toBe(100001);
      
      // Each person's share should be approximately 1/3 of the total
      const expectedShare = 100001 / 3;
      expect(results.balances['Giang'].owes).toBeCloseTo(expectedShare, 0); // Allow small rounding difference
      expect(results.balances['Toàn'].owes).toBeCloseTo(expectedShare, 0);
      expect(results.balances['Quân'].owes).toBeCloseTo(expectedShare, 0);
    });
    
    it('should correctly calculate custom split expenses', () => {
      // Add an expense with custom split
      expenseManager.addExpense({
        name: 'Custom Split Expense',
        amount: 500000,
        date: '2025-04-10',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: false,
        splits: {
          'Giang': 100000, // 20%
          'Toàn': 300000,  // 60%
          'Quân': 100000   // 20%
        }
      });
      
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      expect(results.balances['Giang'].owes).toBe(100000);
      expect(results.balances['Toàn'].owes).toBe(300000);
      expect(results.balances['Quân'].owes).toBe(100000);
      
      expect(results.balances['Toàn'].paid).toBe(500000);
      expect(results.balances['Toàn'].net).toBe(200000); // 500k - 300k
      
      expect(results.balances['Giang'].net).toBe(-100000);
      expect(results.balances['Quân'].net).toBe(-100000);
    });
    
    it('should handle very large numbers correctly', () => {
      // Add a large expense
      expenseManager.addExpense({
        name: 'Very Large Expense',
        amount: 100000000, // 100 million VND
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn'];
      const results = expenseManager.calculateResults(members);
      
      expect(results.balances['Giang'].paid).toBe(100000000);
      expect(results.balances['Giang'].owes).toBe(50000000); // Half of 100m
      expect(results.balances['Giang'].net).toBe(50000000);
      
      expect(results.balances['Toàn'].paid).toBe(0);
      expect(results.balances['Toàn'].owes).toBe(50000000);
      expect(results.balances['Toàn'].net).toBe(-50000000);
      
      // Check that the transaction shows the correct amount
      expect(results.transactions.length).toBe(1);
      expect(results.transactions[0].from).toBe('Toàn');
      expect(results.transactions[0].to).toBe('Giang');
      expect(results.transactions[0].amount).toBe(50000000);
    });
    
    it('should handle complex scenario with multiple expenses and splits', () => {
      // Add several expenses with different payers and participants
      
      // Expense 1: Giang pays for everyone
      expenseManager.addExpense({
        name: 'Lunch',
        amount: 300000,
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      // Expense 2: Toàn pays for himself and Giang
      expenseManager.addExpense({
        name: 'Coffee',
        amount: 100000,
        date: '2025-04-10',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Expense 3: Quân pays for everyone with custom split
      expenseManager.addExpense({
        name: 'Dinner',
        amount: 400000,
        date: '2025-04-10',
        payer: 'Quân',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: false,
        splits: {
          'Giang': 150000,
          'Toàn': 150000,
          'Quân': 100000
        }
      });
      
      // Expense 4: Group fund pays for everyone
      expenseManager.addExpense({
        name: 'Group Activity',
        amount: 450000,
        date: '2025-04-10',
        payer: '__GROUP_FUND__',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn', 'Quân'];
      const results = expenseManager.calculateResults(members);
      
      // Expected values:
      // Giang: Paid 300k, Owes 100k for Lunch, 50k for Coffee, 150k for Dinner = 300k
      // Toàn: Paid 100k, Owes 100k for Lunch, 50k for Coffee, 150k for Dinner = 300k
      // Quân: Paid 400k, Owes 100k for Lunch, 0 for Coffee, 100k for Dinner = 200k
      // Group fund expense is ignored for settlement
      
      expect(results.hasNonFundExpenses).toBe(true);
      
      expect(results.balances['Giang'].paid).toBe(300000);
      expect(results.balances['Giang'].owes).toBe(300000);
      expect(results.balances['Giang'].net).toBe(0); // Net zero
      
      expect(results.balances['Toàn'].paid).toBe(100000);
      expect(results.balances['Toàn'].owes).toBe(300000);
      expect(results.balances['Toàn'].net).toBe(-200000); // Net -200k
      
      expect(results.balances['Quân'].paid).toBe(400000);
      expect(results.balances['Quân'].owes).toBe(200000);
      expect(results.balances['Quân'].net).toBe(200000); // Net +200k
      
      // Verify transactions - Toàn should pay Quân 200k
      expect(results.transactions.length).toBe(1);
      expect(results.transactions[0].from).toBe('Toàn');
      expect(results.transactions[0].to).toBe('Quân');
      expect(results.transactions[0].amount).toBe(200000);
    });
    
    it('should handle multiple payers with minimal transactions', () => {
      // Set up test expenses where everyone has paid something
      expenseManager.addExpense({
        name: 'Giang Paid',
        amount: 100000,
        date: '2025-04-10',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân', 'Trung'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Toàn Paid',
        amount: 80000,
        date: '2025-04-10',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn', 'Quân', 'Trung'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Quân Paid',
        amount: 120000,
        date: '2025-04-10',
        payer: 'Quân',
        participants: ['Giang', 'Toàn', 'Quân', 'Trung'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Trung Paid',
        amount: 60000,
        date: '2025-04-10',
        payer: 'Trung',
        participants: ['Giang', 'Toàn', 'Quân', 'Trung'],
        equalSplit: true
      });
      
      const members = ['Giang', 'Toàn', 'Quân', 'Trung'];
      const results = expenseManager.calculateResults(members);
      
      // Total expenses: 360k
      // Per person share: 90k
      // Giang: paid 100k, owes 90k, net +10k
      // Toàn: paid 80k, owes 90k, net -10k
      // Quân: paid 120k, owes 90k, net +30k
      // Trung: paid 60k, owes 90k, net -30k
      
      // Verify balances are correct
      expect(results.balances['Giang'].net).toBe(10000);
      expect(results.balances['Toàn'].net).toBe(-10000);
      expect(results.balances['Quân'].net).toBe(30000);
      expect(results.balances['Trung'].net).toBe(-30000);
      
      // The algorithm should minimize transactions:
      // Toàn should pay Giang 10k
      // Trung should pay Quân 30k
      expect(results.transactions.length).toBe(2);
      
      // Find the transactions
      const toanToGiang = results.transactions.find(t => 
        t.from === 'Toàn' && t.to === 'Giang'
      );
      
      const trungToQuan = results.transactions.find(t => 
        t.from === 'Trung' && t.to === 'Quân'
      );
      
      expect(toanToGiang).toBeDefined();
      expect(toanToGiang.amount).toBe(10000);
      
      expect(trungToQuan).toBeDefined();
      expect(trungToQuan.amount).toBe(30000);
    });
  });

  describe('getExpenseSuggestions', () => {
    beforeEach(() => {
      // Reset to clean state
      expenseManager = new ExpenseManager(mockFundManager);
    });
    
    it('should return empty array when no expenses exist', () => {
      const suggestions = expenseManager.getExpenseSuggestions();
      expect(suggestions).toEqual([]);
    });
    
    it('should generate suggestions based on past expenses', () => {
      // Set up test expenses with the same name but different amounts
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      // Convert dates to YYYY-MM-DD format
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastWeekStr = lastWeek.toISOString().split('T')[0];
      
      // Add expenses
      expenseManager.addExpense({
        name: 'Ăn trưa',
        amount: 100000,
        date: todayStr,
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Ăn trưa',  // Same name
        amount: 100000,    // Same amount
        date: yesterdayStr,
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Cafe',
        amount: 50000,
        date: lastWeekStr,
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      // Get suggestions
      const suggestions = expenseManager.getExpenseSuggestions();
      
      // Verify suggestions
      expect(suggestions.length).toBeGreaterThan(0);
      
      // "Ăn trưa" should be the first suggestion with amount 100000
      const lunchSuggestion = suggestions.find(s => s.name === 'Ăn trưa');
      expect(lunchSuggestion).toBeDefined();
      expect(lunchSuggestion.amount).toBe(100000);
      expect(lunchSuggestion.frequency).toBe(2);
      
      // "Cafe" should also be in suggestions
      const cafeSuggestion = suggestions.find(s => s.name === 'Cafe');
      expect(cafeSuggestion).toBeDefined();
      expect(cafeSuggestion.amount).toBe(50000);
      expect(cafeSuggestion.frequency).toBe(1);
      
      // "Ăn trưa" should appear before "Cafe" since it's more frequent
      expect(suggestions.indexOf(lunchSuggestion)).toBeLessThan(suggestions.indexOf(cafeSuggestion));
    });
    
    it('should ignore expenses older than 3 months', () => {
      // Current date
      const today = new Date();
      
      // Date 4 months ago
      const fourMonthsAgo = new Date(today);
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      
      // Convert to YYYY-MM-DD format
      const todayStr = today.toISOString().split('T')[0];
      const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0];
      
      // Add a recent expense
      expenseManager.addExpense({
        name: 'Chi tiêu gần đây',
        amount: 80000,
        date: todayStr,
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Add an old expense
      expenseManager.addExpense({
        name: 'Chi tiêu cũ',
        amount: 120000,
        date: fourMonthsAgoStr,
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      // Get suggestions
      const suggestions = expenseManager.getExpenseSuggestions();
      
      // Recent expense should be in suggestions
      const recentSuggestion = suggestions.find(s => s.name === 'Chi tiêu gần đây');
      expect(recentSuggestion).toBeDefined();
      
      // Old expense should be ignored
      const oldSuggestion = suggestions.find(s => s.name === 'Chi tiêu cũ');
      expect(oldSuggestion).toBeUndefined();
    });
    
    it('should suggest most frequently used amount for an expense name', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Add same expense with different amounts
      expenseManager.addExpense({
        name: 'Ăn tối',
        amount: 150000, // This amount appears twice
        date: todayStr,
        payer: 'Giang',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Ăn tối',
        amount: 150000, // Same amount again
        date: todayStr,
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      });
      
      expenseManager.addExpense({
        name: 'Ăn tối',
        amount: 200000, // Different amount
        date: todayStr,
        payer: 'Quân',
        participants: ['Giang', 'Toàn', 'Quân'],
        equalSplit: true
      });
      
      // Get suggestions
      const suggestions = expenseManager.getExpenseSuggestions();
      
      // "Ăn tối" should suggest 150000 as the amount since it's more frequent
      const dinnerSuggestion = suggestions.find(s => s.name === 'Ăn tối');
      expect(dinnerSuggestion).toBeDefined();
      expect(dinnerSuggestion.amount).toBe(150000);
      expect(dinnerSuggestion.frequency).toBe(3); // Total frequency is 3
    });
  });
}); 