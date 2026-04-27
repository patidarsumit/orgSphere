import { NextFunction, Request, Response } from 'express'

export class HttpError extends Error {
  statusCode: number
  code: string
  details?: unknown

  constructor(statusCode: number, message: string, code = 'REQUEST_FAILED', details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const asyncHandler =
  <TReq extends Request = Request, TRes extends Response = Response>(
    handler: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>
  ) =>
  (req: TReq, res: TRes, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.path} not found`,
  })
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const isHttpError = error instanceof HttpError
  const statusCode = isHttpError ? error.statusCode : 500
  const requestId = res.getHeader('X-Request-Id')

  if (statusCode >= 500) {
    console.error(error)
  }

  res.status(statusCode).json({
    code: isHttpError ? error.code : 'INTERNAL_SERVER_ERROR',
    message: isHttpError ? error.message : 'Internal server error',
    ...(isHttpError && error.details ? { details: error.details } : {}),
    ...(requestId ? { requestId } : {}),
  })
}
