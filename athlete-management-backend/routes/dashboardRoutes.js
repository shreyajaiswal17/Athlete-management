import express from 'express';
import { getAthleteData } from '../models/athleteData.js'; // Ensure this function exists

const router = express.Router();

import { getAthleteData } from '../models/athleteData.js'; // Ensure this function exists

import { getAthleteData } from '../models/athleteData.js'; // Ensure this function exists
import { getPerformanceLogs } from '../models/performanceLogs.js'; // Import performance logs function

// Endpoint to fetch dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const athletes = await getAthleteData(); // Fetch athletes with risk flags
    const performanceLogs = await getPerformanceLogs(); // Fetch performance logs

    // Combine athlete data with performance logs
    const combinedData = athletes.map(athlete => {
      const log = performanceLogs.find(log => log.athleteId === athlete._id);
      return {
        ...athlete.toObject(),
        riskFlag: athlete.riskFlag, // Assuming riskFlag is already calculated in athlete data
        performanceRiskFlag: log ? log.riskFlag : 'No Data' // Add performance log risk flag
      };
    });

    res.json(combinedData); // Return combined data
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



export default router;
