import { BASE_URL } from '../services/apiClient';

/**
 * Normalizes image paths from Cloudinary or local uploads to complete, loadable URLs.
 */
export const getFullImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};
