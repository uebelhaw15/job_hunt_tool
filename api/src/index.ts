import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

// ─── Clients ────────────────────────────────────────────────────────────────

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// Validate required env vars at startup — fail fast rather than at first AI call
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('FATAL: Missing ANTHROPIC_API_KEY in environment')
  process.exit(1)
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

await app.register(cors, {
  origin: 'http://localhost:5173',
})

// ─── Anthropic Helper ───────────────────────────────────────────────────────
// Wraps every Claude API call, logs token usage + cost to ApiUsage table.
// Pricing: claude-3-5-haiku input $0.80/M tokens, output $4.00/M tokens

const COST_PER_INPUT_TOKEN = 0.80 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 4.00 / 1_000_000

async function callClaude(
  endpoint: string,
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  maxTokens = 1024
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  })

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd = inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN

  // Log usage to DB for cost tracking
  await prisma.apiUsage.create({
    data: { endpoint, inputTokens, outputTokens, costUsd },
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text
}

// ─── Health ─────────────────────────────────────────────────────────────────

app.get('/health', async () => ({ status: 'ok' }))

// ─── JOBS ────────────────────────────────────────────────────────────────────

// GET /jobs — list all jobs
app.get('/jobs', async () => {
  return prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { description: true, _count: { select: { questions: true } } },
  })
})

// GET /jobs/:id — single job with description + questions
app.get<{ Params: { id: string } }>('/jobs/:id', async (req, reply) => {
  const job = await prisma.job.findUnique({
    where: { id: Number(req.params.id) },
    include: { description: true, questions: { orderBy: { createdAt: 'asc' } } },
  })
  if (!job) return reply.status(404).send({ error: 'Job not found' })
  return job
})

// POST /jobs — create job
app.post<{ Body: { company: string; role: string; status?: string; jobUrl?: string; location?: string; salary?: string; notes?: string } }>(
  '/jobs',
  async (req, reply) => {
    const { company, role, status, jobUrl, location, salary, notes } = req.body
    const job = await prisma.job.create({ data: { company, role, status, jobUrl, location, salary, notes } })
    return reply.status(201).send(job)
  }
)

// PUT /jobs/:id — update job (only updatable fields accepted)
app.put<{ Params: { id: string }; Body: { company?: string; role?: string; status?: string; jobUrl?: string; location?: string; salary?: string; notes?: string } }>(
  '/jobs/:id',
  async (req, reply) => {
    const { company, role, status, jobUrl, location, salary, notes } = req.body
    const job = await prisma.job.update({
      where: { id: Number(req.params.id) },
      data: { company, role, status, jobUrl, location, salary, notes },
    })
    return job
  }
)

// DELETE /jobs/:id — delete job (cascades to description + questions via DB)
app.delete<{ Params: { id: string } }>('/jobs/:id', async (req, reply) => {
  await prisma.job.delete({ where: { id: Number(req.params.id) } })
  return reply.status(204).send()
})

// POST /jobs/:id/description — upsert job description
app.post<{ Params: { id: string }; Body: { content: string } }>(
  '/jobs/:id/description',
  async (req, reply) => {
    const jobId = Number(req.params.id)
    const description = await prisma.jobDescription.upsert({
      where: { jobId },
      create: { jobId, content: req.body.content },
      update: { content: req.body.content },
    })
    return description
  }
)

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

// GET /questions — list questions
// ?jobId=1  → questions for a specific job
// ?bank=true → global bank (jobId IS NULL)
// (no filter) → all questions
app.get<{ Querystring: { jobId?: string; bank?: string } }>(
  '/questions',
  async (req) => {
    const { jobId, bank } = req.query
    const where =
      bank === 'true'
        ? { jobId: null }
        : jobId
        ? { jobId: Number(jobId) }
        : {}
    return prisma.question.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })
  }
)

// POST /questions — create question
app.post<{ Body: { jobId?: number; category: string; question: string; answer?: string; notes?: string; aiGenerated?: boolean } }>(
  '/questions',
  async (req, reply) => {
    const { jobId, category, question, answer, notes, aiGenerated } = req.body
    const created = await prisma.question.create({ data: { jobId, category, question, answer, notes, aiGenerated } })
    return reply.status(201).send(created)
  }
)

// PUT /questions/:id — update question (only updatable fields accepted)
app.put<{ Params: { id: string }; Body: { category?: string; question?: string; answer?: string; notes?: string; jobId?: number } }>(
  '/questions/:id',
  async (req) => {
    const { category, question, answer, notes, jobId } = req.body
    return prisma.question.update({
      where: { id: Number(req.params.id) },
      data: { category, question, answer, notes, jobId },
    })
  }
)

// DELETE /questions/:id — delete question
app.delete<{ Params: { id: string } }>('/questions/:id', async (req, reply) => {
  await prisma.question.delete({ where: { id: Number(req.params.id) } })
  return reply.status(204).send()
})

// POST /questions/:id/copy-to-job — duplicate a bank question to a specific job
app.post<{ Params: { id: string }; Body: { jobId: number } }>(
  '/questions/:id/copy-to-job',
  async (req, reply) => {
    const source = await prisma.question.findUnique({ where: { id: Number(req.params.id) } })
    if (!source) return reply.status(404).send({ error: 'Question not found' })

    const copy = await prisma.question.create({
      data: {
        jobId: req.body.jobId,
        category: source.category,
        question: source.question,
        answer: source.answer,
        notes: source.notes,
        aiGenerated: source.aiGenerated,
      },
    })
    return reply.status(201).send(copy)
  }
)

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

// Seed defaults on startup if none exist
async function seedCategories() {
  const count = await prisma.category.count()
  if (count === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'Behavioral' },
        { name: 'Technical' },
        { name: 'System Design' },
        { name: 'Role-Specific' },
      ],
    })
    app.log.info('Seeded default categories')
  }
}

// GET /categories
app.get('/categories', async () => {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
})

// POST /categories — add a new category
app.post<{ Body: { name: string } }>('/categories', async (req, reply) => {
  const category = await prisma.category.create({ data: { name: req.body.name } })
  return reply.status(201).send(category)
})

// DELETE /categories/:id — remove a category
app.delete<{ Params: { id: string } }>('/categories/:id', async (req, reply) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } })
  return reply.status(204).send()
})

// ─── PRACTICE SESSIONS ───────────────────────────────────────────────────────

// GET /practice/sessions — list all sessions
app.get('/practice/sessions', async () => {
  return prisma.practiceSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { company: true, role: true } },
      _count: { select: { attempts: true } },
    },
  })
})

// GET /practice/sessions/:id — session detail with attempts
app.get<{ Params: { id: string } }>('/practice/sessions/:id', async (req, reply) => {
  const session = await prisma.practiceSession.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      job: { select: { company: true, role: true } },
      attempts: {
        orderBy: { createdAt: 'desc' },
        include: { question: true },
      },
    },
  })
  if (!session) return reply.status(404).send({ error: 'Session not found' })
  return session
})

// POST /practice/sessions — create a new practice session
app.post<{ Body: { title: string; jobId?: number } }>(
  '/practice/sessions',
  async (req, reply) => {
    const session = await prisma.practiceSession.create({ data: req.body })
    return reply.status(201).send(session)
  }
)

// POST /practice/sessions/:id/generate — AI generates questions for the session
// Looks up the linked job role (or uses provided context) and generates questions.
// Saves questions as aiGenerated=true; user can choose to save to bank.
app.post<{
  Params: { id: string }
  Body: { saveToBank?: boolean; count?: number }
}>(
  '/practice/sessions/:id/generate',
  async (req, reply) => {
    const session = await prisma.practiceSession.findUnique({
      where: { id: Number(req.params.id) },
      include: { job: true },
    })
    if (!session) return reply.status(404).send({ error: 'Session not found' })

    const role = session.job ? `${session.job.role} at ${session.job.company}` : session.title
    const count = req.body.count ?? 5

    const systemPrompt = `You are an expert interview coach. Generate realistic, high-quality interview questions.
Return ONLY a valid JSON array of objects with keys: category, question.
Categories must be one of: Behavioral, Technical, System Design, Role-Specific.
Do not include any explanation or markdown — pure JSON only.`

    const userMessage = `Generate ${count} interview questions for the role: ${role}.
Mix categories appropriately for the role type. Return a JSON array only.`

    const raw = await callClaude(
      'generate-questions',
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      1024
    )

    let generated: { category: string; question: string }[]
    try {
      generated = JSON.parse(raw)
    } catch {
      return reply.status(500).send({ error: 'Failed to parse AI response', raw })
    }

    // Save all questions tied to the session's job (or bank if no job)
    const questions = await Promise.all(
      generated.map((q) =>
        prisma.question.create({
          data: {
            jobId: req.body.saveToBank ? null : session.jobId ?? null,
            category: q.category,
            question: q.question,
            aiGenerated: true,
          },
        })
      )
    )

    return reply.status(201).send(questions)
  }
)

// ─── PRACTICE ATTEMPTS ───────────────────────────────────────────────────────

// POST /practice/attempts — submit an answer, get AI scoring + feedback
app.post<{
  Body: { sessionId: number; questionId: number; answer: string }
}>(
  '/practice/attempts',
  async (req, reply) => {
    const { sessionId, questionId, answer } = req.body

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) return reply.status(404).send({ error: 'Question not found' })

    const systemPrompt = `You are an expert interview coach scoring candidate answers.
Return ONLY valid JSON with this exact shape:
{
  "dimensions": {
    "clarity": <1-10>,
    "specificity": <1-10>,
    "relevance": <1-10>,
    "structure": <1-10>
  },
  "grade": "<letter grade e.g. A+, B-, C>",
  "feedback": "<2-4 sentences of constructive feedback>",
  "improvements": "<1-3 specific bullet points on how to improve>"
}
No markdown, no extra text — pure JSON only.`

    const userMessage = `Question: ${question.question}

Candidate's answer: ${answer}

Score this answer and provide feedback.`

    const raw = await callClaude(
      'score-attempt',
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      512
    )

    let parsed: { dimensions: Record<string, number>; grade: string; feedback: string; improvements: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return reply.status(500).send({ error: 'Failed to parse AI scoring response', raw })
    }

    const attempt = await prisma.practiceAttempt.create({
      data: {
        sessionId,
        questionId,
        answer,
        score: JSON.stringify({ dimensions: parsed.dimensions, grade: parsed.grade }),
        aiFeedback: `${parsed.feedback}\n\nImprovements:\n${parsed.improvements}`,
      },
      include: { question: true },
    })

    return reply.status(201).send({ ...attempt, parsedScore: parsed })
  }
)

// PUT /practice/attempts/:id/notes — save user self-reflection notes
app.put<{ Params: { id: string }; Body: { userNotes: string } }>(
  '/practice/attempts/:id/notes',
  async (req) => {
    return prisma.practiceAttempt.update({
      where: { id: Number(req.params.id) },
      data: { userNotes: req.body.userNotes },
    })
  }
)

// ─── API COST TRACKING ───────────────────────────────────────────────────────

// GET /api-usage/summary — monthly + all-time cost totals
app.get('/api-usage/summary', async () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allTime, monthly] = await Promise.all([
    prisma.apiUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    }),
    prisma.apiUsage.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    }),
  ])

  return {
    allTime: {
      inputTokens: allTime._sum.inputTokens ?? 0,
      outputTokens: allTime._sum.outputTokens ?? 0,
      costUsd: allTime._sum.costUsd ?? 0,
    },
    monthly: {
      inputTokens: monthly._sum.inputTokens ?? 0,
      outputTokens: monthly._sum.outputTokens ?? 0,
      costUsd: monthly._sum.costUsd ?? 0,
    },
  }
})

// ─── Start ──────────────────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3001

try {
  await seedCategories()
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info(`API running at http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
