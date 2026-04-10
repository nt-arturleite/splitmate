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
  const [isRecurring, setIsRecurring] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(amountInput) * 100);
    if (
      !description.trim() ||
      isNaN(amount) ||
      amount <= 0 ||
      participants.length === 0
    )
      return;

    const expense = await createExpense({
      groupId,
      description: description.trim(),
      amount,
      paidBy,
      participants,
      isRecurring,
      recurrencePeriod: isRecurring ? "monthly" : undefined,
    });

    onExpenseAdded(expense);
    setShowToast(true);
    setDescription("");
    setAmountInput("");
    setPaidBy(members[0] ?? "");
    setParticipants(members);
    setIsRecurring(false);
  };

  const toggleParticipant = (member: string) => {
    if (member === paidBy) return;
    setParticipants((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member],
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Expense</h2>
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
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Split between
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {members.map((member) => (
              <button
                key={member}
                type="button"
                onClick={() => toggleParticipant(member)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  participants.includes(member)
                    ? "bg-teal text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${
                  member === paidBy
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {member}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="is-recurring"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 text-teal border-gray-300 rounded focus:ring-teal"
          />
          <label
            htmlFor="is-recurring"
            className="ml-2 block text-sm text-gray-900"
          >
            Recurring expense (monthly)
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-teal text-white font-semibold py-2.5 rounded-lg hover:bg-teal-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
}
