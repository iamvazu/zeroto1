import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, ACTIVE_KID_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true, message: 'Signed out successfully' });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set({
    name: ACTIVE_KID_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
