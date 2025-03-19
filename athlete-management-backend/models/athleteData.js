import Athlete from './athlete.js';

// Function to fetch athlete data along with risk flags
export const getAthleteData = async () => {
    try {
        const athletes = await Athlete.find(); // Fetch all athletes
        return athletes.map(athlete => {
            // Logic to determine risk flag based on athlete's data
            let riskFlag = 'Low'; // Default risk flag
            if (athlete.pastInjuries > 2 || athlete.hoursTrained > 20) {
                riskFlag = 'High';
            } else if (athlete.pastInjuries > 0) {
                riskFlag = 'Medium';
            }
            return {
                ...athlete.toObject(),
                riskFlag // Include risk flag in the returned data
            };
        });
    } catch (error) {
        throw new Error('Error fetching athlete data: ' + error.message);
    }
};
