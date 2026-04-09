export interface Group {
  id: string;
  name: string;
  members: string[];
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number; // in cents
  paidBy: string;
  participants: string[];
}
