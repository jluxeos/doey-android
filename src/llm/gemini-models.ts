export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey?.trim()) return [];
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models
      .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''))
      .sort();
  } catch { return []; }
}
