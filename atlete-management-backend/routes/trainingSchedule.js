import express from 'express';
import tf from '@tensorflow/tfjs';
import Athlete from '../models/athlete.js';
import AthleteData from '../models/athleteData.js';

const router = express.Router();

let model;

// Define the training types for each day
const trainingTypes = ['Rest', 'Strength Training', 'Cardio', 'Endurance', 'Speed Work', 'Recovery', 'Technique Work'];

// Define sport-specific training priorities
const sportTrainingMapping = {
    Swimming: ['Technique Work', 'Endurance', 'Strength Training', 'Recovery', 'Cardio', 'Rest', 'Speed Work'],
    Basketball: ['Strength Training', 'Speed Work', 'Cardio', 'Endurance', 'Recovery', 'Technique Work', 'Rest'],
    Track: ['Speed Work', 'Endurance', 'Strength Training', 'Recovery', 'Cardio', 'Technique Work', 'Rest'],
    Football: ['Strength Training', 'Cardio', 'Speed Work', 'Endurance', 'Recovery', 'Technique Work', 'Rest'],
    Tennis: ['Technique Work', 'Strength Training', 'Speed Work', 'Endurance', 'Recovery', 'Cardio', 'Rest'],
    Cricket: ['Technique Work', 'Strength Training', 'Cardio', 'Endurance', 'Recovery', 'Speed Work', 'Rest'],
    Kabaddi: ['Strength Training', 'Speed Work', 'Endurance', 'Cardio', 'Recovery', 'Technique Work', 'Rest'],
    Default: ['Rest', 'Strength Training', 'Cardio', 'Endurance', 'Speed Work', 'Recovery', 'Technique Work']
};

// Route to initialize and train the model for a specific sport
router.post('/train', async (req, res) => {
    const { xs, ys, sport } = req.body; // Expecting input data and sport in the request body

    try {
        // Validate input data
        if (!xs || !ys || xs.length === 0 || ys.length === 0) {
            return res.status(400).send('Input data (xs and ys) must not be empty.');
        }

        // Filter training data based on the specified sport
        let filteredXs = xs;
        let filteredYs = ys;

        if (sport) {
            const athletes = await Athlete.find({ sport });
            const athleteIds = athletes.map(athlete => athlete._id.toString()); // Convert ObjectId to string

            // Filter xs and ys based on matching athlete IDs
            filteredXs = xs.filter(data => athleteIds.includes(data.athleteId.toString())).map(data => data.features);
            filteredYs = ys.filter((_, index) => athleteIds.includes(xs[index].athleteId.toString()));
        }

        if (filteredXs.length === 0 || filteredYs.length === 0) {
            return res.status(400).send('No training data available for the specified sport.');
        }

        // Validate the shape of the input data
        const inputShape = filteredXs[0].length;
        if (!inputShape || inputShape <= 0) {
            return res.status(400).send('Invalid input shape. Ensure xs contains valid feature arrays.');
        }

        // Define a simple model
        model = tf.sequential();
        model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputShape] }));
        model.add(tf.layers.dense({ units: trainingTypes.length, activation: 'softmax' })); // Output for 7 days

        model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: ['accuracy'] });

        // Convert input data to tensors
        const xsTensor = tf.tensor2d(filteredXs);
        const ysTensor = tf.tensor2d(filteredYs);

        // Train the model
        await model.fit(xsTensor, ysTensor, { epochs: 50 });
        res.send(`Model trained successfully for sport: ${sport || 'all sports'}!`);
    } catch (error) {
        console.error('Error training the model:', error);
        res.status(500).send('Failed to train the model.');
    }
});

// Route to make predictions
router.post('/predict', async (req, res) => {
    if (!model) {
        return res.status(400).send('Model is not trained yet.');
    }

    const { data, sport } = req.body; // Expecting input data and sport for prediction
    const inputTensor = tf.tensor2d([data]);

    const prediction = model.predict(inputTensor);
    const output = prediction.dataSync(); // Get the prediction result

    // Map predictions to a 7-day personalized training schedule based on the sport
    const sportSpecificTraining = sportTrainingMapping[sport] || sportTrainingMapping.Default;
    const schedule = sportSpecificTraining.map((trainingType, index) => ({
        day: `Day ${index + 1}`,
        trainingType
    }));

    res.json({ schedule });
});

// Route to generate a 7-day training schedule for an athlete
router.post('/generate-schedule', async (req, res) => {
    const { athleteId } = req.body; // Expecting athlete ID in the request body

    try {
        // Fetch athlete data
        const athlete = await Athlete.findById(athleteId);
        if (!athlete) {
            return res.status(404).send('Athlete not found.');
        }

        // Fetch additional athlete performance data
        const athleteData = await AthleteData.findOne({ athleteId });
        if (!athleteData) {
            return res.status(404).send('Athlete performance data not found.');
        }

        // Safely handle undefined properties
        const injuryHistoryLength = athleteData.injuryHistory ? athleteData.injuryHistory.length : 0;
        const competitionHistoryLength = athleteData.competitionHistory ? athleteData.competitionHistory.length : 0;

        // Prepare input data for prediction
        const sportIndex = Object.keys(sportTrainingMapping).indexOf(athlete.sport) || 0; // Map sport to an index
        const inputData = [
            athlete.age,
            athleteData.trainingLoad || 0, // Default to 0 if undefined
            athleteData.recoveryScore || 0, // Default to 0 if undefined
            injuryHistoryLength,
            competitionHistoryLength,
            sportIndex // Include sport as a feature
        ];

        // Ensure the model is trained
        if (!model) {
            return res.status(400).send('Model is not trained yet.');
        }

        // Make predictions
        const inputTensor = tf.tensor2d([inputData]);
        const prediction = model.predict(inputTensor);
        const output = prediction.dataSync(); // Should be an array of length 7 (softmax outputs for trainingTypes)

        // Generate a personalized 7-day training schedule
        const schedule = [];
        const sportSpecificTraining = sportTrainingMapping[athlete.sport] || sportTrainingMapping.Default;

        for (let i = 0; i < 7; i++) {
            // Ensure output has enough elements; fallback to sport-specific order if prediction fails
            const dayPrediction = output.slice(i * trainingTypes.length, (i + 1) * trainingTypes.length);
            const maxIndex = dayPrediction.length
                ? dayPrediction.indexOf(Math.max(...dayPrediction))
                : i; // Fallback to sport-specific order

            // Add sport-specific details to the training type
            const trainingType = sportSpecificTraining[maxIndex] || trainingTypes[maxIndex];
            const detailedTraining = getDetailedTraining(athlete.sport, trainingType);

            schedule.push({
                day: `Day ${i + 1}`,
                trainingType,
                details: detailedTraining
            });
        }

        res.json({ athleteName: athlete.athleteName, sport: athlete.sport, schedule });
    } catch (error) {
        console.error('Error generating training schedule:', error);
        res.status(500).send('Failed to generate training schedule.');
    }
});

// Helper function to get detailed training based on sport and training type
const getDetailedTraining = (sport, trainingType) => {
    const sportSpecificDetails = {
        Swimming: {
            'Technique Work': 'Focus on improving stroke efficiency and turns.',
            'Endurance': 'Swim long distances at a steady pace.',
            'Strength Training': 'Incorporate resistance band exercises for shoulders.',
            'Recovery': 'Perform light swimming or stretching.',
            'Cardio': 'Do interval swimming with short rest periods.',
            'Rest': 'Take a complete day off from training.',
            'Speed Work': 'Practice sprints with underwater dolphin kicks.'
        },
        Basketball: {
            'Strength Training': 'Focus on lower body strength with squats and lunges.',
            'Speed Work': 'Perform agility ladder drills.',
            'Cardio': 'Run full-court sprints with timed intervals.',
            'Endurance': 'Play 5-on-5 games to build stamina.',
            'Recovery': 'Stretch and foam roll to reduce muscle soreness.',
            'Technique Work': 'Practice shooting and ball-handling drills.',
            'Rest': 'Take a day off to recover fully.'
        },
        Cricket: {
            'Technique Work': 'Practice batting techniques, bowling accuracy, and fielding drills.',
            'Strength Training': 'Focus on core and lower body strength for stability and power.',
            'Cardio': 'Perform interval running to improve stamina for long matches.',
            'Endurance': 'Engage in long-duration net practice sessions.',
            'Recovery': 'Stretch and foam roll to reduce muscle stiffness.',
            'Speed Work': 'Practice quick sprints between the wickets.',
            'Rest': 'Take a complete day off to recover and recharge.'
        },
        Tennis: {
            'Technique Work': 'Work on serve accuracy, volleying, and backhand techniques.',
            'Strength Training': 'Focus on upper body and core strength for powerful strokes.',
            'Cardio': 'Perform on-court drills to improve agility and endurance.',
            'Endurance': 'Play practice matches to build match fitness.',
            'Recovery': 'Stretch and use a massage roller to reduce muscle tension.',
            'Speed Work': 'Practice short sprints to improve court coverage.',
            'Rest': 'Take a day off to recover fully.'
        },
        Football: {
            'Technique Work': 'Practice dribbling, passing accuracy, and shooting drills.',
            'Strength Training': 'Focus on lower body strength with squats and lunges.',
            'Cardio': 'Perform high-intensity interval training to improve stamina.',
            'Endurance': 'Play full-field practice matches to build match fitness.',
            'Recovery': 'Stretch and foam roll to reduce muscle soreness.',
            'Speed Work': 'Perform sprint drills to improve acceleration and agility.',
            'Rest': 'Take a day off to recover fully.'
        },
        Default: {
            'Rest': 'Take a complete day off from training.',
            'Strength Training': 'Perform compound lifts like squats and deadlifts.',
            'Cardio': 'Run or cycle at a moderate pace for 30 minutes.',
            'Endurance': 'Engage in long-duration, low-intensity exercises.',
            'Speed Work': 'Perform short sprints with adequate rest.',
            'Recovery': 'Do yoga or light stretching.',
            'Technique Work': 'Practice sport-specific skills and drills.'
        }
    };

    return sportSpecificDetails[sport]?.[trainingType] || sportSpecificDetails.Default[trainingType];
};

// Route to check if the backend is working
router.get('/status', (req, res) => {
    res.send('Backend is running and ready to train the model or make predictions.');
});

export default router;