# SplitMate

A Splitwise-inspired expense splitting app built with React, TypeScript, and Tailwind CSS. Created as a workshop boilerplate for students to extend with AI coding agents.

## Getting Started

- Install [Mise](https://mise.jdx.dev/installing-mise.html)

- Boot the React App (port 5173) and the JSON API server (port 3001).

```bash
npm install
npm run start
```

### Individual commands

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run start` | Run app + API together   |
| `npm run dev`   | Run Vite dev server only |
| `npm run api`   | Run json-server only     |

## Current Features

- **Groups list** — View all expense groups with member counts, create new groups with a name and comma-separated members
- **Group detail** — View group members, list of expenses with description/amount/payer/split, and a form to add new expenses
- **Balance summary** — Computed net balances for each member (green = owed money, red = owes money), derived from expenses on the frontend
- **Cents-based arithmetic** — All money values stored and computed as integers (cents) to avoid floating-point errors

## Project Structure

```
src/
├── api.ts                  # All API calls (fetch wrappers)
├── types.ts                # TypeScript interfaces (Group, Expense)
├── utils/
│   └── balances.ts         # Pure function: computeBalances(members, expenses)
├── components/
│   ├── GroupList.tsx        # Groups list screen
│   ├── GroupDetail.tsx      # Group detail screen
│   ├── ExpenseForm.tsx      # Add expense form
│   └── BalanceList.tsx      # Balance summary display
├── App.tsx                 # Root component with screen navigation
└── main.tsx                # Entry point
db.json                     # Seed data for json-server
```

## Features to Implement

Pick one and build it:

- **Custom expense splitting** — Allow expenses to be split unevenly (by percentage or exact amounts) instead of always equally among all members
- **Expense categories** — Add categories (food, transport, accommodation, etc.) to expenses with color-coded labels and filtering
- **Settle up algorithm** — Compute the minimum number of payments needed to settle all debts and display them as a clear list of "X pays Y €Z"
- **Expense search and filter** — Add a search bar and filters (by payer, by date range, by amount) to the expense list
- **Expense comments** — Allow members to add comments/notes to individual expenses, stored as a nested resource in the API
