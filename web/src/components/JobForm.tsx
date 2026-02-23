import { useState } from 'react'
import { api, type Job } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'

const STATUSES = ['Considering', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Passed']

interface Props {
  job?: Job
  onSave: () => void
  onCancel: () => void
}

export function JobForm({ job, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    company: job?.company ?? '',
    role: job?.role ?? '',
    status: job?.status ?? 'Considering',
    jobUrl: job?.jobUrl ?? '',
    location: job?.location ?? '',
    salary: job?.salary ?? '',
    notes: job?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        jobUrl: form.jobUrl || undefined,
        location: form.location || undefined,
        salary: form.salary || undefined,
        notes: form.notes || undefined,
      }
      if (job) {
        await api.jobs.update(job.id, payload)
      } else {
        await api.jobs.create(payload)
      }
      onSave()
    } catch {
      toast.error('Failed to save job.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Company *</label>
          <Input value={form.company} onChange={(e) => set('company', e.target.value)} required placeholder="Acme Corp" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Role *</label>
          <Input value={form.role} onChange={(e) => set('role', e.target.value)} required placeholder="Senior PM" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Status</label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Location</label>
          <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Remote / NYC" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Salary</label>
          <Input value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="$120k–$150k" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Job URL</label>
          <Input value={form.jobUrl} onChange={(e) => set('jobUrl', e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Notes</label>
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any notes..." rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  )
}
