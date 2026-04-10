import type { Group, Expense } from "./types";

const API_URL = "http://localhost:3001";

export async function getGroups(): Promise<Group[]> {
  const res = await fetch(`${API_URL}/groups`);
  return res.json();
}

export async function getGroup(id: string): Promise<Group> {
  const res = await fetch(`${API_URL}/groups/${id}`);
  return res.json();
}

export async function createGroup(
  name: string,
  members: string[],
  currency: "USD" | "EUR" | "GBP",
): Promise<Group> {
  const res = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, members, currency }),
  });
  return res.json();
}

export async function getExpenses(groupId: string): Promise<Expense[]> {
  const res = await fetch(`${API_URL}/expenses?groupId=${groupId}`);
  return res.json();
}

export async function createExpense(
  expense: Omit<Expense, "id">,
): Promise<Expense> {
  const res = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  return res.json();
}
