import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import athleteRoutes from './routes/athleteRoutes.js';


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
connectDB();

// Route Mounts
app.use('/api/athlete', athleteRoutes);         // Athlete-related routes (creation, list)


// Server Start
app.listen(3000, () => console.log('Server running on port 3000'));