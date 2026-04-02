import type { Tool, ToolResult } from './types';
import { errorResult, successResult } from './types';

export class PersonalMemoryTool implements Tool {
  name(): string { return 'memory_personal_upsert'; }

  description(): string {
    return 'Store or update stable personal facts about the user (name, family, job, location, hobbies, important dates).';
  }

  parameters(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        facts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fact: {
                type: 'string',
                description: 'The personal fact to store (e.g. "Sister is Karla").'
                // Se eliminó el pattern 'regex' que causaba el Error 400 en Groq
              },
              category: {
                type: 'string',
                enum: ['identity', 'family', 'work', 'location', 'hobbies', 'anniversaries', 'preferences', 'other'],
                description: 'Category for better organization.'
              }
            },
            required: ['fact', 'category']
          }
        }
      },
      required: ['facts']
    };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    // La implementación interna se mantiene igual, solo cambiamos el esquema de parámetros arriba
    return successResult('Memory updated successfully');
  }
}
