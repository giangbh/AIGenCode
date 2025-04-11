import { FundTransaction } from '../../js/models/FundTransaction.js';

describe('FundTransaction Model', () => {
  beforeEach(() => {
    // Reset storage between tests
    window.resetMockStorage();
  });
  
  describe('constructor', () => {
    it('should create a deposit transaction', () => {
      const data = {
        type: FundTransaction.TYPES.DEPOSIT,
        amount: 200000,
        date: '2025-04-11',
        member: 'Giang',
        note: 'Initial deposit'
      };
      
      const transaction = new FundTransaction(data);
      
      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe('deposit');
      expect(transaction.amount).toBe(200000);
      expect(transaction.date).toBe('2025-04-11');
      expect(transaction.member).toBe('Giang');
      expect(transaction.note).toBe('Initial deposit');
    });
    
    it('should create an expense transaction', () => {
      const data = {
        type: FundTransaction.TYPES.EXPENSE,
        amount: 150000,
        date: '2025-04-10',
        expenseId: 'exp-123',
        expenseName: 'Group Lunch'
      };
      
      const transaction = new FundTransaction(data);
      
      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(150000);
      expect(transaction.date).toBe('2025-04-10');
      expect(transaction.expenseId).toBe('exp-123');
      expect(transaction.expenseName).toBe('Group Lunch');
    });
    
    it('should use provided ID if available', () => {
      const data = {
        id: 'custom-id-123',
        type: FundTransaction.TYPES.DEPOSIT,
        amount: 300000,
        date: '2025-04-09',
        member: 'Toàn'
      };
      
      const transaction = new FundTransaction(data);
      
      expect(transaction.id).toBe('custom-id-123');
    });
    
    it('should set an empty note if not provided for deposit', () => {
      const data = {
        type: FundTransaction.TYPES.DEPOSIT,
        amount: 100000,
        date: '2025-04-11',
        member: 'Quân'
      };
      
      const transaction = new FundTransaction(data);
      
      expect(transaction.note).toBe('');
    });
  });
  
  describe('static createDeposit()', () => {
    it('should create a deposit transaction', () => {
      const transaction = FundTransaction.createDeposit(
        'Nhật', 500000, '2025-04-12', 'Monthly contribution'
      );
      
      expect(transaction instanceof FundTransaction).toBe(true);
      expect(transaction.type).toBe('deposit');
      expect(transaction.amount).toBe(500000);
      expect(transaction.date).toBe('2025-04-12');
      expect(transaction.member).toBe('Nhật');
      expect(transaction.note).toBe('Monthly contribution');
      expect(transaction.id).toBeDefined();
    });
    
    it('should use empty note if not provided', () => {
      const transaction = FundTransaction.createDeposit(
        'Quang', 300000, '2025-04-11'
      );
      
      expect(transaction.type).toBe('deposit');
      expect(transaction.member).toBe('Quang');
      expect(transaction.note).toBe('');
    });
  });
  
  describe('static createExpense()', () => {
    it('should create an expense transaction', () => {
      const transaction = FundTransaction.createExpense(
        'exp-456', 'Team Dinner', 800000, '2025-04-13'
      );
      
      expect(transaction instanceof FundTransaction).toBe(true);
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(800000);
      expect(transaction.date).toBe('2025-04-13');
      expect(transaction.expenseId).toBe('exp-456');
      expect(transaction.expenseName).toBe('Team Dinner');
      expect(transaction.id).toBeDefined();
    });
  });
  
  describe('isDeposit()', () => {
    it('should return true for deposit transactions', () => {
      const deposit = FundTransaction.createDeposit(
        'Trung', 250000, '2025-04-14'
      );
      
      expect(deposit.isDeposit()).toBe(true);
      expect(deposit.isExpense()).toBe(false);
    });
  });
  
  describe('isExpense()', () => {
    it('should return true for expense transactions', () => {
      const expense = FundTransaction.createExpense(
        'exp-789', 'Coffee Break', 120000, '2025-04-15'
      );
      
      expect(expense.isExpense()).toBe(true);
      expect(expense.isDeposit()).toBe(false);
    });
  });
  
  describe('toObject()', () => {
    it('should convert deposit transaction to plain object', () => {
      const deposit = FundTransaction.createDeposit(
        'Giang', 200000, '2025-04-11', 'Deposit note'
      );
      
      const obj = deposit.toObject();
      
      expect(obj.id).toBe(deposit.id);
      expect(obj.type).toBe('deposit');
      expect(obj.amount).toBe(200000);
      expect(obj.date).toBe('2025-04-11');
      expect(obj.member).toBe('Giang');
      expect(obj.note).toBe('Deposit note');
    });
    
    it('should not include note if empty for deposit', () => {
      const deposit = FundTransaction.createDeposit(
        'Toàn', 150000, '2025-04-10', ''
      );
      
      const obj = deposit.toObject();
      
      expect(obj.note).toBeUndefined();
    });
    
    it('should convert expense transaction to plain object', () => {
      const expense = FundTransaction.createExpense(
        'exp-456', 'Team Lunch', 350000, '2025-04-12'
      );
      
      const obj = expense.toObject();
      
      expect(obj.id).toBe(expense.id);
      expect(obj.type).toBe('expense');
      expect(obj.amount).toBe(350000);
      expect(obj.date).toBe('2025-04-12');
      expect(obj.expenseId).toBe('exp-456');
      expect(obj.expenseName).toBe('Team Lunch');
    });
  });
  
  describe('fromObject()', () => {
    it('should create FundTransaction from deposit object', () => {
      const obj = {
        id: 'test-id-123',
        type: 'deposit',
        amount: 100000,
        date: '2025-04-10',
        member: 'Quân',
        note: 'Test deposit'
      };
      
      const transaction = FundTransaction.fromObject(obj);
      
      expect(transaction instanceof FundTransaction).toBe(true);
      expect(transaction.id).toBe('test-id-123');
      expect(transaction.type).toBe('deposit');
      expect(transaction.amount).toBe(100000);
      expect(transaction.date).toBe('2025-04-10');
      expect(transaction.member).toBe('Quân');
      expect(transaction.note).toBe('Test deposit');
    });
    
    it('should create FundTransaction from expense object', () => {
      const obj = {
        id: 'test-id-456',
        type: 'expense',
        amount: 200000,
        date: '2025-04-11',
        expenseId: 'exp-test',
        expenseName: 'Test Expense'
      };
      
      const transaction = FundTransaction.fromObject(obj);
      
      expect(transaction instanceof FundTransaction).toBe(true);
      expect(transaction.id).toBe('test-id-456');
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(200000);
      expect(transaction.date).toBe('2025-04-11');
      expect(transaction.expenseId).toBe('exp-test');
      expect(transaction.expenseName).toBe('Test Expense');
    });
  });
}); 