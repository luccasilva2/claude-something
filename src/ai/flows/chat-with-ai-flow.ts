'use server';
/**
 * @fileOverview A Genkit flow for conversational AI chat.
 *
 * - chatWithAI - A function that sends a user message to the AI and receives a response.
 * - ChatWithAIInput - The input type for the chatWithAI function.
 * - ChatWithAIOutput - The return type for the chatWithAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAIInputSchema = z
  .string()
  .describe('The user\'s message to the AI assistant.');
export type ChatWithAIInput = z.infer<typeof ChatWithAIInputSchema>;

const ChatWithAIOutputSchema = z
  .string()
  .describe('The AI assistant\'s response.');
export type ChatWithAIOutput = z.infer<typeof ChatWithAIOutputSchema>;

export async function chatWithAI(
  input: ChatWithAIInput
): Promise<ChatWithAIOutput> {
  return chatWithAIFlow(input);
}

const chatWithAIPrompt = ai.definePrompt({
  name: 'chatWithAIPrompt',
  input: { schema: ChatWithAIInputSchema },
  output: { schema: ChatWithAIOutputSchema },
  prompt: 'You are a helpful AI assistant. Respond to the user\'s message.\n\nUser: {{{input}}}',
});

const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: ChatWithAIInputSchema,
    outputSchema: ChatWithAIOutputSchema,
  },
  async (input) => {
    const { output } = await chatWithAIPrompt(input);
    return output!;
  }
);
