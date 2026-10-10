import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession, getActiveKidId } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      household: {
        include: {
          kidProfiles: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const activeKidId = await getActiveKidId();
  const activeKid = user.household.kidProfiles.find((k) => k.id === activeKidId) || null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    household: {
      id: user.household.id,
      name: user.household.name,
      region: user.household.region,
      customLessonAllowance: user.household.customLessonAllowance,
      kidProfiles: user.household.kidProfiles,
    },
    activeKid,
  });
}
