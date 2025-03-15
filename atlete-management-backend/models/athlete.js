import mongoose from 'mongoose';

// Athlete Schema
const athleteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  goal: { type: String },
  age: { type: Number },
  gender: { type: String },
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Athlete = mongoose.model('Athlete', athleteSchema);
export default Athlete;
