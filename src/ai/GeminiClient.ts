import type { GeminiRequest, GeminiResponse, ChatMessage } from '../types';

class GeminiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(
    message: string,
    history: ChatMessage[],
    systemPrompt: string
  ): Promise<GeminiResponse> {
    const request: GeminiRequest = {
      message,
      history,
      systemPrompt,
    };

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const geminiClient = new GeminiClient();
