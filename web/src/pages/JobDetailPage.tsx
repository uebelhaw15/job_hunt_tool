import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react'
import { api, type Job, type Question, type Category } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { QuestionForm } from '@/components/QuestionForm'
import { QuestionCard } from '@/components/QuestionCard'
import { useToast } from '@/components/ui/Toast'
import { STATUS_COLORS } from '@/lib/utils'

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const jobId = Number(id)

  const [job, setJob] = useState<Job | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [jdContent, setJdContent] = useState('')
  const [editingJd, setEditingJd] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState<Question | null>(null)
  const [bankQuestions, setBankQuestions] = useState<Question[]>([])
  const [showCopyModal, setShowCopyModal] = useState(false)
  const toast = useToast()

  async function load() {
    try {
      const [j, cats] = await Promise.all([api.jobs.get(jobId), api.categories.list()])
      setJob(j)
      setCategories(cats)
      setJdContent(j.description?.content ?? '')
    } catch {
      toast.error('Failed to load job details.')
    }
  }

  useEffect(() => { void load() }, [jobId])

  async function saveJd() {
    try {
      await api.jobs.upsertDescription(jobId, jdContent)
      setEditingJd(false)
      void load()
    } catch {
      toast.error('Failed to save job description.')
    }
  }

  async function handleDeleteQuestion(qid: number) {
    if (!confirm('Delete this question?')) return
    try {
      await api.questions.delete(qid)
      void load()
    } catch {
      toast.error('Failed to delete question.')
    }
  }

  async function openCopyModal() {
    try {
      setBankQuestions(await api.questions.list({ bank: true }))
      setShowCopyModal(true)
    } catch {
      toast.error('Failed to load question bank.')
    }
  }

  async function copyQuestion(qid: number) {
    try {
      await api.questions.copyToJob(qid, jobId)
      setShowCopyModal(false)
      void load()
    } catch {
      toast.error('Failed to copy question.')
    }
  }

  if (!job) return <div className="text-slate-400 text-sm">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={14} /> All Jobs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{job.role}</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {job.company}
              {job.location ? ` · ${job.location}` : ''}
              {job.salary ? ` · ${job.salary}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={job.status} className={STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600'} />
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
        {job.notes && <p className="text-sm text-slate-500 mt-2">{job.notes}</p>}
      </div>

      {/* Job Description */}
      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Job Description</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditingJd(!editingJd)}>
            {editingJd ? 'Cancel' : job.description ? 'Edit' : 'Add'}
          </Button>
        </div>
        {editingJd ? (
          <div>
            <Textarea
              value={jdContent}
              onChange={(e) => setJdContent(e.target.value)}
              rows={10}
              placeholder="Paste the job description here…"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" onClick={() => { void saveJd() }}>Save</Button>
            </div>
          </div>
        ) : job.description ? (
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description.content}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">No job description added yet.</p>
        )}
      </section>

      {/* Questions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Questions ({job.questions?.length ?? 0})
          </h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { void openCopyModal() }}>
              Copy from Bank
            </Button>
            <Button size="sm" onClick={() => { setEditQuestion(null); setShowQuestionForm(true) }}>
              <Plus size={13} /> Add Question
            </Button>
          </div>
        </div>

        {!job.questions?.length ? (
          <p className="text-sm text-slate-400 italic">No questions yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {job.questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onEdit={() => { setEditQuestion(q); setShowQuestionForm(true) }}
                onDelete={() => { void handleDeleteQuestion(q.id) }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Question Modal */}
      <Modal
        open={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        title={editQuestion ? 'Edit Question' : 'Add Question'}
      >
        <QuestionForm
          question={editQuestion ?? undefined}
          jobId={jobId}
          categories={categories}
          onSave={() => { setShowQuestionForm(false); void load() }}
          onCancel={() => setShowQuestionForm(false)}
        />
      </Modal>

      {/* Copy from Bank Modal */}
      <Modal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title="Copy from Question Bank"
        className="max-w-2xl"
      >
        {bankQuestions.length === 0 ? (
          <p className="text-sm text-slate-400">No questions in the global bank yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bankQuestions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-md">
                <div>
                  <p className="text-sm text-slate-800">{q.question}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{q.category}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => { void copyQuestion(q.id) }}>
                  Copy
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
