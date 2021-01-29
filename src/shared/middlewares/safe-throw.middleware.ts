import { NextFunction, Request, Response } from 'express';

/**
 * Wraps the function and safely passes the error to custom error handler, so the error can be sent to client
 * @param handler
 */
export default function safeThrow(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
