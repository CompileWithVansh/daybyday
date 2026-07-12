import { requireAuth } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/components/Toast';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
        <main className="pb-24 safe-bottom">{children}</main>
        <Navigation />
      </div>
    </ToastProvider>
  );
}
