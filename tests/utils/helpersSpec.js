import { 
  generateId, 
  formatCurrency, 
  formatAmountInput, 
  parseFormattedAmount, 
  formatDisplayDate, 
  getTodayDateString 
} from '../../js/utils/helpers.js';

describe('Helper Utilities', () => {
  describe('generateId()', () => {
    it('should generate a unique ID string', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(5);
      expect(id1).not.toEqual(id2); // IDs should be unique
    });
    
    it('should start with underscore', () => {
      const id = generateId();
      expect(id.charAt(0)).toBe('_');
    });
  });
  
  describe('formatCurrency()', () => {
    it('should format numeric values as Vietnamese currency', () => {
      expect(formatCurrency(1000000)).toMatch(/1.000.000/); // Format may vary based on browser locale
      expect(formatCurrency(1000000)).toMatch(/VND|₫/); // Should include currency symbol
    });
    
    it('should handle zero properly', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/0|0,00/);
      expect(result).toMatch(/VND|₫/);
    });
    
    it('should handle negative values', () => {
      const result = formatCurrency(-50000);
      expect(result).toMatch(/-50.000/);
      expect(result).toMatch(/VND|₫/);
    });
  });
  
  describe('formatAmountInput()', () => {
    it('should format numbers with thousands separators', () => {
      expect(formatAmountInput('1000000')).toBe('1.000.000');
      expect(formatAmountInput('25000')).toBe('25.000');
    });
    
    it('should remove non-numeric characters', () => {
      expect(formatAmountInput('abc123def')).toBe('123');
      expect(formatAmountInput('50,000 VND')).toBe('50.000');
    });
    
    it('should return empty string for non-numeric input', () => {
      expect(formatAmountInput('abc')).toBe('');
      expect(formatAmountInput('')).toBe('');
    });
  });
  
  describe('parseFormattedAmount()', () => {
    it('should convert formatted strings to numbers', () => {
      expect(parseFormattedAmount('1.000.000')).toBe(1000000);
      expect(parseFormattedAmount('50.000 VNĐ')).toBe(50000);
    });
    
    it('should handle strings with various separators', () => {
      expect(parseFormattedAmount('1,000,000')).toBe(1000000);
      expect(parseFormattedAmount('1 000 000')).toBe(1000000);
    });
    
    it('should return 0 for invalid input', () => {
      expect(parseFormattedAmount('abc')).toBe(0);
      expect(parseFormattedAmount('')).toBe(0);
    });
  });
  
  describe('formatDisplayDate()', () => {
    it('should convert ISO dates to display format', () => {
      expect(formatDisplayDate('2025-04-11')).toBe('11/04/2025');
      expect(formatDisplayDate('2024-12-31')).toBe('31/12/2024');
    });
    
    it('should return empty string for empty input', () => {
      expect(formatDisplayDate('')).toBe('');
      expect(formatDisplayDate(null)).toBe('');
    });
    
    it('should return original string for invalid format', () => {
      expect(formatDisplayDate('not-a-date')).toBe('not-a-date');
      expect(formatDisplayDate('2025/04/11')).toBe('2025/04/11');
    });
  });
  
  describe('getTodayDateString()', () => {
    it('should return today\'s date in ISO format', () => {
      // Mock the Date object
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new originalDate('2025-04-11T10:00:00Z');
        }
      };
      
      expect(getTodayDateString()).toBe('2025-04-11');
      
      // Restore the original Date object
      global.Date = originalDate;
    });
    
    it('should return a string in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      
      // Check that it's in the expected format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
}); 