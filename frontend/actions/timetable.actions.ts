'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface TimetableSlotResponse {
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

interface GetTimetableResult {
  success: boolean;
  error?: string;
  data?: TimetableSlotResponse[];
}

interface UpdateTimetableResult {
  success: boolean;
  error?: string;
}

const DEFAULT_TIMETABLE = [
  {
    "day": "Wednesday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "type": "Free", "details": "Free / No Class" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIO 418", "faculty": "KT", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Zoo/Bot I Sem." },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIO 407", "faculty": "AS", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Bot I Sem." },
      { "time": "12:05 - 01:00", "period": "4", "courseCode": "MATH 424", "faculty": "Ms. Megha Sharma", "room": "JM 314", "notes": "Statistics Portion" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "type": "Free", "details": "Free / No Class" }
    ]
  },
  {
    "day": "Thursday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "type": "Free", "details": "Free / No Class" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIO 418", "faculty": "KT", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Zoo/Bot I Sem." },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIO 407", "faculty": "AS", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Bot I Sem." },
      { "time": "12:05 - 01:00", "period": "4", "courseCode": "MATH 424", "faculty": "Ms. Megha Sharma Prasad", "room": "JM 314", "notes": "Statistics Portion" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "courseCode": "BIN 413L", "title": "In Silico Laboratory – I (Database & DBMS)", "faculty": "MR", "room": "JM L-314", "notes": "Lab Session (4 Periods)" }
    ]
  },
  {
    "day": "Friday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "courseCode": "CS 451", "faculty": "RB", "room": "JM 314" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIN 408", "faculty": "MR (Dr. Anukriti Saran)", "room": "JM 314" },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIO 418", "faculty": "KT", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Zoo/Bot I Sem." },
      { "time": "12:05 - 01:00", "period": "4", "courseCode": "MATH 424", "faculty": "Ms. Manju Suresh Prasad", "room": "JM 314", "notes": "Mathematics Portion" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "type": "Free", "details": "Free / No Class" }
    ]
  },
  {
    "day": "Saturday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "courseCode": "CS 451", "faculty": "RB", "room": "JM 314" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIN 408", "faculty": "MR (Dr. Anukriti Saran)", "room": "JM 314" },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIO 418", "faculty": "KT", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Zoo/Bot I Sem." },
      { "time": "12:05 - 01:00", "period": "4", "courseCode": "MATH 424", "faculty": "Ms. Manju Suresh Prasad", "room": "JM 314", "notes": "Mathematics Portion" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "type": "Free", "details": "Free / No Class" }
    ]
  },
  {
    "day": "Sunday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "courseCode": "CS 451", "faculty": "RB", "room": "JM 314" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIO 407", "faculty": "AS", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Bot I Sem." },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIN 408", "faculty": "MR (Dr. Anukriti Saran)", "room": "JM 314" },
      { "time": "12:05 - 01:00", "period": "4", "type": "Free", "details": "Free / No Class" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "courseCode": "BIN 413L", "title": "In Silico Laboratory – I (C Programming & Shell Scripting)", "faculty": "RB", "room": "JM L-314", "notes": "Lab Session (4 Periods)" }
    ]
  },
  {
    "day": "Monday",
    "slots": [
      { "time": "09:00 - 10:00", "period": "1", "courseCode": "CS 451", "faculty": "RB", "room": "JM 314" },
      { "time": "10:05 - 11:00", "period": "2", "courseCode": "BIO 407", "faculty": "AS", "room": "JM 104 / JM C-104", "notes": "CW MSc BT/AMBT/Bot I Sem." },
      { "time": "11:05 - 12:00", "period": "3", "courseCode": "BIN 408", "faculty": "MR (Dr. Anukriti Saran)", "room": "JM 314" },
      { "time": "12:05 - 01:00", "period": "4", "type": "Free", "details": "Free / No Class" },
      { "time": "01:05 - 02:00", "period": "5", "type": "Break", "details": "Lunch / Break" },
      { "time": "02:05 - 06:00", "period": "6-9", "courseCode": "BIN 413L", "title": "In Silico Laboratory – I (Operating System)", "faculty": "RB", "room": "JM L-314", "notes": "Lab Session (4 Periods)" }
    ]
  }
];

export async function getTimetable(): Promise<GetTimetableResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    let slots = await prisma.timetableSlot.findMany({
      orderBy: [
        { id: 'asc' } // Orders by sequence of insertion (which will be Wednesday to Monday)
      ]
    });

    // If database has no slots, automatically seed the default timetable
    if (slots.length === 0) {
      await seedDefaultTimetable();
      slots = await prisma.timetableSlot.findMany({
        orderBy: [{ id: 'asc' }]
      });
    }

    return {
      success: true,
      data: slots.map(slot => ({
        id: slot.id,
        day: slot.day,
        time: slot.time,
        period: slot.period,
        courseCode: slot.courseCode,
        title: slot.title,
        faculty: slot.faculty,
        room: slot.room,
        notes: slot.notes,
        details: slot.details,
        type: slot.type,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch timetable. Please try again.',
    };
  }
}

export async function updateTimetableSlot(
  id: number,
  data: {
    courseCode?: string | null;
    title?: string | null;
    faculty?: string | null;
    room?: string | null;
    notes?: string | null;
    details?: string | null;
    type?: string | null;
  }
): Promise<UpdateTimetableResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await prisma.timetableSlot.update({
      where: { id },
      data: {
        courseCode: data.courseCode,
        title: data.title,
        faculty: data.faculty,
        room: data.room,
        notes: data.notes,
        details: data.details,
        type: data.type || (data.courseCode ? 'Class' : 'Free'),
      },
    });

    revalidatePath('/timetable');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to update timetable slot. Please try again.',
    };
  }
}

export async function seedDefaultTimetable(): Promise<UpdateTimetableResult> {
  try {
    // Delete existing slots
    await prisma.timetableSlot.deleteMany({});

    // Bulk create
    const insertData = [];
    for (const daySchedule of DEFAULT_TIMETABLE) {
      for (const slot of daySchedule.slots) {
        insertData.push({
          day: daySchedule.day,
          time: slot.time,
          period: String(slot.period),
          courseCode: (slot as any).courseCode || null,
          title: (slot as any).title || null,
          faculty: (slot as any).faculty || null,
          room: (slot as any).room || null,
          notes: (slot as any).notes || null,
          details: (slot as any).details || null,
          type: (slot as any).type || ((slot as any).courseCode ? 'Class' : 'Free'),
        });
      }
    }

    await prisma.timetableSlot.createMany({
      data: insertData,
    });

    revalidatePath('/timetable');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to seed default timetable.',
    };
  }
}
