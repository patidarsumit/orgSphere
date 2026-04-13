# OrgSphere — Phase 1 Prompt
# Monorepo Scaffold + Auth (Backend + Frontend)
# Paste this entire prompt into Claude Code or Codex

---

## CONTEXT

You are building OrgSphere — an internal corporate collaboration platform.
Stack: Next.js 16 + TypeScript (frontend), Node.js + Express + TypeORM + PostgreSQL (backend), shared Zod schemas.
Everything runs locally. No cloud services.

Read the ARCHITECTURE.md file in the project root before writing any code.

---

## TASK — Phase 1: Monorepo Scaffold + Auth

Build the complete Phase 1 of OrgSphere. This includes:
1. Full monorepo folder structure
2. Backend: Express + TypeORM + PostgreSQL connected and running
3. Backend: Auth endpoints (register, login, refresh, logout, me)
4. Frontend: Next.js 15 app configured with all dependencies
5. Frontend: Login page wired to real API
6. Frontend: Protected route system using RTK auth state
7. Shared: Zod schemas package

---

## STEP 1 — Create monorepo root

Create `package.json` at root with npm workspaces:

```json
{
  "name": "orgsphere",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "packages/schemas"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Create `.gitignore` at root:
```
node_modules/
.env
.env.local
dist/
.next/
server/src/uploads/
*.log
```

---

## STEP 2 — Shared Zod schemas (/packages/schemas)

Create `packages/schemas/package.json`:
```json
{
  "name": "@orgsphere/schemas",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

Create `packages/schemas/auth.schema.ts`:
```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']).default('employee'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

Create `packages/schemas/user.schema.ts`:
```typescript
import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  manager_id: z.string().uuid().nullable().optional(),
})

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']),
  department: z.string().nullable(),
  skills: z.array(z.string()),
  avatar_path: z.string().nullable(),
  manager_id: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
```

Create `packages/schemas/index.ts`:
```typescript
export * from './auth.schema'
export * from './user.schema'
```

---

## STEP 3 — Backend (/server)

### package.json
```json
{
  "name": "@orgsphere/server",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "migration:generate": "typeorm migration:generate",
    "migration:run": "typeorm migration:run -d src/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/data-source.ts"
  },
  "dependencies": {
    "@orgsphere/schemas": "*",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.2.1",
    "typeorm": "^0.3.17",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.2"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### src/data-source.ts
```typescript
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entities/User'
import dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'orgsphere_db',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
})
```

### src/entities/User.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'

export type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string

  @Column({
    type: 'enum',
    enum: ['admin', 'manager', 'tech_lead', 'employee'],
    default: 'employee',
  })
  role!: UserRole

  @Column({ type: 'varchar', length: 255, nullable: true })
  department!: string | null

  @Column({ type: 'jsonb', default: [] })
  skills!: string[]

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_path!: string | null

  @Column({ type: 'uuid', nullable: true })
  manager_id!: string | null

  @ManyToOne(() => User, (user) => user.direct_reports, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null

  @OneToMany(() => User, (user) => user.manager)
  direct_reports!: User[]

  @Column({ type: 'boolean', default: true })
  is_active!: boolean

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

### src/middleware/auth.ts
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: string
    }
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' })
    return
  }
  next()
}
```

### src/middleware/validate.ts
```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      })
      return
    }
    req.body = result.data
    next()
  }
```

### src/controllers/auth.controller.ts
```typescript
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

const userRepo = () => AppDataSource.getRepository(User)

const generateTokens = (user: User) => {
  const payload = { id: user.id, email: user.email, role: user.role }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  })

  return { accessToken, refreshToken }
}

const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  skills: user.skills,
  avatar_path: user.avatar_path,
  manager_id: user.manager_id,
  is_active: user.is_active,
  created_at: user.created_at,
})

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body
    const repo = userRepo()

    const existing = await repo.findOne({ where: { email } })
    if (existing) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    const password_hash = await bcrypt.hash(password, 12)
    const user = repo.create({ name, email, password_hash, role })
    await repo.save(user)

    const { accessToken, refreshToken } = generateTokens(user)

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ user: sanitizeUser(user), accessToken })
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    const repo = userRepo()

    const user = await repo.findOne({ where: { email, is_active: true } })
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const { accessToken, refreshToken } = generateTokens(user)

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ user: sanitizeUser(user), accessToken })
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' })
  }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token
    if (!token) {
      res.status(401).json({ message: 'No refresh token' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      id: string
      email: string
      role: string
    }

    const repo = userRepo()
    const user = await repo.findOne({ where: { id: decoded.id, is_active: true } })
    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    const { accessToken, refreshToken } = generateTokens(user)

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken, user: sanitizeUser(user) })
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
}

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('refresh_token')
  res.json({ message: 'Logged out successfully' })
}

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = userRepo()
    const user = await repo.findOne({ where: { id: req.user!.id } })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json({ user: sanitizeUser(user) })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
```

### src/routes/auth.routes.ts
```typescript
import { Router } from 'express'
import { register, login, refresh, logout, me } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema } from '@orgsphere/schemas'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)

export default router
```

### src/app.ts
```typescript
import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import authRoutes from './routes/auth.routes'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` })
})

export default app
```

### src/server.ts
```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { AppDataSource } from './data-source'

const PORT = process.env.PORT || 4000

AppDataSource.initialize()
  .then(() => {
    console.log('✅ PostgreSQL connected')
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  })
```

### server/.env
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orgsphere_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=orgsphere_jwt_secret_change_this_in_production_32chars
JWT_REFRESH_SECRET=orgsphere_refresh_secret_change_this_too_32chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=./src/uploads
```

---

## STEP 4 — Frontend (/client)

### Initialize Next.js 15
Run: `npx create-next-app@latest client --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"`

### Install dependencies
```bash
cd client
npm install @reduxjs/toolkit react-redux @tanstack/react-query axios nuqs
npm install react-hook-form @hookform/resolvers zod
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install lucide-react clsx tailwind-merge
npm install @orgsphere/schemas
npx shadcn@latest init
npx shadcn@latest add button input label card badge avatar separator toast
```

### client/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### lib/axios.ts
```typescript
import axios from 'axios'
import { store } from '@/store'
import { setCredentials, clearAuth } from '@/store/slices/authSlice'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        store.dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(clearAuth())
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
```

### store/slices/authSlice.ts
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'tech_lead' | 'employee'
  department: string | null
  skills: string[]
  avatar_path: string | null
  manager_id: string | null
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      state.isLoading = false
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isLoading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const { setCredentials, clearAuth, setLoading } = authSlice.actions
export default authSlice.reducer
```

### store/slices/uiSlice.ts
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  toasts: Toast[]
  theme: 'light' | 'dark'
}

const initialState: UIState = {
  sidebarOpen: true,
  activeModal: null,
  toasts: [],
  theme: 'light',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({ ...action.payload, id: Date.now().toString() })
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { toggleSidebar, openModal, closeModal, addToast, removeToast } = uiSlice.actions
export default uiSlice.reducer
```

### store/index.ts
```typescript
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### app/providers.tsx
```typescript
'use client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from '@/store'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
        },
      },
    })
  )

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  )
}
```

### app/layout.tsx
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OrgSphere',
  description: 'Know your organization from every angle',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### app/(public)/login/page.tsx
Build the login page exactly matching the Stitch design:
- Centered card on gray-50 background
- OrgSphere logo (indigo dot + wordmark)
- "Welcome back" heading
- Email input with error state
- Password input with show/hide toggle
- Loading spinner on submit button
- "Forgot password?" link
- "or continue with" divider
- "Sign in with Google" button (UI only, no OAuth needed for Phase 1)
- On successful login: dispatch setCredentials to RTK, redirect to /dashboard
- Use React Hook Form + loginSchema from @orgsphere/schemas
- Use TanStack Query useMutation for the API call
- Show error toast on failed login

### app/(app)/layout.tsx
```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
```

### components/layout/Sidebar.tsx
Build the sidebar exactly as specced in ARCHITECTURE.md section 11:
- OrgSphere logo top-left (indigo dot + "OrgSphere" wordmark)
- Width: 240px, fixed, white background, right border gray-100
- Nav sections with labels: ORGANIZATION, MY WORKSPACE, ADMIN
- Nav items: icon (16px lucide) + label, 36px height, rounded-lg hover:bg-gray-100
- Active item: bg-indigo-50 text-indigo-600, left 2px indigo-600 border
- Icons to use:
  - Dashboard: LayoutDashboard
  - Projects: FolderKanban
  - Employees: Users
  - Teams: UsersRound
  - My Dashboard: House
  - My Tasks: CheckSquare
  - My Notes: FileText
  - Settings: Settings (admin only)
- Bottom: user avatar (initials circle) + name + role + logout button
- Use next/link for navigation
- Use usePathname() for active state

### components/layout/Header.tsx
Build the top header:
- Height: 56px, white, border-bottom gray-100
- Left: breadcrumb showing current page name
- Center: search input (placeholder "Search projects, people, teams...")
- Right: bell icon + user avatar (32px circle with initials)
- Use useSelector to get current user from RTK auth state

### app/(app)/dashboard/page.tsx
Build a minimal dashboard page for now:
- "Welcome back, {user.name}" heading (personalized from RTK auth.user)
- 4 stat cards with placeholder numbers (we wire real data in Phase 7)
- Cards: Total Projects, Total Employees, Active Teams, My Open Tasks
- Use the design system: white cards, gray-50 background, indigo accents

---

## STEP 5 — Database setup instructions

Add these instructions to a README.md in /server:

```
## Database Setup

1. Install PostgreSQL 16 locally
2. Create database:
   psql -U postgres -c "CREATE DATABASE orgsphere_db;"
3. Copy .env.example to .env and fill in your postgres password
4. Run migrations:
   npm run migration:run
5. Start dev server:
   npm run dev
```

Also create an initial migration file that creates the users table.

---

## ACCEPTANCE CRITERIA — Phase 1 is complete when:

- [ ] `npm run dev` from root starts both client (port 3000) and server (port 4000)
- [ ] GET http://localhost:4000/api/health returns { status: 'ok' }
- [ ] POST http://localhost:4000/api/auth/register creates a user in PostgreSQL
- [ ] POST http://localhost:4000/api/auth/login returns accessToken + sets httpOnly refresh cookie
- [ ] GET http://localhost:4000/api/auth/me returns current user with valid Bearer token
- [ ] http://localhost:3000/login renders the login page matching Stitch design
- [ ] Logging in with valid credentials redirects to /dashboard
- [ ] /dashboard shows "Welcome back, {name}" with user from RTK store
- [ ] Refreshing /dashboard page re-authenticates via refresh token (no redirect to login)
- [ ] Clicking logout clears auth state and redirects to /login
- [ ] Sidebar renders correctly with all nav items
- [ ] Navigating between pages updates the active sidebar item
- [ ] TypeScript shows zero errors (`tsc --noEmit`)
