

// Generate a personalized meal plan
import express from 'express';
import Athlete from '../models/athlete.js';
import dotenv from 'dotenv';
import axios from 'axios';
import AthleteData from '../models/athleteData.js';

dotenv.config();

const router = express.Router();

// Sport-specific macronutrient distribution
const sportMacros = {
  Swimming: { protein: 0.3, carbs: 0.5, fats: 0.2 }, // Higher carbs for endurance
  Basketball: { protein: 0.3, carbs: 0.4, fats: 0.3 }, // Balanced for agility and strength
  Running: { protein: 0.25, carbs: 0.55, fats: 0.2 }, // High carbs for endurance
  Weightlifting: { protein: 0.4, carbs: 0.3, fats: 0.3 }, // Higher protein for muscle repair
  Tennis: { protein: 0.3, carbs: 0.45, fats: 0.25 }, // Balanced for agility and endurance
  Default: { protein: 0.3, carbs: 0.4, fats: 0.3 } // General balanced distribution
};

// Sport-specific activity multipliers
const sportActivityMultipliers = {
  Swimming: 1.8, // Higher activity multiplier for endurance sports
  Basketball: 1.6, // Moderate activity multiplier for agility and strength
  Running: 1.7, // High activity multiplier for endurance
  Weightlifting: 1.5, // Lower activity multiplier for strength-based sports
  Tennis: 1.65, // Balanced activity multiplier for agility and endurance
  Default: 1.55 // General activity multiplier
};

// Goal-specific calorie adjustments
const goalAdjustments = {
  'weight loss': -500, // Calorie deficit for weight loss
  'muscle gain': 500, // Calorie surplus for muscle gain
  'maintenance': 0 // No adjustment for maintenance
};

// Generate a personalized meal plan
router.post('/meal-plan', async (req, res) => {
  const { athleteId, weight, height, age, gender, goal, sport } = req.body;

  try {
    // Ensure athleteId is a string
    const athleteIdString = athleteId.toString();

    // Fetch athlete from database using either athleteId or _id
    const athlete = await Athlete.findOne({ $or: [{ athleteId: athleteIdString }, { _id: athleteIdString }] });
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found. Please ensure the athleteId is correct.' });
    }

    const athleteData = await AthleteData.findOne({ athleteId: athlete._id });

    // Use provided data or fallback to stored data
    const calcWeight = weight || athlete.weight;
    const calcHeight = height || athlete.height;
    const calcAge = age || athlete.age;
    const calcGender = gender || athlete.gender;
    const calcIntensity = athleteData?.intensity; // Fetching from athlete data
    const calcSport = sport || athlete.sport; // Use sport from athlete data if not provided
    const calcGoal = goal || athlete.goal; // Use goal from athlete data if not provided

    // Validate required fields
    if (!calcWeight || !calcHeight || !calcAge || !calcGender || !calcIntensity) {
      return res.status(400).json({ error: 'Missing required fields (weight, height, age, gender, trainingIntensity)' });
    }

    // Calculate daily calorie needs (Harris-Benedict formula)
    const baseCalories =
      10 * calcWeight + 6.25 * calcHeight - 5 * calcAge + (calcGender === 'male' ? 5 : -161);

    // Apply sport-specific activity multiplier
    const sportMultiplier = sportActivityMultipliers[calcSport] || sportActivityMultipliers.Default;
    const activityCalories = baseCalories * sportMultiplier;

    // Apply goal-specific calorie adjustment
    const goalAdjustment = goalAdjustments[calcGoal] || goalAdjustments.maintenance;
    const totalCalories = Math.round(activityCalories + goalAdjustment);

    // Use sport-specific macronutrient distribution
    const macros = sportMacros[calcSport] || sportMacros.Default;

    const proteinCalories = totalCalories * macros.protein;
    const carbCalories = totalCalories * macros.carbs;
    const fatCalories = totalCalories * macros.fats;

    const proteinGrams = Math.round(proteinCalories / 4); // 1g protein = 4 calories
    const carbGrams = Math.round(carbCalories / 4); // 1g carbs = 4 calories
    const fatGrams = Math.round(fatCalories / 9); // 1g fat = 9 calories
    console.log('Total Calories:', totalCalories);
    console.log('Using API Key:', process.env.SPOONACULAR_API_KEY);
   
    // Fetch weekly meal plan from Spoonacular API
    const response = await axios.get('https://api.spoonacular.com/mealplanner/generate', {
      params: {
        apiKey: "99f5905ac0e14fdd9ebc6a2cfccd7315",
        targetCalories: totalCalories,
        timeFrame: 'week',
      },
    });
    console.log('Spoonacular Response:', response.data);
    // Extract meals for each day of the week
    const weeklyMealPlan = Object.entries(response.data.week).map(([day, meals]) => ({
      day,
      meals: meals.meals.map((meal) => ({
        title: meal.title,
        readyInMinutes: meal.readyInMinutes,
        servings: meal.servings,
        sourceUrl: meal.sourceUrl,
      })),
    }));

    // Update athlete document with the weekly meal plan
    athlete.mealPlan = athlete.mealPlan || []; // Ensure mealPlan array exists
    athlete.mealPlan.push({ totalCalories, meals: weeklyMealPlan });
    await athlete.save();

    // Send response to client
    res.status(200).json({
      totalCalories,
      macronutrients: {
        protein: `${proteinGrams}g`,
        carbs: `${carbGrams}g`,
        fats: `${fatGrams}g`,
      },
      weeklyMealPlan,
    });
  } catch (error) {
    console.error('Error generating meal plan:', error.message);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

export default router;