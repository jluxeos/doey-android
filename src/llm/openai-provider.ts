import type { LLMProvider, Message, ToolDefinition, LLMResponse, LLMOptions, ToolCall } from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama3-70b-8192';

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(apiKey: string, defaultModel: string = DEFAULT_MODEL, baseUrl: string = GROQ_API_URL) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseUrl = baseUrl;
  }

  getCurrentModel(): string { return this.defaultModel; }

  async testConnection(): Promise<{ success: boolean; error?: string; response?: string; }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: this.defaultModel, messages: [{ role: 'user', content: 'hola' }] }),
      });
      const data = await response.json();
      return { success: response.ok, response: data.choices?.[0]?.message?.content };
    } catch (err) { return { success: false, error: String(err) }; }
  }

  async chat(messages: Message[], tools: ToolDefinition[], options: LLMOptions = {}): Promise<LLMResponse> {
    const groqMessages = messages.map(msg => {
      if (msg.role === 'tool') return { role: 'tool', content: msg.content, tool_call_id: msg.toolCallId };
      if (msg.role === 'assistant' && msg.toolCalls?.length) {
        return {
          role: 'assistant',
          content: msg.content || "",
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
          }))
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const body: any = {
      model: this.defaultModel,
      messages: groqMessages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Groq Error ${response.status}: ${JSON.stringify(data.error)}`);

    const choice = data.choices[0];
    const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      type: 'function',
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments)
    }));

    return {
      content: choice.message.content || "",
      toolCalls,
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }
}
