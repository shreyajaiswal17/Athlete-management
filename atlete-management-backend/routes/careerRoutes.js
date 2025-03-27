import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

let trainedModel = null;

// Training data preparation function
const getTrainingData = async () => {
  try {
    const athletes = await Athlete.find();
    if (!athletes.length) {
      throw new Error('No athletes found in the database for training');
    }

    const athleteDataPromises = athletes.map(async (a) => {
      return await AthleteData.findOne({ athleteId: a._id }).sort({ timestamp: -1 });
    });
    const athleteData = await Promise.all(athleteDataPromises);

    // Input features: [age, hoursTrained, injuryCount, sessionsPerWeek, competitionWins]
    let xs = athletes.map((a, index) => {
      const perf = athleteData[index] || {};
      const wins = a.competitionHistory?.filter(c => c.result === 'Win').length || 0;
      return [
        (a.age || 0) / 100,
        (perf.hoursTrained || 0) / 50,
        (a.injuryHistory?.length || 0) / 10,
        (perf.sessionsPerWeek || 0) / 14,
        (wins) / 20
      ];
    });

    // Output labels: [Focus on Training, Competition Ready, Injury Prevention]
    let ys = athletes.map((a, index) => {
      const perf = athleteData[index] || {};
      const injuryCount = a.injuryHistory?.length || 0;
      const wins = a.competitionHistory?.filter(c => c.result === 'Win').length || 0;
      const hours = perf.hoursTrained || 0;
      const restDays = perf.restDays || 0;

      console.log(`Athlete ${a.name}: age=${a.age}, hours=${hours}, injuryCount=${injuryCount}, sessions=${perf.sessionsPerWeek}, wins=${wins}, restDays=${restDays}`);

      if (wins > 0 && hours > 20 && injuryCount <= 2) return [0, 1, 0]; // Competition Ready
      if (injuryCount > 2 || (restDays < 1 && hours > 40)) return [0, 0, 1]; // Injury Prevention
      return [1, 0, 0]; // Focus on Training
    });

    // Add more synthetic data to balance
    const syntheticXs = [
      [25/100, 45/50, 1/10, 6/14, 1/20], // Your input
      [23/100, 40/50, 0/10, 5/14, 2/20],
      [30/100, 35/50, 2/10, 7/14, 1/20],
      [27/100, 50/50, 1/10, 8/14, 2/20], // More Competition Ready
      [20/100, 25/50, 0/10, 4/14, 1/20],
      [35/100, 30/50, 2/10, 6/14, 3/20]  // Total 6 Competition Ready
    ];
    const syntheticYs = [
      [0, 1, 0], // Competition Ready
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ];

    // Combine real and synthetic data
    xs = [...xs, ...syntheticXs];
    ys = [...ys, ...syntheticYs];

    // Log data summary
    const labelCounts = ys.reduce((acc, y) => {
      const label = y.indexOf(1);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    console.log('Training Inputs (xs):', xs);
    console.log('Training Labels (ys):', ys.map(y => y.indexOf(1)));
    console.log('Label Distribution:', labelCounts);

    return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
  } catch (error) {
    console.error('Error preparing training data:', error);
    throw error;
  }
};

// Train model endpoint
router.get('/train', async (req, res) => {
  try {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] })); // Simplified capacity
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    const { xs, ys } = await getTrainingData();

    // Add class weights to prioritize Competition Ready
    const classWeights = {
      0: 1.0, // Focus on Training
      1: 2.0, // Competition Ready (higher weight)
      2: 1.5  // Injury Prevention
    };

    await model.fit(xs, ys, {
      epochs: 100, // Reduced epochs with better data
      batchSize: 4,
      shuffle: true,
      validationSplit: 0.2,
      classWeight: classWeights,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}, val_loss = ${logs.val_loss}, val_acc = ${logs.val_acc}`);
        }
      }
    });

    trainedModel = model;

    // Test the model with your input
    const testInput = tf.tensor2d([[25/100, 45/50, 1/10, 6/14, 1/20]]);
    const prediction = model.predict(testInput);
    const result = await prediction.data();
    console.log('Test Prediction for Input:', Array.from(result));

    res.status(200).json({
      message: 'Model trained successfully and stored in memory',
      testPrediction: { 
        guidance: ['Focus on Training', 'Competition Ready', 'Injury Prevention'][result.indexOf(Math.max(...result))],
        probabilities: Array.from(result)
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({ message: 'Failed to train model', error: error.message });
  }
});

// Predict career guidance endpoint
router.post('/career-guidance', async (req, res) => {
  try {
    if (!trainedModel) {
      return res.status(400).json({ message: 'Model not trained yet. Please run /train first.' });
    }

    const { age, hoursTrained, injuryCount, sessionsPerWeek, competitionWins } = req.body;
    if ([age, hoursTrained, injuryCount, sessionsPerWeek, competitionWins].some(v => v === undefined)) {
      return res.status(400).json({ 
        message: 'Missing required fields: age, hoursTrained, injuryCount, sessionsPerWeek, competitionWins' 
      });
    }

    const input = [
      (age || 0) / 100,
      (hoursTrained || 0) / 50,
      (injuryCount || 0) / 10,
      (sessionsPerWeek || 0) / 14,
      (competitionWins || 0) / 20
    ];

    const inputTensor = tf.tensor2d([input]);
    const prediction = trainedModel.predict(inputTensor);
    const result = await prediction.data();

    const categories = ['Focus on Training', 'Competition Ready', 'Injury Prevention'];
    const maxIndex = result.indexOf(Math.max(...result));
    const guidance = categories[maxIndex];

    inputTensor.dispose();
    prediction.dispose();

    res.status(200).json({
      careerGuidance: guidance,
      probabilities: Array.from(result)
    });
  } catch (error) {
    console.error('Error predicting career guidance:', error);
    res.status(500).json({ message: 'Failed to predict career guidance', error: error.message });
  }
});


export default router;