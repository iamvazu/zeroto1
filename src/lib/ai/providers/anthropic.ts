// zeroto1.academy — Anthropic Claude LLM Provider

import { LlmProvider, ProviderResponse } from '../types';

export class AnthropicProvider implements LlmProvider {
  public name = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  public async generateText(prompt: string, systemPrompt?: string): Promise<ProviderResponse<string>> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const start = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const content = json.content?.[0]?.text || '';
    const latency = Date.now() - start;

    return {
      data: content,
      rawText: content,
      latencyMs: latency,
      tokensUsed: {
        prompt: json.usage?.input_tokens || 0,
        completion: json.usage?.output_tokens || 0,
        total: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
      },
      costEstimateUsd: ((json.usage?.input_tokens || 0) / 1000) * 0.003 + ((json.usage?.output_tokens || 0) / 1000) * 0.015,
    };
  }

  public async generateJson<T>(prompt: string, systemPrompt?: string): Promise<ProviderResponse<T>> {
    const formattedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON with no markdown formatting or surrounding code fences.`;
    const res = await this.generateText(formattedPrompt, systemPrompt);
    let cleaned = res.rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned) as T;
    return {
      data: parsed,
      rawText: res.rawText,
      latencyMs: res.latencyMs,
      tokensUsed: res.tokensUsed,
      costEstimateUsd: res.costEstimateUsd,
    };
  }
}
