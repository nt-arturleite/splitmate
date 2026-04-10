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

Pick one (or more!) and build it:

### Core Features
- **Custom expense splitting** — Allow expenses to be split unevenly (by percentage or exact amounts) instead of always equally among participants
- **Settle up algorithm** — Compute the minimum number of payments needed to settle all debts and display them as a clear list of "X pays Y €Z"
- **Delete / edit expenses** — Allow users to remove or modify existing expenses, with confirmation dialogs
- **Expense categories** — Add categories (food, transport, accommodation, etc.) to expenses with color-coded labels and filtering
-
### UI/UX Improvements
- **Expense search and filter** — Add a search bar and filters (by payer, by amount range, by participant) to the expense list
- **Dark mode** — Add a theme toggle with dark mode support using Tailwind's dark variant
- **Currency selector** — Let groups choose their currency (€, $, £) and format amounts accordingly
- **Responsive mobile layout** — Optimize the layout for mobile screens with a bottom navigation bar
- **Animations** — Add smooth transitions when adding/removing expenses or switching between views

### Social & Collaboration
- **Expense comments** — Allow members to add comments/notes to individual expenses, stored as a nested resource in the API
- **Activity feed** — Show a chronological log of all actions (expense added, member joined, settlement made)
- **Group invites** — Generate shareable invite links to join a group

### Data & Backend
- **Authentication** — Add simple login/signup (e.g. username + password) so each user has their own identity and can only edit their own expenses
- **Export to CSV** — Add a button to download all group expenses as a CSV file
- **Recurring expenses** — Allow marking expenses as recurring (monthly rent, subscriptions) that auto-create each period
- **Multi-currency support** — Allow expenses in different currencies within the same group, with conversion rates
