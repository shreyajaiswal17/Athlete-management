import express from 'express';
import { Groq } from 'groq-sdk';

const router = express.Router();
const groq = new Groq({ apiKey: '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' });
console.log('Groq initialized:', groq);

router.post('/', async (req, res) => {
  const { message } = req.body;
  console.log('Received request body:', req.body);

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log('Generating content for message:', message);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama3-8b-8192', // Adjust if your model is valid
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null,
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    console.log('AI response received:', aiResponse.slice(0, 50) + '...');
    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error in Groq API:', error.response?.data || error.message, error.stack);
    res.status(500).json({ error: 'Failed to process the message', details: error.response?.data || error.message });
  }
});

export default router;