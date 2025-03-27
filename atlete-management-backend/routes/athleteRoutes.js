import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

// Risk Flag Model (5 inputs)
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
model.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

const trainModel = async () => {
  try {
    const data = await AthleteData.find().populate('athleteId');
    if (data.length > 0) {
      const validData = data.filter(d => d.athleteId);
      if (validData.length === 0) {
        console.log('No valid AthleteData with linked Athlete found');
        return;
      }
      const xs = validData.map(d => [
        parseFloat(d.hoursTrained || 0),
        parseFloat(d.sessionsPerWeek || 0),
        parseFloat(d.athleteId.injuryHistory.length || 0),
        parseFloat(d.restDays || 0),
        parseFloat(d.athleteId.age || 0)
      ]);
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

// Helper function to predict risk flag
const predictRiskFlag = (input) => {
  const tensor = tf.tensor2d([input], [1, 5], 'float32');
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
        return [
          parseFloat(d.hoursTrained || 0),
          parseFloat(d.sessionsPerWeek || 0),
          parseFloat(d.athleteId.injuryHistory.length || 0),
          parseFloat(d.restDays || 0),
          parseFloat(d.athleteId.age || 0),
          parseFloat(daysSinceLastInjury || 1000)
        ];
      });
      const ys = validData.map(d => d.athleteId.injuryHistory.length > 0 ? 1 : 0);
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
    explanation = `Your injury risk is critically high (${(prediction * 100).toFixed(1)}%). This stems from a high training load (${hoursTrained} hours/week across ${sessionsPerWeek} sessions), which is excessive given only ${restDays} rest day(s) and a history of ${pastInjuries} injuries—the most recent just ${daysSinceLastInjury.toFixed(0)} days ago. At age ${age}, your body’s recovery capacity is strained, especially for ${sport}, which demands repetitive high-impact effort. Without immediate intervention, you’re at severe risk of re-injury or a new strain. Halving your training volume and prioritizing rest will allow tissue repair, while active recovery maintains mobility without overloading your system.`;
  } else if (prediction > 0.5) {
    riskLevel = 'High Risk';
    recommendation = `Reduce training volume by 20-30% (to ~${(hoursTrained * 0.7).toFixed(1)}-${(hoursTrained * 0.8).toFixed(1)} hours/week), limit sessions to ${Math.max(3, sessionsPerWeek - 1)} per week, and ensure at least 2-3 rest days. Add recovery techniques like foam rolling or ice baths tailored to ${sport} demands.`;
    explanation = `Your injury risk is high (${(prediction * 100).toFixed(1)}%), driven by a demanding schedule (${hoursTrained} hours/week over ${sessionsPerWeek} sessions) with insufficient rest (${restDays} day(s)). With ${pastInjuries} prior injuries—the latest ${daysSinceLastInjury.toFixed(0)} days ago—and your age of ${age}, your body is under notable strain. For ${sport}, this imbalance risks overuse injuries like sprains or tendonitis. Cutting back 20-30% on training and capping sessions reduces cumulative stress, while extra rest days and recovery methods help mitigate inflammation and fatigue.`;
  } else if (prediction > 0.25) {
    riskLevel = 'Moderate Risk';
    recommendation = `Maintain your current ${hoursTrained} hours/week and ${sessionsPerWeek} sessions, but add 1-2 extra rest days (aim for ${restDays + 1}-${restDays + 2} total). Monitor fatigue signs (e.g., soreness, slower ${sport} performance) and consider light cross-training to balance load.`;
    explanation = `Your injury risk is moderate (${(prediction * 100).toFixed(1)}%). Your training (${hoursTrained} hours/week, ${sessionsPerWeek} sessions) and rest (${restDays} day(s)) are borderline sustainable, given ${pastInjuries} past injuries—the most recent ${daysSinceLastInjury.toFixed(0)} days ago—and your age (${age}). For ${sport}, this suggests you’re pushing your limits without adequate recovery, risking fatigue-related issues. Adding rest days prevents overtraining, while monitoring and cross-training maintain fitness without tipping into higher risk.`;
  } else {
    riskLevel = 'Low Risk';
    recommendation = `Continue your current plan of ${hoursTrained} hours/week across ${sessionsPerWeek} sessions with ${restDays} rest days. Schedule regular check-ins (e.g., biweekly) to assess ${sport} performance and recovery, and maintain flexibility with optional rest if needed.`;
    explanation = `Your injury risk is low (${(prediction * 100).toFixed(1)}%), reflecting a balanced routine (${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days) for your age (${age}). With ${pastInjuries} injuries—the last ${daysSinceLastInjury.toFixed(0)} days ago—you’re managing well for ${sport}. This stability supports consistent progress, but ongoing vigilance ensures small issues (e.g., minor soreness) don’t escalate. Regular check-ins keep you on track without overadjusting.`;
  }

  return { riskLevel, recommendation, explanation };
};

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
    const { athleteId, name, sport, goal, age, gender, location, injuryHistory, competitionHistory, hoursTrained, sessionsPerWeek, restDays,education,careerGoals,currentIncome,savings,sponsorships} = req.body;
    if (!athleteId || !name || !sport) {
      return res.status(400).json({ message: 'Missing required fields: athleteId, name, and sport are required' });
    }
    const existingAthlete = await Athlete.findOne({ athleteId });
    if (existingAthlete) {
      return res.status(400).json({ message: 'An athlete with this athleteId already exists' });
    }
    if (age !== undefined && (typeof age !== 'number' || isNaN(age) || age < 0)) {
      return res.status(400).json({ message: 'Age must be a positive number' });
    }
    const parsedHoursTrained = hoursTrained !== undefined ? parseFloat(hoursTrained) : 0;
    const parsedSessionsPerWeek = sessionsPerWeek !== undefined ? parseFloat(sessionsPerWeek) : 0;
    const parsedRestDays = restDays !== undefined ? parseFloat(restDays) : 0;
    if (parsedHoursTrained < 0 || parsedSessionsPerWeek < 0 || parsedRestDays < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }
    // Validate financial fields
    const parsedCurrentIncome = currentIncome !== undefined ? parseFloat(currentIncome) : 0;
    const parsedSavings = savings !== undefined ? parseFloat(savings) : 0;
    if (parsedCurrentIncome < 0 || parsedSavings < 0) {
      return res.status(400).json({ message: 'Financial fields (currentIncome, savings) must be positive numbers' });
    }

    // Validate sponsorships (optional array of objects)
    let validatedSponsorships = [];
    if (sponsorships) {
      if (!Array.isArray(sponsorships)) {
        return res.status(400).json({ message: 'Sponsorships must be an array' });
      }
      validatedSponsorships = sponsorships.map(s => ({
        sponsor: s.sponsor || 'Unknown',
        amount: parseFloat(s.amount) || 0,
        startDate: s.startDate ? new Date(s.startDate) : new Date(),
        endDate: s.endDate ? new Date(s.endDate) : null
      }));
      if (validatedSponsorships.some(s => isNaN(s.amount) || s.amount < 0)) {
        return res.status(400).json({ message: 'Sponsorship amounts must be positive numbers' });
      }
      if (validatedSponsorships.some(s => s.startDate > s.endDate)) {
        return res.status(400).json({ message: 'Sponsorship startDate must be before endDate' });
      }
    }

    // Include all fields in athleteData, including financial fields
    const athleteData = { 
      athleteId, 
      name, 
      sport, 
      goal, 
      age, 
      gender, 
      location, 
      injuryHistory: injuryHistory || [], 
      competitionHistory: competitionHistory || [], 
      education, 
      careerGoals, 
      currentIncome: parsedCurrentIncome, // Add financial field
      savings: parsedSavings,             // Add financial field
      sponsorships: validatedSponsorships // Add financial field
    };
    const athlete = new Athlete(athleteData);
    await athlete.save();
    if (parsedHoursTrained > 0 || parsedSessionsPerWeek > 0 || parsedRestDays > 0) {
      const athletePerformance = new AthleteData({ athleteId: athlete._id, hoursTrained: parsedHoursTrained, sessionsPerWeek: parsedSessionsPerWeek, restDays: parsedRestDays, timestamp: new Date() });
      await athletePerformance.save();
    }
    res.status(201).json({ message: 'Athlete created successfully', athlete });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
    if (error.code === 11000) return res.status(400).json({ message: 'Athlete ID already exists' });
    res.status(500).json({ message: 'Error creating athlete', error: error.message });
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
        education: athlete.education,
        careerGoals: athlete.careerGoals,
        competitionHistory: athlete.competitionHistory,
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
    if (data.length === 0) return res.status(404).json({ error: 'No data found for this athlete' });
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
      parseFloat(daysSinceLastInjury || 1000)
    ];

    const tensor = tf.tensor2d([input], [1, 6], 'float32');
    const prediction = injuryModel.predict(tensor).dataSync()[0];

    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(prediction, input, athlete.sport);

    const predictionResult = {
      ...d._doc,
      injuryRisk: riskLevel,
      predictionScore: prediction,
      preventionRecommendation: recommendation,
      preventionExplanation: explanation
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
          riskFlag: {
            $cond: {
              if: { $eq: ['$athleteData', null] },
              then: false,
              else: {
                $gt: [
                  {
                    $add: [
                      { $multiply: [{ $ifNull: ['$athleteData.hoursTrained', 0] }, 0.3] },
                      { $multiply: [{ $ifNull: ['$athleteData.sessionsPerWeek', 0] }, 0.2] },
                      { $multiply: [{ $size: { $ifNull: ['$injuryHistory', []] } }, 0.5] },
                      { $multiply: [{ $ifNull: ['$athleteData.restDays', 0] }, -0.4] }
                    ]
                  },
                  10
                ]
              }
            }
          }
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
    if (!hoursTrained || !sessionsPerWeek || !restDays) return res.status(400).json({ message: 'Missing required fields' });
    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays);
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
    performance.timestamp = new Date();
    await performance.save();

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0),
      parseFloat(daysSinceLastInjury || 1000)
    ];

    const riskFlag = predictRiskFlag(input.slice(0, 5));
    const tensor = tf.tensor2d([input], [1, 6], 'float32');
    const injuryPrediction = injuryModel.predict(tensor).dataSync()[0];

    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(injuryPrediction, input, athlete.sport);

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
        timestamp: performance.timestamp 
      },
      analysis: { 
        riskFlag, 
        injuryRisk: riskLevel, 
        injuryPredictionScore: injuryPrediction, 
        trendAnalysis: `Training load ${trend} compared to recent average`, 
        fatigueIndex, 
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
    if (!athleteId || !hoursTrained || !sessionsPerWeek || !restDays) return res.status(400).json({ message: 'Missing required fields' });
    const parsedHoursTrained = parseFloat(hoursTrained);
    const parsedSessionsPerWeek = parseFloat(sessionsPerWeek);
    const parsedRestDays = parseFloat(restDays);
    if (isNaN(parsedHoursTrained) || isNaN(parsedSessionsPerWeek) || isNaN(parsedRestDays) || 
        parsedHoursTrained < 0 || parsedSessionsPerWeek < 0 || parsedRestDays < 0) {
      return res.status(400).json({ message: 'Performance fields must be positive numbers' });
    }
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
    const latestPerformance = await AthleteData.findOne({ athleteId }).sort({ timestamp: -1 });
    const isRecent = latestPerformance && (new Date() - new Date(latestPerformance.timestamp)) < 24 * 60 * 60 * 1000;
    if (isRecent) {
      return res.status(200).json({ message: 'Recent performance exists. Consider updating instead.', performanceId: latestPerformance._id, suggestion: 'Use PUT /api/athlete/performance/:performanceId to update' });
    }
    const athletePerformance = new AthleteData({ athleteId: athlete._id, hoursTrained: parsedHoursTrained, sessionsPerWeek: parsedSessionsPerWeek, restDays: parsedRestDays, timestamp: new Date() });
    await athletePerformance.save();

    const lastInjuryDate = athlete.injuryHistory.length > 0
      ? Math.max(...athlete.injuryHistory.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastInjury = lastInjuryDate ? (Date.now() - lastInjuryDate) / (1000 * 60 * 60 * 24) : 1000;

    const input = [
      parsedHoursTrained,
      parsedSessionsPerWeek,
      athlete.injuryHistory.length,
      parsedRestDays,
      parseFloat(athlete.age || 0),
      parseFloat(daysSinceLastInjury || 1000)
    ];

    const riskFlag = predictRiskFlag(input.slice(0, 5));
    const tensor = tf.tensor2d([input], [1, 6], 'float32');
    const injuryPrediction = injuryModel.predict(tensor).dataSync()[0];

    const { riskLevel, recommendation, explanation } = generatePreventionRecommendation(injuryPrediction, input, athlete.sport);

    const pastData = await AthleteData.find({ athleteId }).sort({ timestamp: -1 }).limit(3);
    const avgHours = pastData.length > 0 ? pastData.reduce((sum, d) => sum + d.hoursTrained, 0) / pastData.length : 0;
    const trend = parsedHoursTrained > avgHours ? `increased by ${(parsedHoursTrained - avgHours).toFixed(1)} hours` : 'stable';
    const fatigueIndex = Math.min(100, Math.max(0, (parsedHoursTrained * 0.5) + (parsedSessionsPerWeek * 5) - (parsedRestDays * 10)));

    res.status(201).json({
      message: 'Performance logged successfully',
      performance: { 
        athleteId: athlete._id, 
        hoursTrained: parsedHoursTrained, 
        sessionsPerWeek: parsedSessionsPerWeek, 
        restDays: parsedRestDays, 
        pastInjuries: athlete.injuryHistory.length, 
        timestamp: athletePerformance.timestamp 
      },
      analysis: { 
        riskFlag, 
        injuryRisk: riskLevel, 
        injuryPredictionScore: injuryPrediction, 
        trendAnalysis: `Training load ${trend} compared to recent average`, 
        fatigueIndex, 
        preventionRecommendation: recommendation,
        preventionExplanation: explanation
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
    athlete.injuryHistory.push({ injury: injury || 'Unknown', severity: parseInt(severity) || 0, recoveryTime: parseInt(recoveryTime) || 0, date: date ? new Date(date) : new Date() });
    await athlete.save();
    res.status(200).json({ message: 'Injury added successfully', injuryHistory: athlete.injuryHistory });
  } catch (error) {
    console.error('Error adding injury:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;