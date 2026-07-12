import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function RootPage() {
  const cookieStore = cookies();
  const jwt = cookieStore.get('jwt')?.value;

  if (jwt) {
    redirect('/home');
  } else {
    redirect('/login');
  }
}
