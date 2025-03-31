import mongoose from 'mongoose';

const athleteDataSchema = new mongoose.Schema({
  athleteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Athlete', 
    required: true 
  }, // Reference to Athlete
  hoursTrained: Number,
  sessionsPerWeek: Number,
  restDays: Number,
  // New financial fields
  expenses: { 
    type: Number, 
    default: 0, 
    description: 'Weekly expenses (in USD)' 
  },
  incomeThisPeriod: { 
    type: Number, 
    default: 0, 
    description: 'Income earned this period (e.g., weekly, in USD)' 
  },
  intensity: { type: Number, default: 5, min: 1 }, // New field: RPE 1-10
  exertionLevel: { type: Number, default: 0 },
  exertionCategory: { type: String, default: 'Low' },
  riskFlag: { type: String, default: 'Low Risk' },
  timestamp: { type: Date, default: Date.now }
});

const AthleteData = mongoose.model('AthleteData', athleteDataSchema);
export default AthleteData;