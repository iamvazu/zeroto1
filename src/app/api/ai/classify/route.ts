// zeroto1.academy — API Route: Classify Question (POST /api/ai/classify)
// Applies burst rate limiting, runs AI middleware classification, returns subject, ageBand, safetyVerdict

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { checkBurstRateLimit } from '@/lib/ai/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkBurstRateLimit(`classify:${ip}`, 5, 5000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)) } }
      );
    }

    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const classification = await aiService.classify(question);
    return NextResponse.json({ success: true, data: classification });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
