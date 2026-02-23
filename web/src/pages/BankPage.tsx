import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api, type Question, type Category, type Job } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { QuestionForm } from '@/components/QuestionForm'
import { QuestionCard } from '@/components/QuestionCard'
import { useToast } from '@/components/ui/Toast'

export function BankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState<Question | null>(null)
  const [copyTarget, setCopyTarget] = useState<{ qid: number; jobId: string } | null>(null)
  const toast = useToast()

  async function load() {
    try {
      const [qs, cats, js] = await Promise.all([
        api.questions.list({ bank: true }),
        api.categories.list(),
        api.jobs.list(),
      ])
      setQuestions(qs)
      setCategories(cats)
      setJobs(js)
    } catch {
      toast.error('Failed to load question bank.')
    }
  }

  useEffect(() => { void load() }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this question from the bank?')) return
    try {
      await api.questions.delete(id)
      void load()
    } catch {
      toast.error('Failed to delete question.')
    }
  }

  async function handleCopy() {
    if (!copyTarget || !copyTarget.jobId) return
    try {
      await api.questions.copyToJob(copyTarget.qid, Number(copyTarget.jobId))
      setCopyTarget(null)
      void load()
    } catch {
      toast.error('Failed to copy question to job.')
    }
  }

  const filtered = filter === 'All' ? questions : questions.filter((q) => q.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Question Bank</h2>
        <Button onClick={() => { setEditQuestion(null); setShowForm(true) }}>
          <Plus size={15} /> Add Question
        </Button>
      </div>

      {/* Filter by category */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-500">Filter:</span>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No questions in the bank yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onEdit={() => { setEditQuestion(q); setShowForm(true) }}
              onDelete={() => { void handleDelete(q.id) }}
              onCopy={() => setCopyTarget({ qid: q.id, jobId: '' })}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editQuestion ? 'Edit Question' : 'Add to Bank'}
      >
        <QuestionForm
          question={editQuestion ?? undefined}
          categories={categories}
          onSave={() => { setShowForm(false); void load() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Copy to Job Modal */}
      <Modal
        open={!!copyTarget}
        onClose={() => setCopyTarget(null)}
        title="Copy to Job"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">Select a job to copy this question to:</p>
          <Select
            value={copyTarget?.jobId ?? ''}
            onChange={(e) => setCopyTarget((t) => t ? { ...t, jobId: e.target.value } : null)}
          >
            <option value="">Select a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.role} @ {j.company}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCopyTarget(null)}>Cancel</Button>
            <Button disabled={!copyTarget?.jobId} onClick={() => { void handleCopy() }}>Copy</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
