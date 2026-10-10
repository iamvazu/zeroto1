// zeroto1.academy — LLM Provider Factory
// Swappable purely via AI_PROVIDER environment variable

import { LlmProvider } from '../types';
import { MockLlmProvider } from './mock';
import { OpenAiProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleGeminiProvider } from './google';

export function getLlmProvider(overrideProviderName?: string): LlmProvider {
  const providerName = (overrideProviderName || process.env.AI_PROVIDER || 'mock').toLowerCase();

  switch (providerName) {
    case 'openai':
      return new OpenAiProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'google':
    case 'gemini':
      return new GoogleGeminiProvider();
    case 'mock':
    default:
      return new MockLlmProvider();
  }
}
