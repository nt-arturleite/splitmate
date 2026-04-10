import type { SplitType } from '../types';

export function resolveSplit(
  splitType: SplitType,
  amount: number,
  members: string[],
  input?: Record<string, number>,
): Record<string, number> {
  switch (splitType) {
    case 'equal':
      return resolveEqual(amount, members);
    case 'exact':
      return resolveExact(amount, members, input!);
    case 'percentage':
      return resolvePercentage(amount, members, input!);
    case 'shares':
      return resolveShares(amount, members, input!);
  }
}

function resolveEqual(amount: number, members: string[]): Record<string, number> {
  const n = members.length;
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;
  const result: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    result[members[i]] = base + (i < remainder ? 1 : 0);
  }
  return result;
}

function resolveExact(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const sum = members.reduce((acc, m) => acc + input[m], 0);
  if (sum !== amount) {
    throw new Error('Exact amounts must sum to the expense total');
  }
  const result: Record<string, number> = {};
  for (const m of members) {
    result[m] = input[m];
  }
  return result;
}

function resolvePercentage(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const totalPct = members.reduce((acc, m) => acc + input[m], 0);
  if (totalPct !== 100) {
    throw new Error('Percentages must sum to 100');
  }
  const result: Record<string, number> = {};
  let allocated = 0;
  for (let i = 0; i < members.length; i++) {
    if (i === members.length - 1) {
      result[members[i]] = amount - allocated;
    } else {
      const cents = Math.floor(amount * input[members[i]] / 100);
      result[members[i]] = cents;
      allocated += cents;
    }
  }
  return result;
}

function resolveShares(
  amount: number,
  members: string[],
  input: Record<string, number>,
): Record<string, number> {
  const totalShares = members.reduce((acc, m) => acc + input[m], 0);
  const result: Record<string, number> = {};
  let allocated = 0;
  for (let i = 0; i < members.length; i++) {
    const cents = Math.floor(amount * input[members[i]] / totalShares);
    result[members[i]] = cents;
    allocated += cents;
  }
  const remainder = amount - allocated;
  for (let i = 0; i < remainder; i++) {
    result[members[i]] += 1;
  }
  return result;
}
