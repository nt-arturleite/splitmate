interface BalanceListProps {
  balances: Record<string, number>;
}

function formatCents(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

export default function BalanceList({ balances }: BalanceListProps) {
  const entries = Object.entries(balances);

  if (entries.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Balances</h2>
      <ul className="space-y-3">
        {entries.map(([member, balance]) => (
          <li key={member} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{member}</span>
            <span
              className={`text-sm font-semibold ${
                balance > 0
                  ? "text-emerald-600"
                  : balance < 0
                    ? "text-red-500"
                    : "text-gray-400"
              }`}
            >
              {balance > 0 && "+"}
              {balance < 0 && "−"}
              {balance === 0 ? "settled" : `€${formatCents(balance)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
