import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const apiKey = 'AIzaSyBxE8dyrygRc8USvlF_XJ4LvJmDqMG0cdg';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash', // Verify with Google’s latest API docs
  systemInstruction: `
  You are a helpful assistant for "PeakPulse," an app for athletes and coaches. Provide concise, actionable, sport-specific advice on training, recovery, nutrition, or anger management. Use bold headings like "Training Tips:" and keep responses under 100 words with practical, sport-related examples.
`,
});

const generationConfig = {
  temperature: 0.2,
  maxOutputTokens: 150, // Limits to ~100 words
  topP: 0.8,
};

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const chatSession = model.startChat({ generationConfig, history: [] });
    const result = await chatSession.sendMessage(message);
    res.status(200).json({ response: result.response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;