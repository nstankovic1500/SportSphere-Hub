import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { DEFAULT_PROFILE_IMAGE, safeDeleteFile } from '../../utils/file-storage';

const updateProfileImage = async (userId: string, file: Express.Multer.File | undefined) => {
  if (!file) {
    throw new AppError('profileImage file is required', 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    await safeDeleteFile(`profiles/${file.filename}`);
    throw new AppError('User not found', 404);
  }

  const previousProfileImage = user.profileImage;
  const nextProfileImage = `profiles/${file.filename}`;

  try {
    user.profileImage = nextProfileImage;
    await user.save();
  } catch (error) {
    await safeDeleteFile(nextProfileImage);
    throw error;
  }

  if (previousProfileImage && previousProfileImage !== DEFAULT_PROFILE_IMAGE) {
    await safeDeleteFile(previousProfileImage);
  }

  return {
    imagePath: nextProfileImage,
  };
};

export { updateProfileImage };
