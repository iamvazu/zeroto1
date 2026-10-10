import { NextResponse } from 'next/server';
import { getMetricsSummary, getRecentMetricEvents } from '@/lib/metrics/successMetrics';

export async function GET() {
  const summary = getMetricsSummary();
  const recent = getRecentMetricEvents().slice(0, 50);

  return NextResponse.json({
    success: true,
    summary,
    recent,
  });
}
