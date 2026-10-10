import { NextRequest, NextResponse } from 'next/server';
import { trackMetricEvent, MetricEventType } from '@/lib/metrics/successMetrics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, value, metadata } = body;

    const validTypes: MetricEventType[] = [
      'time_to_first_lesson',
      'lesson_completion_rate',
      'free_to_paid_conversion',
      'churn_rate',
      'refund_rate',
      'ai_moderation_block_rate',
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing metric event type', validTypes },
        { status: 400 }
      );
    }

    const event = trackMetricEvent(type, typeof value === 'number' ? value : 1, metadata);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
