// ─── API Client ─────────────────────────────────────────────────────────────
// Typed wrappers around every backend endpoint.

const BASE = 'http://localhost:3001'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`)
  return data as T
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Job {
  id: number
  company: string
  role: string
  status: string
  jobUrl?: string
  location?: string
  salary?: string
  notes?: string
  createdAt: string
  updatedAt: string
  description?: { id: number; content: string }
  questions?: Question[]
  _count?: { questions: number }
}

export interface Question {
  id: number
  jobId?: number
  category: string
  question: string
  answer?: string
  notes?: string
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  createdAt: string
}

export interface PracticeSession {
  id: number
  jobId?: number
  title: string
  createdAt: string
  job?: { company: string; role: string }
  _count?: { attempts: number }
  attempts?: PracticeAttempt[]
}

export interface PracticeAttempt {
  id: number
  sessionId: number
  questionId: number
  answer: string
  score?: string
  aiFeedback?: string
  userNotes?: string
  createdAt: string
  question?: Question
  parsedScore?: {
    dimensions: { clarity: number; specificity: number; relevance: number; structure: number }
    grade: string
    feedback: string
    improvements: string
  }
}

export interface ApiUsageSummary {
  allTime: { inputTokens: number; outputTokens: number; costUsd: number }
  monthly: { inputTokens: number; outputTokens: number; costUsd: number }
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const api = {
  jobs: {
    list: () => req<Job[]>('/jobs'),
    get: (id: number) => req<Job>(`/jobs/${id}`),
    create: (body: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<Job>('/jobs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Job>) =>
      req<Job>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => req<void>(`/jobs/${id}`, { method: 'DELETE' }),
    upsertDescription: (id: number, content: string) =>
      req<{ id: number; content: string }>(`/jobs/${id}/description`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },

  questions: {
    list: (params?: { jobId?: number; bank?: boolean }) => {
      const qs = params?.bank
        ? '?bank=true'
        : params?.jobId
        ? `?jobId=${params.jobId}`
        : ''
      return req<Question[]>(`/questions${qs}`)
    },
    create: (body: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<Question>('/questions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Question>) =>
      req<Question>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => req<void>(`/questions/${id}`, { method: 'DELETE' }),
    copyToJob: (id: number, jobId: number) =>
      req<Question>(`/questions/${id}/copy-to-job`, {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
  },

  categories: {
    list: () => req<Category[]>('/categories'),
    create: (name: string) =>
      req<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    delete: (id: number) => req<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  practice: {
    listSessions: () => req<PracticeSession[]>('/practice/sessions'),
    getSession: (id: number) => req<PracticeSession>(`/practice/sessions/${id}`),
    createSession: (body: { title: string; jobId?: number }) =>
      req<PracticeSession>('/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    generateQuestions: (sessionId: number, opts?: { saveToBank?: boolean; count?: number }) =>
      req<Question[]>(`/practice/sessions/${sessionId}/generate`, {
        method: 'POST',
        body: JSON.stringify(opts ?? {}),
      }),
    submitAttempt: (body: { sessionId: number; questionId: number; answer: string }) =>
      req<PracticeAttempt>('/practice/attempts', { method: 'POST', body: JSON.stringify(body) }),
    saveNotes: (attemptId: number, userNotes: string) =>
      req<PracticeAttempt>(`/practice/attempts/${attemptId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ userNotes }),
      }),
  },

  usage: {
    summary: () => req<ApiUsageSummary>('/api-usage/summary'),
  },
}
