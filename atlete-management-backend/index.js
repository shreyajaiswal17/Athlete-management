import express from 'express';
import cors from 'cors';



import connectDB from './db.js';
import athleteRoutes from './routes/athleteRoutes.js';
const app = express();
app.use(cors());
app.use(express.json());
// MongoDB Connection
connectDB();
app.use(express.urlencoded({ extended: true })); // ✅ Middleware to parse form-urlencoded data



app.use('/api/athlete', athleteRoutes);
app.listen(3000, () => console.log('Server running on port 3000'));
