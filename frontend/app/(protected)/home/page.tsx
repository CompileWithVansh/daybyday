import { getMeetingDate } from '@/actions/meeting.actions';
import { calculateDaysRemaining, calculatePhotoPosition } from '@/lib/countdown';
import { HomeContent } from './HomeContent';

export default async function HomePage() {
  const result = await getMeetingDate();

  if (!result.success || !result.data) {
    return <HomeContent meetingData={null} />;
  }

  const meetingDate = new Date(result.data.date + 'T00:00:00');
  const startDate = new Date(result.data.startDate + 'T00:00:00');

  const daysRemaining = calculateDaysRemaining(meetingDate);
  const photoPosition = calculatePhotoPosition(startDate, meetingDate);

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
