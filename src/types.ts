export interface Group {
  id: string;
  name: string;
  members: string[];
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number; // in cents
  paidBy: string;
  splitType: SplitType;
  participants: Record<string, number>; // member name → owed amount in cents
}
