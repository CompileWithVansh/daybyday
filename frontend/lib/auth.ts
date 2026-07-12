import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Retrieves the JWT auth token from cookies.
 * Returns null if no token is present.
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get('jwt')?.value ?? null;
}

/**
 * Decodes the JWT and fetches the current user from the database.
 * Returns null if no valid token or user not found.
 */
export async function getCurrentUser() {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Requires authentication for a route.
 * Redirects to /login if no valid user session.
 * Returns the user object if authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
