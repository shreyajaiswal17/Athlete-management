import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';
import Team from '../models/team.js';
import dotenv from 'dotenv';
import Event from '../models/event.js';
dotenv.config();
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
const sportMaxHours = {
  'Tennis': 40,
  'Swimming': 60,
  'Running': 50,
  'Weightlifting': 30,
  'Cricket': 45,
  'default': 50
};

const calculateExertionLevel = async (athleteId, hoursTrained, sessionsPerWeek, restDays, intensity, sport) => {
  const sportMultiplier = sportMultipliers[sport] || 1.0;
  // Query by custom athleteId field instead of _id
    const athlete = await Athlete.findOne({ athleteId: athleteId });
    console.log("athlete", athlete);
  const injuryHistory = athlete ? athlete.injuryHistory : [];
console.log("injuryHistory", injuryHistory);
  const trainingLoad = hoursTrained * intensity * sportMultiplier;
  console.log("trainingLoad", trainingLoad);
  const sessionImpact = sessionsPerWeek * Math.log(sessionsPerWeek + 1) * 3;

  const recoveryImpact = restDays > 0 ? 4 * Math.log(restDays + 1) : 0;
  let rawExertion = Math.max(0, trainingLoad + sessionImpact - recoveryImpact);

  // Use athlete._id for querying past data if athlete exists
  const pastData = athlete ? await AthleteData.findOne({ athleteId: athlete._id }).sort({ timestamp: -1 }).limit(3) : [];
  let cumulativeAdjustment = 0;
  pastData.forEach((data, index) => {
    const decay = 0.5 ** (index + 1);
    const pastExertion = (data.hoursTrained * data.intensity * sportMultiplier) + 
                         (data.sessionsPerWeek * Math.log(data.sessionsPerWeek + 1) * 3) - 
                         (data.restDays > 0 ? 4 * Math.log(data.restDays + 1) : 0);
    cumulativeAdjustment += decay * Math.max(0, pastExertion);
  });
  rawExertion += Math.min(cumulativeAdjustment, 40);

  const recentInjuries = injuryHistory.filter(i => (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24) < 90).length;
  rawExertion *= (1 + 0.05 * recentInjuries);

  const normalizationFactor = sportMaxHours[sport] * 4;
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
  const recoveryScore = Math.max(0, Math.min(100, (restDays * 20) + (7 - sessionsPerWeek) * 5));
  const riskFlag = trainingLoad > 300 || recoveryScore < 30 ? 'High Risk' : recoveryScore < 50 ? 'Moderate Risk' : 'Low Risk';

  const recommendations = [];
  if (trainingLoad > 300) {
    recommendations.push({
      recommendation: 'Reduce training load by 20-30% to avoid overtraining and fatigue.',
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
    const athletes = await Athlete.find({}, 'name sport _id athleteId injuryHistory age');
    const athleteData = await AthleteData.find({
      athleteId: { $in: athletes.map(a => a._id) },
    })
      .sort({ timestamp: -1 })
      .lean();

    const latestDataMap = {};
    athleteData.forEach(data => {
      const athleteId = data.athleteId.toString();
      if (!latestDataMap[athleteId] || new Date(data.timestamp) > new Date(latestDataMap[athleteId].timestamp)) {
        latestDataMap[athleteId] = data;
      }
    });

    const athletesWithStatus = await Promise.all(
      athletes.map(async (athlete) => {
        try {
          const status = await calculateAthleteStatus(athlete._id);
          return {
            athleteId: athlete._id, // Use athleteId instead of _id
            name: athlete.name,
            sport: athlete.sport,
            status,
          };
        } catch (error) {
          console.error(`Error calculating status for athlete ${athlete._id}:`, error);
          return {
            athleteId: athlete._id,
            name: athlete.name,
            sport: athlete.sport,
            status: 'UNKNOWN',
          };
        }
      })
    );

    res.status(200).json(athletesWithStatus);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Server error', error: error.message });
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
// GET /api/athlete/performance/:id
router.get('/performance/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const performanceData = await AthleteData.find({ athleteId: req.params.id }).sort({ timestamp: 1 }); // Ascending order for chronological trend
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
      { $sort: { 'athleteData.timestamp': -1 } },
      {
        $group: {
          _id: '$_id',
          athleteData: { $first: '$athleteData' },
          name: { $first: '$name' },
          sport: { $first: '$sport' },
          age: { $first: '$age' },
          injuryHistory: { $first: '$injuryHistory' }
        }
      },
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

    // Create a new performance record instead of updating
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

    const newPerformance = new AthleteData({ 
      athleteId: athlete._id, 
      hoursTrined: parsedHoursTrained, 
      sessionsPerWeek: parsedSessionsPerWeek, 
      restDays: parsedRestDays, 
      intensity: parsedIntensity,
      riskFlag,
      exertionLevel,
      exertionCategory,
      timestamp: new Date() 
    });
    await newPerformance.save();
    console.log(`Logged New Performance (by athleteId):`, newPerformance.toObject());

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
        timestamp: newPerformance.timestamp 
      },
      analysis: { 
        riskFlag, 
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
    console.error('Error logging performance (by athleteId):', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// POST /api/athlete/log-performance

router.post('/log-performance', async (req, res) => {
  try {
    const { athleteId, hoursTrained, sessionsPerWeek, restDays, rpe } = req.body;
    if (!athleteId || hoursTrained === undefined || sessionsPerWeek === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays || 0);
    const parsedIntensity = parseFloat(rpe) || (2 * parsedSessionsPerWeek);

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

    // Calculate exertion level once and reuse it
    const exertionResult = await calculateExertionLevel(
      athleteId, parsedHoursTrained, parsedSessionsPerWeek, parsedRestDays, parsedIntensity, athlete.sport
    );
    const exertionLevel = exertionResult.value;
    const exertionCategory = exertionResult.category;

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0)
    ];
    const riskFlag = predictRiskFlag(input);

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

const sportThresholds = {
  Cricket: { maxTrainingLoad: 200, minRecovery: 70, maxHours: 25, maxSessions: 6 },
  Running: { maxTrainingLoad: 120, minRecovery: 80, maxHours: 15, maxSessions: 5 },
  Swimming: { maxTrainingLoad: 160, minRecovery: 75, maxHours: 20, maxSessions: 7 },
};

const normalize = (value, max) => Math.min(Math.max(value / max, 0), 1);

const calculateTrainingMetric = (hoursTrained, sessionsPerWeek, restDays, intensity, injuryHistory, sport) => {
  const thresholds = sportThresholds[sport] || sportThresholds.Cricket;
  const injuryPenalty = injuryHistory.reduce((sum, injury) => sum + (injury.severity || 1), 0) / 10;
  
  const rawLoad = (hoursTrained || 0) * (sessionsPerWeek || 0) * (intensity || 5);
  const trainingLoad = rawLoad / Math.max((restDays || 0) + 2, 2) * (1 - injuryPenalty);
  
  const recoveryBase = (restDays || 0) * 15 + (injuryHistory.length > 0 ? 20 : 40);
  const recoveryScore = Math.min(100, Math.max(0, recoveryBase - injuryPenalty * 10));
  
  return { trainingLoad: Math.round(trainingLoad), recoveryScore: Math.round(recoveryScore) };
};

const calculateAthleteStatus = async (athleteId) => {
  try {
    console.log(`Calculating status for athleteId: ${athleteId}`);
    
    const latestData = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    const athlete = await Athlete.findById(athleteId);
    
    if (!athlete) {
      console.log(`No Athlete found for athleteId: ${athleteId}`);
      return 'UNKNOWN';
    }
    if (!latestData) {
      console.log(`No AthleteData found for athleteId: ${athleteId}`);
      return 'UNKNOWN';
    }

    console.log(`AthleteData found:`, {
      athleteId: latestData.athleteId.toString(),
      hoursTrained: latestData.hoursTrained,
      sessionsPerWeek: latestData.sessionsPerWeek,
      restDays: latestData.restDays,
      intensity: latestData.intensity,
      riskFlag: latestData.riskFlag,
      timestamp: latestData.timestamp,
    });

    // Relaxed to 10 days for testing
    const daysSinceData = (Date.now() - new Date(latestData.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceData > 10) {
      console.log(`Data too old: ${daysSinceData} days since last update`);
      return 'UNKNOWN';
    }
    if (latestData.hoursTrained == null || latestData.sessionsPerWeek == null || latestData.restDays == null) {
      console.log(`Missing required fields:`, {
        hoursTrained: latestData.hoursTrained,
        sessionsPerWeek: latestData.sessionsPerWeek,
        restDays: latestData.restDays,
      });
      return 'UNKNOWN';
    }

    const { hoursTrained, sessionsPerWeek, restDays, intensity, riskFlag } = latestData;
    const { injuryHistory, sport, age } = athlete;
    const { trainingLoad, recoveryScore } = calculateTrainingMetric(
      hoursTrained,
      sessionsPerWeek,
      restDays,
      intensity,
      injuryHistory,
      sport
    );

    console.log('Calculated Metrics:', {
      trainingLoad,
      recoveryScore,
      sport,
      age,
      injuryHistoryLength: injuryHistory.length,
      riskFlag,
    });

    const thresholds = sportThresholds[sport] || sportThresholds.Cricket;
    
    if (injuryHistory.some(injury => (Date.now() - new Date(injury.date).getTime()) / (1000 * 60 * 60 * 24) < (injury.recoveryTime || 30))) {
      console.log('Status: INJURED');
      return 'INJURED';
    }

    const riskFlagScore = { 'Low Risk': 0.9, 'Moderate Risk': 0.5, 'High Risk': 0.1 }[riskFlag] || 0.5;
    const normalizedLoad = normalize(trainingLoad, thresholds.maxTrainingLoad);
    const normalizedRecovery = normalize(recoveryScore, 100);
    const injuryFactor = 1 - Math.min(injuryHistory.length / 5, 1);
    const ageAdjustment = age > 40 ? 0.9 : age < 25 ? 1.05 : 1.0;

    const statusScore = (
      0.4 * riskFlagScore +
      0.3 * normalizedLoad +
      0.2 * normalizedRecovery +
      0.1 * injuryFactor
    ) * ageAdjustment;

    console.log('Status Score:', statusScore);

    if (statusScore < 0.3 || trainingLoad > thresholds.maxTrainingLoad || restDays < 1) {
      console.log('Status: OVERTRAINING');
      return 'OVERTRAINING';
    }
    if (statusScore > 0.85 && trainingLoad > 0.7 * thresholds.maxTrainingLoad && recoveryScore > thresholds.minRecovery) {
      console.log('Status: PEAKING');
      return 'PEAKING';
    }
    if (restDays > 3 && trainingLoad < 0.3 * thresholds.maxTrainingLoad) {
      console.log('Status: RESTING');
      return 'RESTING';
    }
    if (statusScore > 0.6) {
      console.log('Status: ACTIVE');
      return 'ACTIVE';
    }
    if (statusScore > 0.4) {
      console.log('Status: MODERATE');
      return 'MODERATE';
    }
    console.log('Status: UNKNOWN (fallback)');
    return 'UNKNOWN';
  } catch (error) {
    console.error(`Error calculating athlete status for ${athleteId}:`, error);
    return 'UNKNOWN';
  }
};
router.post('/add-event', async (req, res) => {
  try {
    const { athleteId, title, date, time, description } = req.body;
    if (!athleteId || !title || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const event = new Event({
      athleteId,
      title,
      date: new Date(date),
      time,
      description: description || '',
    });
    console.log('Saved event date:', event.date);
    await event.save();

    res.status(201).json({ message: 'Event added successfully', event });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/upcoming-schedule', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    console.log('Today:', today, 'Next Week:', nextWeek);
    const events = await Event.find({
      date: { $gte: today, $lte: nextWeek },
    }).sort({ date: 1 });
    console.log('Raw Events:', events);
    const formattedEvents = events.map(event => ({
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
    }));
    console.log('Formatted Events:', formattedEvents);
    res.status(200).json({ upcomingEvents: formattedEvents });
  } catch (error) {
    console.error('Error fetching upcoming schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
//PUT /api/athlete/:id/injuries
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
// POST /api/athlete/create-team
router.post('/create-team', async (req, res) => {
  try {
    const { name, sport, athleteIds, coach } = req.body;
    if (!name || !sport) return res.status(400).json({ message: 'Missing required fields' });

    // Verify athletes exist
    const athletes = await Athlete.find({ _id: { $in: athleteIds } });
    if (athletes.length !== athleteIds.length) {
      return res.status(400).json({ message: 'Some athletes not found' });
    }

    const team = new Team({ name, sport, athletes: athleteIds, coach });
    await team.save();

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// PUT /api/athlete/team/:teamId/add-athlete
router.put('/team/:teamId/add-athlete', async (req, res) => {
  try {
    const { athleteId } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    if (!team.athletes.includes(athleteId)) {
      team.athletes.push(athleteId);
      await team.save();
    }

    res.status(200).json({ message: 'Athlete added to team', team });
  } catch (error) {
    console.error('Error adding athlete to team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// GET /api/athlete/teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find().populate('athletes', 'name sport');
    res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/team-performance/:teamId', async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId).populate('athletes');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const athleteIds = team.athletes.map(athlete => athlete._id);
    if (!athleteIds.length) return res.status(200).json({ message: 'No athletes in team', metrics: {} });

    // Fetch recent AthleteData (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const athleteData = await AthleteData.find({
      athleteId: { $in: athleteIds },
      timestamp: { $gte: thirtyDaysAgo },
    })
      .populate('athleteId', 'name injuryHistory sport age')
      .sort({ timestamp: -1 });

    if (!athleteData.length) {
      return res.status(200).json({ message: 'No recent data for team athletes', metrics: {}, historicalMetrics: [] });
    }

    // Aggregate current metrics
    const metrics = {
      totalAthletes: athleteIds.length,
      activeAthletes: 0,
      averageTrainingLoad: 0,
      averageRecoveryScore: 0,
      teamFatigueIndex: 0,
      exertionDistribution: { High: 0, Moderate: 0, Low: 0 },
      injuryRiskDistribution: { High: 0, Moderate: 0, Low: 0 },
      recentInjuries: 0,
      highRiskAthletes: [],
      statusDistribution: {
        INJURED: 0,
        OVERTRAINING: 0,
        ACTIVE: 0,
        RESTING: 0,
        PEAKING: 0,
        MODERATE: 0,
        UNKNOWN: 0,
      },
    };

    const uniqueAthletes = new Set();
    let totalTrainingLoad = 0;
    let totalRecoveryScore = 0;
    let totalFatigue = 0;

    // Calculate athlete statuses and store per-athlete data
    const athleteStatuses = [];

    // Group athlete data by athlete ID to get the latest record for each
    const latestAthleteData = {};
    athleteData.forEach(data => {
      const athleteId = data.athleteId._id.toString();
      if (!latestAthleteData[athleteId] || new Date(data.timestamp) > new Date(latestAthleteData[athleteId].timestamp)) {
        latestAthleteData[athleteId] = data;
      }
    });

    // Calculate status for each athlete
    for (const athlete of team.athletes) {
      const athleteId = athlete._id.toString();
      const status = await calculateAthleteStatus(athleteId);
      athleteStatuses.push({
        athleteId: athlete._id,
        name: athlete.name,
        sport: athlete.sport,
        status,
      });
      metrics.statusDistribution[status]++;
    }

    // Process athlete data for metrics
    athleteData.forEach(data => {
      const athlete = data.athleteId;
      if (!athlete) return;

      uniqueAthletes.add(athlete._id.toString());
      const trainingLoad = data.hoursTrained * data.intensity;
      totalTrainingLoad += trainingLoad;
      const recoveryScore = Math.max(0, Math.min(100, (data.restDays * 15) - (data.sessionsPerWeek * 10)));
      totalRecoveryScore += recoveryScore;

      if (data.exertionCategory) {
        metrics.exertionDistribution[data.exertionCategory]++;
      }

      const lastInjuryDate = athlete.injuryHistory.length > 0
        ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
        : 0;
      const daysSinceLastInjury = lastInjuryDate
        ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24)
        : 1000;

      const input = [
        data.hoursTrained,
        data.sessionsPerWeek,
        athlete.injuryHistory.length,
        data.restDays,
        athlete.age || 0,
        daysSinceLastInjury,
      ];
      const normalizedInput = normalizeInput(input);
      const tensor = tf.tensor2d([normalizedInput], [1, 6], 'float32');
      const injuryRisk = injuryModel.predict(tensor).dataSync()[0];

      const riskCategory = injuryRisk > 0.75 ? 'High' : injuryRisk > 0.25 ? 'Moderate' : 'Low';
      metrics.injuryRiskDistribution[riskCategory]++;
      if (riskCategory === 'High') {
        metrics.highRiskAthletes.push({ name: athlete.name, sport: athlete.sport });
      }

      const recentInjuries = athlete.injuryHistory.filter(
        i => (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24) < 30
      ).length;
      metrics.recentInjuries += recentInjuries;

      const fatigueIndex = Math.min(
        100,
        Math.max(0, (data.hoursTrained * 0.5) + (data.sessionsPerWeek * 5) - (data.restDays * 10))
      );
      totalFatigue += fatigueIndex;
    });

    metrics.activeAthletes = uniqueAthletes.size;
    metrics.averageTrainingLoad =
      metrics.activeAthletes > 0 ? (totalTrainingLoad / metrics.activeAthletes).toFixed(1) : 0;
    metrics.averageRecoveryScore =
      metrics.activeAthletes > 0 ? (totalRecoveryScore / metrics.activeAthletes).toFixed(1) : 0;
    metrics.teamFatigueIndex =
      metrics.activeAthletes > 0 ? (totalFatigue / metrics.activeAthletes).toFixed(1) : 0;

    // Convert distribution counts to percentages
    Object.keys(metrics.exertionDistribution).forEach(key => {
      metrics.exertionDistribution[key] = metrics.activeAthletes
        ? ((metrics.exertionDistribution[key] / metrics.activeAthletes) * 100).toFixed(1) + '%'
        : '0%';
    });
    Object.keys(metrics.injuryRiskDistribution).forEach(key => {
      metrics.injuryRiskDistribution[key] = metrics.activeAthletes
        ? ((metrics.injuryRiskDistribution[key] / metrics.activeAthletes) * 100).toFixed(1) + '%'
        : '0%';
    });
    Object.keys(metrics.statusDistribution).forEach(key => {
      metrics.statusDistribution[key] = metrics.activeAthletes
        ? ((metrics.statusDistribution[key] / metrics.activeAthletes) * 100).toFixed(1) + '%'
        : '0%';
    });

    // Calculate historical metrics (group by date)
    const historicalMetrics = [];
    const dataByDate = {};

    athleteData.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0];
      if (!dataByDate[date]) {
        dataByDate[date] = { trainingLoad: 0, recoveryScore: 0, fatigueIndex: 0, count: 0 };
      }
      dataByDate[date].trainingLoad += data.hoursTrained * data.intensity;
      dataByDate[date].recoveryScore += Math.max(0, Math.min(100, (data.restDays * 15) - (data.sessionsPerWeek * 10)));
      dataByDate[date].fatigueIndex += Math.min(
        100,
        Math.max(0, (data.hoursTrained * 0.5) + (data.sessionsPerWeek * 5) - (data.restDays * 10))
      );
      dataByDate[date].count += 1;
    });

    Object.keys(dataByDate)
      .sort()
      .forEach(date => {
        const entry = dataByDate[date];
        historicalMetrics.push({
          date,
          averageTrainingLoad: (entry.trainingLoad / entry.count).toFixed(1),
          averageRecoveryScore: (entry.recoveryScore / entry.count).toFixed(1),
          teamFatigueIndex: (entry.fatigueIndex / entry.count).toFixed(1),
        });
      });

    const insights = {
      trainingLoad: `Team training load averages ${metrics.averageTrainingLoad}, which is ${
        metrics.averageTrainingLoad > 300 ? 'high' : 'manageable'
      }.`,
      recovery: `Team recovery score is ${metrics.averageRecoveryScore}, indicating ${
        metrics.averageRecoveryScore < 30
          ? 'poor recovery'
          : metrics.averageRecoveryScore < 50
          ? 'moderate recovery'
          : 'good recovery'
      }.`,
      injuryRisk: `Recent injuries: ${metrics.recentInjuries}. High-risk athletes: ${metrics.highRiskAthletes.length}.`,
      statusSummary: `Athlete statuses: ${metrics.statusDistribution.PEAKING} peaking, ${metrics.statusDistribution.INJURED} injured, ${metrics.statusDistribution.OVERTRAINING} overtraining.`,
      recommendations: [],
    };

    if (metrics.averageTrainingLoad > 300) {
      insights.recommendations.push(
        'Reduce team training volume by 15-20% to prevent overtraining. Consider lighter sessions or cross-training.'
      );
    }
    if (metrics.averageRecoveryScore < 50) {
      insights.recommendations.push(
        'Increase team rest days to 2-3 per week and incorporate recovery sessions (e.g., yoga, stretching).'
      );
    }
    if (metrics.recentInjuries > metrics.activeAthletes * 0.2) {
      insights.recommendations.push(
        'Review training protocols for injury prevention. Schedule medical evaluations for affected athletes.'
      );
    }
    if (metrics.highRiskAthletes.length > 0) {
      insights.recommendations.push(
        `Monitor high-risk athletes: ${metrics.highRiskAthletes.map(a => a.name).join(', ')}.`
      );
    }
    if (metrics.statusDistribution.INJURED > '0%') {
      insights.recommendations.push(
        `Prioritize recovery plans for ${metrics.statusDistribution.INJURED} of athletes currently injured.`
      );
    }
    if (metrics.statusDistribution.OVERTRAINING > '0%') {
      insights.recommendations.push(
        `Reduce training intensity for ${metrics.statusDistribution.OVERTRAINING} of athletes at risk of overtraining.`
      );
    }

    res.status(200).json({
      teamId: team._id,
      teamName: team.name,
      sport: team.sport,
      metrics,
      insights,
      historicalMetrics,
      athleteStatuses, // New field with per-athlete status
    });
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
export default router;