// zeroto1.academy — API Route: Generate Live Deep Dive (POST /api/ai/deep-dive)
// Takes lesson topic and kid's specific curiosity to produce personalized follow-up exploration

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { checkBurstRateLimit } from '@/lib/ai/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkBurstRateLimit(`deepdive:${ip}`, 8, 10000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Please wait a moment before asking another question.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { lessonTopic, kidCuriosity } = body;

    if (!lessonTopic || typeof lessonTopic !== 'string') {
      return NextResponse.json({ error: 'lessonTopic is required' }, { status: 400 });
    }

    const deepDive = await aiService.generateDeepDive({
      lessonTopic: lessonTopic.trim(),
      kidCuriosity: typeof kidCuriosity === 'string' ? kidCuriosity.trim() : undefined,
    });

    return NextResponse.json({ success: true, data: deepDive });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
