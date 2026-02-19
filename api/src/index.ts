import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: 'http://localhost:5173',
})

app.get('/health', async () => {
  return { status: 'ok' }
})

const port = Number(process.env.PORT) || 3001

try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`API running at http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
