
'use server';
/**
 * @fileOverview An AI agent that explains space phenomena based on user questions,
 * and provides information about the Cosmofy platform.
 * It uses OpenRouter to access various LLMs.
 *
 * - spaceExplainer - A function that explains space phenomena or Cosmofy.
 * - SpaceExplainerInput - The input type for the spaceExplainer function.
 * - SpaceExplainerOutput - The return type for the spaceExplainer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SpaceExplainerInputSchema = z.object({
  question: z.string().describe('The question about space phenomena or the Cosmofy platform.'),
});
export type SpaceExplainerInput = z.infer<typeof SpaceExplainerInputSchema>;

const SpaceExplainerOutputSchema = z.object({
  answer: z.string().describe('The AI-generated explanation.'),
});
export type SpaceExplainerOutput = z.infer<typeof SpaceExplainerOutputSchema>;

// This function is what your UI will call.
export async function spaceExplainer(input: SpaceExplainerInput): Promise<SpaceExplainerOutput> {
  return spaceExplainerOpenRouterFlow(input);
}

const spaceExplainerOpenRouterFlow = ai.defineFlow(
  {
    name: 'spaceExplainerOpenRouterFlow',
    inputSchema: SpaceExplainerInputSchema,
    outputSchema: SpaceExplainerOutputSchema,
  },
  async (input) => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }

    const model = "deepseek/deepseek-chat"; 

    const cosmofyContext = `
You are Cosmo, the friendly and knowledgeable AI assistant for Cosmofy.
Cosmofy is an engaging web application designed to be a portal to the cosmos. Its mission is to make space exploration accessible and exciting for everyone.

Key features of Cosmofy include:
- Dashboard: An overview of key space-related features.
- Space Weather Center: Provides information on solar flares, Coronal Mass Ejections (CMEs), geomagnetic storms, and other solar phenomena.
- Space Disaster Watch: Monitors potential space-related threats like Near-Earth Objects (NEOs), high-speed solar wind streams, and issues alerts.
- Live Spacecraft Tracking: Allows users to follow active space missions (like the ISS, Hubble) with real-time TLE data and pass predictions.
- Personalized Event Calendar: Helps users discover upcoming rocket launches, meteor showers, eclipses, and other celestial events, tailored to their location.
- Interactive Solar System (Future Feature): Planned to allow exploration of planets, moons, and their positions. Currently shows 2D planetary data.

When asked about Cosmofy, its features, or what it does, provide helpful and accurate information based on the above.
For general space-related questions, answer clearly, concisely, and in a friendly, engaging manner suitable for a general audience. Use markdown for formatting if appropriate (e.g., lists, bolding key terms).
If a question is ambiguous, you can ask for clarification.
Do not mention your specific model name (DeepSeek) or that you are accessed via OpenRouter. You are Cosmo, part of Cosmofy.
`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cosmofy.app', // Replace with your app's production URL
          'X-Title': 'Cosmofy AI Assistant',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: cosmofyContext },
            { role: 'user', content: input.question },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter API Error:', response.status, errorBody);
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return { answer: data.choices[0].message.content.trim() };
      } else {
        console.error('Unexpected OpenRouter API response structure:', data);
        throw new Error('Failed to get a valid response from OpenRouter.');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      if (error instanceof Error) {
        throw new Error(`Network or parsing error when calling OpenRouter: ${error.message}`);
      }
      throw new Error('An unknown error occurred while contacting the AI service.');
    }
  }
);
