import { describe, it, expect } from 'vitest';
import { resolveSplit } from './splits';

describe('resolveSplit', () => {
  const members = ['Ana', 'Bruno', 'Carlos'];

  describe('equal split', () => {
    it('splits evenly when divisible', () => {
      const result = resolveSplit('equal', 3000, members);
      expect(result).toEqual({ Ana: 1000, Bruno: 1000, Carlos: 1000 });
    });

    it('distributes remainder cents to first participants', () => {
      const result = resolveSplit('equal', 1000, members);
      expect(result).toEqual({ Ana: 334, Bruno: 333, Carlos: 333 });
    });

    it('handles remainder of 2 with 3 participants', () => {
      const result = resolveSplit('equal', 1001, members);
      expect(result).toEqual({ Ana: 334, Bruno: 334, Carlos: 333 });
    });

    it('works with a single participant', () => {
      const result = resolveSplit('equal', 5000, ['Ana']);
      expect(result).toEqual({ Ana: 5000 });
    });
  });

  describe('exact split', () => {
    it('passes through exact amounts', () => {
      const input = { Ana: 1500, Bruno: 900, Carlos: 600 };
      const result = resolveSplit('exact', 3000, members, input);
      expect(result).toEqual({ Ana: 1500, Bruno: 900, Carlos: 600 });
    });

    it('throws when amounts do not sum to total', () => {
      const input = { Ana: 1500, Bruno: 900, Carlos: 500 };
      expect(() => resolveSplit('exact', 3000, members, input)).toThrow(
        'Exact amounts must sum to the expense total'
      );
    });
  });

  describe('percentage split', () => {
    it('converts percentages to cents', () => {
      const input = { Ana: 50, Bruno: 30, Carlos: 20 };
      const result = resolveSplit('percentage', 3000, members, input);
      expect(result).toEqual({ Ana: 1500, Bruno: 900, Carlos: 600 });
    });

    it('distributes remainder cents on uneven percentages', () => {
      const input = { Ana: 34, Bruno: 33, Carlos: 33 };
      const result = resolveSplit('percentage', 1000, members, input);
      expect(result).toEqual({ Ana: 340, Bruno: 330, Carlos: 330 });
    });

    it('throws when percentages do not sum to 100', () => {
      const input = { Ana: 50, Bruno: 30, Carlos: 10 };
      expect(() => resolveSplit('percentage', 3000, members, input)).toThrow(
        'Percentages must sum to 100'
      );
    });
  });

  describe('shares split', () => {
    it('splits proportionally by shares', () => {
      const input = { Ana: 2, Bruno: 1, Carlos: 1 };
      const result = resolveSplit('shares', 4000, members, input);
      expect(result).toEqual({ Ana: 2000, Bruno: 1000, Carlos: 1000 });
    });

    it('distributes remainder cents on uneven share splits', () => {
      const input = { Ana: 2, Bruno: 1 };
      const result = resolveSplit('shares', 1000, ['Ana', 'Bruno'], input);
      const total = Object.values(result).reduce((a, b) => a + b, 0);
      expect(total).toBe(1000);
      expect(result).toEqual({ Ana: 667, Bruno: 333 });
    });

    it('handles equal shares same as equal split', () => {
      const input = { Ana: 1, Bruno: 1, Carlos: 1 };
      const result = resolveSplit('shares', 1000, members, input);
      expect(result).toEqual({ Ana: 334, Bruno: 333, Carlos: 333 });
    });
  });
});
