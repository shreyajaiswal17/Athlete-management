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
  // Add more sports as needed
  'default': 1.0 // Fallback for unknown sports
};
// Calculate exertion level with intensity and sport-specific factors
const calculateExertionLevel = (hoursTrained, sessionsPerWeek, restDays, intensity, sport) => {
  const sportMultiplier = sportMultipliers[sport] || sportMultipliers['default'];
  const maxHours = 50; // Max reasonable training hours
  const normalizationFactor = maxHours * 2; // Adjusted normalization factor

  // Adjusted weights for raw exertion calculation
  const rawExertion = (hoursTrained * intensity * sportMultiplier) + (sessionsPerWeek * 8) - (restDays * 20);

  // Normalize the exertion level to a 0–100 scale
  const exertionLevel = Math.min(100, Math.max(0, (rawExertion / normalizationFactor) * 100));

  // Categorize the exertion level
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
    Math.min(hoursTrained, 100) / 100, // 0-100 hours
    Math.min(sessionsPerWeek, 7) / 7,  // 0-7 sessions
    Math.min(pastInjuries, 20) / 20,    // 0-20 injuries
    Math.min(restDays, 7) / 7,          // 0-7 rest days
    Math.min(age, 100) / 100           // 0-100 years
  ];
  if (daysSinceLastInjury !== undefined) {
    result.push(Math.min(daysSinceLastInjury, 365) / 365); // 0-365 days
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
        d.hoursTrained > 40 && d.restDays < 2 && d.athleteId.injuryHistory.length > 0 ? 2 : // High
        d.hoursTrained > 20 && d.sessionsPerWeek > 4 ? 1 : 0 // Moderate : Low
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
const generatePreventionRecommendation = (prediction, input, sport = 'your sport') => {
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

  // Sport-specific recommendations
  const recommendations = [];

  // Training adjustments
  if (trainingLoad > 300) {
    recommendations.push({
      recommendation: 'Reduce training load by 20-30% to avoid overtraining and fatigue.',
      explanation: 'Overtraining increases the risk of stress fractures, muscle strains, and burnout. Reducing training load allows the body to recover and adapt.'
    });
  }
  if (sessionsPerWeek > 5) {
    recommendations.push({
      recommendation: 'Limit training sessions to 5 per week to balance intensity and recovery.',
      explanation: 'Excessive sessions can lead to overuse injuries like tendinitis. Reducing sessions gives muscles and joints time to recover.'
    });
  }

  // Recovery techniques
  if (recoveryScore < 30) {
    recommendations.push({
      recommendation: 'Increase rest days to at least 2-3 per week to improve recovery.',
      explanation: 'Rest days allow the body to repair microtears in muscles, reducing the risk of chronic injuries like tendinopathy.'
    });
    recommendations.push({
      recommendation: 'Incorporate active recovery techniques like yoga, stretching, or swimming.',
      explanation: 'Active recovery improves blood flow, reduces stiffness, and prevents muscle imbalances that can lead to injuries.'
    });
  } else if (recoveryScore >= 30 && recoveryScore < 50) {
    recommendations.push({
      recommendation: 'Add foam rolling or massage therapy to your recovery routine.',
      explanation: 'Foam rolling and massage reduce muscle tightness and improve flexibility, lowering the risk of strains.'
    });
    recommendations.push({
      recommendation: 'Use ice baths or contrast showers to reduce muscle soreness.',
      explanation: 'Cold therapy reduces inflammation and speeds up recovery, preventing overuse injuries.'
    });
  }

  // Nutrition
  recommendations.push({
    recommendation: 'Ensure adequate protein intake (1.6-2.2g/kg body weight) to support muscle repair.',
    explanation: 'Protein is essential for repairing muscle damage caused by intense training, reducing the risk of muscle tears.'
  });
  recommendations.push({
    recommendation: 'Stay hydrated by drinking at least 2-3 liters of water daily.',
    explanation: 'Dehydration can lead to muscle cramps and reduced joint lubrication, increasing the risk of injuries.'
  });
  recommendations.push({
    recommendation: 'Include anti-inflammatory foods like berries, nuts, and leafy greens in your diet.',
    explanation: 'Anti-inflammatory foods help reduce muscle soreness and joint inflammation, preventing chronic injuries.'
  });

  // Mental health and stress management
  recommendations.push({
    recommendation: 'Practice mindfulness or meditation to manage stress and improve focus.',
    explanation: 'Stress can increase muscle tension and reduce focus, leading to poor form and a higher risk of injuries.'
  });
  recommendations.push({
    recommendation: 'Ensure you get 7-9 hours of quality sleep each night for optimal recovery.',
    explanation: 'Sleep is critical for tissue repair and hormonal balance, reducing the likelihood of overuse injuries.'
  });

  // Injury prevention (sport-specific)
  if (injuryHistory.length > 0) {
    recommendations.push({
      recommendation: 'Focus on strengthening exercises for previously injured areas.',
      explanation: 'Strengthening weak areas reduces the risk of re-injury by improving stability and resilience.'
    });
    recommendations.push({
      recommendation: 'Schedule regular physiotherapy sessions to monitor and prevent recurring injuries.',
      explanation: 'Physiotherapy helps identify and address biomechanical issues that could lead to recurring injuries.'
    });
  }

  // Sport-specific recommendations
  if (sport === 'Basketball') {
    recommendations.push({
      recommendation: 'Incorporate plyometric exercises like box jumps to improve explosive power.',
      explanation: 'Plyometric training strengthens tendons and reduces the risk of ankle and knee injuries common in basketball.'
    });
    recommendations.push({
      recommendation: 'Practice landing mechanics to reduce stress on knees during jumps.',
      explanation: 'Proper landing mechanics prevent ACL injuries by reducing impact forces on the knees.'
    });
  } else if (sport === 'Swimming') {
    recommendations.push({
      recommendation: 'Focus on shoulder mobility exercises to prevent overuse injuries.',
      explanation: 'Swimming involves repetitive shoulder movements, and improving mobility reduces the risk of rotator cuff injuries.'
    });
    recommendations.push({
      recommendation: 'Incorporate core strengthening exercises to improve stroke efficiency.',
      explanation: 'A strong core stabilizes the body in the water, reducing strain on the shoulders and lower back.'
    });
  } else if (sport === 'Running') {
    recommendations.push({
      recommendation: 'Incorporate hill sprints to build strength and reduce impact forces.',
      explanation: 'Hill sprints strengthen the lower body and reduce the repetitive impact forces associated with flat running.'
    });
    recommendations.push({
      recommendation: 'Rotate running shoes every 300-500 miles to maintain cushioning.',
      explanation: 'Worn-out shoes lose cushioning, increasing the risk of stress fractures and joint pain.'
    });
  }

  return { trainingLoad, recoveryScore, riskFlag, recommendations };
};

// GET /api/athlete/training-metrics/:id
router.get('/training-metrics/:id', async (req, res) => {
  try {
    const athleteId = req.params.id.trim();
    console.log("athleteId",athleteId);
   

    const athlete = await Athlete.findById(athleteId);
    console.log("athlete",athlete);
    const latestPerformance = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    console.log(latestPerformance);
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
      recommendations: recommendations || []
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
      return res.status(400).json({ message: 'Missing required fields: athleteId, name, and sport are required' });
    }
    const existingAthlete = await Athlete.findOne({ athleteId });
    if (existingAthlete) {
      return res.status(400).json({ message: 'An athlete with this athleteId already exists' });
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

    const athletePerformance = new AthleteData({ 
      athleteId: athlete._id, 
      hoursTrained: 0, 
      sessionsPerWeek: 0, 
      restDays: 0, 
     intensity: 5, // Default intensity
     riskFlag: 'Low Risk',
      timestamp: new Date() 
    });
    await athletePerformance.save();

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
    const performanceData = await AthleteData.find({ athleteId: req.params.id });
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
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
    res.status(500).json({ message: 'Server error' });
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
    if (!hoursTrained || !sessionsPerWeek ) return res.status(400).json({ message: 'Missing required fields' });
    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays);
    const parsedIntensity = 2 * parsedSessionsPerWeek;
     // Updated intensity calculation
     console.log("sessionsperweek",parsedSessionsPerWeek);
      console.log("intensity",parsedIntensity);
    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) || isNaN(parsedRestDays) || 
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0 || parsedRestDays < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }
    const performance = await AthleteData.findById(performanceId).populate('athleteId');
    if (!performance) return res.status(404).json({ message: 'Performance record not found' });
    const athlete = performance.athleteId;
    if (!athlete) return res.status(404).json({ message: 'Associated athlete not found' });

    performance.hoursTrained = parsedHoursTrained;
    performance.sessionsPerWeek = parsedSessionsPerWeek;
    performance.restDays = parsedRestDays;
    performance.intensity = parsedIntensity; // Updated intensity assignment
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
    performance.exertionLevel = exertionLevel; // Updated exertionLevel
    performance.exertionCategory = exertionCategory; // Updated exertionCategory
    await performance.save();

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

// POST /api/athlete/log-performance
router.post('/log-performance', async (req, res) => {
  try {
    const { athleteId, hoursTrained, sessionsPerWeek, restDays } = req.body;
    if (!athleteId || !hoursTrained || !sessionsPerWeek ) return res.status(400).json({ message: 'Missing required fields' });
    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays);
    const parsedIntensity = 2 * parsedSessionsPerWeek; // Updated intensity calculation
    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) ||
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0 || parsedIntensity < 1 ) {
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
      intensity: parsedIntensity, // Updated intensity assignment
      riskFlag,
      exertionLevel, // Updated exertionLevel
      exertionCategory, // Updated exertionCategory
      timestamp: new Date() 
    });
    await athletePerformance.save();

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
      ? `Consider focusing on injury prevention and long-term career sustainability in ${athlete.sport}. Explore coaching or mentoring opportunities to extend your involvement in the sport.`
      : `Focus on skill development and competitive performance in ${athlete.sport}. Set short-term goals for upcoming competitions and long-term goals for career milestones.`;

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