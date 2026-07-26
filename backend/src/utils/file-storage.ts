import fs from 'fs/promises';
import path from 'path';

import { UPLOAD_ROOT } from '../config/upload';

const MANAGED_UPLOAD_FOLDERS = new Set(['profiles', 'facilities', 'products']);
const DEFAULT_PROFILE_IMAGE = 'profiles/default-avatar.png';

const isManagedUploadPath = (relativePath: string) => {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const [folderName] = normalizedPath.split('/');

  return MANAGED_UPLOAD_FOLDERS.has(folderName ?? '');
};

const toUploadAbsolutePath = (relativePath: string) => {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = path.resolve(UPLOAD_ROOT, normalizedPath);

  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    return null;
  }

  return absolutePath;
};

const safeDeleteFile = async (relativePath: string | undefined | null) => {
  if (!relativePath || !isManagedUploadPath(relativePath)) {
    return;
  }

  const absolutePath = toUploadAbsolutePath(relativePath);

  if (!absolutePath) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error: unknown) {
    if (!(typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT')) {
      throw error;
    }
  }
};

export {
  DEFAULT_PROFILE_IMAGE,
  isManagedUploadPath,
  safeDeleteFile,
};
