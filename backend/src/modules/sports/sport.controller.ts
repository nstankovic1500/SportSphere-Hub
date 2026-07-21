import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { getActiveSports } from './sport.service';

const getSportsController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getActiveSports();

  res.status(200).json({
    success: true,
    data,
  });
});

export { getSportsController };
