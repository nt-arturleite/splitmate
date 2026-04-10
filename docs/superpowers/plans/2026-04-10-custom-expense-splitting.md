# Custom Expense Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support four split types (equal, exact, percentage, shares) when creating expenses, resolving all splits to cent amounts at creation time.

**Architecture:** The `participants` field changes from `string[]` to `Record<string, number>` (member → cents owed). A new `resolveSplit()` utility handles all split math. The form adds a split type selector and per-type input fields. `computeBalances()` simplifies to just reading the pre-resolved amounts.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vite 8, json-server, Vitest (new)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/types.ts` | Modify | Add `SplitType`, update `Expense.participants` to `Record<string, number>` |
| `src/utils/splits.ts` | Create | `resolveSplit()` — all split resolution math |
| `src/utils/splits.test.ts` | Create | Tests for `resolveSplit()` |
| `src/utils/balances.ts` | Modify | Simplify `computeBalances()` to read pre-resolved amounts |
| `src/utils/balances.test.ts` | Create | Tests for updated `computeBalances()` |
| `src/components/ExpenseForm.tsx` | Modify | Add split type selector and per-type input fields |
| `src/components/GroupDetail.tsx` | Modify | Update expense display for non-equal splits |
| `db.json` | Modify | Migrate existing expenses to new format |
| `vite.config.ts` | Modify | Add vitest config |
| `package.json` | Modify | Add vitest dev dependency |

---

### Task 1: Set Up Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install vitest**

Run:
```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add vitest config to vite.config.ts**

Current `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Replace the import and add a `test` block:
```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
  },
})
```

- [ ] **Step 4: Verify vitest runs (no tests yet, should exit cleanly)**

Run:
```bash
npm test
```
Expected: exits with "no test files found" or similar clean output.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: set up vitest for unit testing"
```

---

### Task 2: Update Types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Update `src/types.ts`**

Replace the entire file content with:

```typescript
export interface Group {
  id: string;
  name: string;
  members: string[];
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number; // in cents
  paidBy: string;
  splitType: SplitType;
  participants: Record<string, number>; // member name → owed amount in cents
}
```

- [ ] **Step 2: Verify the project compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: Type errors in `balances.ts`, `ExpenseForm.tsx`, and `GroupDetail.tsx` because they still use `participants` as `string[]`. This is expected — we fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: update Expense type with splitType and Record participants"
```

---

### Task 3: Implement `resolveSplit()` with Tests

**Files:**
- Create: `src/utils/splits.ts`
- Create: `src/utils/splits.test.ts`

- [ ] **Step 1: Write failing tests for `resolveSplit()`**

Create `src/utils/splits.test.ts`:

```typescript
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
      // 1000 / 3 = 333 base, remainder 1
      expect(result).toEqual({ Ana: 334, Bruno: 333, Carlos: 333 });
    });

    it('handles remainder of 2 with 3 participants', () => {
      const result = resolveSplit('equal', 1001, members);
      // 1001 / 3 = 333 base, remainder 2
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
      // 33.33% each of 1000 = 333.3 cents each
      const input = { Ana: 34, Bruno: 33, Carlos: 33 };
      const result = resolveSplit('percentage', 1000, members, input);
      // Ana: floor(1000*34/100) = 340, Bruno: floor(1000*33/100) = 330, Carlos: 330
      // sum = 1000, no remainder
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
      // 3 shares, 1000 cents: 1000/3 = 333 per share
      // Ana (2 shares): floor(1000*2/3) = 666
      // Bruno (1 share): floor(1000*1/3) = 333
      // sum = 999, remainder = 1
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test
```
Expected: FAIL — `Cannot find module './splits'`

- [ ] **Step 3: Implement `resolveSplit()`**

Create `src/utils/splits.ts`:

```typescript
import type { SplitType } from '../types';

export function resolveSplit(
  splitType: SplitType,
  amount: number,
  members: string[],
  input?: Record<string, number>,
): Record<string, number> {
  switch (splitType) {
    case 'equal':
      return resolveEqual(amount, members);
    case 'exact':
      return resolveExact(amount, members, input!);
    case 'percentage':
      return resolvePercentage(amount, members, input!);
    case 'shares':
      return resolveShares(amount, members, input!);
  }
}

function resolveEqual(amount: number, members: string[]): Record<string, number> {
  const n = members.length;
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;
  const result: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    result[members[i]] = base + (i < remainder ? 1 : 0);
  }
  return result;
}

function resolveExact(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const sum = members.reduce((acc, m) => acc + input[m], 0);
  if (sum !== amount) {
    throw new Error('Exact amounts must sum to the expense total');
  }
  const result: Record<string, number> = {};
  for (const m of members) {
    result[m] = input[m];
  }
  return result;
}

function resolvePercentage(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const totalPct = members.reduce((acc, m) => acc + input[m], 0);
  if (totalPct !== 100) {
    throw new Error('Percentages must sum to 100');
  }
  const result: Record<string, number> = {};
  let allocated = 0;
  for (let i = 0; i < members.length; i++) {
    if (i === members.length - 1) {
      result[members[i]] = amount - allocated;
    } else {
      const cents = Math.floor(amount * input[members[i]] / 100);
      result[members[i]] = cents;
      allocated += cents;
    }
  }
  return result;
}

function resolveShares(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const totalShares = members.reduce((acc, m) => acc + input[m], 0);
  const result: Record<string, number> = {};
  let allocated = 0;
  for (let i = 0; i < members.length; i++) {
    if (i === members.length - 1) {
      result[members[i]] = amount - allocated;
    } else {
      const cents = Math.floor(amount * input[members[i]] / totalShares);
      result[members[i]] = cents;
      allocated += cents;
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/splits.ts src/utils/splits.test.ts
git commit -m "feat: add resolveSplit utility with tests for all split types"
```

---

### Task 4: Update `computeBalances()` with Tests

**Files:**
- Modify: `src/utils/balances.ts`
- Create: `src/utils/balances.test.ts`

- [ ] **Step 1: Write tests for updated `computeBalances()`**

Create `src/utils/balances.test.ts`:

```typescript
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
    // Ana paid 3000, owes 1000 → net +2000
    // Bruno paid 0, owes 1000 → net -1000
    // Carlos paid 0, owes 1000 → net -1000
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
    // Ana paid 3000, owes 1500 → net +1500
    // Bruno paid 0, owes 900 → net -900
    // Carlos paid 0, owes 600 → net -600
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
    // Ana: +3000 - 1000 - 500 = +1500
    // Bruno: +1500 - 1000 - 500 = 0
    // Carlos: -1000 - 500 = -1500
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
    // Ana: +2000 (paid, not a participant)
    // Bruno: -1000
    // Carlos: -1000
    expect(result).toEqual({ Ana: 2000, Bruno: -1000, Carlos: -1000 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test
```
Expected: FAIL — the current `computeBalances` uses `participants.length` and array indexing, which won't work with `Record<string, number>`.

- [ ] **Step 3: Update `computeBalances()` in `src/utils/balances.ts`**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/balances.ts src/utils/balances.test.ts
git commit -m "feat: simplify computeBalances to use pre-resolved participant amounts"
```

---

### Task 5: Migrate `db.json`

**Files:**
- Modify: `db.json`

- [ ] **Step 1: Migrate all expenses in `db.json`**

For each expense, convert `participants` from `string[]` to `Record<string, number>` with equal-split amounts, and add `splitType: "equal"`. The formula for each participant's amount: `Math.floor(expense.amount / n)`, with remainder distributed to first participants.

Replace the entire `db.json` with:

```json
{
  "groups": [
    {
      "id": "lisbon-trip",
      "name": "Lisbon Trip",
      "members": ["Ana", "Bruno", "Carlos", "Diana"]
    },
    {
      "id": "flatmates",
      "name": "Flatmates",
      "members": ["Bruno", "Eva", "Carlos"]
    }
  ],
  "expenses": [
    {
      "id": "exp-1",
      "groupId": "lisbon-trip",
      "description": "Dinner at Alfama",
      "amount": 6000,
      "paidBy": "Ana",
      "splitType": "equal",
      "participants": { "Ana": 1500, "Bruno": 1500, "Carlos": 1500, "Diana": 1500 }
    },
    {
      "id": "exp-2",
      "groupId": "lisbon-trip",
      "description": "Taxi to hotel",
      "amount": 3200,
      "paidBy": "Bruno",
      "splitType": "equal",
      "participants": { "Ana": 800, "Bruno": 800, "Carlos": 800, "Diana": 800 }
    },
    {
      "id": "exp-3",
      "groupId": "lisbon-trip",
      "description": "Museum tickets",
      "amount": 4800,
      "paidBy": "Carlos",
      "splitType": "equal",
      "participants": { "Ana": 1200, "Bruno": 1200, "Carlos": 1200, "Diana": 1200 }
    },
    {
      "id": "exp-4",
      "groupId": "flatmates",
      "description": "Groceries",
      "amount": 8700,
      "paidBy": "Eva",
      "splitType": "equal",
      "participants": { "Bruno": 2900, "Eva": 2900, "Carlos": 2900 }
    },
    {
      "id": "exp-5",
      "groupId": "flatmates",
      "description": "Electricity bill",
      "amount": 4500,
      "paidBy": "Bruno",
      "splitType": "equal",
      "participants": { "Bruno": 1500, "Eva": 1500, "Carlos": 1500 }
    },
    {
      "groupId": "flatmates",
      "description": "Teste",
      "amount": 2000,
      "paidBy": "Carlos",
      "splitType": "equal",
      "participants": { "Bruno": 667, "Eva": 667, "Carlos": 666 },
      "id": "6k8uiVe5_04"
    },
    {
      "groupId": "flatmates",
      "description": "Settle Carlos",
      "amount": 3066,
      "paidBy": "Carlos",
      "splitType": "equal",
      "participants": { "Eva": 3066 },
      "id": "e1GS9ryFN7w"
    },
    {
      "groupId": "lisbon-trip",
      "description": "Settle Bruno",
      "amount": 300,
      "paidBy": "Bruno",
      "splitType": "equal",
      "participants": { "Carlos": 300 },
      "id": "VY01N2Hpj2Q"
    },
    {
      "groupId": "lisbon-trip",
      "description": "Diana Settle with Ana",
      "amount": 2500,
      "paidBy": "Diana",
      "splitType": "equal",
      "participants": { "Ana": 2500 },
      "id": "y83fuPDPnRY"
    },
    {
      "groupId": "lisbon-trip",
      "description": "Diana Settle",
      "amount": 1000,
      "paidBy": "Diana",
      "splitType": "equal",
      "participants": { "Carlos": 1000 },
      "id": "a-mxe9-bL7o"
    },
    {
      "groupId": "lisbon-trip",
      "description": "Bruno expense",
      "amount": 1000,
      "paidBy": "Ana",
      "splitType": "equal",
      "participants": { "Bruno": 1000 },
      "id": "xcGTCB3ieHc"
    },
    {
      "groupId": "flatmates",
      "description": "cneas",
      "amount": 2000,
      "paidBy": "Eva",
      "splitType": "equal",
      "participants": { "Carlos": 667, "Bruno": 667, "Eva": 666 },
      "id": "SuthL4rO0NY"
    }
  ],
  "$schema": "./node_modules/json-server/schema.json"
}
```

- [ ] **Step 2: Verify json-server still serves the data**

Run:
```bash
npx json-server --watch db.json --port 3001 &
sleep 1
curl -s http://localhost:3001/expenses | head -30
kill %1
```
Expected: JSON response with the migrated expenses showing `participants` as objects and `splitType` fields.

- [ ] **Step 3: Commit**

```bash
git add db.json
git commit -m "chore: migrate db.json expenses to Record participants with splitType"
```

---

### Task 6: Update `ExpenseForm.tsx` — Split Type Selector and Form Logic

**Files:**
- Modify: `src/components/ExpenseForm.tsx`

- [ ] **Step 1: Rewrite `ExpenseForm.tsx`**

Replace the entire file with:

```tsx
import { useState, useEffect } from "react";
import type { Expense, SplitType } from "../types";
import { createExpense } from "../api";
import { resolveSplit } from "../utils/splits";

interface ExpenseFormProps {
  groupId: string;
  members: string[];
  onExpenseAdded: (expense: Expense) => void;
}

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: 'equal', label: 'Equal' },
  { value: 'exact', label: 'Exact' },
  { value: 'percentage', label: '%' },
  { value: 'shares', label: 'Shares' },
];

export default function ExpenseForm({
  groupId,
  members,
  onExpenseAdded,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paidBy, setPaidBy] = useState(members[0] ?? "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splitInputs, setSplitInputs] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const resetSplitInputs = (memberList: string[], type: SplitType) => {
    const defaults: Record<string, string> = {};
    for (const m of memberList) {
      if (type === 'shares') {
        defaults[m] = '1';
      } else {
        defaults[m] = '';
      }
    }
    setSplitInputs(defaults);
  };

  const amountCents = Math.round(parseFloat(amountInput) * 100);
  const validAmount = !isNaN(amountCents) && amountCents > 0;

  const getSplitValidation = (): { valid: boolean; message: string } => {
    if (!validAmount || selectedMembers.length === 0) {
      return { valid: false, message: '' };
    }

    if (splitType === 'equal') {
      return { valid: true, message: '' };
    }

    if (splitType === 'exact') {
      const sum = selectedMembers.reduce((acc, m) => {
        const val = Math.round(parseFloat(splitInputs[m] || '0') * 100);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const remaining = amountCents - sum;
      if (remaining === 0) return { valid: true, message: '' };
      return {
        valid: false,
        message: `Remaining: €${(remaining / 100).toFixed(2)}`,
      };
    }

    if (splitType === 'percentage') {
      const sum = selectedMembers.reduce((acc, m) => {
        const val = parseFloat(splitInputs[m] || '0');
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const remaining = 100 - sum;
      if (remaining === 0) return { valid: true, message: '' };
      return {
        valid: false,
        message: `Remaining: ${remaining.toFixed(1)}%`,
      };
    }

    // shares — always valid as long as at least one share > 0
    const hasShares = selectedMembers.some(
      (m) => parseInt(splitInputs[m] || '0') > 0
    );
    return { valid: hasShares, message: '' };
  };

  const buildSplitInput = (): Record<string, number> | undefined => {
    if (splitType === 'equal') return undefined;

    const input: Record<string, number> = {};
    for (const m of selectedMembers) {
      if (splitType === 'exact') {
        input[m] = Math.round(parseFloat(splitInputs[m] || '0') * 100);
      } else if (splitType === 'percentage') {
        input[m] = parseFloat(splitInputs[m] || '0');
      } else {
        input[m] = parseInt(splitInputs[m] || '1');
      }
    }
    return input;
  };

  const getPerPersonAmount = (member: string): number | null => {
    if (splitType !== 'shares' || !validAmount) return null;
    const totalShares = selectedMembers.reduce(
      (acc, m) => acc + parseInt(splitInputs[m] || '1'),
      0,
    );
    if (totalShares === 0) return null;
    const memberShares = parseInt(splitInputs[member] || '1');
    return Math.floor(amountCents * memberShares / totalShares);
  };

  const validation = getSplitValidation();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (
      !description.trim() ||
      !validAmount ||
      selectedMembers.length === 0 ||
      !validation.valid
    )
      return;

    const participants = resolveSplit(
      splitType,
      amountCents,
      selectedMembers,
      buildSplitInput(),
    );

    const expense = await createExpense({
      groupId,
      description: description.trim(),
      amount: amountCents,
      paidBy,
      splitType,
      participants,
    });

    onExpenseAdded(expense);
    setShowToast(true);
    setDescription("");
    setAmountInput("");
    setPaidBy(members[0] ?? "");
    setSelectedMembers(members);
    setSplitType('equal');
    setSplitInputs({});
  };

  const toggleParticipant = (member: string) => {
    if (member === paidBy) return;
    setSelectedMembers((prev) => {
      const next = prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member];
      if (splitType !== 'equal') {
        resetSplitInputs(next, splitType);
      }
      return next;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
    >
      {showToast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2.5 rounded-lg">
          Expense added!
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Add Expense
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner at the restaurant"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid by
            </label>
            <select
              value={paidBy}
              onChange={(e) => {
                const newPayer = e.target.value;
                setPaidBy(newPayer);
                setSelectedMembers((prev) =>
                  prev.includes(newPayer) ? prev : [...prev, newPayer]
                );
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal bg-white"
            >
              {members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split between
          </label>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <button
                key={member}
                type="button"
                onClick={() => toggleParticipant(member)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  member === paidBy
                    ? "bg-teal text-white border-teal opacity-75 cursor-default"
                    : selectedMembers.includes(member)
                      ? "bg-teal text-white border-teal cursor-pointer"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400 cursor-pointer"
                }`}
              >
                {member}
              </button>
            ))}
          </div>
        </div>

        {/* Split type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split type
          </label>
          <div className="flex gap-2">
            {SPLIT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSplitType(value);
                  resetSplitInputs(selectedMembers, value);
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  splitType === value
                    ? "bg-teal text-white border-teal"
                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-member split inputs (not shown for equal) */}
        {splitType !== 'equal' && selectedMembers.length > 0 && (
          <div className="space-y-2">
            {selectedMembers.map((member) => (
              <div key={member} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-24 truncate">
                  {member}
                </span>
                <input
                  type="number"
                  step={splitType === 'shares' ? '1' : '0.01'}
                  min={splitType === 'shares' ? '0' : '0'}
                  value={splitInputs[member] ?? ''}
                  onChange={(e) =>
                    setSplitInputs((prev) => ({
                      ...prev,
                      [member]: e.target.value,
                    }))
                  }
                  placeholder={
                    splitType === 'exact'
                      ? '0.00'
                      : splitType === 'percentage'
                        ? '0'
                        : '1'
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                />
                <span className="text-xs text-gray-400 w-16 text-right">
                  {splitType === 'exact' && '€'}
                  {splitType === 'percentage' && '%'}
                  {splitType === 'shares' &&
                    getPerPersonAmount(member) !== null &&
                    `€${(getPerPersonAmount(member)! / 100).toFixed(2)}`}
                </span>
              </div>
            ))}
            {validation.message && (
              <p
                className={`text-xs font-medium ${
                  validation.valid ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {validation.message}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="bg-teal hover:bg-teal-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify the project compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: Only remaining errors should be in `GroupDetail.tsx` (fixed in next task).

- [ ] **Step 3: Commit**

```bash
git add src/components/ExpenseForm.tsx
git commit -m "feat: add split type selector and per-type inputs to ExpenseForm"
```

---

### Task 7: Update `GroupDetail.tsx` — Expense Display

**Files:**
- Modify: `src/components/GroupDetail.tsx`

- [ ] **Step 1: Update expense display in `GroupDetail.tsx`**

Replace lines 65-96 (the `expenses.map` block inside the `<ul>`) with:

```tsx
{expenses.map((expense) => {
  const participantNames = Object.keys(expense.participants);
  const isEqual = expense.splitType === 'equal' || !expense.splitType;
  const perPerson = isEqual
    ? Math.floor(expense.amount / participantNames.length)
    : null;

  return (
    <li
      key={expense.id}
      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium text-gray-900">
          {expense.description}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Paid by{" "}
          <span className="font-medium text-gray-700">
            {expense.paidBy}
          </span>{" "}
          ·{" "}
          {perPerson !== null
            ? `€${formatCents(perPerson)} / person`
            : expense.splitType === 'percentage'
              ? 'Split by %'
              : expense.splitType === 'shares'
                ? 'Split by shares'
                : 'Custom split'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Split: {participantNames.join(", ")}
        </p>
      </div>
      <span className="text-sm font-semibold text-gray-900">
        €{formatCents(expense.amount)}
      </span>
    </li>
  );
})}
```

- [ ] **Step 2: Verify the project compiles cleanly**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Run all tests**

Run:
```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/GroupDetail.tsx
git commit -m "feat: update expense display for non-equal split types"
```

---

### Task 8: Manual Smoke Test

- [ ] **Step 1: Start the app**

Run:
```bash
npm start
```

- [ ] **Step 2: Test equal split (existing behavior)**

1. Open `http://localhost:5173` in the browser
2. Click on "Lisbon Trip" group
3. Add an expense: description "Test equal", amount 10.00, paid by Ana, all 4 members selected, split type "Equal"
4. Verify the expense appears with "€2.50 / person"
5. Verify balances update correctly

- [ ] **Step 3: Test exact split**

1. Add expense: "Test exact", amount 30.00, paid by Bruno
2. Select split type "Exact"
3. Enter: Ana: 15.00, Bruno: 9.00, Carlos: 3.00, Diana: 3.00
4. Verify "Remaining" shows €0.00 and submit works
5. Verify expense appears with "Custom split" label

- [ ] **Step 4: Test percentage split**

1. Add expense: "Test percentage", amount 100.00, paid by Carlos
2. Select split type "%"
3. Enter: Ana: 40, Bruno: 30, Carlos: 20, Diana: 10
4. Verify "Remaining" shows 0.0% and submit works
5. Verify expense appears with "Split by %" label

- [ ] **Step 5: Test shares split**

1. Add expense: "Test shares", amount 120.00, paid by Diana
2. Select split type "Shares"
3. Enter: Ana: 2, Bruno: 1, Carlos: 1, Diana: 0
4. Verify per-person amounts show next to inputs (€60.00, €30.00, €30.00, €0.00)
5. Verify expense appears with "Split by shares" label

- [ ] **Step 6: Test validation**

1. Try submitting an exact split where amounts don't sum to total — should be blocked
2. Try submitting a percentage split where percentages don't sum to 100 — should be blocked
3. Toggle a participant off and verify their input disappears

- [ ] **Step 7: Commit any fixes if needed, then final commit**

```bash
git add -A
git commit -m "feat: custom expense splitting — complete implementation"
```
