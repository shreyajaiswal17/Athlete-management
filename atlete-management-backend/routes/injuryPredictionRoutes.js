import express from 'express';
import tf from '@tensorflow/tfjs';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

// TensorFlow.js Model Setup for Injury Prediction
const injuryModel = tf.sequential();
injuryModel.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
injuryModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
injuryModel.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

// Centralized function to train the injury prediction model
const trainInjuryModel = async () => {
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
        d.pastInjuries > 0 ? 1 : 0 // Binary classification for injury prediction
      );
      await injuryModel.fit(tf.tensor2d(xs, [xs.length, xs[0].length], 'float32'), tf.tensor1d(ys, 'int32'), { epochs: 50 });
      console.log('Injury prediction model trained');
    }
  } catch (error) {
    console.error('Error training injury model:', error);
  }
};

// Train model at startup
trainInjuryModel();

// GET /api/athlete/injury-prediction - Fetch injury predictions
router.get('/injury-prediction/:id', async (req, res) => {
    try {
      const data = await AthleteData.find({ athleteId: req.params.id }).sort({ timestamp: -1 }).limit(1); // Latest record for this athlete
      if (data.length === 0) {
        return res.status(404).json({ error: 'No data found for this athlete' });
      }
      const d = data[0];
      const input = [
        d.hoursTrained,
        d.sessionsPerWeek,
        d.pastInjuries,
        d.restDays,
        d.age || 0
      ];
      const tensor = tf.tensor2d([input], [1, input.length], 'float32');
      const prediction = injuryModel.predict(tensor).dataSync()[0];
      const predictionResult = {
        ...d._doc,
        injuryRisk: prediction > 0.5 ? 'High Risk' : 'Low Risk',
        predictionScore: prediction // Optional: raw probability
      };
      res.status(200).json({ injuryPrediction: predictionResult });
    } catch (error) {
      console.error('Error fetching injury prediction:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });