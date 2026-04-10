import { describe, it, expect } from 'vitest';
import { computeBalances } from './balances';
import type { Expense } from '../types';

describe('computeBalances', () => {
  const members = ['Ana', 'Bruno', 'Carlos'];

  it('returns zero balances with no expenses', () => {
    const result = computeBalances(members, []);
    expect(result).toEqual({ Ana: 0, Bruno: 0, Carlos: 0 });
  });

  it('credits payer and debits participants', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Dinner',
        amount: 3000,
        paidBy: 'Ana',
        splitType: 'equal',
        participants: { Ana: 1000, Bruno: 1000, Carlos: 1000 },
      },
    ];
    const result = computeBalances(members, expenses);
    expect(result).toEqual({ Ana: 2000, Bruno: -1000, Carlos: -1000 });
  });

  it('handles non-equal splits', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Dinner',
        amount: 3000,
        paidBy: 'Ana',
        splitType: 'exact',
        participants: { Ana: 1500, Bruno: 900, Carlos: 600 },
      },
    ];
    const result = computeBalances(members, expenses);
    expect(result).toEqual({ Ana: 1500, Bruno: -900, Carlos: -600 });
  });

  it('accumulates multiple expenses', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Dinner',
        amount: 3000,
        paidBy: 'Ana',
        splitType: 'equal',
        participants: { Ana: 1000, Bruno: 1000, Carlos: 1000 },
      },
      {
        id: '2',
        groupId: 'g1',
        description: 'Taxi',
        amount: 1500,
        paidBy: 'Bruno',
        splitType: 'equal',
        participants: { Ana: 500, Bruno: 500, Carlos: 500 },
      },
    ];
    const result = computeBalances(members, expenses);
    expect(result).toEqual({ Ana: 1500, Bruno: 0, Carlos: -1500 });
  });

  it('handles expense where payer is not a participant', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        groupId: 'g1',
        description: 'Gift',
        amount: 2000,
        paidBy: 'Ana',
        splitType: 'equal',
        participants: { Bruno: 1000, Carlos: 1000 },
      },
    ];
    const result = computeBalances(members, expenses);
    expect(result).toEqual({ Ana: 2000, Bruno: -1000, Carlos: -1000 });
  });
});
