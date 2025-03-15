import express from 'express';
import Athlete from '../models/athlete.js';

const router = express.Router();

// Create Athlete Endpoint
router.post('/create', async (req, res) => {
  const { name, sport, goal, age, gender, location } = req.body;
console.log("req.body",req.body);
  if (!name || !sport) {
    return res.status(400).json({ error: 'Name and sport are required' });
  }

  try {
    const athlete = new Athlete({
      name,
      sport,
      goal,
      age,
      gender,
      location
    });
    await athlete.save();
    res.status(201).json(athlete);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
