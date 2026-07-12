'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getPhotos,
  uploadBatch,
  createAlbum,
  getAlbums,
  deletePhoto,
  uploadToAlbum,
} from '@/actions/gallery.actions';
import { groupPhotosByMonth, type PhotoGroup } from '@/lib/gallery';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import type { Photo } from '@/types';

interface Album {
  id: number;
  name: string;
  photoCount: number;
  coverUrl: string | null;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    const [photosResult, albumsResult] = await Promise.all([
      getPhotos(),
      getAlbums(),
    ]);

    if (photosResult.success && photosResult.data) {
      const photoData = photosResult.data as unknown as Photo[];
      setPhotos(photoData);
      setGroups(groupPhotosByMonth(photoData));
    } else {
      setError(photosResult.error || 'Failed to load photos');
    }

    if (albumsResult.success && albumsResult.data) {
      setAlbums(albumsResult.data as unknown as Album[]);
    }

    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    let result;
    if (activeAlbum) {
      result = await uploadToAlbum(formData, activeAlbum.id);
    } else {
      result = await uploadBatch(formData);
    }

    if (result.success) {
      await fetchAll();
      // Refresh active album data if inside one
      if (activeAlbum) {
        const albumsResult = await getAlbums();
        if (albumsResult.success && albumsResult.data) {
          const updatedAlbums = albumsResult.data as unknown as Album[];
          setAlbums(updatedAlbums);
          const updated = updatedAlbums.find((a) => a.id === activeAlbum.id);
          if (updated) setActiveAlbum(updated);
        }
      }
    } else {
      setError(result.error || 'Upload failed');
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleCreateAlbum() {
    if (!albumName.trim()) return;

    setCreatingAlbum(true);
    setError(null);

    const result = await createAlbum(albumName.trim());
    if (result.success) {
      setAlbumName('');
      setShowAlbumModal(false);
      setSuccessMsg(`Album "${albumName.trim()}" created!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      // Refresh albums to show the new one
      const albumsResult = await getAlbums();
      if (albumsResult.success && albumsResult.data) {
        setAlbums(albumsResult.data as unknown as Album[]);
      }
    } else {
      setError(result.error || 'Failed to create album');
    }

    setCreatingAlbum(false);
  }

  function getImageUrl(photo: Photo): string {
    return photo.imageUrl || photo.image?.url || '';
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-pink-400 text-lg">Loading gallery...</div>
      </div>
    );
  }

  // Album detail view
  if (activeAlbum) {
    return (
      <PageTransition>
        <div className="p-4 max-w-6xl mx-auto">
          {/* Album header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveAlbum(null)}
              className="text-pink-600 hover:text-pink-800 transition-colors text-2xl"
              aria-label="Back to gallery"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-pink-900">
              {activeAlbum.name}
            </h1>
            <span className="text-pink-400 text-sm">
              {activeAlbum.photos.length} photo{activeAlbum.photos.length !== 1 ? 's' : ''}
            </span>
            <div className="ml-auto">
              <PinkButton
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload to Album'}
              </PinkButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
                aria-label="Select photos to upload to album"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Empty album state */}
          {activeAlbum.photos.length === 0 && (
            <PinkCard className="text-center py-12">
              <p className="text-4xl mb-3">📁</p>
              <p className="text-pink-400 text-lg mb-2">This album is empty</p>
              <p className="text-pink-300 text-sm">
                Upload photos to this album to get started
              </p>
            </PinkCard>
          )}

          {/* Album photos grid */}
          {activeAlbum.photos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {activeAlbum.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="aspect-square rounded-lg overflow-hidden border border-pink-100 hover:border-pink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
                  aria-label={`View photo${photo.eventTag ? ` from ${photo.eventTag}` : ''}`}
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.eventTag || 'Album photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {selectedPhoto && (
            <LightBox
              photo={selectedPhoto}
              getImageUrl={getImageUrl}
              deleting={deleting}
              onClose={() => setSelectedPhoto(null)}
              onDelete={async () => {
                setDeleting(true);
                const result = await deletePhoto(selectedPhoto.id);
                if (result.success) {
                  setSelectedPhoto(null);
                  await fetchAll();
                  // Refresh active album
                  const albumsResult = await getAlbums();
                  if (albumsResult.success && albumsResult.data) {
                    const updatedAlbums = albumsResult.data as unknown as Album[];
                    setAlbums(updatedAlbums);
                    const updated = updatedAlbums.find((a) => a.id === activeAlbum.id);
                    if (updated) setActiveAlbum(updated);
                  }
                } else {
                  setError(result.error || 'Failed to delete');
                }
                setDeleting(false);
              }}
            />
          )}
        </div>
      </PageTransition>
    );
  }

  // Main gallery view
  return (
    <PageTransition>
      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-pink-900">Gallery</h1>
          <div className="flex gap-2">
            <PinkButton
              variant="secondary"
              onClick={() => setShowAlbumModal(true)}
            >
              + Album
            </PinkButton>
            <PinkButton
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </PinkButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              aria-label="Select photos to upload"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMsg}
          </div>
        )}

        {/* Albums section */}
        {albums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-pink-800 mb-3">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setActiveAlbum(album)}
                  className="group rounded-2xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100/70 hover:border-pink-300 transition-all p-4 text-left focus:outline-none focus:ring-2 focus:ring-pink-300"
                  aria-label={`Open album ${album.name}`}
                >
                  {/* Thumbnail or folder icon */}
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-pink-100 flex items-center justify-center">
                    {album.coverUrl ? (
                      <img
                        src={album.coverUrl}
                        alt={album.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl">📁</span>
                    )}
                  </div>
                  {/* Album info */}
                  <p className="text-sm font-medium text-pink-900 truncate">
                    {album.name}
                  </p>
                  <p className="text-xs text-pink-400">
                    {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All Photos section */}
        {photos.length === 0 && albums.length === 0 && !error && (
          <PinkCard className="text-center py-12">
            <p className="text-pink-400 text-lg mb-2">No photos yet</p>
            <p className="text-pink-300 text-sm">
              Upload your first photo to get started
            </p>
          </PinkCard>
        )}

        {groups.map((group) => (
          <section key={`${group.year}-${group.month}`} className="mb-8">
            <h2 className="text-lg font-semibold text-pink-800 mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {group.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="aspect-square rounded-lg overflow-hidden border border-pink-100 hover:border-pink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
                  aria-label={`View photo${photo.eventTag ? ` from ${photo.eventTag}` : ''}`}
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.eventTag || 'Gallery photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Lightbox */}
        {selectedPhoto && (
          <LightBox
            photo={selectedPhoto}
            getImageUrl={getImageUrl}
            deleting={deleting}
            onClose={() => setSelectedPhoto(null)}
            onDelete={async () => {
              setDeleting(true);
              const result = await deletePhoto(selectedPhoto.id);
              if (result.success) {
                setSelectedPhoto(null);
                await fetchAll();
              } else {
                setError(result.error || 'Failed to delete');
              }
              setDeleting(false);
            }}
          />
        )}

        {/* Album creation modal */}
        {showAlbumModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAlbumModal(false)}
            role="dialog"
            aria-label="Create album"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <PinkCard className="w-full max-w-sm">
                <h3 className="text-lg font-semibold text-pink-900 mb-4">
                  Create Album
                </h3>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Album name"
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 mb-4"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateAlbum();
                  }}
                  aria-label="Album name"
                />
                <div className="flex gap-2 justify-end">
                  <PinkButton
                    variant="ghost"
                    onClick={() => {
                      setShowAlbumModal(false);
                      setAlbumName('');
                    }}
                  >
                    Cancel
                  </PinkButton>
                  <PinkButton
                    onClick={handleCreateAlbum}
                    disabled={creatingAlbum || !albumName.trim()}
                  >
                    {creatingAlbum ? 'Creating...' : 'Create'}
                  </PinkButton>
                </div>
              </PinkCard>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

/** Reusable lightbox component with download and delete */
function LightBox({
  photo,
  getImageUrl,
  deleting,
  onClose,
  onDelete,
}: {
  photo: Photo;
  getImageUrl: (p: Photo) => string;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Photo lightbox"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getImageUrl(photo)}
          alt={photo.eventTag || 'Gallery photo'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        {/* Top right: download + delete + close */}
        <div className="absolute top-3 right-3 flex gap-2">
          <a
            href={getImageUrl(photo)}
            download={`daybyday-${photo.id}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/40 backdrop-blur-sm text-white/70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white hover:text-pink-600 transition-all text-sm"
            aria-label="Download photo"
            onClick={(e) => e.stopPropagation()}
          >
            📥
          </a>
          <button
            onClick={() => {
              if (!confirm('Delete this photo?')) return;
              onDelete();
            }}
            disabled={deleting}
            className="bg-black/40 backdrop-blur-sm text-white/70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-sm"
            aria-label="Delete photo"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            className="bg-black/40 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 transition-all font-bold text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
