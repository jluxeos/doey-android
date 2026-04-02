import type { LLMProvider, Message, ToolDefinition } from '../llm/types';
import type { ToolRegistry } from './tool-registry';
import { DebugLogger } from './debug-logger';

export interface RunToolLoopOptions {
  provider: LLMProvider;
  tools: ToolRegistry;
  maxIterations?: number;
  shouldExit?: () => boolean;
  earlyExitContent?: () => string;
  onIterationComplete?: () => void;
}

export interface RunToolLoopResult {
  content: string;
  newMessages: Message[];
  iterations: number;
}

export async function runToolLoop(
  options: RunToolLoopOptions,
  messages: Message[],
): Promise<RunToolLoopResult> {
  const {
    provider,
    tools,
    maxIterations = 10,
    shouldExit,
    earlyExitContent,
    onIterationComplete,
  } = options;

  const newMessages: Message[] = [];
  let iterations = 0;
  let finalContent = '';

  const toolDefs: ToolDefinition[] = tools.definitions();
  const allMessages = [...messages];

  while (iterations < maxIterations) {
    if (shouldExit?.()) {
      finalContent = earlyExitContent?.() ?? '';
      break;
    }

    iterations++;
    DebugLogger.add('info', 'tool-loop', `Iteration ${iterations}/${maxIterations}`);

    let response;
    try {
      response = await provider.chat(allMessages, toolDefs);
    } catch (err) {
      DebugLogger.add('error', 'tool-loop', `LLM call failed: ${String(err)}`);
      throw err;
    }

    const assistantMsg: Message = {
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls.length > 0 ? response.toolCalls : undefined,
    };
    allMessages.push(assistantMsg);
    newMessages.push(assistantMsg);
    finalContent = response.content;

    if (response.finishReason !== 'tool_calls' || response.toolCalls.length === 0) {
      DebugLogger.add('info', 'tool-loop', 'No tool calls, ending loop');
      onIterationComplete?.();
      break;
    }

    for (const tc of response.toolCalls) {
      DebugLogger.add('info', 'tool-loop', `Calling tool: ${tc.name}`);
      let resultContent: string;
      try {
        const tool = tools.getTool(tc.name);
        if (!tool) {
          resultContent = JSON.stringify({ error: `Tool "${tc.name}" not found` });
        } else {
          const res = await tool.execute(tc.arguments);
          resultContent = typeof res === 'string' ? res : JSON.stringify(res);
        }
      } catch (err) {
        resultContent = JSON.stringify({ error: String(err) });
      }

      const toolResultMsg: Message = {
        role: 'tool',
        content: resultContent,
        toolCallId: tc.id,
      };
      allMessages.push(toolResultMsg);
      newMessages.push(toolResultMsg);
      DebugLogger.add('info', 'tool-loop', `Tool ${tc.name} result: ${resultContent.slice(0, 200)}`);
    }

    onIterationComplete?.();

    if (shouldExit?.()) {
      finalContent = earlyExitContent?.() ?? finalContent;
      break;
    }
  }

  return { content: finalContent, newMessages, iterations };
}
