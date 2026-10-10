import { NextRequest, NextResponse } from 'next/server';
import { captureException, getCapturedErrors } from '@/lib/monitoring/errorTracker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message || 'Intentional test exception for Sprint 15 monitoring gate';

    const testError = new Error(message);
    const captured = captureException(testError, {
      source: 'test-endpoint',
      userIp: req.headers.get('x-forwarded-for') || '127.0.0.1',
      simulatedPayload: body,
    });

    return NextResponse.json({
      success: true,
      message: 'Test error successfully captured by monitoring system',
      event: captured,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const errors = getCapturedErrors();
  return NextResponse.json({
    success: true,
    count: errors.length,
    errors,
  });
}
