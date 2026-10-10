// zeroto1.academy — AI Middleware Service (PRD §6, Sprint 7)
// Provider-agnostic AI layer with Redis/memory caching, structured logging, rate limiting, and ai_jobs tracking

import { prisma } from '../prisma';
import { aiCache } from './cache';
import { logAiEvent } from './logger';
import { getLlmProvider } from './providers';
import {
  buildClassifyPrompt,
  buildGenerateLessonPrompt,
  buildDeepDivePrompt,
  buildReExplainPrompt,
  buildModeratePrompt,
} from './prompts';
import {
  AiRequestOptions,
  AiTaskType,
  ClassifyResult,
  DeepDiveResult,
  GeneratedLessonSchema,
  ModerateResult,
  ReExplainResult,
} from './types';

export class AiMiddlewareService {
  /**
   * Helper that executes any task with caching, provider invocation,
   * database job tracking in ai_jobs, and structured logging.
   */
  private async executeTask<T>(
    taskType: AiTaskType,
    promptInfo: { system: string; user: string },
    options: AiRequestOptions = {}
  ): Promise<{ data: T; cached: boolean; latencyMs: number }> {
    const startTime = Date.now();
    const provider = getLlmProvider();
    const cacheKey = aiCache.hashKey(taskType.toLowerCase(), {
      provider: provider.name,
      userPrompt: promptInfo.user,
    });

    // 1. Check Cache
    if (!options.bypassCache) {
      const cachedResult = await aiCache.get<T>(cacheKey);
      if (cachedResult) {
        const latency = Date.now() - startTime;
        logAiEvent({
          level: 'info',
          event: 'ai_task_complete',
          taskType,
          provider: provider.name,
          latencyMs: latency,
          cached: true,
          metadata: { prompt: promptInfo.user.slice(0, 80) },
        });

        // Record in ai_jobs as CACHED
        try {
          await prisma.aiJob.create({
            data: {
              taskType,
              status: 'COMPLETED',
              prompt: promptInfo.user,
              response: JSON.stringify(cachedResult),
              latencyMs: latency,
              cached: true,
            },
          });
        } catch {
          // Do not fail if DB log has a hiccup
        }

        return { data: cachedResult, cached: true, latencyMs: latency };
      }
    }

    // 2. Invoke Provider
    try {
      const providerRes = await provider.generateJson<T>(promptInfo.user, promptInfo.system);
      const latency = Date.now() - startTime;

      // 3. Cache Result
      await aiCache.set(cacheKey, providerRes.data, options.ttlSeconds || 86400);

      // 4. Record in ai_jobs table
      try {
        await prisma.aiJob.create({
          data: {
            taskType,
            status: 'COMPLETED',
            prompt: promptInfo.user,
            response: JSON.stringify(providerRes.data),
            latencyMs: latency,
            cached: false,
          },
        });
      } catch {
        // Silently tolerate db logging error
      }

      // 5. Structured Log
      logAiEvent({
        level: 'info',
        event: 'ai_task_complete',
        taskType,
        provider: provider.name,
        latencyMs: latency,
        costUsd: providerRes.costEstimateUsd,
        cached: false,
        metadata: { prompt: promptInfo.user.slice(0, 80) },
      });

      return { data: providerRes.data, cached: false, latencyMs: latency };
    } catch (err: unknown) {
      const latency = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      logAiEvent({
        level: 'error',
        event: 'ai_task_failed',
        taskType,
        provider: provider.name,
        latencyMs: latency,
        error: errorMessage,
      });

      try {
        await prisma.aiJob.create({
          data: {
            taskType,
            status: 'FAILED',
            prompt: promptInfo.user,
            error: errorMessage,
            latencyMs: latency,
            cached: false,
          },
        });
      } catch {
        // Ignore logging error
      }

      throw err;
    }
  }

  /**
   * Task 1: Classify
   * Classifies a kid's free-text question into subject, age band, and safety verdict.
   */
  public async classify(
    question: string,
    options: AiRequestOptions = {}
  ): Promise<ClassifyResult> {
    const promptInfo = buildClassifyPrompt(question);
    const res = await this.executeTask<ClassifyResult>('CLASSIFY', promptInfo, options);
    return res.data;
  }

  /**
   * Task 2: Generate Lesson
   * Generates a complete 6-step lesson conforming to PRD §6.3 JSON schema.
   */
  public async generateLesson(
    params: { question: string; subject: string; ageBand: string },
    options: AiRequestOptions = {}
  ): Promise<GeneratedLessonSchema> {
    const promptInfo = buildGenerateLessonPrompt(params.question, params.subject, params.ageBand);
    const res = await this.executeTask<GeneratedLessonSchema>('GENERATE_LESSON', promptInfo, options);
    return res.data;
  }

  /**
   * Task 3: Generate Deep Dive
   * Generates follow-up curiosities and deeper facts.
   */
  public async generateDeepDive(
    params: { lessonTopic: string; kidCuriosity?: string },
    options: AiRequestOptions = {}
  ): Promise<DeepDiveResult> {
    const promptInfo = buildDeepDivePrompt(params.lessonTopic, params.kidCuriosity);
    const res = await this.executeTask<DeepDiveResult>('DEEP_DIVE', promptInfo, options);
    return res.data;
  }

  /**
   * Task 4: Re-explain
   * Generates gentle, supportive re-explanations with everyday analogies.
   */
  public async reExplain(
    params: { questionPrompt: string; wrongAnswer: string; correctConcept: string },
    options: AiRequestOptions = {}
  ): Promise<ReExplainResult> {
    const promptInfo = buildReExplainPrompt(params.questionPrompt, params.wrongAnswer, params.correctConcept);
    const res = await this.executeTask<ReExplainResult>('RE_EXPLAIN', promptInfo, options);
    return res.data;
  }

  /**
   * Task 5: Moderate
   * Evaluates input or output text against strict kid-safety criteria.
   */
  public async moderate(
    text: string,
    options: AiRequestOptions = {}
  ): Promise<ModerateResult> {
    const promptInfo = buildModeratePrompt(text);
    const res = await this.executeTask<ModerateResult>('MODERATE', promptInfo, options);

    // Also persist to moderation_logs table
    try {
      await prisma.moderationLog.create({
        data: {
          source: 'INPUT',
          text: text.slice(0, 500),
          verdict: res.data.verdict,
          reason: res.data.reason || null,
        },
      });
    } catch {
      // Ignore
    }

    return res.data;
  }
}

export const aiService = new AiMiddlewareService();
