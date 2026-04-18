import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'
import { env } from '../config/env'

type TokenPayload = {
  id: string
  email: string
  role: string
}

const userRepo = () => AppDataSource.getRepository(User)

const signToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: string
): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] }
  return jwt.sign(payload, secret, options)
}

const generateTokens = (user: User) => {
  const payload = { id: user.id, email: user.email, role: user.role }

  return {
    accessToken: signToken(
      payload,
      env.jwtSecret(),
      env.jwtAccessExpires()
    ),
    refreshToken: signToken(
      payload,
      env.jwtRefreshSecret(),
      env.jwtRefreshExpires()
    ),
  }
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
  created_at: user.created_at.toISOString(),
})

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name: string
      email: string
      password: string
    }
    const repo = userRepo()

    const existing = await repo.findOne({ where: { email } })
    if (existing) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    const password_hash = await bcrypt.hash(password, 12)
    const user = repo.create({ name, email, password_hash, role: 'employee' })
    await repo.save(user)

    const { accessToken, refreshToken } = generateTokens(user)
    setRefreshCookie(res, refreshToken)

    res.status(201).json({ user: sanitizeUser(user), accessToken })
  } catch {
    res.status(500).json({ message: 'Server error during registration' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string }
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
    setRefreshCookie(res, refreshToken)

    res.json({ user: sanitizeUser(user), accessToken })
  } catch {
    res.status(500).json({ message: 'Server error during login' })
  }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token as string | undefined
    if (!token) {
      res.status(401).json({ message: 'No refresh token' })
      return
    }

    const decoded = jwt.verify(token, env.jwtRefreshSecret()) as TokenPayload
    const repo = userRepo()
    const user = await repo.findOne({ where: { id: decoded.id, is_active: true } })

    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    const { accessToken, refreshToken } = generateTokens(user)
    setRefreshCookie(res, refreshToken)

    res.json({ accessToken, user: sanitizeUser(user) })
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
}

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('refresh_token')
  res.json({ message: 'Logged out successfully' })
}

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'No authenticated user' })
      return
    }

    const repo = userRepo()
    const user = await repo.findOne({ where: { id: req.user.id, is_active: true } })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.json({ user: sanitizeUser(user) })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
