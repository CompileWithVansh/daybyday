'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Authenticates a user against the database using bcrypt.
 * On success, stores a JWT in an HTTP-only cookie.
 */
export async function login(
  identifier: string,
  password: string
): Promise<LoginResult> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '30d',
    });

    const cookieStore = cookies();
    cookieStore.set('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to process login. Please try again.',
    };
  }
}

/**
 * Clears the JWT cookie and redirects the user to the login page.
 */
export async function logout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('jwt');
  redirect('/login');
}

export async function getProfile() {
  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
  };
}
