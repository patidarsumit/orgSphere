import fs from 'fs'
import path from 'path'
import { Request } from 'express'
import multer from 'multer'

const avatarDir = path.join(__dirname, '../uploads/avatars')

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarDir)
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname).toLowerCase()
    callback(null, `avatar-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true)
    return
  }

  callback(new Error('Only JPEG, PNG and WebP images are allowed'))
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024),
  },
})

