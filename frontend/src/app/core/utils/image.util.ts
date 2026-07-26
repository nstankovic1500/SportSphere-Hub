import { environment } from '../../../environments/environment';

const normalizeLegacyImagePath = (relativePath: string) => {
  if (relativePath.includes('/')) {
    return relativePath;
  }

  if (relativePath.startsWith('facility-')) {
    return `facilities/${relativePath}`;
  }

  if (relativePath.startsWith('product-')) {
    return `products/${relativePath}`;
  }

  if (
    relativePath.startsWith('profile-')
    || relativePath.startsWith('avatar-')
    || relativePath === 'default-avatar.png'
  ) {
    return `profiles/${relativePath}`;
  }

  return relativePath;
};

const buildUploadImageUrl = (relativePath: string | null | undefined) => {
  const trimmedPath = relativePath?.trim();

  if (!trimmedPath) {
    return '';
  }

  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }

  const normalizedPath = normalizeLegacyImagePath(trimmedPath).replace(/^\/+/, '');

  return `${environment.backendUrl}/uploads/${normalizedPath}`;
};

export { buildUploadImageUrl };
