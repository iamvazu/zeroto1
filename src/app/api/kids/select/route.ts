import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession, ACTIVE_KID_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { kidProfileId } = body;

    if (!kidProfileId) {
      return NextResponse.json({ error: 'kidProfileId is required' }, { status: 400 });
    }

    const kid = await prisma.kidProfile.findFirst({
      where: {
        id: kidProfileId,
        householdId: session.householdId,
      },
    });

    if (!kid) {
      return NextResponse.json({ error: 'Kid profile not found' }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true, activeKid: kid });

    response.cookies.set({
      name: ACTIVE_KID_COOKIE_NAME,
      value: kid.id,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Select kid profile error:', error);
    return NextResponse.json(
      { error: 'Failed to select kid profile' },
      { status: 500 }
    );
  }
}
