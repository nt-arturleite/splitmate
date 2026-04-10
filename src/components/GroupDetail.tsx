import { useEffect, useState } from "react";
import type { Group, Expense } from "../types";
import { getExpenses } from "../api";
import { computeBalances } from "../utils/balances";
import ExpenseForm from "./ExpenseForm";
import BalanceList from "./BalanceList";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function GroupDetail({ group, onBack }: GroupDetailProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    getExpenses(group.id).then(setExpenses);
  }, [group.id]);

  const balances = computeBalances(group.members, expenses);

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-teal transition-colors mb-6 flex items-center gap-1 cursor-pointer"
      >
        <span>←</span> Back to groups
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {group.members.map((member) => (
            <span
              key={member}
              className="bg-teal-light text-teal-dark text-xs font-medium px-3 py-1 rounded-full"
            >
              {member}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <ExpenseForm
          groupId={group.id}
          members={group.members}
          onExpenseAdded={(expense) =>
            setExpenses((prev) => [...prev, expense])
          }
        />

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
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
            </ul>
          )}
        </div>

        <BalanceList balances={balances} />
      </div>
    </div>
  );
}
