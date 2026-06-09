import { config, isOpenRouterConfigured } from './config';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouter({ systemPrompt, userMessage, temperature = 0.5, history = [] }) {
  if (!isOpenRouterConfigured) {
    throw new Error('OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to frontend/.env.local');
  }

  const apiKey = config.openRouterApiKey;

  const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userMessage }];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      'X-Title': 'CareerPilot AI',
    },
    body: JSON.stringify({
      model: config.openRouterModel,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(errBody || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
