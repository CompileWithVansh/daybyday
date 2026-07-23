'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { PinkCard } from '@/components/PinkCard';
import { getTimetable, updateTimetableSlot, seedDefaultTimetable } from '@/actions/timetable.actions';
import { useToast } from '@/components/Toast';

interface SlotData {
  id: number;
  day: string;
  time: string;
  period: string;
  courseCode: string | null;
  title: string | null;
  faculty: string | null;
  room: string | null;
  notes: string | null;
  details: string | null;
  type: string | null;
}

const DAYS_OF_WEEK = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday"];

const DAY_EMOJIS: Record<string, string> = {
  Wednesday: "📝",
  Thursday: "📚",
  Friday: "🔬",
  Saturday: "💻",
  Sunday: "🧬",
  Monday: "🧠"
};

// Pastel color generator based on courseCode
function getCourseColor(courseCode: string | null, type: string | null) {
  if (type === 'Break') return 'bg-amber-50 border-amber-200 text-amber-900';
  if (type === 'Free' || !courseCode) return 'bg-pink-50/40 border-pink-100 border-dashed text-pink-400';
  
  // Hash courseCode to assign a fixed pastel theme
  const code = courseCode.toUpperCase();
  if (code.includes('CS')) return 'bg-indigo-50 border-indigo-200 text-indigo-900';
  if (code.includes('BIO')) return 'bg-emerald-50 border-emerald-200 text-emerald-950';
  if (code.includes('BIN')) return 'bg-purple-50 border-purple-200 text-purple-950';
  if (code.includes('MATH')) return 'bg-sky-50 border-sky-200 text-sky-900';
  
  return 'bg-pink-50 border-pink-200 text-pink-900';
}

export default function TimetablePage() {
  const { showToast } = useToast();
  const [timetable, setTimetable] = useState<SlotData[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Wednesday");
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pressTimeoutId, setPressTimeoutId] = useState<any>(null);

  const startPress = (slot: SlotData) => {
    const timer = setTimeout(() => {
      handleEditClick(slot);
      showToast("Editing slot details... ✏️");
    }, 800); // 800ms hold
    setPressTimeoutId(timer);
  };

  const endPress = () => {
    if (pressTimeoutId) {
      clearTimeout(pressTimeoutId);
      setPressTimeoutId(null);
    }
  };

  // Modal form states
  const [formCourseCode, setFormCourseCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formFaculty, setFormFaculty] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formType, setFormType] = useState('Class');

  const fetchTimetable = async () => {
    setLoading(true);
    const result = await getTimetable();
    if (result.success && result.data) {
      setTimetable(result.data);
    } else {
      showToast(result.error || 'Failed to load timetable.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetable();

    // Default selectedDay to today's day of week if it is in our cycle
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (DAYS_OF_WEEK.includes(todayName)) {
      setSelectedDay(todayName);
    }
  }, []);


  const handleEditClick = (slot: SlotData) => {
    setEditingSlot(slot);
    setFormCourseCode(slot.courseCode || '');
    setFormTitle(slot.title || '');
    setFormFaculty(slot.faculty || '');
    setFormRoom(slot.room || '');
    setFormNotes(slot.notes || '');
    setFormType(slot.type || (slot.courseCode ? 'Class' : 'Free'));
  };

  const handleResetDefault = async () => {
    if (!confirm("Are you sure you want to reset the timetable to Pakhi's default schedule? This will overwrite any custom edits.")) {
      return;
    }
    setLoading(true);
    const result = await seedDefaultTimetable();
    if (result.success) {
      showToast('Timetable reset to default schedule!');
      await fetchTimetable();
    } else {
      showToast('Failed to reset timetable.', 'error');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setSaving(true);
    const result = await updateTimetableSlot(editingSlot.id, {
      courseCode: formType === 'Class' ? formCourseCode : null,
      title: formType === 'Class' ? formTitle : null,
      faculty: formType === 'Class' ? formFaculty : null,
      room: formType === 'Class' ? formRoom : null,
      notes: formType === 'Class' ? formNotes : null,
      type: formType,
      details: formType === 'Break' ? 'Lunch / Break' : formType === 'Free' ? 'Free / No Class' : null
    });

    if (result.success) {
      showToast('Schedule slot updated successfully!');
      setEditingSlot(null);
      await fetchTimetable();
    } else {
      showToast(result.error || 'Failed to update schedule slot.', 'error');
    }
    setSaving(false);
  };

  // Filter slots for the selected day
  const dailySlots = timetable.filter(slot => slot.day === selectedDay);

  return (
    <PageTransition>
      <div className="min-h-screen bg-pink-50/30 pb-20">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 py-3 shadow-[0_1px_5px_rgba(236,72,153,0.05)]">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Link 
              href="/home" 
              className="flex items-center gap-1 text-pink-500 font-semibold hover:text-pink-600 active:scale-95 transition-all text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Home
            </Link>
            <h1 className="text-base font-bold text-pink-900 font-sans">
              Pakhi's College Timetable
            </h1>
            <div className="w-12" />
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
          {/* Day Selector Tabs (Horizontal row of cards) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-0.5">
            {DAYS_OF_WEEK.map((day) => {
              const isActive = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center justify-center min-w-[4.5rem] py-2.5 rounded-xl border transition-all active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-b from-pink-400 to-pink-500 border-pink-400 text-white shadow-md shadow-pink-100 scale-105 z-10'
                      : 'bg-white border-pink-100 text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <span className="text-lg mb-0.5">{DAY_EMOJIS[day]}</span>
                  <span className="text-[10px] font-bold tracking-tight">
                    {day.substring(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loader */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-pink-400 font-medium font-sans">Loading schedule...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailySlots.length === 0 ? (
                <PinkCard className="text-center py-10">
                  <p className="text-pink-400 text-sm font-sans">No classes set for {selectedDay}! 🌸</p>
                </PinkCard>
              ) : (
                dailySlots.map((slot) => {
                  const isClass = slot.type === 'Class' || (!slot.type && slot.courseCode);
                  const isBreak = slot.type === 'Break';
                  const colorClass = getCourseColor(slot.courseCode, slot.type);

                  return (
                    <div 
                      key={slot.id} 
                      onDoubleClick={() => handleEditClick(slot)}
                      onTouchStart={() => startPress(slot)}
                      onTouchEnd={endPress}
                      onTouchMove={endPress}
                      className={`relative flex items-stretch border rounded-2xl overflow-hidden cursor-pointer hover:shadow-sm transition-all shadow-sm select-none ${colorClass}`}
                    >
                      {/* Timeline Side Info (Period + Time boundary) */}
                      <div className="flex flex-col justify-center items-center px-3 border-r border-inherit bg-white/50 w-20 shrink-0 text-center select-none">
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest leading-none mb-1">
                          Period {slot.period}
                        </span>
                        <span className="text-[9px] font-semibold opacity-70 leading-tight">
                          {slot.time.split(' - ')[0]}
                        </span>
                        <div className="h-2 w-0.5 bg-pink-100 my-0.5" />
                        <span className="text-[9px] font-semibold opacity-70 leading-tight">
                          {slot.time.split(' - ')[1]}
                        </span>
                      </div>

                      {/* Main Slot Description */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        {isClass ? (
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <span className="inline-block text-[10px] font-bold bg-pink-100/60 text-pink-700 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                                {slot.courseCode}
                              </span>
                              {slot.room && (
                                <span className="text-[10px] font-bold bg-white/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-pink-100 text-pink-600 px-1.5 py-0.5 rounded-md">
                                  📍 {slot.room}
                                </span>
                              )}
                            </div>
                            
                            {slot.title && (
                              <h3 className="text-xs font-bold leading-tight font-sans mt-1">
                                {slot.title}
                              </h3>
                            )}
                            
                            {slot.faculty && (
                              <p className="text-[10px] font-semibold opacity-85 font-sans">
                                Faculty: <span className="font-bold">{slot.faculty}</span>
                              </p>
                            )}

                            {slot.notes && (
                              <p className="text-[9px] italic opacity-60 font-sans border-t border-pink-100/50 pt-1 mt-1 leading-snug">
                                💬 {slot.notes}
                              </p>
                            )}
                          </div>
                        ) : isBreak ? (
                          <div className="flex items-center justify-center h-full py-2 space-x-1.5">
                            <span className="text-base">🥪</span>
                            <span className="text-xs font-bold tracking-wide uppercase font-sans">
                              Lunch / Break
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full py-4 text-pink-300">
                            <span className="text-xs font-semibold italic font-sans uppercase tracking-widest">
                              Free Period 🌸
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Edit Modal Dialog */}
        {editingSlot && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-pink-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-slide-up sm:animate-fade-in border border-pink-100">
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-pink-50 bg-pink-50/20 flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-sm font-bold text-pink-900 font-sans">
                    Edit Period {editingSlot.period}
                  </h2>
                  <p className="text-[10px] text-pink-400 font-medium">
                    {editingSlot.day} | {editingSlot.time}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingSlot(null)}
                  className="text-pink-400 hover:text-pink-600 p-1 rounded-full hover:bg-pink-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1.5">
                    Period Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Class', 'Break', 'Free'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setFormType(type)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          formType === type
                            ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                            : 'bg-white border-pink-100 text-pink-500 hover:bg-pink-50/50'
                        }`}
                      >
                        {type === 'Class' ? '📚 Class' : type === 'Break' ? '🥪 Break' : '🌸 Free'}
                      </button>
                    ))}
                  </div>
                </div>

                {formType === 'Class' && (
                  <div className="space-y-3">
                    {/* Course Code & Room */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">
                          Course Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. BIO 418"
                          value={formCourseCode}
                          onChange={(e) => setFormCourseCode(e.target.value)}
                          className="w-full px-3 py-2 border border-pink-100 rounded-xl text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none bg-pink-50/10 font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">
                          Room Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. JM 104"
                          value={formRoom}
                          onChange={(e) => setFormRoom(e.target.value)}
                          className="w-full px-3 py-2 border border-pink-100 rounded-xl text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none bg-pink-50/10 font-sans"
                        />
                      </div>
                    </div>

                    {/* Class/Lab Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">
                        Course Name / Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. In Silico Laboratory – I"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-pink-100 rounded-xl text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none bg-pink-50/10"
                      />
                    </div>

                    {/* Faculty */}
                    <div>
                      <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">
                        Faculty / Lecturer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Anukriti Saran"
                        value={formFaculty}
                        onChange={(e) => setFormFaculty(e.target.value)}
                        className="w-full px-3 py-2 border border-pink-100 rounded-xl text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none bg-pink-50/10"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">
                        Notes / Instructions
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Bring lab coat, stats homework due today"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-pink-100 rounded-xl text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none bg-pink-50/10 resize-none"
                      />
                    </div>
                  </div>
                )}

                {formType === 'Break' && (
                  <p className="text-[11px] text-pink-400 italic text-center py-4 bg-pink-50/20 rounded-2xl font-sans">
                    Period will render as Lunch / Break 🥪
                  </p>
                )}

                {formType === 'Free' && (
                  <p className="text-[11px] text-pink-400 italic text-center py-4 bg-pink-50/20 rounded-2xl font-sans">
                    Period will render as Free / No Class 🌸
                  </p>
                )}

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="flex-1 py-2.5 bg-pink-50 text-pink-500 rounded-xl font-bold hover:bg-pink-100 transition-colors text-xs active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-gradient-to-b from-pink-400 to-pink-500 text-white rounded-xl font-bold hover:from-pink-500 hover:to-pink-600 transition-all text-xs active:scale-95 shadow-md shadow-pink-100 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
