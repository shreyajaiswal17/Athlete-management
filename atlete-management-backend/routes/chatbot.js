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
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide an ultra-concise, coherent response strictly within 50 tokens. End at a complete sentence, avoiding cutoffs at colons or mid-list. Prioritize brevity and clarity, especially for list-based queries.'
        },
        { role: 'user', content: message }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.5, // Low for conciseness
      max_tokens: 50, // Strict limit
      top_p: 0.7, // Tight for brevity
      stream: false,
      stop: ['. ', '! ', '? '], // Stop at sentence boundaries only
    });

    const aiResponse = chatCompletion.choices[0].message.content.trim();
    // Estimate token count (1 token ≈ 0.75 words)
    const wordCount = aiResponse.split(/\s+/).length;
    const tokenEstimate = Math.round(wordCount / 0.75);
    console.log('AI response received:', aiResponse.slice(0, 50) + '...');
    console.log('Estimated tokens:', tokenEstimate);
    console.log('Word count:', wordCount);
    console.log('Character count:', aiResponse.length);
    console.log('Full response:', aiResponse); // Log full response for debugging

    // Fallback: Truncate at last complete sentence if over limit
    let finalResponse = aiResponse;
    if (tokenEstimate > 50) {
      const sentences = aiResponse.split(/(?<=[.!?])\s+/);
      let tokenCount = 0;
      finalResponse = '';
      for (let sentence of sentences) {
        const sentenceTokens = Math.round(sentence.split(/\s+/).length / 0.75);
        if (tokenCount + sentenceTokens <= 50) {
          finalResponse += sentence + ' ';
          tokenCount += sentenceTokens;
        } else {
          break;
        }
      }
      finalResponse = finalResponse.trim();
      console.log('Response truncated to fit ~50 tokens');
    }

    res.status(200).json({ response: finalResponse });
  } catch (error) {
    console.error('Error in Groq API:', error.response?.data || error.message, error.stack);
    res.status(500).json({ error: 'Failed to process the message', details: error.response?.data || error.message });
  }
});

export default router;