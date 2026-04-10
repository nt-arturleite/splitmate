export interface Group {
  id: string;
  name: string;
  members: string[];
  currency?: "USD" | "EUR" | "GBP";
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  isRecurring?: boolean;
  recurrencePeriod?: "monthly";
}
  amount: number; // in cents
  paidBy: string;
  participants: string[];
}
