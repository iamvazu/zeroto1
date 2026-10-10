// zeroto1.academy — OpenAI LLM Provider

import { LlmProvider, ProviderResponse } from '../types';

export class OpenAiProvider implements LlmProvider {
  public name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  public async generateText(prompt: string, systemPrompt?: string): Promise<ProviderResponse<string>> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const start = Date.now();
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '';
    const latency = Date.now() - start;

    return {
      data: content,
      rawText: content,
      latencyMs: latency,
      tokensUsed: {
        prompt: json.usage?.prompt_tokens || 0,
        completion: json.usage?.completion_tokens || 0,
        total: json.usage?.total_tokens || 0,
      },
      costEstimateUsd: ((json.usage?.total_tokens || 0) / 1000) * 0.0015,
    };
  }

  public async generateJson<T>(prompt: string, systemPrompt?: string): Promise<ProviderResponse<T>> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const start = Date.now();
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    const latency = Date.now() - start;
    const parsed = JSON.parse(content) as T;

    return {
      data: parsed,
      rawText: content,
      latencyMs: latency,
      tokensUsed: {
        prompt: json.usage?.prompt_tokens || 0,
        completion: json.usage?.completion_tokens || 0,
        total: json.usage?.total_tokens || 0,
      },
      costEstimateUsd: ((json.usage?.total_tokens || 0) / 1000) * 0.0015,
    };
  }
}
