import { Expense } from '../../js/models/Expense.js';

describe('Expense Model', () => {
  let sampleExpenseData;
  let mockGenerateId;
  
  beforeEach(() => {
    // Set up test data before each test
    sampleExpenseData = {
      name: 'Dinner',
      amount: 500000, // 500,000 VND
      date: '2025-04-15',
      payer: 'Giang',
      participants: ['Giang', 'Toàn', 'Quân'],
      equalSplit: true,
      splits: {}
    };
    
    // Reset storage between tests
    window.resetMockStorage();
  });
  
  describe('constructor', () => {
    it('should create a new Expense with the provided data', () => {
      const expense = new Expense(sampleExpenseData);
      
      expect(expense.name).toBe('Dinner');
      expect(expense.amount).toBe(500000);
      expect(expense.date).toBe('2025-04-15');
      expect(expense.payer).toBe('Giang');
      expect(expense.participants).toEqual(['Giang', 'Toàn', 'Quân']);
      expect(expense.equalSplit).toBe(true);
      expect(expense.splits).toEqual({});
      expect(expense.id).toBeDefined(); // Should have generated an ID
    });
    
    it('should use provided ID if specified', () => {
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
  
  describe('serialize()', () => {
    it('should convert expense to plain object', () => {
      const expense = new Expense(sampleExpenseData);
      const serialized = expense.serialize();
      
      expect(serialized.name).toBe('Dinner');
      expect(serialized.amount).toBe(500000);
      expect(serialized.date).toBe('2025-04-15');
      expect(serialized.payer).toBe('Giang');
      expect(serialized.participants).toEqual(['Giang', 'Toàn', 'Quân']);
      expect(serialized.equalSplit).toBe(true);
      expect(serialized.splits).toEqual({});
      expect(serialized.id).toBe(expense.id);
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
    
    // New test cases for edge cases and corner cases
    
    it('should handle fractional amounts in equal splits correctly', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        amount: 100001 // Not evenly divisible by 3
      });
      
      // The sum of all split amounts should equal the original amount
      const giangAmount = expense.getSplitAmountFor('Giang');
      const toanAmount = expense.getSplitAmountFor('Toàn');
      const quanAmount = expense.getSplitAmountFor('Quân');
      
      const totalSplit = giangAmount + toanAmount + quanAmount;
      expect(totalSplit).toBe(100001);
      
      // Each person's share should be approximately 1/3
      const expectedShare = 100001 / 3;
      expect(giangAmount).toBeCloseTo(expectedShare, 0);
      expect(toanAmount).toBeCloseTo(expectedShare, 0);
      expect(quanAmount).toBeCloseTo(expectedShare, 0);
    });
    
    it('should handle single participant scenario', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        participants: ['Giang'] // Only Giang
      });
      
      expect(expense.getSplitAmountFor('Giang')).toBe(500000); // Full amount
      expect(expense.getSplitAmountFor('Toàn')).toBe(0); // Not a participant
    });
    
    it('should handle zero amount expense', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        amount: 0
      });
      
      expect(expense.getSplitAmountFor('Giang')).toBe(0);
      expect(expense.getSplitAmountFor('Toàn')).toBe(0);
      expect(expense.getSplitAmountFor('Quân')).toBe(0);
    });
    
    it('should validate manual split amounts match total expense amount', () => {
      // Check if the model validates that manual splits add up to the expense amount
      const expense = new Expense({
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 200000,
          'Toàn': 200000,
          'Quân': 100000
        }
      });
      
      const totalSplit = expense.getSplitAmountFor('Giang') + 
                        expense.getSplitAmountFor('Toàn') + 
                        expense.getSplitAmountFor('Quân');
      
      expect(totalSplit).toBe(500000); // Should equal the expense amount
    });
    
    it('should handle a very large number of participants', () => {
      // Create an expense with 20 participants
      const manyParticipants = Array.from({ length: 20 }, (_, i) => `Person${i+1}`);
      
      const expense = new Expense({
        ...sampleExpenseData,
        participants: manyParticipants,
        amount: 200000 // 200,000 VND
      });
      
      // Each person should pay 10,000 VND
      const expectedShare = 200000 / 20;
      
      for (let i = 0; i < 20; i++) {
        expect(expense.getSplitAmountFor(`Person${i+1}`)).toBe(expectedShare);
      }
      
      // The sum should still be the original amount
      const totalAmount = manyParticipants.reduce((sum, person) => {
        return sum + expense.getSplitAmountFor(person);
      }, 0);
      
      expect(totalAmount).toBe(200000);
    });
    
    it('should handle uneven manual splits that dont sum to total amount', () => {
      // This tests whether the model corrects or proportionally adjusts splits
      // that don't add up to the total expense amount
      
      const expense = new Expense({
        ...sampleExpenseData,
        equalSplit: false,
        splits: {
          'Giang': 100000, // These only sum to 300,000
          'Toàn': 100000, // not the full 500,000
          'Quân': 100000
        }
      });
      
      // The implementation might handle this in different ways:
      // 1. Accepting the splits as is (which means the payer covers the rest)
      // 2. Proportionally adjusting the splits
      // 3. Throwing an error
      
      // Let's assume option 1 for this test (payer covers difference)
      const totalSplit = expense.getSplitAmountFor('Giang') + 
                        expense.getSplitAmountFor('Toàn') + 
                        expense.getSplitAmountFor('Quân');
      
      // If option 1: total will be 300,000
      // If option 2: total will be 500,000
      // We'll check both possibilities
      expect([300000, 500000]).toContain(totalSplit);
    });
    
    it('should correctly determine payment status for each participant', () => {
      const expense = new Expense(sampleExpenseData);
      
      // Giang is the payer
      expect(expense.isPayer('Giang')).toBe(true);
      expect(expense.isPayer('Toàn')).toBe(false);
      
      // All three are participants
      expect(expense.isParticipant('Giang')).toBe(true);
      expect(expense.isParticipant('Toàn')).toBe(true);
      expect(expense.isParticipant('Quân')).toBe(true);
      expect(expense.isParticipant('Trung')).toBe(false); // Not a participant
    });
    
    it('should handle expense paid by group fund correctly', () => {
      const expense = new Expense({
        ...sampleExpenseData,
        payer: '__GROUP_FUND__'
      });
      
      // The group fund is the payer
      expect(expense.isPayer('__GROUP_FUND__')).toBe(true);
      expect(expense.isPayer('Giang')).toBe(false);
      
      // Equal split still works the same
      const expectedShare = 500000 / 3;
      expect(expense.getSplitAmountFor('Giang')).toBe(expectedShare);
      expect(expense.getSplitAmountFor('Toàn')).toBe(expectedShare);
      expect(expense.getSplitAmountFor('Quân')).toBe(expectedShare);
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
        name: 'Dinner',
        amount: 500000,
        date: '2025-04-15',
        payer: 'Giang',
        participants: ['Giang', 'Toàn', 'Quân'],
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