import 'reflect-metadata'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { rateLimit } from './middleware/rateLimit'
import { requestLogger } from './middleware/requestLogger'
import activityRoutes from './routes/activity.routes'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import employeeRoutes from './routes/employee.routes'
import noteRoutes from './routes/note.routes'
import postRoutes from './routes/post.routes'
import projectRoutes from './routes/project.routes'
import searchRoutes from './routes/search.routes'
import settingsRoutes from './routes/settings.routes'
import taskRoutes from './routes/task.routes'
import teamRoutes from './routes/team.routes'

const app = express()

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

const authWriteRateLimiter = rateLimit({
  keyPrefix: 'auth-write',
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts. Please try again later.',
})

const searchRateLimiter = rateLimit({
  keyPrefix: 'search',
  maxRequests: 120,
  windowMs: 60 * 1000,
})

const publicContentRateLimiter = rateLimit({
  keyPrefix: 'public-content',
  maxRequests: 240,
  windowMs: 60 * 1000,
})

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(requestLogger)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth/login', authWriteRateLimiter)
app.use('/api/auth/register', authWriteRateLimiter)
app.use('/api/search', searchRateLimiter)
app.use('/api/posts/public', publicContentRateLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/posts', postRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(notFoundHandler)
app.use(errorHandler)

export default app
