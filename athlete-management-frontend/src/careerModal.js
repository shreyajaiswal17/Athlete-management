import * as tf from '@tensorflow/tfjs';

// Define a simple sequential model
const loadModel = async () => {
    const model = await tf.loadLayersModel('http://localhost:3000/career-model/model.json');
    return model;
  };
const createCareerModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] })); // 5 input features
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' })); // 3 output classes
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  return model;
};

// Sample input normalization function
const normalizeData = (athleteData) => {
  const { age, performanceScore, injuryCount, trainingHours, competitionWins } = athleteData;
  return [
    age / 100,              // Normalize age (0-100)
    performanceScore / 100, // Normalize score (0-100)
    injuryCount / 10,       // Normalize injuries (0-10)
    trainingHours / 50,     // Normalize hours (0-50)
    competitionWins / 20    // Normalize wins (0-20)
  ];
};

// Predict career guidance
const predictCareerGuidance = async (model, athleteData) => {
  const inputTensor = tf.tensor2d([normalizeData(athleteData)]);
  const prediction = model.predict(inputTensor);
  const result = await prediction.data();
  const categories = ['Focus on Training', 'Competition Ready', 'Sustain Performance'];
  const maxIndex = result.indexOf(Math.max(...result));
  return categories[maxIndex];
};

export { createCareerModel, predictCareerGuidance };