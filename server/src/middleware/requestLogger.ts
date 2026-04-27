import { randomUUID } from 'crypto'
import { performance } from 'perf_hooks'
import { NextFunction, Request, Response } from 'express'

export interface RequestWithId extends Request {
  id?: string
}

const getRequestId = (req: Request) => {
  const headerValue = req.header('x-request-id')
  return headerValue && headerValue.trim().length > 0 ? headerValue.trim() : randomUUID()
}

export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction) => {
  const requestId = getRequestId(req)
  const startedAt = performance.now()

  req.id = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt)
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms request_id=${requestId}`

    if (res.statusCode >= 500) {
      console.error(message)
      return
    }

    if (res.statusCode >= 400) {
      console.warn(message)
      return
    }

    console.info(message)
  })

  next()
}
