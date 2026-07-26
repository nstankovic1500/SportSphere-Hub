import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { asyncHandler } from '../../utils/asyncHandler';
import { updateProfileImage as updateProfileImageService } from './user.service';

const updateProfileImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.auth?.userId);
  const data = await updateProfileImageService(userId, req.file);

  res.status(200).json({
    success: true,
    data,
  });
});

export { updateProfileImage };
