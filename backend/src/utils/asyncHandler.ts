import type { Request, Response, NextFunction, RequestHandler } from 'express'

type MaybeAsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => unknown

export const asyncHandler =
  (fn: MaybeAsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
