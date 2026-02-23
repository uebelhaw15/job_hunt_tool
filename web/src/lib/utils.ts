import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe JSON.parse — returns null instead of throwing on malformed input
export function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try { return JSON.parse(value) as T } catch { return null }
}

// Format a USD cost value for display
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(4)}¢`
  return `$${usd.toFixed(4)}`
}

// Job status badge colour mapping
export const STATUS_COLORS: Record<string, string> = {
  Considering: 'bg-slate-100 text-slate-700',
  Applied: 'bg-blue-100 text-blue-700',
  'Phone Screen': 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-orange-100 text-orange-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Passed: 'bg-purple-100 text-purple-700',
}

// Grade colour mapping
export const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-600', A: 'text-green-600', 'A-': 'text-green-500',
  'B+': 'text-blue-600', B: 'text-blue-600', 'B-': 'text-blue-500',
  'C+': 'text-yellow-600', C: 'text-yellow-600', 'C-': 'text-yellow-500',
  'D+': 'text-orange-600', D: 'text-orange-600', 'D-': 'text-orange-500',
  F: 'text-red-600',
}
