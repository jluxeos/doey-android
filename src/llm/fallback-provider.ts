import type { LLMProvider, Message, ToolDefinition, LLMResponse, LLMOptions } from './types';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';

export class FallbackProvider implements LLMProvider {
  constructor(private primary: GeminiProvider, private secondary: OpenAIProvider | null) {}

  getCurrentModel(): string { return this.primary.getCurrentModel(); }

  async testConnection() {
    const primaryRes = await this.primary.testConnection();
    if (primaryRes.success) return primaryRes;
    if (!this.secondary) return { success: false, error: 'Gemini falló: ' + primaryRes.error };
    const secondaryRes = await this.secondary.testConnection();
    if (secondaryRes.success) return { success: true, response: 'Gemini falló, Groq activo.' };
    return { success: false, error: 'Gemini: ' + primaryRes.error + ' | Groq: ' + secondaryRes.error };
  }

  async chat(messages: Message[], tools: ToolDefinition[], options: LLMOptions = {}): Promise<LLMResponse> {
    try {
      return await this.primary.chat(messages, tools, options);
    } catch (err: any) {
      if (!this.secondary) throw err;
      try {
        return await this.secondary.chat(messages, tools, options);
      } catch (secondaryErr: any) {
        throw new Error('Gemini falló (' + (err?.message || err) + ') y Groq también falló (' + (secondaryErr?.message || secondaryErr) + ')');
      }
    }
  }
}
