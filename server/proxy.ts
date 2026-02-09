import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Validate API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  console.error('Please create a .env file with your API key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

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

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, systemPrompt } = req.body as ChatRequest;

    if (!message || !systemPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build the conversation history
    const formattedHistory = history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      },
    });

    // Prepend system prompt to the message for context
    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;

    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    // Try to parse as JSON
    let parsedResponse: GeminiResponse;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, wrap the text as a message
        parsedResponse = {
          message: responseText.trim(),
          trigger_next_scene: false,
        };
      }
    } catch {
      // Fallback: treat entire response as message
      parsedResponse = {
        message: responseText.trim(),
        trigger_next_scene: false,
      };
    }

    // Validate response structure
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
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log(`  POST /api/chat - Send chat messages`);
  console.log(`  GET /api/health - Health check`);
});
