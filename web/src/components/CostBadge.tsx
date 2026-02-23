import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'
import { api, type ApiUsageSummary } from '@/lib/api'
import { formatCost } from '@/lib/utils'

// Polls /api-usage/summary every 30s and displays monthly + all-time cost.
export function CostBadge() {
  const [usage, setUsage] = useState<ApiUsageSummary | null>(null)

  async function load() {
    try {
      const data = await api.usage.summary()
      setUsage(data)
    } catch {
      // silently ignore — API may not be up yet
    }
  }

  useEffect(() => {
    void load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (!usage) return null

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
      <DollarSign size={13} className="text-slate-400" />
      <span>
        <span className="font-medium text-slate-700">This month:</span>{' '}
        {formatCost(usage.monthly.costUsd)}
      </span>
      <span className="text-slate-300">|</span>
      <span>
        <span className="font-medium text-slate-700">All time:</span>{' '}
        {formatCost(usage.allTime.costUsd)}
      </span>
    </div>
  )
}
