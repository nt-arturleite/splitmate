import { useEffect, useState } from "react";
import type { Group, Expense } from "../types";
import { getExpenses } from "../api";
import { computeBalances } from "../utils/balances";
import ExpenseForm from "./ExpenseForm";
import BalanceList from "./BalanceList";
import { unparse } from "papaparse";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function downloadCsv(data: unknown[], filename: string) {
  const csv = unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
            <button
              onClick={() => {
                const data = expenses.map(
                  ({ description, amount, paidBy, participants }) => ({
                    description,
                    amount: formatCents(amount),
                    paidBy,
                    participants: participants.join(", "),
                  }),
                );
                downloadCsv(data, `${group.name}-expenses.csv`);
              }}
              className="text-sm text-gray-500 hover:text-teal transition-colors flex items-center gap-1 cursor-pointer"
            >
              Export to CSV
            </button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((expense) => {
                const perPerson = Math.floor(
                  expense.amount / expense.participants.length,
                );
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
                        · €{formatCents(perPerson)} / person
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Split: {expense.participants.join(", ")}
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
