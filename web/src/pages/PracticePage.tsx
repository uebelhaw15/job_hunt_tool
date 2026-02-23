import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Brain } from 'lucide-react'
import { api, type PracticeSession, type Job } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

export function PracticePage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', jobId: '' })
  const [creating, setCreating] = useState(false)
  const toast = useToast()

  async function load() {
    try {
      const [s, j] = await Promise.all([api.practice.listSessions(), api.jobs.list()])
      setSessions(s)
      setJobs(j)
    } catch {
      toast.error('Failed to load practice sessions.')
    }
  }

  useEffect(() => { void load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.practice.createSession({
        title: form.title,
        jobId: form.jobId ? Number(form.jobId) : undefined,
      })
      setShowCreate(false)
      setForm({ title: '', jobId: '' })
      void load()
    } catch {
      toast.error('Failed to create session.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Practice Sessions</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Brain size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No practice sessions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={`/practice/${s.id}`}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-800">{s.title}</p>
                {s.job && (
                  <p className="text-sm text-slate-500">{s.job.role} @ {s.job.company}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{s._count?.attempts ?? 0} attempts</p>
                <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Practice Session">
        <form onSubmit={(e) => { void handleCreate(e) }} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Session Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Google PM Prep"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Link to Job (optional)</label>
            <Select
              value={form.jobId}
              onChange={(e) => setForm((f) => ({ ...f, jobId: e.target.value }))}
            >
              <option value="">Freeform — no job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.role} @ {j.company}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
