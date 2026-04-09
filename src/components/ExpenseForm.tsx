import { useState, useEffect } from "react";
import type { Expense } from "../types";
import { createExpense } from "../api";

interface ExpenseFormProps {
  groupId: string;
  members: string[];
  onExpenseAdded: (expense: Expense) => void;
}

export default function ExpenseForm({
  groupId,
  members,
  onExpenseAdded,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paidBy, setPaidBy] = useState(members[0] ?? "");
  const [participants, setParticipants] = useState<string[]>(members);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(amountInput) * 100);
    if (!description.trim() || isNaN(amount) || amount <= 0 || participants.length === 0) return;

    const expense = await createExpense({
      groupId,
      description: description.trim(),
      amount,
      paidBy,
      participants,
    });

    onExpenseAdded(expense);
    setShowToast(true);
    setDescription("");
    setAmountInput("");
    setPaidBy(members[0] ?? "");
    setParticipants(members);
  };

  const toggleParticipant = (member: string) => {
    if (member === paidBy) return;
    setParticipants((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
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
                setParticipants((prev) =>
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
                    : participants.includes(member)
                      ? "bg-teal text-white border-teal cursor-pointer"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400 cursor-pointer"
                }`}
              >
                {member}
              </button>
            ))}
          </div>
        </div>
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
