import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { FallbackProvider } from './fallback-provider';
import type { LLMProvider } from './types';

export function createLLMProvider(options: {
  apiKey: string;
  customApiKey?: string;
}): LLMProvider {
  const gemini = new GeminiProvider(options.apiKey, 'gemini-2.5-flash');
  const groq = options.customApiKey?.trim()
    ? new OpenAIProvider(options.customApiKey, 'llama-3.1-8b-instant')
    : null;
  return new FallbackProvider(gemini, groq);
}
