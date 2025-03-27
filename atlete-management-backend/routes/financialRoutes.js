import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

let trainedFinancialModel = null;

// Training data preparation function
const getFinancialTrainingData = async () => {
  try {
    const athletes = await Athlete.find();
    if (!athletes.length) {
      throw new Error('No athletes found in the database for financial training');
    }

    const athleteDataPromises = athletes.map(async (a) => {
      return await AthleteData.findOne({ athleteId: a._id }).sort({ timestamp: -1 });
    });
    const athleteData = await Promise.all(athleteDataPromises);

    // Input features: [age, currentIncome, expenses, savingsRate]
    let xs = athletes.map((a, index) => {
      const perf = athleteData[index] || {};
      const currentIncome = a.currentIncome || 0;
      const savings = a.savings || 0;
      const expenses = perf.expenses || 0; // Weekly expenses
      const savingsRate = currentIncome > 0 ? (savings / currentIncome) * 100 : 0; // Percentage

      return [
        (a.age || 0) / 100, // Normalize age (0-1, max 100)
        currentIncome / 100000, // Normalize income (max 100k USD)
        expenses / 1000, // Normalize weekly expenses (max 1k USD)
        savingsRate / 100 // Normalize savings rate (0-100%)
      ];
    });

    // Output labels: [Save More, Invest Now, Reduce Expenses]
    let ys = athletes.map((a, index) => {
      const perf = athleteData[index] || {};
      const currentIncome = a.currentIncome || 0;
      const savings = a.savings || 0;
      const expenses = perf.expenses || 0; // Weekly expenses
      const savingsRate = currentIncome > 0 ? (savings / currentIncome) * 100 : 0;

      console.log(`Athlete ${a.name}: age=${a.age}, currentIncome=${currentIncome}, expenses=${expenses}, savingsRate=${savingsRate.toFixed(2)}%`);

      // Weekly expenses > 20% of annual income / 52 weeks suggests overspending
      if (currentIncome > 50000 && savingsRate > 20) return [0, 1, 0]; // Invest Now
      if (expenses > (currentIncome * 0.2) / 52) return [0, 0, 1]; // Reduce Expenses
      return [1, 0, 0]; // Save More (default)
    });

    // Add synthetic data to balance the dataset
    const syntheticXs = [
      [25/100, 60000/100000, 200/1000, 25/100],  // Invest Now (high income, good savings)
      [30/100, 40000/100000, 1000/1000, 10/100], // Reduce Expenses (high weekly expenses)
      [22/100, 30000/100000, 150/1000, 5/100],   // Save More (low savings rate)
      [28/100, 70000/100000, 300/1000, 30/100],  // Invest Now
      [35/100, 45000/100000, 900/1000, 15/100]   // Reduce Expenses
    ];
    const syntheticYs = [
      [0, 1, 0], // Invest Now
      [0, 0, 1], // Reduce Expenses
      [1, 0, 0], // Save More
      [0, 1, 0], // Invest Now
      [0, 0, 1]  // Reduce Expenses
    ];

    xs = [...xs, ...syntheticXs];
    ys = [...ys, ...syntheticYs];

    // Log data summary
    const labelCounts = ys.reduce((acc, y) => {
      const label = y.indexOf(1);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    console.log('Financial Training Inputs (xs):', xs);
    console.log('Financial Training Labels (ys):', ys.map(y => y.indexOf(1)));
    console.log('Financial Label Distribution:', labelCounts);

    return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
  } catch (error) {
    console.error('Error preparing financial training data:', error);
    throw error;
  }
};

// Train financial model endpoint
router.get('/financial-train', async (req, res) => {
  try {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [4] }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    const { xs, ys } = await getFinancialTrainingData();

    await model.fit(xs, ys, {
      epochs: 100,
      batchSize: 4,
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Financial Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}, val_loss = ${logs.val_loss}, val_acc = ${logs.val_acc}`);
        }
      }
    });

    trainedFinancialModel = model;

    // Test with a sample input
    const testInput = tf.tensor2d([[25/100, 60000/100000, 200/1000, 25/100]]);
    const prediction = model.predict(testInput);
    const result = await prediction.data();
    console.log('Financial Test Prediction:', Array.from(result));

    res.status(200).json({
      message: 'Financial model trained successfully and stored in memory',
      testPrediction: {
        advice: ['Save More', 'Invest Now', 'Reduce Expenses'][result.indexOf(Math.max(...result))],
        probabilities: Array.from(result)
      }
    });
  } catch (error) {
    console.error('Error training financial model:', error);
    res.status(500).json({ message: 'Failed to train financial model', error: error.message });
  }
});

// Predict financial guidance endpoint
router.post('/financial-guidance', async (req, res) => {
  try {
    if (!trainedFinancialModel) {
      return res.status(400).json({ message: 'Financial model not trained yet. Please run /financial-train first.' });
    }

    const { age, currentIncome, expenses, savings } = req.body;
    if ([age, currentIncome, expenses, savings].some(v => v === undefined)) {
      return res.status(400).json({ 
        message: 'Missing required fields: age, currentIncome, expenses, savings' 
      });
    }

    const savingsRate = currentIncome > 0 ? (savings / currentIncome) * 100 : 0;
    const input = [
      (age || 0) / 100,
      (currentIncome || 0) / 100000,
      (expenses || 0) / 1000,
      savingsRate / 100
    ];

    const inputTensor = tf.tensor2d([input]);
    const prediction = trainedFinancialModel.predict(inputTensor);
    const result = await prediction.data();

    const categories = ['Save More', 'Invest Now', 'Reduce Expenses'];
    const maxIndex = result.indexOf(Math.max(...result));
    const advice = categories[maxIndex];

    inputTensor.dispose();
    prediction.dispose();

    res.status(200).json({
      financialAdvice: advice,
      probabilities: Array.from(result)
    });
  } catch (error) {
    console.error('Error predicting financial guidance:', error);
    res.status(500).json({ message: 'Failed to predict financial guidance', error: error.message });
  }
});

export default router;