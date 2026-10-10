export type MetricEventType =
  | 'time_to_first_lesson'
  | 'lesson_completion_rate'
  | 'free_to_paid_conversion'
  | 'churn_rate'
  | 'refund_rate'
  | 'ai_moderation_block_rate';

export interface MetricEvent {
  id: string;
  type: MetricEventType;
  value: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const globalForMetrics = globalThis as unknown as {
  metricEventsBuffer: MetricEvent[] | undefined;
};

export const metricEventsBuffer: MetricEvent[] =
  globalForMetrics.metricEventsBuffer ?? [];

if (process.env.NODE_ENV !== 'production') {
  globalForMetrics.metricEventsBuffer = metricEventsBuffer;
}

const MAX_EVENTS = 1000;

/**
 * Record a high-priority business and pedagogical metric event.
 */
export function trackMetricEvent(
  type: MetricEventType,
  value: number = 1,
  metadata?: Record<string, unknown>
): MetricEvent {
  const event: MetricEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    value,
    metadata,
    timestamp: new Date().toISOString(),
  };

  metricEventsBuffer.unshift(event);
  if (metricEventsBuffer.length > MAX_EVENTS) {
    metricEventsBuffer.pop();
  }

  return event;
}

export interface MetricsSummary {
  totalEventsRecorded: number;
  timeToFirstLessonAvgSeconds: number;
  lessonCompletions: number;
  freeToPaidConversions: number;
  churns: number;
  refunds: number;
  aiModerationBlocks: number;
  eventsByType: Record<MetricEventType, number>;
}

export function getMetricsSummary(): MetricsSummary {
  const eventsByType: Record<MetricEventType, number> = {
    time_to_first_lesson: 0,
    lesson_completion_rate: 0,
    free_to_paid_conversion: 0,
    churn_rate: 0,
    refund_rate: 0,
    ai_moderation_block_rate: 0,
  };

  let ttflSum = 0;
  let ttflCount = 0;

  for (const ev of metricEventsBuffer) {
    eventsByType[ev.type] = (eventsByType[ev.type] || 0) + 1;
    if (ev.type === 'time_to_first_lesson') {
      ttflSum += ev.value;
      ttflCount++;
    }
  }

  return {
    totalEventsRecorded: metricEventsBuffer.length,
    timeToFirstLessonAvgSeconds: ttflCount > 0 ? Math.round(ttflSum / ttflCount) : 0,
    lessonCompletions: eventsByType.lesson_completion_rate,
    freeToPaidConversions: eventsByType.free_to_paid_conversion,
    churns: eventsByType.churn_rate,
    refunds: eventsByType.refund_rate,
    aiModerationBlocks: eventsByType.ai_moderation_block_rate,
    eventsByType,
  };
}

export function getRecentMetricEvents(): MetricEvent[] {
  return [...metricEventsBuffer];
}
