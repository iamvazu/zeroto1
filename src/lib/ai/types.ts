// zeroto1.academy — AI Middleware Types (PRD §6)

export type AgeBand = '5-8' | '8-11' | '11-15';
export type SubjectName = 'History' | 'Science' | 'Art' | 'Math';

export type AiTaskType =
  | 'CLASSIFY'
  | 'GENERATE_LESSON'
  | 'DEEP_DIVE'
  | 'RE_EXPLAIN'
  | 'MODERATE';

export interface ClassifyResult {
  subject: SubjectName | string;
  ageBand: AgeBand;
  safetyVerdict: 'PASS' | 'FAIL';
  reasoning: string;
}

export interface PracticeQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

export interface GeneratedLessonSchema {
  title: string;
  subject: string;
  ageBand: AgeBand;
  summary: string;
  bigQuestion: string;
  byTheEnd: string;
  steps: {
    hook: {
      text: string;
      imagePrompt: string;
    };
    video: {
      query: string;
      channelAllowlist: string[];
    };
    read: {
      paragraphs: string[];
    };
    activity: {
      instruction: string;
      interactionType: 'tap' | 'sort' | 'observe';
    };
    practice: {
      questions: PracticeQuestion[];
    };
    deepDive: {
      followUps: string[];
    };
  };
}

export interface DeepDiveResult {
  followUpPrompts: string[];
  deeperFact: string;
  relatedTopics: string[];
}

export interface ReExplainResult {
  gentleExplanation: string;
  analogy: string;
  tryAgainEncouragement: string;
}

export interface ModerateResult {
  verdict: 'PASS' | 'FAIL';
  reason?: string;
  categories?: string[];
}

export interface ProviderResponse<T> {
  data: T;
  rawText: string;
  latencyMs: number;
  tokensUsed?: { prompt: number; completion: number; total: number };
  costEstimateUsd: number;
}

export interface LlmProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<ProviderResponse<string>>;
  generateJson<T>(prompt: string, systemPrompt?: string): Promise<ProviderResponse<T>>;
}

export interface AiRequestOptions {
  bypassCache?: boolean;
  ttlSeconds?: number;
  householdId?: string;
  kidProfileId?: string;
}
