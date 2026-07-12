import type { Photo } from '@/types';

export interface PhotoGroup {
  label: string;
  month: number;
  year: number;
  photos: Photo[];
}

/**
 * Groups photos by month/year for display.
 * Returns groups sorted in reverse chronological order.
 */
export function groupPhotosByMonth(photos: Photo[]): PhotoGroup[] {
  const groups = new Map<string, PhotoGroup>();

  for (const photo of photos) {
    const date = new Date(photo.uploadDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        month: date.getMonth(),
        year: date.getFullYear(),
        photos: [],
      });
    }
    groups.get(key)!.photos.push(photo);
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.year - a.year || b.month - a.month
  );
}
