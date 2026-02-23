import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader } from 'lucide-react'
import { api, type PracticeSession, type Question, type PracticeAttempt } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { GRADE_COLORS, safeJsonParse } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export function PracticeSessionPage() {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)

  const [session, setSession] = useState<PracticeSession | null>(null)
  // Questions returned from the last generate call — visible immediately before any attempt
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [generating, setGenerating] = useState(false)
  const toast = useToast()
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PracticeAttempt | null>(null)
  const [selfNotes, setSelfNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [historyQuestion, setHistoryQuestion] = useState<Question | null>(null)

  async function load() {
    try {
      const s = await api.practice.getSession(sessionId)
      setSession(s)
    } catch {
      toast.error('Failed to load practice session.')
    }
  }

  useEffect(() => { void load() }, [sessionId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const newQuestions = await api.practice.generateQuestions(sessionId, { count: 5 })
      // Store freshly generated questions so they appear immediately without needing an attempt
      setGeneratedQuestions((prev) => {
        const existingIds = new Set(prev.map((q) => q.id))
        return [...prev, ...newQuestions.filter((q) => !existingIds.has(q.id))]
      })
      void load()
    } catch {
      toast.error('Failed to generate questions. Check your API key and try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!practiceQuestion) return
    setSubmitting(true)
    try {
      const attempt = await api.practice.submitAttempt({
        sessionId,
        questionId: practiceQuestion.id,
        answer,
      })
      setResult(attempt)
      setSelfNotes('')
    } catch {
      toast.error('Failed to score answer. Check your API key and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveNotes() {
    if (!result) return
    setSavingNotes(true)
    try {
      await api.practice.saveNotes(result.id, selfNotes)
      void load()
    } catch {
      toast.error('Failed to save notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  function openPractice(q: Question) {
    setPracticeQuestion(q)
    setAnswer('')
    setResult(null)
    setSelfNotes('')
  }

  if (!session) return <div className="text-slate-400 text-sm">Loading…</div>

  // Merge: questions seen in attempts + freshly generated (deduped by id)
  const attemptedMap = new Map(
    (session.attempts ?? []).map((a) => [a.questionId, a.question!])
  )
  const generatedMap = new Map(generatedQuestions.map((q) => [q.id, q]))
  const merged = new Map([...generatedMap, ...attemptedMap]) // attempts win on conflict
  const sessionQuestions: Question[] = [...merged.values()]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={14} /> All Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{session.title}</h2>
            {session.job && (
              <p className="text-sm text-slate-500">{session.job.role} @ {session.job.company}</p>
            )}
          </div>
          <Button onClick={() => { void handleGenerate() }} disabled={generating} variant="secondary">
            {generating ? <><Loader size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate Questions</>}
          </Button>
        </div>
      </div>

      {/* Generated Questions */}
      {sessionQuestions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-400">
          <p className="text-sm">No questions yet. Click "Generate Questions" to have AI create practice questions for this role.</p>
        </div>
      ) : (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Practice Questions</h3>
          <div className="flex flex-col gap-2">
            {sessionQuestions.map((q) => {
              const attempts = session.attempts?.filter((a) => a.questionId === q.id) ?? []
              const latest = attempts[0]
              const parsedScore = safeJsonParse<{ grade: string }>(latest?.score)

              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-0.5">{q.category}</p>
                    <p className="text-sm text-slate-800">{q.question}</p>
                    {parsedScore && (
                      <p className={`text-xs font-bold mt-1 ${GRADE_COLORS[parsedScore.grade] ?? 'text-slate-500'}`}>
                        Last attempt: {parsedScore.grade} · {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {attempts.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setHistoryQuestion(q)}>
                        History
                      </Button>
                    )}
                    <Button size="sm" onClick={() => openPractice(q)}>Practice</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Practice Modal */}
      <Modal
        open={!!practiceQuestion && !result}
        onClose={() => setPracticeQuestion(null)}
        title="Practice Answer"
        className="max-w-2xl"
      >
        {practiceQuestion && (
          <form onSubmit={(e) => { void handleSubmitAnswer(e) }} className="flex flex-col gap-4">
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-xs font-medium text-slate-400 mb-1">{practiceQuestion.category}</p>
              <p className="text-sm font-medium text-slate-800">{practiceQuestion.question}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Your Answer</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="Type your answer here…"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPracticeQuestion(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !answer.trim()}>
                {submitting ? <><Loader size={13} className="animate-spin" /> Scoring…</> : 'Submit for AI Scoring'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Result Modal */}
      <Modal
        open={!!result}
        onClose={() => { setResult(null); setPracticeQuestion(null); void load() }}
        title="AI Feedback"
        className="max-w-2xl"
      >
        {result?.parsedScore && (
          <div className="flex flex-col gap-4">
            {/* Grade */}
            <div className="flex items-center justify-between bg-slate-50 rounded-md p-3">
              <span className="text-sm font-medium text-slate-600">Overall Grade</span>
              <span className={`text-2xl font-bold ${GRADE_COLORS[result.parsedScore.grade] ?? 'text-slate-700'}`}>
                {result.parsedScore.grade}
              </span>
            </div>

            {/* Dimension scores */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.parsedScore.dimensions).map(([dim, score]) => (
                <div key={dim} className="bg-white border border-slate-200 rounded-md p-2.5">
                  <p className="text-xs text-slate-400 capitalize mb-1">{dim}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{score}/10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Feedback */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">AI Feedback</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.aiFeedback}</p>
            </div>

            {/* Self Notes */}
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Your Self-Reflection Notes</label>
              <Textarea
                value={selfNotes}
                onChange={(e) => setSelfNotes(e.target.value)}
                rows={3}
                placeholder="What would you do differently? What felt strong?"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="secondary" onClick={() => { void handleSaveNotes() }} disabled={savingNotes}>
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </Button>
              </div>
            </div>

            <Button onClick={() => { setResult(null); setPracticeQuestion(null); void load() }}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        open={!!historyQuestion}
        onClose={() => setHistoryQuestion(null)}
        title="Attempt History"
        className="max-w-2xl"
      >
        {historyQuestion && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50 rounded-md p-3">
              <p className="text-sm font-medium text-slate-800">{historyQuestion.question}</p>
            </div>
            {(session.attempts ?? [])
              .filter((a) => a.questionId === historyQuestion.id)
              .map((attempt, i) => {
                const score = safeJsonParse<{ grade: string }>(attempt.score)
                return (
                  <div key={attempt.id} className="border border-slate-200 rounded-md p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Attempt {i + 1} · {new Date(attempt.createdAt).toLocaleString()}</span>
                      {score && (
                        <span className={`text-sm font-bold ${GRADE_COLORS[score.grade] ?? 'text-slate-500'}`}>{score.grade}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{attempt.answer}</p>
                    {attempt.aiFeedback && (
                      <p className="text-xs text-slate-500 whitespace-pre-wrap border-t border-slate-100 pt-2">{attempt.aiFeedback}</p>
                    )}
                    {attempt.userNotes && (
                      <p className="text-xs text-blue-600 italic border-t border-slate-100 pt-2">Your notes: {attempt.userNotes}</p>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </Modal>
    </div>
  )
}
