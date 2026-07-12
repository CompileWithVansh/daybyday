'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createEntry, updateEntry, getEntryById, uploadMedia } from '@/actions/diary.actions';
import { formatDateISO } from '@/lib/utils';

interface ExistingEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: Array<{ id: number; url: string; name: string }>;
  voiceNote: { id: number; url: string; name: string } | null;
}

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🤗', label: 'Grateful' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🥳', label: 'Excited' },
];

const weathers = [
  { emoji: '☀️', label: 'Sunny' },
  { emoji: '⛅', label: 'Cloudy' },
  { emoji: '🌧️', label: 'Rainy' },
  { emoji: '❄️', label: 'Snowy' },
  { emoji: '🌙', label: 'Night' },
  { emoji: '🌈', label: 'Rainbow' },
];

export default function DiaryEntryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = params.id as string;
  const isNew = idParam === 'new';
  const isReadonly = searchParams.get('readonly') === 'true';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [existingEntry, setExistingEntry] = useState<ExistingEntry | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: number; url: string; name: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice note state
  const [voiceNote, setVoiceNote] = useState<{ id: number; url: string; name: string } | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Load existing entry by ID
  useEffect(() => {
    if (isNew) return;

    async function loadEntry() {
      const entryId = parseInt(idParam, 10);
      if (isNaN(entryId)) {
        setError('Invalid entry ID');
        setLoading(false);
        return;
      }

      const result = await getEntryById(entryId);
      if (result.success && result.data) {
        const entry = result.data;
        setExistingEntry({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          weather: entry.weather,
          images: entry.images || [],
          voiceNote: entry.voiceNote || null,
        });
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setMood(entry.mood || '');
        setWeather(entry.weather || '');
        setDate(entry.date);
        setUploadedImages(entry.images || []);
        setVoiceNote(entry.voiceNote || null);
      } else {
        setError(result.error || 'Entry not found');
      }
      setLoading(false);
    }
    loadEntry();
  }, [idParam, isNew]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append('files', file);

    const result = await uploadMedia(formData);
    if (result.success && result.data) {
      setUploadedImages((prev) => [
        ...prev,
        { id: result.data!.id, url: result.data!.url, name: result.data!.name },
      ]);
    } else {
      setError(result.error || 'Failed to upload image');
    }

    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setUploadingVoice(true);
        const formData = new FormData();
        formData.append('files', audioBlob, `voice-note-${date}.webm`);

        const result = await uploadMedia(formData);
        if (result.success && result.data) {
          setVoiceNote({ id: result.data.id, url: result.data.url, name: result.data.name });
        } else {
          setError(result.error || 'Failed to upload voice note');
        }
        setUploadingVoice(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Voice file upload fallback
  const handleVoiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVoice(true);
    setError(null);

    const formData = new FormData();
    formData.append('files', file);

    const result = await uploadMedia(formData);
    if (result.success && result.data) {
      setVoiceNote({ id: result.data.id, url: result.data.url, name: result.data.name });
    } else {
      setError(result.error || 'Failed to upload voice note');
    }

    setUploadingVoice(false);
    if (voiceInputRef.current) voiceInputRef.current.value = '';
  };

  // Save entry
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (existingEntry) {
        const result = await updateEntry(existingEntry.id, {
          title,
          content,
          mood,
          weather,
          images: uploadedImages.map((img) => img.id),
          voiceNote: voiceNote?.id || null,
        });

        if (!result.success) {
          setError(result.error || 'Failed to update entry');
        } else {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } else {
        const result = await createEntry({
          date,
          title,
          content,
          mood,
          weather,
          user: 0,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create entry');
        } else {
          setSuccess(true);
          if (result.data) {
            setExistingEntry({
              id: result.data.id,
              title: result.data.title,
              content: result.data.content,
              mood: result.data.mood,
              weather: result.data.weather,
              images: result.data.images || [],
              voiceNote: result.data.voiceNote || null,
            });
            // Update the URL to the new entry's ID without a full reload
            window.history.replaceState(null, '', `/diary/${result.data.id}`);
          }
          setTimeout(() => setSuccess(false), 3000);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.p
          className="text-pink-400 font-cursive text-lg"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Opening your diary...
        </motion.p>
      </div>
    );
  }

  // Format date nicely for the header
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="diary-bg min-h-screen">
      {/* Floating hearts background (subtle) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="floating-heart absolute text-pink-200 text-lg"
            style={{
              left: `${15 + i * 25}%`,
              animationDelay: `${i * 1.5}s`,
              bottom: '-20px',
            }}
          >
            ♡
          </span>
        ))}
      </div>

      <div className="relative z-10 p-4 pb-28 space-y-5 max-w-lg mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.push('/diary')}
            className="text-pink-500 hover:text-pink-700 transition-colors flex items-center gap-1 min-h-[44px]"
            aria-label="Back to diary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </button>
          {isReadonly && (
            <span className="text-xs bg-pink-200 text-pink-700 px-3 py-1 rounded-full font-medium">
              Read Only
            </span>
          )}
        </div>

        {/* Beautiful date header */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-cursive text-3xl sm:text-4xl text-pink-700">
            {formattedDate}
          </h1>
          <p className="text-pink-400 text-sm">
            {isReadonly ? 'From your partner, with love...' : 'Dear Diary...'}
          </p>
        </motion.div>

        {/* Title Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {isReadonly ? (
            title && (
              <h2 className="font-cursive text-2xl text-pink-800 text-center border-b border-pink-200 pb-2">
                {title}
              </h2>
            )
          ) : (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this entry a title..."
              className="w-full text-xl font-cursive text-pink-800 placeholder:text-pink-300 bg-transparent border-0 border-b-2 border-pink-200 focus:border-pink-400 outline-none py-2 px-1 transition-colors text-center"
              aria-label="Entry title"
            />
          )}
        </motion.div>

        {/* Mood Selector */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-semibold text-pink-700">How are you feeling?</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {moods.map((m) => (
              <button
                key={m.emoji}
                type="button"
                onClick={() => !isReadonly && setMood(m.emoji)}
                disabled={isReadonly}
                className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all ${
                  mood === m.emoji
                    ? 'bg-pink-100 scale-110 mood-selected'
                    : 'bg-white hover:bg-pink-50 border border-pink-100'
                } ${isReadonly ? 'cursor-default' : ''}`}
                aria-label={`Mood: ${m.label}`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[9px] text-pink-500 font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Weather Selector */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm font-semibold text-pink-700">Weather today</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {weathers.map((w) => (
              <button
                key={w.emoji}
                type="button"
                onClick={() => !isReadonly && setWeather(w.emoji)}
                disabled={isReadonly}
                className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all ${
                  weather === w.emoji
                    ? 'bg-pink-100 scale-110 mood-selected'
                    : 'bg-white hover:bg-pink-50 border border-pink-100'
                } ${isReadonly ? 'cursor-default' : ''}`}
                aria-label={`Weather: ${w.label}`}
              >
                <span className="text-2xl">{w.emoji}</span>
                <span className="text-[9px] text-pink-500 font-medium">{w.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Diary Textarea */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isReadonly ? (
            <div className="diary-textarea whitespace-pre-wrap min-h-[200px]">
              {content || 'No content'}
            </div>
          ) : (
            <textarea
              id="diary-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dear Diary..."
              rows={8}
              className="diary-textarea"
              aria-label="Diary entry content"
            />
          )}
        </motion.div>

        {/* Image Upload — Polaroid style */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-sm font-semibold text-pink-700">Memories 📸</label>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-4 justify-center py-2">
              {uploadedImages.map((img, index) => (
                <motion.div
                  key={img.id}
                  className="polaroid relative"
                  initial={{ opacity: 0, scale: 0.8, rotate: index % 2 === 0 ? -3 : 3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)` }}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-24 h-24 object-cover rounded-sm"
                  />
                  {!isReadonly && (
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((i) => i.id !== img.id))}
                      className="absolute -top-2 -right-2 bg-pink-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-md"
                      aria-label={`Remove image ${img.name}`}
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!isReadonly && (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full py-3 px-4 bg-white border-2 border-dashed border-pink-200 rounded-xl text-pink-500 font-medium hover:bg-pink-50 transition-all text-sm flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    ⏳
                  </motion.span>
                ) : (
                  '📷'
                )}
                {uploadingImage ? 'Uploading...' : 'Add Photo'}
              </button>
            </>
          )}
        </motion.div>

        {/* Voice Note */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="text-sm font-semibold text-pink-700">Voice Note 🎙️</label>

          {voiceNote ? (
            <motion.div
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-pink-100 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.span
                className="text-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🎙️
              </motion.span>
              <div className="flex-1">
                <p className="text-sm text-pink-700 font-medium truncate">{voiceNote.name}</p>
                {/* Mini waveform visualization */}
                <div className="flex items-end gap-0.5 h-4 mt-1">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-pink-300 rounded-full"
                      animate={{ height: [4, 8 + Math.random() * 8, 4] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
              {!isReadonly && (
                <button
                  type="button"
                  onClick={() => setVoiceNote(null)}
                  className="text-pink-400 hover:text-pink-600 text-xs font-medium min-h-[44px] px-2"
                  aria-label="Remove voice note"
                >
                  Remove
                </button>
              )}
            </motion.div>
          ) : !isReadonly ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={uploadingVoice}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? 'bg-pink-500 text-white animate-pulse'
                    : 'bg-white border border-pink-200 text-pink-600 hover:bg-pink-50'
                }`}
              >
                {isRecording ? '⏹️ Stop' : '🎙️ Record'}
              </button>

              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*"
                onChange={handleVoiceFileUpload}
                className="hidden"
                id="voice-upload"
              />
              <button
                type="button"
                onClick={() => voiceInputRef.current?.click()}
                disabled={uploadingVoice || isRecording}
                className="py-3 px-4 bg-white border border-pink-200 rounded-xl text-pink-600 font-medium text-sm hover:bg-pink-50 transition-all"
              >
                {uploadingVoice ? '⏳' : '📁 Upload'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-pink-400 italic">No voice note</p>
          )}

          {isRecording && (
            <motion.p
              className="text-sm text-pink-500 text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🔴 Recording...
            </motion.p>
          )}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-pink-50 border border-pink-200 rounded-xl"
            >
              <p className="text-sm text-pink-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 bg-green-50 border border-green-200 rounded-xl text-center"
            >
              <p className="text-sm text-green-700">Saved with love! 💕</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button — only when not readonly */}
        {!isReadonly && (
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-60"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                💫
              </motion.span>
            ) : (
              <span>💕</span>
            )}
            {saving ? 'Saving...' : 'Save with love'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
