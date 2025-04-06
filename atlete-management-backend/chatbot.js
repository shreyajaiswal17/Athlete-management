import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_API_KEY is not set in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 503) {
      console.warn(`Retrying... (${MAX_RETRIES - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

router.post('/api/chatbot', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `
        You are a helpful assistant for athletes and coaches. 
        Provide concise, actionable advice on training, recovery, and nutrition. 
        Ensure your response is exactly 300 words.
      `,
    });

    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 300,
      topP: 0.8,
    };

    const chatSession = model.startChat({ generationConfig, history: [] });
    const result = await retryWithBackoff(() => chatSession.sendMessage(message));
    const aiResponse = result.response.text();

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error in chatbot API:', error.message, error.stack);
    if (error.status === 503) {
      res.status(503).json({
        error: 'Service unavailable due to high demand. Please try again later.',
        fallbackResponse: 'I am currently unable to process your request.',
      });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});

export default router;