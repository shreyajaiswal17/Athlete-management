import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

// Sport-specific demand multipliers
const sportMultipliers = {
  'Tennis': 1.2,
  'Swimming': 0.8,
  'Running': 1.0,
  'Weightlifting': 1.5,
  'Cricket': 1.0,
  'default': 1.0
};

// Calculate exertion level with intensity and sport-specific factors
const calculateExertionLevel = (hoursTrained, sessionsPerWeek, restDays, intensity, sport) => {
  const sportMultiplier = sportMultipliers[sport] || sportMultipliers['default'];
  const maxHours = 50;
  const normalizationFactor = maxHours * 2;

  const rawExertion = (hoursTrained * intensity * sportMultiplier) + (sessionsPerWeek * 8) - (restDays * 20);
  const exertionLevel = Math.min(100, Math.max(0, (rawExertion / normalizationFactor) * 100));

  if (exertionLevel > 88) return { value: exertionLevel, category: 'High' };
  if (exertionLevel > 33) return { value: exertionLevel, category: 'Moderate' };
  return { value: exertionLevel, category: 'Low' };
};

// Risk Flag Model (5 inputs)
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
model.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

// Normalize inputs (handles 5 or 6 inputs)
const normalizeInput = (input) => {
  const [hoursTrained, sessionsPerWeek, pastInjuries, restDays, age, daysSinceLastInjury] = input;
  const result = [
    Math.min(hoursTrained, 100) / 100,
    Math.min(sessionsPerWeek, 7) / 7,
    Math.min(pastInjuries, 20) / 20,
    Math.min(restDays, 7) / 7,
    Math.min(age, 100) / 100
  ];
  if (daysSinceLastInjury !== undefined) {
    result.push(Math.min(daysSinceLastInjury, 365) / 365);
  }
  return result;
};

const trainModel = async () => {
  try {
    const data = await AthleteData.find().populate('athleteId');
    if (data.length > 0) {
      const validData = data.filter(d => d.athleteId);
      if (validData.length === 0) {
        console.log('No valid AthleteData with linked Athlete found');
        return;
      }
      const xs = validData.map(d => normalizeInput([
        parseFloat(d.hoursTrained || 0),
        parseFloat(d.sessionsPerWeek || 0),
        parseFloat(d.athleteId.injuryHistory.length || 0),
        parseFloat(d.restDays || 0),
        parseFloat(d.athleteId.age || 0)
      ]));
      const ys = validData.map(d => 
        d.hoursTrained > 40 && d.restDays < 2 && d.athleteId.injuryHistory.length > 0 ? 2 :
        d.hoursTrained > 20 && d.sessionsPerWeek > 4 ? 1 : 0
      );
      await model.fit(tf.tensor2d(xs, [xs.length, 5], 'float32'), tf.tensor1d(ys), { epochs: 50, verbose: 1 });
      console.log('Risk flag model trained');
    } else {
      console.log('No AthleteData available for training');
    }
  } catch (error) {
    console.error('Error training risk flag model:', error);
  }
};
trainModel();

// Helper function to predict and return risk flag
const predictRiskFlag = (input) => {
  const normalizedInput = normalizeInput(input);
  const tensor = tf.tensor2d([normalizedInput], [1, 5], 'float32');
  const prediction = model.predict(tensor);
  const riskIndex = prediction.argMax(-1).dataSync()[0];
  const riskFlags = ['Low Risk', 'Moderate Risk - Monitor', 'High Risk - Rest Recommended'];
  return riskFlags[riskIndex];
};

// Injury Prediction Model (6 inputs)
const injuryModel = tf.sequential();
injuryModel.add(tf.layers.dense({ units: 10, inputShape: [6], activation: 'relu' }));
injuryModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
injuryModel.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

const trainInjuryModel = async () => {
  try {
    const data = await AthleteData.find().populate('athleteId');
    if (data.length > 0) {
      const validData = data.filter(d => d.athleteId);
      if (validData.length === 0) {
        console.log('No valid AthleteData with linked Athlete found');
        return;
      }
      const xs = validData.map(d => {
        const lastInjuryDate = d.athleteId.injuryHistory.length > 0
          ? Math.max(...d.athleteId.injuryHistory.map(i => new Date(i.date).getTime()))
          : 0;
        const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;
        return normalizeInput([
          parseFloat(d.hoursTrained || 0),
          parseFloat(d.sessionsPerWeek || 0),
          parseFloat(d.athleteId.injuryHistory.length || 0),
          parseFloat(d.restDays || 0),
          parseFloat(d.athleteId.age || 0),
          parseFloat(daysSinceLastInjury)
        ]);
      });
      const ys = validData.map(d => {
        const lastInjuryDate = d.athleteId.injuryHistory.length > 0
          ? Math.max(...d.athleteId.injuryHistory.map(i => new Date(i.date).getTime()))
          : 0;
        const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;
        return (d.hoursTrained > 40 && d.restDays < 2 && d.athleteId.injuryHistory.length > 3) || 
               (daysSinceLastInjury < 7 && d.athleteId.injuryHistory.length > 0) ? 1 : 0;
      });
      await injuryModel.fit(tf.tensor2d(xs, [xs.length, 6], 'float32'), tf.tensor1d(ys, 'int32'), { epochs: 50, verbose: 1 });
      console.log('Injury prediction model trained with prevention features');
    } else {
      console.log('No AthleteData available for training');
    }
  } catch (error) {
    console.error('Error training injury model:', error);
  }
};
trainInjuryModel();

// Enhanced helper function to generate detailed prevention recommendations
const generatePreventionRecommendation = (prediction, input, sport = 'General') => {
  const [hoursTrained, sessionsPerWeek, pastInjuries, restDays, age, daysSinceLastInjury] = input;

  let riskLevel, recommendation, explanation;

  if (prediction > 0.75) {
    riskLevel = 'Critical Risk';
    recommendation = `Immediately reduce training intensity by 50% (to ~${(hoursTrained * 0.5).toFixed(1)} hours/week) and increase rest to 3-4 days this week. Incorporate active recovery (e.g., light stretching or low-impact drills for ${sport}) and consult a physiotherapist if recent injuries persist.`;
    explanation = `Your injury risk is critically high (${(prediction * 100).toFixed(1)}%). This stems from a high training load (${hoursTrained} hours/week across ${sessionsPerWeek} sessions), insufficient rest (${restDays} day(s)), and ${pastInjuries} injuries—the most recent ${daysSinceLastInjury.toFixed(0)} days ago. At age ${age}, immediate action is critical.`;
  } else if (prediction > 0.5) {
    riskLevel = 'High Risk';
    recommendation = `Reduce training volume by 20-30% (to ~${(hoursTrained * 0.7).toFixed(1)}-${(hoursTrained * 0.8).toFixed(1)} hours/week), limit sessions to ${Math.max(3, sessionsPerWeek - 1)} per week, and ensure 2-3 rest days. Add recovery techniques like foam rolling or ice baths for ${sport}.`;
    explanation = `Your injury risk is high (${(prediction * 100).toFixed(1)}%) due to ${hoursTrained} hours/week over ${sessionsPerWeek} sessions with only ${restDays} rest day(s) and ${pastInjuries} injuries—the latest ${daysSinceLastInjury.toFixed(0)} days ago. At age ${age}, this risks overuse injuries.`;
  } else if (prediction > 0.25) {
    riskLevel = 'Moderate Risk';
    recommendation = `Maintain ${hoursTrained} hours/week and ${sessionsPerWeek} sessions, but add 1-2 rest days (aim for ${restDays + 1}-${restDays + 2} total). Monitor fatigue signs (e.g., soreness, slower ${sport} performance) and consider light cross-training.`;
    explanation = `Your injury risk is moderate (${(prediction * 100).toFixed(1)}%). Your ${hoursTrained} hours/week and ${sessionsPerWeek} sessions with ${restDays} rest day(s) are borderline sustainable given ${pastInjuries} injuries (latest ${daysSinceLastInjury.toFixed(0)} days ago) at age ${age}.`;
  } else {
    riskLevel = 'Low Risk';
    recommendation = `Continue your current plan of ${hoursTrained} hours/week across ${sessionsPerWeek} sessions with ${restDays} rest days. Schedule regular check-ins (e.g., biweekly) to assess ${sport} performance and recovery.`;
    explanation = `Your injury risk is low (${(prediction * 100).toFixed(1)}%). Your routine (${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days) is balanced for age ${age} with ${pastInjuries} injuries (latest ${daysSinceLastInjury.toFixed(0)} days ago).`;
  }

  return { riskLevel, recommendation, explanation };
};

// Helper function to calculate training load, recovery metrics, and provide sport-specific recommendations
const calculateTrainingMetrics = (hoursTrained, sessionsPerWeek, restDays, intensity, injuryHistory = [], sport = 'General') => {
  const trainingLoad = hoursTrained * intensity;
  const recoveryScore = Math.max(0, Math.min(100, (restDays * 15) - (sessionsPerWeek * 10)));
  const riskFlag = trainingLoad > 300 || recoveryScore < 30 ? 'High Risk' : recoveryScore < 50 ? 'Moderate Risk' : 'Low Risk';

  const recommendations = [];
  if (trainingLoad > 300) {
    recommendations.push({
      recommendation: 'Reducers training load by 20-30% to avoid overtraining and fatigue.',
      explanation: 'Overtraining increases the risk of stress fractures, muscle strains, and burnout.'
    });
  }
  if (sessionsPerWeek > 5) {
    recommendations.push({
      recommendation: 'Limit training sessions to 5 per week to balance intensity and recovery.',
      explanation: 'Excessive sessions can lead to overuse injuries like tendinitis.'
    });
  }
  if (recoveryScore < 30) {
    recommendations.push({
      recommendation: 'Increase rest days to at least 2-3 per week to improve recovery.',
      explanation: 'Rest days allow the body to repair microtears in muscles.'
    });
  }
  return { trainingLoad, recoveryScore, riskFlag, recommendations };
};

// GET /api/athlete/training-metrics/:id
router.get('/training-metrics/:id', async (req, res) => {
  try {
    const athleteId = req.params.id.trim();
    const athlete = await Athlete.findById(athleteId);
    const latestPerformance = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    if (!athlete || !latestPerformance) {
      return res.status(404).json({ message: 'Athlete or performance data not found' });
    }

    const { hoursTrained, sessionsPerWeek, restDays, intensity } = latestPerformance;
    const { trainingLoad, recoveryScore, riskFlag, recommendations } = calculateTrainingMetrics(
      hoursTrained,
      sessionsPerWeek,
      restDays,
      intensity,
      athlete.injuryHistory,
      athlete.sport
    );

    res.status(200).json({
      trainingLoad,
      recoveryScore,
      riskFlag,
      insights: {
        trainingLoad: `Your training load is ${trainingLoad}, which is ${trainingLoad > 300 ? 'high' : 'manageable'}.`,
        recoveryScore: `Your recovery score is ${recoveryScore}, indicating ${recoveryScore < 30 ? 'poor recovery' : recoveryScore < 50 ? 'moderate recovery' : 'good recovery'}.`,
        riskFlag: `Your current risk level is ${riskFlag}.`
      },
      recommendations
    });
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/athlete/athletes
router.get('/athletes', async (req, res) => {
  try {
    const athletes = await Athlete.find({}, 'name sport _id athleteId');
    res.status(200).json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/athlete/create-athlete
router.post('/create-athlete', async (req, res) => {
  try {
    const { athleteId, name, sport, age, gender, location, careerGoals, currentIncome, savings } = req.body;
    if (!athleteId || !name || !sport) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingAthlete = await Athlete.findOne({ athleteId });
    if (existingAthlete) {
      return res.status(400).json({ message: 'Athlete already exists' });
    }

    const parsedAge = parseFloat(age || 0);
    const parsedCurrentIncome = parseFloat(currentIncome || 0);
    const parsedSavings = parseFloat(savings || 0);

    const athleteData = { 
      athleteId, name, sport, age: parsedAge, gender, location, 
      injuryHistory: [], competitionHistory: [], 
      careerGoals: careerGoals || [], currentIncome: parsedCurrentIncome, savings: parsedSavings 
    };
    const athlete = new Athlete(athleteData);
    await athlete.save();

    const calculateInitialTrainingMetrics = (sport, age, competitionHistory, injuryHistory) => {
      let baseHoursTrained = 10;
      let baseSessionsPerWeek = 3;
      let baseRestDays = 2;

      const sportMultiplier = sportMultipliers[sport] || 1.0;
      baseHoursTrained *= sportMultiplier;
      baseSessionsPerWeek = Math.min(5, baseSessionsPerWeek * sportMultiplier);

      if (age > 40) {
        baseHoursTrained *= 0.8;
        baseRestDays += 1;
      }
      if (competitionHistory.length > 0) baseHoursTrained += 2;
      if (injuryHistory.length > 0) {
        baseHoursTrained *= 0.9;
        baseRestDays += 1;
      }

      return {
        hoursTrained: Math.max(5, Math.min(30, Math.round(baseHoursTrained))),
        sessionsPerWeek: Math.max(1, Math.min(7, Math.round(baseSessionsPerWeek))),
        restDays: Math.max(1, Math.min(4, Math.round(baseRestDays)))
      };
    };

    const metrics = calculateInitialTrainingMetrics(sport, parsedAge, athleteData.competitionHistory, athleteData.injuryHistory);
    console.log(`Calculated Metrics for ${name}:`, metrics);

    const athletePerformance = new AthleteData({ 
      athleteId: athlete._id, 
      hoursTrained: metrics.hoursTrained,
      sessionsPerWeek: metrics.sessionsPerWeek,
      restDays: metrics.restDays,
      intensity: 2 * metrics.sessionsPerWeek,
      riskFlag: predictRiskFlag([metrics.hoursTrained, metrics.sessionsPerWeek, athlete.injuryHistory.length, metrics.restDays, parsedAge]),
      timestamp: new Date()
    });
    await athletePerformance.save();
    console.log(`Saved AthleteData:`, athletePerformance.toObject());

    const savedData = await AthleteData.findById(athletePerformance._id);
    console.log(`Verified Saved Data:`, savedData.toObject());

    res.status(201).json({ message: 'Athlete created successfully', athlete });
  } catch (error) {
    console.error('Error creating athlete:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/athlete/performance/:id
router.get('/performance/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const performanceData = await AthleteData.find({ athleteId: req.params.id }).sort({ timestamp: -1 });
    console.log(`Performance Data for ${athlete.name}:`, performanceData);

    res.json({
      performanceData: performanceData.map(data => ({
        athleteName: athlete.name,
        sport: athlete.sport,
        athleteId: athlete.athleteId,
        _id: athlete._id,
        age: athlete.age,
        hoursTrained: data.hoursTrained,
        sessionsPerWeek: data.sessionsPerWeek,
        pastInjuries: athlete.injuryHistory.length,
        injuryHistory: athlete.injuryHistory,
        restDays: data.restDays,
        riskFlag: data.riskFlag,
        education: athlete.education,
        careerGoals: athlete.careerGoals,
        competitionHistory: athlete.competitionHistory,
        currentIncome: athlete.currentIncome,
        savings: athlete.savings,
        sponsorships: athlete.sponsorships,
        timestamp: data.timestamp
      }))
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/athlete/injury-prediction/:id
router.get('/injury-prediction/:id', async (req, res) => {
  try {
    const data = await AthleteData.find({ athleteId: req.params.id }).sort({ timestamp: -1 }).limit(1);
    if (!data.length) return res.status(404).json({ error: 'No data found for this athlete' });
    const d = data[0];
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const input = [
      parseFloat(d.hoursTrained || 0),
      parseFloat(d.sessionsPerWeek || 0),
      parseFloat(athlete.injuryHistory.length || 0),
      parseFloat(d.restDays || 0),
      parseFloat(athlete.age || 0),
      parseFloat(daysSinceLastInjury)
    ];
    const normalizedInput = normalizeInput(input);
    const tensor = tf.tensor2d([normalizedInput], [1, 6], 'float32');
    const prediction = injuryModel.predict(tensor).dataSync()[0];

    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(prediction, input, athlete.sport);

    const predictionResult = {
      ...d._doc,
      injuryRisk: riskLevel,
      predictionScore: prediction,
      preventionRecommendation: recommendation,
      preventionExplanation: explanation,
      riskFlag: d.riskFlag,
      exertionLevel: d.exertionLevel,
      exertionCategory: d.exertionCategory
    };

    res.status(200).json({ injuryPrediction: predictionResult });
  } catch (error) {
    console.error('Error fetching injury prediction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/athlete/data
router.get('/data', async (req, res) => {
  try {
    const enrichedData = await Athlete.aggregate([
      { $lookup: { from: 'athletedatas', localField: '_id', foreignField: 'athleteId', as: 'athleteData' } },
      { $unwind: { path: '$athleteData', preserveNullAndEmptyArrays: true } },
      { $sort: { 'athleteData.timestamp': -1, createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          athleteId: '$_id',
          hoursTrained: { $ifNull: ['$athleteData.hoursTrained', 0] },
          sessionsPerWeek: { $ifNull: ['$athleteData.sessionsPerWeek', 0] },
          restDays: { $ifNull: ['$athleteData.restDays', 0] },
          timestamp: '$athleteData.timestamp',
          athleteName: { $ifNull: ['$name', 'Unknown'] },
          sport: { $ifNull: ['$sport', 'Unknown'] },
          age: '$age',
          pastInjuries: { $size: { $ifNull: ['$injuryHistory', []] } },
          riskFlag: { $ifNull: ['$athleteData.riskFlag', 'Low Risk'] }
        }
      }
    ]);
    if (!enrichedData.length) return res.status(404).json({ message: 'No athletes found' });
    res.status(200).json(enrichedData);
  } catch (error) {
    console.error('Error fetching athlete data:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/athlete/performance/:performanceId
router.put('/performance/:performanceId', async (req, res) => {
  try {
    const { hoursTrained, sessionsPerWeek, restDays } = req.body;
    const performanceId = req.params.performanceId;
    if (hoursTrained === undefined || sessionsPerWeek === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays || 0);
    const parsedIntensity = 2 * parsedSessionsPerWeek;

    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) || 
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }

    const performance = await AthleteData.findById(performanceId).populate('athleteId');
    if (!performance) return res.status(404).json({ message: 'Performance record not found' });
    const athlete = performance.athleteId;
    if (!athlete) return res.status(404).json({ message: 'Associated athlete not found' });

    performance.hoursTrained = parsedHoursTrained;
    performance.sessionsPerWeek = parsedSessionsPerWeek;
    performance.restDays = parsedRestDays;
    performance.intensity = parsedIntensity;
    performance.timestamp = new Date();

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0)
    ];
    performance.riskFlag = predictRiskFlag(input);
    const { value: exertionLevel, category: exertionCategory } = calculateExertionLevel(
      parsedHoursTrained, parsedSessionsPerWeek, parsedRestDays, parsedIntensity, athlete.sport
    );
    performance.exertionLevel = exertionLevel;
    performance.exertionCategory = exertionCategory;
    await performance.save();
    console.log(`Updated Performance:`, performance.toObject());

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const injuryInput = [...input, parseFloat(daysSinceLastInjury)];
    const normalizedInput = normalizeInput(injuryInput);
    const tensor = tf.tensor2d([normalizedInput], [1, 6], 'float32');
    const injuryPrediction = injuryModel.predict(tensor).dataSync()[0];
    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(injuryPrediction, injuryInput, athlete.sport);

    const pastData = await AthleteData.find({ athleteId: athlete._id }).sort({ timestamp: -1 }).limit(3);
    const avgHours = pastData.length > 0 ? pastData.reduce((sum, d) => sum + d.hoursTrained, 0) / pastData.length : 0;
    const trend = parsedHoursTrained > avgHours ? `increased by ${(parsedHoursTrained - avgHours).toFixed(1)} hours` : 'stable';
    const fatigueIndex = Math.min(100, Math.max(0, (parsedHoursTrained * 0.5) + (parsedSessionsPerWeek * 5) - (parsedRestDays * 10)));

    res.status(200).json({
      message: 'Performance updated successfully',
      performance: { 
        athleteId: athlete._id, 
        hoursTrained: parsedHoursTrained, 
        sessionsPerWeek: parsedSessionsPerWeek, 
        restDays: parsedRestDays, 
        pastInjuries: athlete.injuryHistory.length, 
        riskFlag: performance.riskFlag,
        exertionLevel,
        exertionCategory,
        timestamp: performance.timestamp 
      },
      analysis: { 
        riskFlag: performance.riskFlag, 
        injuryRisk: riskLevel, 
        injuryPredictionScore: injuryPrediction, 
        trendAnalysis: `Training load has ${trend}.`, 
        fatigueIndex: `Fatigue index is ${fatigueIndex}, indicating ${fatigueIndex > 70 ? 'high fatigue' : 'manageable fatigue'}.`,
        exertionLevel,
        exertionCategory, 
        preventionRecommendation: recommendation,
        preventionExplanation: explanation
      }
    });
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// PUT /api/athlete/performance/update/:athleteId
router.put('/performance/update/:athleteId', async (req, res) => {
  try {
    const { hoursTrained, sessionsPerWeek, restDays } = req.body;
    const athleteId = req.params.athleteId;
    if (hoursTrained === undefined || sessionsPerWeek === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays || 0);
    const parsedIntensity = 2 * parsedSessionsPerWeek;

    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) || 
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    let performance = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    if (!performance) {
      performance = new AthleteData({ 
        athleteId: athlete._id, 
        hoursTrained: parsedHoursTrained, 
        sessionsPerWeek: parsedSessionsPerWeek, 
        restDays: parsedRestDays, 
        intensity: parsedIntensity,
        timestamp: new Date()
      });
    } else {
      performance.hoursTrained = parsedHoursTrained;
      performance.sessionsPerWeek = parsedSessionsPerWeek;
      performance.restDays = parsedRestDays;
      performance.intensity = parsedIntensity;
      performance.timestamp = new Date();
    }

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0)
    ];
    performance.riskFlag = predictRiskFlag(input);
    const { value: exertionLevel, category: exertionCategory } = calculateExertionLevel(
      parsedHoursTrained, parsedSessionsPerWeek, parsedRestDays, parsedIntensity, athlete.sport
    );
    performance.exertionLevel = exertionLevel;
    performance.exertionCategory = exertionCategory;
    await performance.save();
    console.log(`Updated/Created Performance (by athleteId):`, performance.toObject());

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const injuryInput = [...input, parseFloat(daysSinceLastInjury)];
    const normalizedInput = normalizeInput(injuryInput);
    const tensor = tf.tensor2d([normalizedInput], [1, 6], 'float32');
    const injuryPrediction = injuryModel.predict(tensor).dataSync()[0];
    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(injuryPrediction, injuryInput, athlete.sport);

    const pastData = await AthleteData.find({ athleteId: athlete._id }).sort({ timestamp: -1 }).limit(3);
    const avgHours = pastData.length > 0 ? pastData.reduce((sum, d) => sum + d.hoursTrained, 0) / pastData.length : 0;
    const trend = parsedHoursTrained > avgHours ? `increased by ${(parsedHoursTrained - avgHours).toFixed(1)} hours` : 'stable';
    const fatigueIndex = Math.min(100, Math.max(0, (parsedHoursTrained * 0.5) + (parsedSessionsPerWeek * 5) - (parsedRestDays * 10)));

    res.status(200).json({
      message: 'Performance updated successfully',
      performance: { 
        athleteId: athlete._id, 
        hoursTrained: parsedHoursTrained, 
        sessionsPerWeek: parsedSessionsPerWeek, 
        restDays: parsedRestDays, 
        pastInjuries: athlete.injuryHistory.length, 
        riskFlag: performance.riskFlag,
        exertionLevel,
        exertionCategory,
        timestamp: performance.timestamp 
      },
      analysis: { 
        riskFlag: performance.riskFlag, 
        injuryRisk: riskLevel, 
        injuryPredictionScore: injuryPrediction, 
        trendAnalysis: `Training load has ${trend}.`, 
        fatigueIndex: `Fatigue index is ${fatigueIndex}, indicating ${fatigueIndex > 70 ? 'high fatigue' : 'manageable fatigue'}.`,
        exertionLevel,
        exertionCategory, 
        preventionRecommendation: recommendation,
        preventionExplanation: explanation
      }
    });
  } catch (error) {
    console.error('Error updating performance (by athleteId):', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// POST /api/athlete/log-performance
router.post('/log-performance', async (req, res) => {
  try {
    const { athleteId, hoursTrained, sessionsPerWeek, restDays } = req.body;
    if (!athleteId || hoursTrained === undefined || sessionsPerWeek === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays || 0);
    const parsedIntensity = 2 * parsedSessionsPerWeek;

    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) || 
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const latestPerformance = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    const isRecent = latestPerformance && (new Date() - new Date(latestPerformance.timestamp)) < 24 * 60 * 60 * 1000;
    if (isRecent) {
      return res.status(200).json({ 
        message: 'Recent performance exists. Consider updating instead.', 
        performanceId: latestPerformance._id, 
        suggestion: 'Use PUT /api/athlete/performance/:performanceId to update' 
      });
    }

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0)
    ];
    const riskFlag = predictRiskFlag(input);
    const { value: exertionLevel, category: exertionCategory } = calculateExertionLevel(
      parsedHoursTrained, parsedSessionsPerWeek, parsedRestDays, parsedIntensity, athlete.sport
    );

    const athletePerformance = new AthleteData({ 
      athleteId: athlete._id, 
      hoursTrained: parsedHoursTrained, 
      sessionsPerWeek: parsedSessionsPerWeek, 
      restDays: parsedRestDays, 
      intensity: parsedIntensity,
      riskFlag,
      exertionLevel,
      exertionCategory,
      timestamp: new Date() 
    });
    await athletePerformance.save();
    console.log(`Logged Performance:`, athletePerformance.toObject());

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const injuryInput = [...input, parseFloat(daysSinceLastInjury)];
    const normalizedInput = normalizeInput(injuryInput);
    const tensor = tf.tensor2d([normalizedInput], [1, 6], 'float32');
    const injuryPrediction = injuryModel.predict(tensor).dataSync()[0];
    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(injuryPrediction, injuryInput, athlete.sport);

    const pastData = await AthleteData.find({ athleteId }).sort({ timestamp: -1 }).limit(3);
    const avgHours = pastData.length > 0 ? pastData.reduce((sum, d) => sum + d.hoursTrained, 0) / pastData.length : 0;
    const trend = parsedHoursTrained > avgHours ? `increased by ${(parsedHoursTrained - avgHours).toFixed(1)} hours` : 'stable';
    const fatigueIndex = Math.min(100, Math.max(0, (parsedHoursTrained * 0.5) + (parsedSessionsPerWeek * 5) - (parsedRestDays * 10)));

    const careerAdvice = athlete.age > 30 
      ? `Consider focusing on injury prevention and long-term career sustainability in ${athlete.sport}. Explore coaching or mentoring opportunities.`
      : `Focus on skill development and competitive performance in ${athlete.sport}. Set short-term and long-term goals.`;

    res.status(201).json({
      message: 'Performance logged successfully',
      performance: { 
        athleteId: athlete._id, 
        hoursTrained: parsedHoursTrained, 
        sessionsPerWeek: parsedSessionsPerWeek, 
        restDays: parsedRestDays, 
        pastInjuries: athlete.injuryHistory.length, 
        riskFlag,
        exertionLevel,
        exertionCategory,
        timestamp: athletePerformance.timestamp 
      },
      analysis: { 
        riskFlag, 
        injuryRisk: riskLevel, 
        injuryPredictionScore: injuryPrediction, 
        trendAnalysis: `Training load ${trend}.`, 
        fatigueIndex, 
        preventionRecommendation: recommendation,
        preventionExplanation: explanation,
        careerGuidance: careerAdvice
      }
    });
  } catch (error) {
    console.error('Error logging performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/athlete/:id/injuries
router.put('/:id/injuries', async (req, res) => {
  try {
    const { injury, severity, recoveryTime, date } = req.body;
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    athlete.injuryHistory.push({ 
      injury: injury || 'Unknown', 
      severity: parseInt(severity) || 0, 
      recoveryTime: parseInt(recoveryTime) || 0, 
      date: date ? new Date(date) : new Date() 
    });
    await athlete.save();

    const latestPerformance = await AthleteData.findOne({ athleteId: athlete._id }).sort({ timestamp: -1 });
    if (latestPerformance) {
      const input = [
        latestPerformance.hoursTrained,
        latestPerformance.sessionsPerWeek,
        athlete.injuryHistory.length,
        latestPerformance.restDays,
        parseFloat(athlete.age || 0)
      ];
      latestPerformance.riskFlag = predictRiskFlag(input);
      await latestPerformance.save();
    }

    res.status(200).json({ message: 'Injury added successfully', injuryHistory: athlete.injuryHistory });
  } catch (error) {
    console.error('Error adding injury:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;