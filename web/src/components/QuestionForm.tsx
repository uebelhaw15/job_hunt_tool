import { useState } from 'react'
import { api, type Question, type Category } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

interface Props {
  question?: Question
  jobId?: number     // set when adding to a specific job; omit for bank
  categories: Category[]
  onSave: () => void
  onCancel: () => void
}

export function QuestionForm({ question, jobId, categories, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    category: question?.category ?? categories[0]?.name ?? '',
    question: question?.question ?? '',
    answer: question?.answer ?? '',
    notes: question?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        answer: form.answer || undefined,
        notes: form.notes || undefined,
        jobId: jobId ?? undefined,
      }
      if (question) {
        await api.questions.update(question.id, payload)
      } else {
        await api.questions.create({ ...payload, aiGenerated: false })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
        <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
          {categories.map((c) => <option key={c.id}>{c.name}</option>)}
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Question *</label>
        <Input
          value={form.question}
          onChange={(e) => set('question', e.target.value)}
          required
          placeholder="Tell me about a time you…"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Answer</label>
        <Textarea
          value={form.answer}
          onChange={(e) => set('answer', e.target.value)}
          placeholder="Your prepared answer…"
          rows={5}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Notes</label>
        <Textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Tips, reminders, context…"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  )
}
