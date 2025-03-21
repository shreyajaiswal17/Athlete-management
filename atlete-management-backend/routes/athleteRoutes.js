import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

// TensorFlow.js Model Setup (centralized instance)
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
model.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

// Centralized function to train the model
const trainModel = async () => {
  try {
    const data = await AthleteData.find();
    if (data.length > 0) {
      const xs = data.map(d => [
        parseFloat(d.hoursTrained),
        parseFloat(d.sessionsPerWeek),
        parseFloat(d.pastInjuries),
        parseFloat(d.restDays),
        parseFloat(d.age || 0)
      ]);
      const ys = data.map(d => 
        d.hoursTrained > 70 && d.restDays < 2 && d.pastInjuries > 0 ? 2 :
        d.sessionsPerWeek <= 3 && d.pastInjuries === 0 ? 0 : 1
      );
      await model.fit(tf.tensor2d(xs, [xs.length, xs[0].length], 'float32'), tf.tensor1d(ys), { epochs: 50 });
      console.log('Model trained');
    }
  } catch (error) {
    console.error('Error training model:', error);
  }
};

// Train model at startup
trainModel();

// Helper function to predict risk flag
const predictRiskFlag = (input) => {
  const tensor = tf.tensor2d([input], [1, input.length], 'float32');
  const prediction = model.predict(tensor);
  const riskIndex = prediction.argMax(-1).dataSync()[0];
  const riskFlags = ['Low Risk', 'Moderate Risk - Monitor', 'High Risk - Rest Recommended'];
  return riskFlags[riskIndex];
};

// GET /api/athlete/athletes - Fetch all athletes
router.get('/athletes', async (req, res) => {
  try {
    const athletes = await Athlete.find({}, 'name sport _id');
    res.status(200).json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/athlete/create - Create athlete with initial performance
router.post('/create', async (req, res) => {
  const { name, sport, goal, age, gender, location, hoursTrained, sessionsPerWeek, pastInjuries, restDays } = req.body;

  if (!name || !sport) {
    return res.status(400).json({ error: 'Name and sport are required' });
  }

  try {
    const athlete = new Athlete({
      name,
      sport,
      goal,
      age: parseInt(age),
      gender,
      location
    });
    await athlete.save();

    const athleteData = new AthleteData({
      athleteId: athlete._id,
      hoursTrained: parseFloat(hoursTrained) || 0,
      sessionsPerWeek: parseFloat(sessionsPerWeek) || 0,
      pastInjuries: parseFloat(pastInjuries) || 0,
      restDays: parseFloat(restDays) || 0,
      sportType: sport
    });
    await athleteData.save();

    const input = [
      athleteData.hoursTrained,
      athleteData.sessionsPerWeek,
      athleteData.pastInjuries,
      athleteData.restDays,
      athlete.age || 0
    ];
    const riskFlag = predictRiskFlag(input);

    res.status(201).json({ message: 'Athlete created successfully', athlete, riskFlag });
  } catch (error) {
    console.error('Error in /create:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const athletes = await Athlete.find({}, 'name sport _id');
    res.json(athletes);
    console.log(athletes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/athlete/log-performance - Log weekly performance
router.post('/log-performance', async (req, res) => {
  const { athleteId, hoursTrained, sessionsPerWeek, pastInjuries, restDays } = req.body;
  console.log("athlete",req.body);
   console.log("hello");
  if (!athleteId) {
    return res.status(400).json({ error: 'Athlete ID is required' });
  }

  try {
    const athlete = await Athlete.findById(athleteId);
   console.log("athlete",athlete);
   console.log("hello");
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const athleteData = new AthleteData({
      athleteId,
      hoursTrained: parseFloat(hoursTrained) || 0,
      sessionsPerWeek: parseFloat(sessionsPerWeek) || 0,
      pastInjuries: parseFloat(pastInjuries) || 0,
      restDays: parseFloat(restDays) || 0,
      sportType: athlete.sport
    });
    await athleteData.save();

    const input = [
      athleteData.hoursTrained,
      athleteData.sessionsPerWeek,
      athleteData.pastInjuries,
      athleteData.restDays,
      athlete.age || 0
    ];
    const riskFlag = predictRiskFlag(input);

    await trainModel(); // Retrain with new data

    res.status(201).json({ message: 'Weekly performance logged successfully', riskFlag });
  } catch (error) {
    console.error('Error in /log-performance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/performance/:id', async (req, res) => {

  try {
    const data = await AthleteData.find({ athleteId: req.params.id }).sort({ timestamp: -1 }).populate('athleteId', 'name sport gender age');

    const enrichedData = data.map((d) => {
      const athlete = d.athleteId; // Populated athlete document
      const input = [
        d.hoursTrained,
        d.sessionsPerWeek,
        d.pastInjuries,
        d.restDays,
        athlete?.age || 0
      ];
      const riskFlag = predictRiskFlag(input);
    
      return { 
        ...d._doc, 
        riskFlag,
        athleteName: athlete?.name || d.name || 'Unknown',
        gender: athlete?.gender || 'Not specified',
        sport: athlete?.sport || d.sportType || 'Unknown'
      };
    });
    res.status(200).json({ performanceData: enrichedData });
  } catch (error) {
    console.error('Error fetching athlete data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /api/athlete/data - Fetch recent performance data
router.get('/data', async (req, res) => {
  try {
    const data = await AthleteData.find().sort({ timestamp: -1 }).limit(10);
    const enrichedData = await Promise.all(data.map(async (d) => {
      const athlete = await Athlete.findById(d.athleteId);
      const input = [
        d.hoursTrained,
        d.sessionsPerWeek,
        d.pastInjuries,
        d.restDays,
        athlete?.age || 0
      ];
      const riskFlag = predictRiskFlag(input);
      return { ...d._doc, riskFlag, athleteName: athlete?.name };
    }));
    res.status(200).json(enrichedData);
  } catch (error) {
    console.error('Error fetching athlete data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
