import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const MAX_RETRIES = 3; // Maximum number of retries
const RETRY_DELAY = 1000; // Initial delay in milliseconds

// Helper function to retry with exponential backoff
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 503) {
      console.warn(`Retrying... (${MAX_RETRIES - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2); // Double the delay for each retry
    }
    throw error;
  }
};

// Chatbot endpoint
router.post('/api/chatbot', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    // Configure the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `
        You are a helpful assistant for athletes and coaches. 
        Provide concise, actionable advice on training, recovery, and nutrition. 
        Ensure your response is exactly 300 words.
      `,
    });

    const generationConfig = {
      temperature: 0.2, // Balanced creativity
      maxOutputTokens: 300, // Adjust to fit 300 words
      topP: 0.8, // Focused responses
    };

    // Start a chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [], // No prior context for now
    });

    // Send the user's message and get the AI's response
    const result = await retryWithBackoff(() => chatSession.sendMessage(message));
    const aiResponse = result.response.text();

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error in chatbot API:', error);

    // Provide a fallback response if retries fail
    if (error.status === 503) {
      res.status(503).json({
        error: 'The chatbot service is currently unavailable due to high demand. Please try again later.',
        fallbackResponse: 'I am currently unable to process your request. Please try again later.',
      });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
  }
});

export default router;