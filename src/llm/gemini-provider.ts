import type { LLMProvider, Message, ToolDefinition, LLMResponse, LLMOptions, ToolCall } from './types';

function cleanSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const banned = ['additionalProperties', '$schema', 'default', 'examples', 'contentEncoding', 'contentMediaType'];
  const result: any = Array.isArray(schema) ? [] : {};
  for (const key of Object.keys(schema)) {
    if (banned.includes(key)) continue;
    result[key] = cleanSchema(schema[key]);
  }
  return result;
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, init);
    if (response.status !== 429) return response;
    const data = await response.clone().json().catch(() => ({}));
    const msg: string = data?.error?.message || '';
    const match = msg.match(/retry in ([\d.]+)s/i);
    const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : (attempt + 1) * 10000;
    await new Promise(r => setTimeout(r, waitMs));
    lastError = data;
  }
  throw new Error(`Gemini Error: ${JSON.stringify(lastError?.error || lastError)}`);
}

export class GeminiProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  getCurrentModel(): string { return this.model; }

  async chat(messages: Message[], tools: ToolDefinition[], options: LLMOptions = {}): Promise<LLMResponse> {
    const googleTools = tools.length > 0 ? [{
      function_declarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: cleanSchema(t.function.parameters)
      }))
    }] : [];

    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const contents = nonSystemMessages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'user',
          parts: [{ functionResponse: { name: msg.toolCallId || 'tool', response: { content: msg.content } } }]
        };
      }
      const parts: any[] = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.toolCalls) {
        msg.toolCalls.forEach(tc => {
          parts.push({ functionCall: { name: tc.name, args: tc.arguments } });
        });
      }
      return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    });

    const body: any = { contents };
    if (googleTools.length > 0) body.tools = googleTools;
    if (systemMsg?.content) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(`Gemini Error: ${data.error?.message || JSON.stringify(data.error)}`);

    const candidate = data.candidates?.[0];
    const content = (candidate?.content?.parts || []).filter((p: any) => p.text).map((p: any) => p.text).join('') || '';

    const toolCalls: ToolCall[] = (candidate?.content?.parts || [])
      .filter((p: any) => p.functionCall)
      .map((p: any) => ({
        id: Math.random().toString(36).substring(7),
        type: 'function' as const,
        name: p.functionCall.name,
        arguments: p.functionCall.args
      }));

    return {
      content,
      toolCalls,
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }

  async testConnection() {
    try {
      const res = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'hola' }] }] }) }
      );
      const data = await res.json();
      return { success: res.ok, response: data.candidates?.[0]?.content?.parts?.[0]?.text };
    } catch (err) { return { success: false, error: String(err) }; }
  }
}
