import type { Expense } from "../types";

/**
 * Computes the net balance for each member based on the group's expenses.
 * A positive balance means the member is owed money.
 * A negative balance means the member owes money.
 * All values are in cents (integers).
 */
export function computeBalances(
  members: string[],
  expenses: Expense[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const member of members) {
    balances[member] = 0;
  }

  for (const expense of expenses) {
    const n = expense.participants.length;
    const baseShare = Math.floor(expense.amount / n);
    const remainder = expense.amount - baseShare * n;

    // The payer gets credited the full amount
    balances[expense.paidBy] += expense.amount;

    // Each participant gets debited their share;
    // the first `remainder` participants pay 1 extra cent
    for (let i = 0; i < n; i++) {
      balances[expense.participants[i]] -= baseShare + (i < remainder ? 1 : 0);
    }
  }

  return balances;
}
