// zeroto1.academy — Mock LLM Provider
// Deterministic, high-fidelity responses for tests and offline development

import { LlmProvider, ProviderResponse, GeneratedLessonSchema, ClassifyResult, DeepDiveResult, ReExplainResult, ModerateResult } from '../types';

const UNSAFE_KEYWORDS = [
  'bomb', 'gun', 'weapon', 'kill', 'murder', 'suicide', 'drug', 'poison', 'hack', 'porn', 'sex', 'violence', 'hate'
];

export class MockLlmProvider implements LlmProvider {
  public name = 'mock';

  public async generateText(prompt: string, _systemPrompt?: string): Promise<ProviderResponse<string>> {
    const start = Date.now();
    const responseText = `[Mock Response to: ${prompt.slice(0, 50)}...]`;
    return {
      data: responseText,
      rawText: responseText,
      latencyMs: Date.now() - start + 45,
      tokensUsed: { prompt: Math.ceil(prompt.length / 4), completion: 20, total: Math.ceil(prompt.length / 4) + 20 },
      costEstimateUsd: 0.0001,
    };
  }

  public async generateJson<T>(prompt: string, _systemPrompt?: string): Promise<ProviderResponse<T>> {
    const start = Date.now();
    const promptLower = prompt.toLowerCase();

    let resultData: unknown;

    // 1. Moderate Task
    if (promptLower.includes('moderate this text')) {
      const isUnsafe = UNSAFE_KEYWORDS.some((kw) => promptLower.includes(kw));
      const modResult: ModerateResult = isUnsafe
        ? { verdict: 'FAIL', reason: 'Contains unsafe or prohibited content for children', categories: ['unsafe_content'] }
        : { verdict: 'PASS' };
      resultData = modResult;
    }
    // 2. Classify Task
    else if (promptLower.includes('classify this kid question')) {
      const isUnsafe = UNSAFE_KEYWORDS.some((kw) => promptLower.includes(kw));
      let subject = 'Science';
      if (promptLower.includes('history') || promptLower.includes('pyramid') || promptLower.includes('rome') || promptLower.includes('war') || promptLower.includes('ancient')) {
        subject = 'History';
      } else if (promptLower.includes('art') || promptLower.includes('paint') || promptLower.includes('draw') || promptLower.includes('music')) {
        subject = 'Art';
      } else if (promptLower.includes('math') || promptLower.includes('number') || promptLower.includes('fraction') || promptLower.includes('count')) {
        subject = 'Math';
      }

      let ageBand: '5-8' | '8-11' | '11-15' = '8-11';
      if (promptLower.includes('simple') || promptLower.includes('5') || promptLower.includes('baby')) {
        ageBand = '5-8';
      } else if (promptLower.includes('complex') || promptLower.includes('advanced') || promptLower.includes('physics')) {
        ageBand = '11-15';
      }

      const classifyResult: ClassifyResult = {
        subject,
        ageBand,
        safetyVerdict: isUnsafe ? 'FAIL' : 'PASS',
        reasoning: isUnsafe
          ? 'Flagged for potentially unsafe content'
          : `Classified as ${subject} for curiosity level ${ageBand}`,
      };
      resultData = classifyResult;
    }
    // 3. Deep Dive Task
    else if (promptLower.includes('topic:') && promptLower.includes('kid\'s curiosity:')) {
      const ddResult: DeepDiveResult = {
        followUpPrompts: [
          'What happens if we travel deeper into this mystery?',
          'How did scientists first discover this phenomenon?',
          'Could we see this with our own eyes today?',
        ],
        deeperFact: 'Did you know? The very first instruments used to observe this were made of polished crystal and silver!',
        relatedTopics: ['Ocean Ecosystems', 'Sound Waves in Liquids', 'Animal Communication'],
      };
      resultData = ddResult;
    }
    // 4. Re-explain Task
    else if (promptLower.includes('target concept:')) {
      const reResult: ReExplainResult = {
        gentleExplanation: 'That was a clever guess! But think of sound waves like ripples across a swimming pool rather than tiny flying arrows.',
        analogy: 'Imagine splashing water in a bathtub — the ripples spread everywhere smoothly, carrying the message across.',
        tryAgainEncouragement: 'Take another peek at the clue and see which choice matches ripples in the water!',
      };
      resultData = reResult;
    }
    // 5. Generate Lesson (Default schema)
    else {
      const lessonResult: GeneratedLessonSchema = {
        title: 'How Do Whales Talk Across the Vast Ocean?',
        subject: 'Science',
        ageBand: '8-11',
        summary: 'Dive under the waves to discover the secret underwater songs that travel thousands of miles through the deep ocean.',
        bigQuestion: 'How can a whale sing to a friend who is hundreds of miles away in total ocean darkness?',
        byTheEnd: 'You will understand how acoustic sound channels work in water and how blue whales use singing to navigate and connect.',
        steps: {
          hook: {
            text: 'Imagine standing in pitch blackness under the sea. You cannot see your hand, but suddenly a low, deep vibration hums in your chest.',
            imagePrompt: 'A majestic humpback whale gliding through sunlit turquoise ocean waters with gentle acoustic ripples.',
          },
          video: {
            query: 'How whales communicate underwater science',
            channelAllowlist: ['SciShow Kids', 'CrashCourse Kids', 'National Geographic Kids', 'TED-Ed'],
          },
          read: {
            paragraphs: [
              'Sound travels nearly five times faster through water than through air because water molecules are packed tightly together.',
              'Whales produce powerful low-frequency clicks and songs that bounce along a deep layer of cold water called the SOFAR channel.',
              'These songs can travel across entire oceans, allowing whales to find each other across thousands of miles without getting lost.',
            ],
          },
          activity: {
            instruction: 'Tap the sound wave to match the frequency of the whale song and discover how far the signal travels!',
            interactionType: 'tap',
          },
          practice: {
            questions: [
              {
                prompt: 'Why does sound travel faster through water than through air?',
                choices: [
                  'Water molecules are packed much closer together than air molecules',
                  'Water is warmer than air',
                  'The ocean has no gravity',
                  'Fish push the sound waves forward',
                ],
                answerIndex: 0,
                explanation: 'Because water is denser, each vibrating particle quickly bumps into its neighbor, sending sound racing!',
              },
              {
                prompt: 'What special ocean layer acts like a sound highway for whale songs?',
                choices: [
                  'The SOFAR acoustic channel',
                  'The sandy seabed',
                  'The surface coral reef',
                  'The polar ice cap',
                ],
                answerIndex: 0,
                explanation: 'The SOFAR channel traps and channels sound waves like a fiber-optic cable for ocean songs.',
              },
            ],
          },
          deepDive: {
            followUps: [
              'Do different whale pods have different regional dialects?',
              'How does human ship engine noise impact whale communication?',
              'Can dolphins use clicking sounds like underwater cameras?',
            ],
          },
        },
      };
      resultData = lessonResult;
    }

    const jsonText = JSON.stringify(resultData);
    return {
      data: resultData as T,
      rawText: jsonText,
      latencyMs: Date.now() - start + 65,
      tokensUsed: { prompt: Math.ceil(prompt.length / 4), completion: Math.ceil(jsonText.length / 4), total: 320 },
      costEstimateUsd: 0.0002,
    };
  }
}
