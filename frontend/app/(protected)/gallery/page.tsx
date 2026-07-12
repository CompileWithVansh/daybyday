'use client';

import { useEffect, useState, useRef } from 'react';
import { getPhotos, uploadBatch, createAlbum, deletePhoto } from '@/actions/gallery.actions';
import { groupPhotosByMonth, type PhotoGroup } from '@/lib/gallery';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import type { Photo } from '@/types';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    setLoading(true);
    setError(null);
    const result = await getPhotos();
    if (result.success && result.data) {
      const photoData = result.data as unknown as Photo[];
      setPhotos(photoData);
      setGroups(groupPhotosByMonth(photoData));
    } else {
      setError(result.error || 'Failed to load photos');
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

    const result = await uploadBatch(formData);
    if (result.success) {
      await fetchPhotos();
    } else {
      setError(result.error || 'Upload failed');
    }

    setUploading(false);
    // Reset file input
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
    } else {
      setError(result.error || 'Failed to create album');
    }

    setCreatingAlbum(false);
  }

  function getImageUrl(photo: Photo): string {
    // Prisma stores the URL directly in imageUrl, with an image compatibility layer
    return photo.imageUrl || photo.image?.url || '';
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-pink-400 text-lg">Loading gallery...</div>
      </div>
    );
  }

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

      {/* Empty state */}
      {photos.length === 0 && !error && (
        <PinkCard className="text-center py-12">
          <p className="text-pink-400 text-lg mb-2">No photos yet</p>
          <p className="text-pink-300 text-sm">
            Upload your first photo to get started
          </p>
        </PinkCard>
      )}

      {/* Photo groups by month */}
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

      {/* Lightbox with delete and download options */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-label="Photo lightbox"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(selectedPhoto)}
              alt={selectedPhoto.eventTag || 'Gallery photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {/* Top right: small delete + close */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={async () => {
                  if (!confirm('Delete this photo?')) return;
                  setDeleting(true);
                  const result = await deletePhoto(selectedPhoto.id);
                  if (result.success) {
                    setSelectedPhoto(null);
                    await fetchPhotos();
                  } else {
                    setError(result.error || 'Failed to delete');
                  }
                  setDeleting(false);
                }}
                disabled={deleting}
                className="bg-black/40 backdrop-blur-sm text-white/70 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-sm"
                aria-label="Delete photo"
              >
                🗑️
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="bg-black/40 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 transition-all font-bold text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {/* Download button — bottom center, main action */}
            <a
              href={getImageUrl(selectedPhoto)}
              download={`daybyday-${selectedPhoto.id}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-pink-600 px-6 py-3 rounded-2xl font-medium hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              📥 Download
            </a>
          </div>
        </div>
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
