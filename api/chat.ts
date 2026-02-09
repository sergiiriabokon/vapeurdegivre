import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  systemPrompt: string;
}

interface GeminiResponse {
  message: string;
  trigger_next_scene: boolean;
  target_scene_id?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { message, history, systemPrompt } = req.body as ChatRequest;

    if (!message || !systemPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const formattedHistory = history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      },
    });

    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;
    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    let parsedResponse: GeminiResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          message: responseText.trim(),
          trigger_next_scene: false,
        };
      }
    } catch {
      parsedResponse = {
        message: responseText.trim(),
        trigger_next_scene: false,
      };
    }

    if (!parsedResponse.message) {
      parsedResponse.message = 'I have nothing to say at the moment.';
    }

    if (typeof parsedResponse.trigger_next_scene !== 'boolean') {
      parsedResponse.trigger_next_scene = false;
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
