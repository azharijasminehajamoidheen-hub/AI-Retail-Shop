import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RetailPulse Edge Backend',
      mode: 'Offline-First Edge Host',
      timestamp: new Date().toISOString(),
    });
  });

  // Multilingual Copilot Explain with Gemini 3.7 Flash
  app.post('/api/copilot/explain', async (req, res) => {
    try {
      const { query, language, context } = req.body;
      const ai = getGenAI();

      if (!ai) {
        return res.status(200).json({
          explanation: null,
          isOfflineFallback: true,
          message: 'Local Edge Mode active without cloud Gemini key.',
        });
      }

      const prompt = `You are the RetailPulse Edge Multilingual Staff Copilot for a supermarket.
The user is a store associate asking an operational question in language: ${language || 'en'}.
Provide a direct, helpful, and concise operational answer (2-3 sentences max).
Do NOT mention fake or ungrounded statistics. Emphasize physical actions (restocking shelves, opening checkout counters, auditing misplacements).
Question: "${query}"
Context: ${JSON.stringify(context || {})}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({
        explanation: response.text,
        isOfflineFallback: false,
      });
    } catch (err: any) {
      console.warn('Gemini Copilot Error:', err.message);
      res.json({
        explanation: null,
        isOfflineFallback: true,
        error: err.message,
      });
    }
  });

  // Setup Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RetailPulse Edge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
