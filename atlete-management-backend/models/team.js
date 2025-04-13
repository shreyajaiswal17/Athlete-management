// models/team.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sport: { type: String, required: true },
  athletes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' }],
  coach: { type: String }, // Optional
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Team', teamSchema);