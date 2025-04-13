// models/event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
});

export default mongoose.model('Event', eventSchema);