import mongoose from 'mongoose';
const athleteDataSchema = new mongoose.Schema({
  athleteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Athlete', 
    required: true 
  }, // Reference to Athlete
  hoursTrained: Number,
  sessionsPerWeek: Number,
  pastInjuries: Number,
  restDays: Number,
  sportType: String,
  timestamp: { type: Date, default: Date.now }
});

const AthleteData = mongoose.model('AthleteData', athleteDataSchema);

export default AthleteData;
