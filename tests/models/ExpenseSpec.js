import { Expense } from '../../js/models/Expense.js';

describe('Expense Model', () => {
  let sampleExpenseData;
  let mockGenerateId;
  
  beforeEach(() => {
    // Sample data for tests
    sampleExpenseData = {
      name: 'Dinner at Restaurant',
      amount: 500000, // 500,000 VND
      date: '2025-04-11',
      payer: 'Giang',
      participants: ['Giang', 'Quân', 'Toàn'],
      equalSplit: true
    };
    
    // Reset storage between tests
    window.resetMockStorage();
  });
  
  describe('constructor', () => {
    it('should create an Expense instance with provided data', () => {
      const expense = new Expense(sampleExpenseData);
      
      expect(expense.name).toBe('Dinner at Restaurant');
      expect(expense.amount).toBe(500000);
      expect(expense.date).toBe('2025-04-11');
      expect(expense.payer).toBe('Giang');
      expect(expense.participants).toEqual(['Giang', 'Quân', 'Toàn']);
      expect(expense.equalSplit).toBe(true);
      expect(expense.splits).toEqual({});
      expect(expense.id).toBeDefined();
    });
    
    it('should use provided ID if available', () => {
      const expenseWithId = new Expense({
        ...sampleExpenseData,
        id: 'test-id-123'
      });
      
      expect(expenseWithId.id).toBe('test-id-123');
    });
    
    it('should set splits if equalSplit is false', () => {
      const manualSplitExpense = new Expense({
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 200000,
          'Quân': 150000,
          'Toàn': 150000
        }
      });
      
      expect(manualSplitExpense.splits).toEqual({
        'Giang': 200000,
        'Quân': 150000,
        'Toàn': 150000
      });
    });
  });
  
  describe('getSplitAmountFor()', () => {
    it('should return equal split amount when equalSplit is true', () => {
      const expense = new Expense(sampleExpenseData);
      const expectedAmount = 500000 / 3; // 3 participants
      
      expect(expense.getSplitAmountFor('Giang')).toBe(expectedAmount);
      expect(expense.getSplitAmountFor('Quân')).toBe(expectedAmount);
      expect(expense.getSplitAmountFor('Toàn')).toBe(expectedAmount);
    });
    
    it('should return manual split amount when equalSplit is false', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 200000,
          'Quân': 150000,
          'Toàn': 150000
        }
      });
      
      expect(expense.getSplitAmountFor('Giang')).toBe(200000);
      expect(expense.getSplitAmountFor('Quân')).toBe(150000);
      expect(expense.getSplitAmountFor('Toàn')).toBe(150000);
    });
    
    it('should return 0 for participant not in manual splits', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 250000,
          'Quân': 250000
        }
      });
      
      expect(expense.getSplitAmountFor('Trung')).toBe(0);
    });
  });
  
  describe('includesParticipant()', () => {
    it('should return true for a participant in the expense', () => {
      const expense = new Expense(sampleExpenseData);
      
      expect(expense.includesParticipant('Giang')).toBe(true);
      expect(expense.includesParticipant('Quân')).toBe(true);
      expect(expense.includesParticipant('Toàn')).toBe(true);
    });
    
    it('should return false for a participant not in the expense', () => {
      const expense = new Expense(sampleExpenseData);
      
      expect(expense.includesParticipant('Trung')).toBe(false);
      expect(expense.includesParticipant('Nhật')).toBe(false);
    });
  });
  
  describe('update()', () => {
    it('should update expense with new data', () => {
      const expense = new Expense(sampleExpenseData);
      const newData = {
        name: 'Updated Expense',
        amount: 600000,
        date: '2025-04-12',
        payer: 'Toàn',
        participants: ['Giang', 'Toàn'],
        equalSplit: true
      };
      
      expense.update(newData);
      
      expect(expense.name).toBe('Updated Expense');
      expect(expense.amount).toBe(600000);
      expect(expense.date).toBe('2025-04-12');
      expect(expense.payer).toBe('Toàn');
      expect(expense.participants).toEqual(['Giang', 'Toàn']);
      expect(expense.equalSplit).toBe(true);
      expect(expense.splits).toEqual({});
    });
    
    it('should update equalSplit and splits correctly', () => {
      const expense = new Expense(sampleExpenseData);
      const newData = {
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 300000,
          'Quân': 200000
        }
      };
      
      expense.update(newData);
      
      expect(expense.equalSplit).toBe(false);
      expect(expense.splits).toEqual({
        'Giang': 300000,
        'Quân': 200000
      });
    });
  });
  
  describe('toObject()', () => {
    it('should convert expense to plain object', () => {
      const expense = new Expense(sampleExpenseData);
      const obj = expense.toObject();
      
      expect(obj).toEqual({
        id: expense.id,
        name: 'Dinner at Restaurant',
        amount: 500000,
        date: '2025-04-11',
        payer: 'Giang',
        participants: ['Giang', 'Quân', 'Toàn'],
        equalSplit: true,
        splits: {}
      });
    });
  });
  
  describe('fromObject()', () => {
    it('should create expense instance from object', () => {
      const obj = {
        id: 'test-id-456',
        name: 'Coffee Meeting',
        amount: 120000,
        date: '2025-04-10',
        payer: 'Nhật',
        participants: ['Nhật', 'Trung', 'Quang'],
        equalSplit: false,
        splits: {
          'Nhật': 40000,
          'Trung': 40000,
          'Quang': 40000
        }
      };
      
      const expense = Expense.fromObject(obj);
      
      expect(expense).toBeInstanceOf(Expense);
      expect(expense.id).toBe('test-id-456');
      expect(expense.name).toBe('Coffee Meeting');
      expect(expense.amount).toBe(120000);
      expect(expense.payer).toBe('Nhật');
      expect(expense.equalSplit).toBe(false);
      expect(expense.splits).toEqual({
        'Nhật': 40000,
        'Trung': 40000,
        'Quang': 40000
      });
    });
  });
}); 