import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import multer from 'multer';

import { AppError } from '../utils/AppError';

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', '..', 'uploads');
const PROFILE_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'profiles');
const FACILITY_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'facilities');
const PRODUCT_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'products');
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

for (const directory of [UPLOAD_ROOT, PROFILE_UPLOAD_DIR, FACILITY_UPLOAD_DIR, PRODUCT_UPLOAD_DIR]) {
  fs.mkdirSync(directory, { recursive: true });
}

const createUploader = (folderName: 'profiles' | 'facilities' | 'products') =>
  multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, path.join(UPLOAD_ROOT, folderName));
      },
      filename: (_req, file, callback) => {
        const extension = MIME_TO_EXTENSION[file.mimetype] ?? '';
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    limits: {
      fileSize: MAX_UPLOAD_SIZE,
    },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        callback(new AppError('Only jpeg, png and webp image formats are allowed', 400));
        return;
      }

      callback(null, true);
    },
  });

export {
  FACILITY_UPLOAD_DIR,
  MAX_UPLOAD_SIZE,
  PRODUCT_UPLOAD_DIR,
  PROFILE_UPLOAD_DIR,
  UPLOAD_ROOT,
  createUploader,
};
