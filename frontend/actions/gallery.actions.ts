'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface PhotoResponse {
  id: number;
  imageUrl: string;
  image: { url: string }; // Compatibility with gallery page
  uploadDate: string;
  eventTag: string | null;
  user: { id: number; displayName: string };
  albumId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface AlbumResponse {
  id: number;
  name: string;
  photoCount: number;
  coverUrl: string | null;
  photos: PhotoResponse[];
  createdAt: string;
  updatedAt: string;
}

interface GetPhotosResult {
  success: boolean;
  error?: string;
  data?: PhotoResponse[];
}

interface UploadPhotoResult {
  success: boolean;
  error?: string;
  data?: PhotoResponse;
}

interface UploadBatchResult {
  success: boolean;
  error?: string;
  data?: PhotoResponse[];
}

interface GetAlbumsResult {
  success: boolean;
  error?: string;
  data?: AlbumResponse[];
}

interface CreateAlbumResult {
  success: boolean;
  error?: string;
  data?: { id: number; name: string };
}

/**
 * Fetches all photos from both users in reverse chronological order.
 */
export async function getPhotos(): Promise<GetPhotosResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const photos = await prisma.photo.findMany({
      orderBy: { uploadDate: 'desc' },
      include: { user: { select: { id: true, displayName: true } } },
    });

    const mapped: PhotoResponse[] = photos.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      image: { url: p.imageUrl },
      uploadDate: p.uploadDate.toISOString().split('T')[0],
      eventTag: p.eventTag,
      user: { id: p.user.id, displayName: p.user.displayName },
      albumId: p.albumId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch photos. Please try again.',
    };
  }
}

/**
 * Uploads a single photo to Cloudinary and creates a photo record.
 * @param formData - FormData containing the file under 'files' key
 * @param eventTag - Optional event/album tag for the photo
 */
export async function uploadPhoto(
  formData: FormData,
  eventTag?: string
): Promise<UploadPhotoResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const file = formData.get('files') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadToCloudinary(buffer, 'daybyday/gallery');

    const photo = await prisma.photo.create({
      data: {
        imageUrl: uploadResult.url,
        uploadDate: new Date(),
        eventTag: eventTag || null,
        userId: user.id,
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    return {
      success: true,
      data: {
        id: photo.id,
        imageUrl: photo.imageUrl,
        image: { url: photo.imageUrl },
        uploadDate: photo.uploadDate.toISOString().split('T')[0],
        eventTag: photo.eventTag,
        user: { id: photo.user.id, displayName: photo.user.displayName },
        albumId: photo.albumId,
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to upload photo. Please try again.',
    };
  }
}

/**
 * Handles batch upload of multiple files.
 * Iterates over all file entries in the FormData and uploads each one.
 * @param formData - FormData containing multiple files under 'files' key
 * @param eventTag - Optional event/album tag for all photos in the batch
 */
export async function uploadBatch(
  formData: FormData,
  eventTag?: string
): Promise<UploadBatchResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const files = formData.getAll('files');
    const uploadedPhotos: PhotoResponse[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToCloudinary(buffer, 'daybyday/gallery');

        const photo = await prisma.photo.create({
          data: {
            imageUrl: uploadResult.url,
            uploadDate: new Date(),
            eventTag: eventTag || null,
            userId: user.id,
          },
          include: { user: { select: { id: true, displayName: true } } },
        });

        uploadedPhotos.push({
          id: photo.id,
          imageUrl: photo.imageUrl,
          image: { url: photo.imageUrl },
          uploadDate: photo.uploadDate.toISOString().split('T')[0],
          eventTag: photo.eventTag,
          user: { id: photo.user.id, displayName: photo.user.displayName },
          albumId: photo.albumId,
          createdAt: photo.createdAt.toISOString(),
          updatedAt: photo.updatedAt.toISOString(),
        });
      } catch {
        // Skip failed uploads, continue with rest
        continue;
      }
    }

    if (uploadedPhotos.length === 0 && files.length > 0) {
      return { success: false, error: 'All uploads failed. Please try again.' };
    }

    return { success: true, data: uploadedPhotos };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to upload photos. Please try again.',
    };
  }
}

/**
 * Fetches all albums with photo count and first photo thumbnail.
 */
export async function getAlbums(): Promise<GetAlbumsResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const albums = await prisma.album.findMany({
      include: {
        photos: {
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { uploadDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped: AlbumResponse[] = albums.map((album) => ({
      id: album.id,
      name: album.name,
      photoCount: album.photos.length,
      coverUrl: album.photos.length > 0 ? album.photos[0].imageUrl : null,
      photos: album.photos.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        image: { url: p.imageUrl },
        uploadDate: p.uploadDate.toISOString().split('T')[0],
        eventTag: p.eventTag,
        user: { id: p.user.id, displayName: p.user.displayName },
        albumId: p.albumId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch albums. Please try again.',
    };
  }
}

/**
 * Uploads a photo to a specific album.
 * @param formData - FormData containing the file under 'files' key
 * @param albumId - The album to upload into
 */
export async function uploadToAlbum(
  formData: FormData,
  albumId: number
): Promise<UploadBatchResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const files = formData.getAll('files');
    const uploadedPhotos: PhotoResponse[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToCloudinary(buffer, 'daybyday/gallery');

        const photo = await prisma.photo.create({
          data: {
            imageUrl: uploadResult.url,
            uploadDate: new Date(),
            eventTag: null,
            userId: user.id,
            albumId: albumId,
          },
          include: { user: { select: { id: true, displayName: true } } },
        });

        uploadedPhotos.push({
          id: photo.id,
          imageUrl: photo.imageUrl,
          image: { url: photo.imageUrl },
          uploadDate: photo.uploadDate.toISOString().split('T')[0],
          eventTag: photo.eventTag,
          user: { id: photo.user.id, displayName: photo.user.displayName },
          albumId: photo.albumId,
          createdAt: photo.createdAt.toISOString(),
          updatedAt: photo.updatedAt.toISOString(),
        });
      } catch {
        continue;
      }
    }

    if (uploadedPhotos.length === 0 && files.length > 0) {
      return { success: false, error: 'All uploads failed. Please try again.' };
    }

    return { success: true, data: uploadedPhotos };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to upload photos to album. Please try again.',
    };
  }
}

/**
 * Creates a new album with the given name.
 * @param name - User-defined album name
 */
export async function createAlbum(name: string): Promise<CreateAlbumResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const album = await prisma.album.create({
      data: { name },
    });

    return {
      success: true,
      data: { id: album.id, name: album.name },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to create album. Please try again.',
    };
  }
}

/**
 * Deletes a photo by ID.
 * Only the photo owner can delete it.
 */
export async function deletePhoto(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Verify ownership
    const photo = await prisma.photo.findFirst({
      where: { id, userId: user.id },
    });

    if (!photo) {
      return { success: false, error: 'Photo not found or you do not have permission to delete it' };
    }

    await prisma.photo.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to delete photo. Please try again.',
    };
  }
}
