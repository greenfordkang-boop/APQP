import { describe, it, expect } from 'vitest';
import { formatDate, addDays, getDelayStatus } from '../utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate('2025-03-15');
      expect(result).toMatch(/2025/);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2025-01-01');
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(11);
    });
  });

  describe('getDelayStatus', () => {
    it('should detect delayed status', () => {
      const result = getDelayStatus('2025-01-01', '2025-01-10');
      expect(result).toBe('delayed');
    });

    it('should detect on-track status', () => {
      const result = getDelayStatus('2025-01-10', '2025-01-05');
      expect(result).toBe('on-time');
    });
  });
});
