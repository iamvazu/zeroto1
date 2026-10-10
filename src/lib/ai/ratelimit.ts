// zeroto1.academy — Rate Limiter & Household Allowance Counter (PRD §6.1, §6.4)

import { prisma } from '../prisma';
import { logAiEvent } from './logger';

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * In-memory sliding window rate limiter for burst prevention.
 * E.g., max 5 requests per 5-second window per client/IP.
 */
export function checkBurstRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 5000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));

    logAiEvent({
      level: 'warn',
      event: 'rate_limit_exceeded',
      metadata: { key, count: record.timestamps.length, resetMs },
    });

    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}

export function resetBurstRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_ALLOWANCE = 75;

/**
 * Household custom-lesson allowance counter (75 lessons per 30 days).
 * Resets automatically if 30 days have elapsed since last reset date.
 */
export async function getHouseholdAllowance(householdId: string): Promise<{
  remaining: number;
  resetAt: Date;
  canGenerate: boolean;
}> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { customLessonAllowance: true, allowanceResetAt: true },
  });

  if (!household) {
    throw new Error(`Household not found: ${householdId}`);
  }

  const now = Date.now();
  const resetTime = new Date(household.allowanceResetAt).getTime();

  // If 30 days have elapsed, reset to default 75
  if (now - resetTime >= THIRTY_DAYS_MS) {
    const updated = await prisma.household.update({
      where: { id: householdId },
      data: {
        customLessonAllowance: DEFAULT_ALLOWANCE,
        allowanceResetAt: new Date(),
      },
      select: { customLessonAllowance: true, allowanceResetAt: true },
    });

    logAiEvent({
      level: 'info',
      event: 'allowance_reset',
      metadata: { householdId, newAllowance: DEFAULT_ALLOWANCE },
    });

    return {
      remaining: updated.customLessonAllowance,
      resetAt: updated.allowanceResetAt,
      canGenerate: updated.customLessonAllowance > 0,
    };
  }

  return {
    remaining: household.customLessonAllowance,
    resetAt: household.allowanceResetAt,
    canGenerate: household.customLessonAllowance > 0,
  };
}

/**
 * Decrement the household allowance by 1 upon successful custom lesson creation.
 */
export async function decrementHouseholdAllowance(householdId: string): Promise<{
  remaining: number;
  success: boolean;
}> {
  const current = await getHouseholdAllowance(householdId);

  if (!current.canGenerate) {
    logAiEvent({
      level: 'warn',
      event: 'allowance_exhausted',
      metadata: { householdId, remaining: current.remaining },
    });
    return { remaining: 0, success: false };
  }

  const updated = await prisma.household.update({
    where: { id: householdId },
    data: {
      customLessonAllowance: { decrement: 1 },
    },
    select: { customLessonAllowance: true },
  });

  logAiEvent({
    level: 'info',
    event: 'allowance_decremented',
    metadata: { householdId, remaining: updated.customLessonAllowance },
  });

  return {
    remaining: updated.customLessonAllowance,
    success: true,
  };
}
