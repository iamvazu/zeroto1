import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

const VALID_AGE_BANDS = ['5-8', '8-11', '11-15'];
const DEFAULT_AVATARS = ['🚀', '🎨', '🦖', '🌟', '🐬', '🦉', '🦁', '🦊'];

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kidProfiles = await prisma.kidProfile.findMany({
    where: { householdId: session.householdId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ kidProfiles });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, avatar, ageBand } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: 'Child display name is required' },
        { status: 400 }
      );
    }

    if (!ageBand || !VALID_AGE_BANDS.includes(ageBand)) {
      return NextResponse.json(
        { error: 'Valid age band is required (5-8, 8-11, 11-15)' },
        { status: 400 }
      );
    }

    const selectedAvatar =
      avatar && avatar.trim()
        ? avatar.trim()
        : DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    const kidProfile = await prisma.kidProfile.create({
      data: {
        householdId: session.householdId,
        displayName: displayName.trim(),
        avatar: selectedAvatar,
        ageBand,
      },
    });

    return NextResponse.json({ ok: true, kidProfile });
  } catch (error) {
    console.error('Create kid profile error:', error);
    return NextResponse.json(
      { error: 'Failed to create kid profile' },
      { status: 500 }
    );
  }
}
