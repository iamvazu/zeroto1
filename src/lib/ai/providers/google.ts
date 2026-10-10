// zeroto1.academy — Google Gemini LLM Provider

import { LlmProvider, ProviderResponse } from '../types';

export class GoogleGeminiProvider implements LlmProvider {
  public name = 'google';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  public async generateText(prompt: string, systemPrompt?: string): Promise<ProviderResponse<string>> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Gemini API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const latency = Date.now() - start;

    return {
      data: content,
      rawText: content,
      latencyMs: latency,
      tokensUsed: { prompt: 200, completion: 150, total: 350 },
      costEstimateUsd: 0.0001,
    };
  }

  public async generateJson<T>(prompt: string, systemPrompt?: string): Promise<ProviderResponse<T>> {
    const formattedPrompt = `${prompt}\n\nIMPORTANT: Return strictly valid JSON object without surrounding markdown fences.`;
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
