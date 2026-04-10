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
