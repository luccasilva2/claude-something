'use server';
/**
 * @fileOverview A Genkit flow for conversational AI chat.
 *
 * - chatWithAI - Sends a user message plus retrieved local skill context to the model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAIInputSchema = z.object({
  message: z.string().describe('The user message.'),
  skillsContext: z.string().describe('Relevant local skills context retrieved from files.'),
  historyContext: z.string().describe('Recent conversation history.'),
  assistantMode: z.string().describe('Selected chatbot mode.'),
  assistantModeGuidelines: z.string().describe('Behavior rules for selected chatbot mode.'),
  assistantModeOutputContract: z.string().describe('Required output structure for selected chatbot mode.'),
  assistantModeQualityGate: z.string().describe('Completion quality gate for selected chatbot mode.'),
  n8nExpertMode: z.boolean().describe('Whether to enforce enterprise n8n workflow delivery standards.'),
  n8nGuidelines: z.string().describe('Enterprise n8n workflow development guidance.'),
});
export type ChatWithAIInput = z.infer<typeof ChatWithAIInputSchema>;

const ChatWithAIOutputSchema = z
  .string()
  .describe('The AI assistant response.');
export type ChatWithAIOutput = z.infer<typeof ChatWithAIOutputSchema>;

export async function chatWithAI(input: ChatWithAIInput): Promise<ChatWithAIOutput> {
  return chatWithAIFlow(input);
}

const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: ChatWithAIInputSchema,
    outputSchema: ChatWithAIOutputSchema,
  },
  async (input) => {
    const prompt = `You are a practical AI assistant.

You receive local "skills" docs extracted from the project's skills folder.
Use them when relevant, but do not invent details that are not in the context.
If context is not relevant, answer normally and say you did not find a specific local skill.

Important behavior rules:
- Local file context may already be provided below by the backend.
- Never claim you cannot access local files/folders when local context is present.
- Do not say you are unable to read @n8n-local or local directories if excerpts are provided.
- Ground your answer on the provided excerpts and clearly state when information is missing.
- If user asks to modify/create files, instruct them to use chat commands (/write, /append, /mkdir) and approval flow when needed.
- If n8nExpertMode is true, produce enterprise-grade workflow output.

assistantMode:
${input.assistantMode}

assistantMode guidelines:
${input.assistantModeGuidelines}

assistantMode output contract:
${input.assistantModeOutputContract}

assistantMode quality gate:
${input.assistantModeQualityGate}

Additional global rule:
- Reply in the same language used by the user unless explicitly asked otherwise.

n8nExpertMode:
${input.n8nExpertMode ? 'true' : 'false'}

n8n enterprise guidance:
${input.n8nGuidelines}

Local skills context:
${input.skillsContext}

Recent conversation history:
${input.historyContext}

User message:
${input.message}`;

    const result = await ai.generate({ prompt });
    const text = result.text?.trim();
    if (text) {
      return text;
    }

    const output = result.output;
    if (typeof output === 'string' && output.trim()) {
      return output.trim();
    }

    return 'Nao consegui gerar uma resposta valida agora. Tente novamente.';
  }
);
