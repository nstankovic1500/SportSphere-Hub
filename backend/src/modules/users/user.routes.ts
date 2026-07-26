import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { runUploadMiddleware } from '../../middleware/upload.middleware';
import { createUploader } from '../../config/upload';
import { updateProfileImage } from './user.controller';

const userRouter = Router();
const profileUpload = createUploader('profiles');

userRouter.use(authMiddleware);
userRouter.patch(
  '/profile-image',
  runUploadMiddleware(profileUpload.single('profileImage')),
  updateProfileImage,
);

export { userRouter };
