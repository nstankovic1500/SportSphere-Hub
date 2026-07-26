import { Router } from 'express';

import { createUploader } from '../../config/upload';
import { authMiddleware } from '../../middleware/auth.middleware';
import { runUploadMiddleware } from '../../middleware/upload.middleware';
import {
  adminLogin,
  currentUser,
  forgotPassword,
  login,
  register,
  resetPassword,
} from './auth.controller';

const authRouter = Router();
const profileUpload = createUploader('profiles');

authRouter.post('/adminLogin', adminLogin);
authRouter.post('/login', login);
authRouter.post(
  '/register',
  runUploadMiddleware(profileUpload.single('profileImage')),
  register,
);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
authRouter.get('/current', authMiddleware, currentUser);

export { authRouter };
