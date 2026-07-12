'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getAnnotations, getMonthSummary, markDate, addEmoji, updateAnnotation } from '@/actions/calendar.actions';
import { PageTransition } from '@/components/PageTransition';

interface AnnotationData {
  id: number;
  date: string;
  completed: boolean;
  emojis: string;
  note: string;
  user: { id: number; displayName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface MonthSummary {
  completedDays: number;
  emojiDays: number;
  noteDays: number;
  annotations: AnnotationData[];
}

const EMOJI_OPTIONS = ['😊', '😢', '😍', '😤', '🥺', '❤️', '🎂', '✈️', '📸', '🎉'];

export default function CalendarPage() {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalCompleted, setModalCompleted] = useState(false);
  const [modalEmojis, setModalEmojis] = useState<string[]>([]);
  const [modalNote, setModalNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchAnnotations = useCallback(async (month: number, year: number) => {
    setLoading(true);
    const result = await getAnnotations(month, year);
    if (result.success && result.data) {
      setAnnotations(result.data);
    }
    setLoading(false);
  }, []);

  const fetchSummary = useCallback(async (month: number, year: number) => {
    const now = new Date();
    const isCurrentOrFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1);

    if (!isCurrentOrFuture) {
      const result = await getMonthSummary(month, year);
      if (result.success && result.data) {
        setMonthSummary(result.data);
      } else {
        setMonthSummary(null);
      }
    } else {
      setMonthSummary(null);
    }
  }, []);

  useEffect(() => {
    fetchAnnotations(currentMonth, currentYear);
    fetchSummary(currentMonth, currentYear);
  }, [currentMonth, currentYear, fetchAnnotations, fetchSummary]);

  const handleDatesSet = (arg: any) => {
    const start = arg.view.currentStart;
    const month = start.getMonth() + 1;
    const year = start.getFullYear();
    if (month !== currentMonth || year !== currentYear) {
      setCurrentMonth(month);
      setCurrentYear(year);
    }
  };

  const handleDateClick = (arg: any) => {
    const clickedDate = arg.dateStr;
    // Use local date (IST) — not UTC
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Allow today and past dates, block future
    if (clickedDate > today) return;

    setSelectedDate(clickedDate);

    // Pre-fill modal with existing annotations for this date from the current user
    const existing = annotations.find(
      (a) => a.date === clickedDate
    );

    if (existing) {
      setModalCompleted(existing.completed);
      setModalNote(existing.note || '');
      setIsEditing(true);
      try {
        const parsed = JSON.parse(existing.emojis);
        setModalEmojis(Array.isArray(parsed) ? parsed : []);
      } catch {
        setModalEmojis([]);
      }
    } else {
      setModalCompleted(false);
      setModalEmojis([]);
      setModalNote('');
      setIsEditing(false);
    }

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);

    await updateAnnotation(selectedDate, {
      completed: modalCompleted,
      emojis: modalEmojis,
      note: modalNote,
    });

    await fetchAnnotations(currentMonth, currentYear);
    await fetchSummary(currentMonth, currentYear);
    setSaving(false);
    setShowModal(false);
  };

  const toggleEmoji = (emoji: string) => {
    setModalEmojis((prev) =>
      prev.includes(emoji)
        ? prev.filter((e) => e !== emoji)
        : [...prev, emoji]
    );
  };

  // Build FullCalendar events from annotations
  const calendarEvents = annotations.map((annotation) => {
    let emojis: string[] = [];
    try {
      emojis = JSON.parse(annotation.emojis);
    } catch {
      emojis = [];
    }

    const title = [
      annotation.completed ? '✓' : '',
      ...emojis,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: String(annotation.id),
      date: annotation.date,
      title: title || (annotation.completed ? '✓' : ''),
      classNames: [
        annotation.completed ? 'calendar-completed' : '',
        emojis.length > 0 ? 'calendar-emoji' : '',
      ].filter(Boolean),
      extendedProps: {
        completed: annotation.completed,
        emojis,
        note: annotation.note,
        userName: annotation.user?.displayName || '',
      },
    };
  });

  return (
    <PageTransition>
    <div className="py-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-pink-900 mb-4">
        Our Calendar
      </h1>

      {/* Monthly Summary for past months */}
      {monthSummary && (
        <div className="mb-4 p-4 bg-pink-50 rounded-xl border border-pink-200">
          <h3 className="text-sm font-semibold text-pink-800 mb-2">
            Monthly Memories
          </h3>
          <div className="flex gap-4 text-sm text-pink-700">
            <span>✓ {monthSummary.completedDays} days completed</span>
            <span>🎉 {monthSummary.emojiDays} days with emojis</span>
            <span>📝 {monthSummary.noteDays} days with notes</span>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center mb-4">
          <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
        </div>
      )}

      {/* FullCalendar */}
      <div className="calendar-wrapper rounded-xl overflow-hidden border border-pink-200 bg-white shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          height="auto"
          dayCellClassNames={(arg) => {
            const dateStr = arg.date.toISOString().split('T')[0];
            const hasCompleted = annotations.some(
              (a) => a.date === dateStr && a.completed
            );
            return hasCompleted ? ['day-completed'] : [];
          }}
          eventContent={(eventInfo) => {
            const { completed, emojis, note, userName } = eventInfo.event.extendedProps;
            return (
              <div className="text-xs leading-tight px-0.5">
                {completed && (
                  <span className="text-pink-600 font-bold">✓</span>
                )}
                {emojis && emojis.length > 0 && (
                  <span className="ml-0.5">{emojis.join('')}</span>
                )}
                {note && note.trim().length > 0 && (
                  <span className="ml-0.5">📝</span>
                )}
                {userName && (
                  <span className="block text-[10px] text-pink-400 truncate">
                    {userName}
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Date Annotation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-pink-200">
            <h2 className="text-lg font-bold text-pink-900 mb-1">
              {isEditing ? 'Edit Annotation' : 'Annotate Date'}
            </h2>
            <p className="text-sm text-pink-600 mb-4">{selectedDate}</p>

            {/* Completed checkbox */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={modalCompleted}
                onChange={(e) => setModalCompleted(e.target.checked)}
                className="w-5 h-5 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-pink-800 font-medium">
                Mark as completed
              </span>
            </label>

            {/* Emoji picker */}
            <div className="mb-4">
              <p className="text-sm font-medium text-pink-800 mb-2">
                Add emojis
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleEmoji(emoji)}
                    className={`text-2xl p-1.5 rounded-lg transition-colors ${
                      modalEmojis.includes(emoji)
                        ? 'bg-pink-200 ring-2 ring-pink-400'
                        : 'bg-pink-50 hover:bg-pink-100'
                    }`}
                    aria-label={`Toggle emoji ${emoji}`}
                    aria-pressed={modalEmojis.includes(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Note textarea */}
            <div className="mb-4">
              <p className="text-sm font-medium text-pink-800 mb-2">
                Add a note
              </p>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Write a note... (e.g. I missed you today 💕)"
                className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-pink-900 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-pink-300 text-pink-700 font-medium hover:bg-pink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for FullCalendar pink theme */}
      <style jsx global>{`
        .calendar-wrapper .fc {
          --fc-border-color: #fbcfe8;
          --fc-today-bg-color: #fdf2f8;
          --fc-event-bg-color: #fce7f3;
          --fc-event-border-color: #f9a8d4;
          --fc-event-text-color: #831843;
          font-family: inherit;
        }

        .calendar-wrapper .fc .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #831843;
        }

        .calendar-wrapper .fc .fc-button {
          background-color: #ec4899;
          border-color: #ec4899;
          border-radius: 0.5rem;
          font-weight: 500;
          padding: 0.3rem 0.7rem;
        }

        .calendar-wrapper .fc .fc-button:hover {
          background-color: #db2777;
          border-color: #db2777;
        }

        .calendar-wrapper .fc .fc-button:active,
        .calendar-wrapper .fc .fc-button.fc-button-active {
          background-color: #be185d;
          border-color: #be185d;
        }

        .calendar-wrapper .fc .fc-col-header-cell {
          background-color: #fdf2f8;
          color: #9d174d;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.5rem 0;
        }

        .calendar-wrapper .fc .fc-daygrid-day-number {
          color: #831843;
          font-size: 0.85rem;
          padding: 4px 6px;
        }

        .calendar-wrapper .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background-color: #ec4899;
          color: white;
          border-radius: 50%;
          width: 1.6rem;
          height: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-wrapper .day-completed .fc-daygrid-day-number {
          text-decoration: line-through;
          text-decoration-color: #ec4899;
          text-decoration-thickness: 2px;
        }

        .calendar-wrapper .fc .fc-daygrid-event {
          border-radius: 4px;
          padding: 1px 3px;
          margin: 1px 2px;
          border: none;
        }

        .calendar-wrapper .fc .fc-h-event {
          background-color: #fce7f3;
          border: 1px solid #f9a8d4;
        }

        .calendar-wrapper .fc .fc-daygrid-day:hover {
          background-color: #fdf2f8;
          cursor: pointer;
        }

        .calendar-wrapper .fc .fc-daygrid-day.fc-day-other .fc-daygrid-day-number {
          color: #f9a8d4;
        }
      `}</style>
    </div>
    </PageTransition>
  );
}
