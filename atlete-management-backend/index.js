import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import athleteRoutes from './routes/athleteRoutes.js';
import injuryPredictionRoutes from './routes/injuryPredictionRoutes.js';



const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
connectDB();

app.use('/api/athlete', athleteRoutes);         // Athlete-related routes (creation, list)
app.use('/api/athlete', injuryPredictionRoutes); // Injury prediction routes



// Server Start
app.listen(3000, () => console.log('Server running on port 3000'));
