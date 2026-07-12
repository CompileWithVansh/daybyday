import { getMeetingDate } from '@/actions/meeting.actions';
import { calculateDaysRemaining } from '@/lib/countdown';
import { HomeContent } from './HomeContent';

export default async function HomePage() {
  const result = await getMeetingDate();

  if (!result.success || !result.data) {
    return <HomeContent meetingData={null} />;
  }

  const meetingDate = new Date(result.data.date + 'T00:00:00');

  const daysRemaining = calculateDaysRemaining(meetingDate);
  
  // Simple position: the fewer days left, the closer they are
  // 0 days = 1.0 (together), 1 day = 0.95, 7 days = 0.7, 30 days = 0.3, 100+ days = ~0
  let photoPosition: number;
  if (daysRemaining === 0) {
    photoPosition = 1;
  } else if (daysRemaining === 1) {
    photoPosition = 0.95;
  } else if (daysRemaining <= 7) {
    photoPosition = 1 - (daysRemaining / 10);
  } else if (daysRemaining <= 30) {
    photoPosition = 0.7 - ((daysRemaining - 7) / 50);
  } else {
    // For longer countdowns, scale down gradually (never below 0)
    photoPosition = Math.max(0, 0.25 - ((daysRemaining - 30) / 300));
  }

  return (
    <HomeContent
      meetingData={{
        daysRemaining,
        photoPosition,
        meetingDateStr: result.data.date,
      }}
    />
  );
}
