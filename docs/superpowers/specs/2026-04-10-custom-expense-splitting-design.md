# Custom Expense Splitting — Design Spec

## Overview

Add support for four split types when creating an expense: **equal**, **exact amounts**, **percentage**, and **shares/weights**. The form resolves all split types into final cent amounts before saving, keeping the data model and balance computation simple.

## Data Model

### Updated `Expense` type (`src/types.ts`)

```typescript
type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;                        // total in cents
  paidBy: string;
  splitType: SplitType;                  // defaults to 'equal'
  participants: Record<string, number>;  // member name → owed amount in cents
}
```

The `participants` field changes from `string[]` to `Record<string, number>`. Every split type is resolved to cent amounts at creation time. A `splitType` field is stored for display purposes.

### Examples (€30 expense)

| Split Type | User Input | Stored `participants` |
|---|---|---|
| Equal (3 people) | — | `{ "Ana": 1000, "Bruno": 1000, "Carlos": 1000 }` |
| Exact | Ana: €15, Bruno: €9, Carlos: €6 | `{ "Ana": 1500, "Bruno": 900, "Carlos": 600 }` |
| Percentage | 50%, 30%, 20% | `{ "Ana": 1500, "Bruno": 900, "Carlos": 600 }` |
| Shares | 2, 1, 1 | `{ "Ana": 1500, "Bruno": 750, "Carlos": 750 }` |

## Balance Computation

`computeBalances` in `src/utils/balances.ts` simplifies to:

1. Credit the payer: `balances[paidBy] += expense.amount`
2. Debit each participant: `balances[member] -= participants[member]`

No division or remainder logic — that moves to the split resolution step.

## Split Resolution Logic

A `resolveSplit()` utility function that the form calls before saving. Takes split type, total amount, participant list, and user input. Returns `Record<string, number>` (cents).

### Resolution rules per type

- **Equal**: `floor(amount / n)` per person. Remainder cents (amount % n) distributed one each to the first N participants.
- **Exact**: User enters amounts in euros, converted to cents. Validation: sum must equal expense total.
- **Percentage**: User enters percentages per person. Validation: sum must equal 100. Convert each to cents via `floor(amount * pct / 100)`, distribute remainder cents to first N participants by largest fractional part.
- **Shares**: User enters integer share counts per person. Compute `floor(amount * memberShares / totalShares)` per person, distribute remainder cents to first N participants.

## Expense Form UX (`src/components/ExpenseForm.tsx`)

### Split type selector

A row of 4 buttons below the "Split between" participant toggles:

- **Equal** (default) — current behavior, no extra inputs
- **Exact** — each selected participant gets an amount input (euros). Shows "Remaining: €X.XX" running total. Submit blocked if amounts don't sum to total.
- **%** — each selected participant gets a percentage input. Shows "Remaining: X%" running total. Submit blocked if percentages don't sum to 100%.
- **Shares** — each selected participant gets a numeric input (default 1). Shows resolved per-person amount next to each input. No validation beyond shares > 0.

### Existing behavior preserved

- Payer is auto-included in participants and cannot be toggled off.
- Toggling participants on/off updates the split inputs dynamically.
- Form resets after successful submission.

## Display Changes (`src/components/GroupDetail.tsx`)

In the expense list:

- **Equal splits**: Show "€X.XX each" (current behavior).
- **Non-equal splits**: Show the split type label (e.g., "Split by %" or "Split by shares") instead of a per-person amount.

## Migration (`db.json`)

All existing expenses are updated:

- `participants` converted from `string[]` to `Record<string, number>` with equal-split amounts pre-computed.
- `splitType: "equal"` added to each expense.

## Out of Scope

- Expense editing (no edit feature exists currently)
- Multiple payers per expense
- Adjustment split type
- Itemized/receipt splitting
- Debt simplification algorithm
- Recurring expenses
