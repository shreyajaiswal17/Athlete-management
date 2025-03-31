import mongoose from 'mongoose';

const athleteSchema = new mongoose.Schema({
  athleteId: { type: String, required: true, unique: true }, // Unique ID
  name: { type: String, required: true },
  sport: { type: String, required: true },
  goal: { type: String },
  age: { type: Number },
  gender: { type: String },
  location: { type: String },
  injuryHistory: [{
    injury: String,
    severity: Number,
    recoveryTime: Number,
    date: Date
  }],
  competitionHistory: [{
    event: String,
    result: String,
    date: Date
  }],
  education: String, // e.g., "BS in Kinesiology"
  careerGoals: [String], // e.g., ["Compete", "Coach"]
  // New financial fields
  currentIncome: { 
    type: Number, 
    default: 0, 
    description: 'Annual income from contracts, sponsorships, etc. (in USD)' 
  },
  savings: { 
    type: Number, 
    default: 0, 
    description: 'Total current savings (in USD)' 
  },
  weight: { type: Number, description: 'Weight in kilograms' },
  height: { type: Number, description: 'Height in centimeters' },
  sponsorships: [{
    sponsor: String,
    amount: Number,
    startDate: Date,
    endDate: Date
  }],
  // Store generated meal plan and hydration data
  mealPlan: [{
    totalCalories: Number,
    meals: [{
      title: String,
      readyInMinutes: Number,
      servings: Number,
      sourceUrl: String
    }],
    generatedAt: { type: Date, default: Date.now }
  }],
  hydrationPlan: {
    totalWater: Number, // in liters
    generatedAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },

});

const Athlete = mongoose.model('Athlete', athleteSchema);
export default Athlete;