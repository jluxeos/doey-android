const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  if (!apiKey?.trim()) return [];
  try {
    const response = await fetch(GROQ_MODELS_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data
      .map((m: any) => m.id)
      .filter((id: string) => /llama|mixtral|gemma|deepseek/.test(id))
      .sort();
  } catch { return []; }
}

export async function fetchClaudeModels(): Promise<string[]> { return []; }
export async function fetchCustomModels(): Promise<string[]> { return []; }
