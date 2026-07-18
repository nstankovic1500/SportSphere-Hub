import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown;

const asyncHandler = (handler: AsyncController): RequestHandler => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export { asyncHandler };
