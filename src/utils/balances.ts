import type { Expense } from "../types";

export function computeBalances(
  members: string[],
  expenses: Expense[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const member of members) {
    balances[member] = 0;
  }

  for (const expense of expenses) {
    balances[expense.paidBy] += expense.amount;

    for (const [member, owed] of Object.entries(expense.participants)) {
      balances[member] -= owed;
    }
  }

  return balances;
}
