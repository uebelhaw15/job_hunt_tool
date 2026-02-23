import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ExternalLink } from 'lucide-react'
import { api, type Job } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { JobForm } from '@/components/JobForm'
import { useToast } from '@/components/ui/Toast'
import { STATUS_COLORS } from '@/lib/utils'

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const toast = useToast()

  async function load() {
    try {
      setJobs(await api.jobs.list())
    } catch {
      toast.error('Failed to load jobs. Is the API running?')
    }
  }

  useEffect(() => { void load() }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this job and all its data?')) return
    try {
      await api.jobs.delete(id)
      void load()
    } catch {
      toast.error('Failed to delete job.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Jobs</h2>
        <Button onClick={() => { setEditJob(null); setShowForm(true) }}>
          <Plus size={15} /> Add Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No jobs yet. Add your first role to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link to={`/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                  {job.role}
                </Link>
                <p className="text-sm text-slate-500 truncate">
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                  {job.salary ? ` · ${job.salary}` : ''}
                </p>
              </div>

              <Badge label={job.status} className={STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600'} />

              <span className="text-xs text-slate-400">{job._count?.questions ?? 0} questions</span>

              {job.jobUrl && (
                <a href={job.jobUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500">
                  <ExternalLink size={14} />
                </a>
              )}

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditJob(job); setShowForm(true) }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editJob ? 'Edit Job' : 'Add Job'}
      >
        <JobForm
          job={editJob ?? undefined}
          onSave={() => { setShowForm(false); void load() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
