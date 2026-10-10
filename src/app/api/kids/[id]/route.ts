import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

const VALID_AGE_BANDS = ['5-8', '8-11', '11-15'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { displayName, avatar, ageBand } = body;

    // Verify ownership
    const existing = await prisma.kidProfile.findFirst({
      where: {
        id,
        householdId: session.householdId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updateData: { displayName?: string; avatar?: string; ageBand?: string } = {};

    if (displayName && displayName.trim()) {
      updateData.displayName = displayName.trim();
    }
    if (avatar && avatar.trim()) {
      updateData.avatar = avatar.trim();
    }
    if (ageBand && VALID_AGE_BANDS.includes(ageBand)) {
      updateData.ageBand = ageBand;
    }

    const updated = await prisma.kidProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, kidProfile: updated });
  } catch (error) {
    console.error('Update kid profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update kid profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.kidProfile.findFirst({
      where: {
        id,
        householdId: session.householdId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await prisma.kidProfile.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Kid profile deleted' });
  } catch (error) {
    console.error('Delete kid profile error:', error);
    return NextResponse.json(
      { error: 'Failed to delete kid profile' },
      { status: 500 }
    );
  }
}
