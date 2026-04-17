import 'reflect-metadata'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import employeeRoutes from './routes/employee.routes'
import noteRoutes from './routes/note.routes'
import projectRoutes from './routes/project.routes'
import taskRoutes from './routes/task.routes'
import teamRoutes from './routes/team.routes'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notes', noteRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` })
})

export default app
