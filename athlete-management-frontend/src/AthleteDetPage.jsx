import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import PerformanceTrendsPage from './PerformanceTrendsPage.jsx';
import TrainingSchedulePage from './TrainingSchedulePage.jsx';
import MealPlan from './MealPlan.jsx';
const fallbackAthleteData = {
  1: { id: 1, athleteName: 'John Doe', sport: 'Basketball', role: 'Guard', age: 25, education: 'BS in Kinesiology', careerGoals: ['Professional Athlete'], performance: 'Excellent', injuryHistory: [], competitionHistory: [] },
  2: { id: 2, athleteName: 'Jane Smith', sport: 'Swimming', role: 'Freestyler', age: 22, education: 'BA in Sports Management', careerGoals: ['Coach'], performance: 'Good', injuryHistory: [], competitionHistory: [] },
  3: { id: 3, athleteName: 'Mike Johnson', sport: 'Track', role: 'Sprinter', age: 28, education: 'MS in Exercise Science', careerGoals: ['Olympian', 'Trainer'], performance: 'Very Good', injuryHistory: [], competitionHistory: [] }
};

const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

function AthleteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [athleteData, setAthleteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
        if (!response.data || !response.data.performanceData) {
          throw new Error('No performance data found in response');
        }
        const athlete = { ...response.data.performanceData[0], role: response.data.performanceData[0].role || 'General' };
        setAthleteData(athlete);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load athlete data: ${err.message}`);
        setAthleteData(fallbackAthleteData[id] ? { ...fallbackAthleteData[id], performanceData: [], role: fallbackAthleteData[id].role || 'General' } : null);
      }
    };

    fetchAthleteData();
  }, [id]);

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{athleteData.athleteName}</h1>
        <span className="text-sm text-gray-400">User: {user.name}</span>
      </div>

      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}

      <div className="bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] p-4 rounded-lg mb-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p><strong>Sport:</strong> {athleteData.sport || 'Not specified'}</p>
          <p><strong>Role:</strong> {athleteData.role || 'General'}</p>
          <p><strong>Age:</strong> {athleteData.age || 'Not specified'}</p>
          <p><strong>Education:</strong> {athleteData.education || 'Not specified'}</p>
          <p><strong>Career Goals:</strong> {athleteData.careerGoals?.join(', ') || 'Not specified'}</p>
          <p><strong>Competition Wins:</strong> {calculateCompetitionWins(athleteData.competitionHistory)}</p>
        </div>
      </div>
      <PerformanceTrendsPage/>
      <TrainingSchedulePage/>
      <MealPlan/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
        <button
          onClick={() => navigate(`/athlete/${id}/injury`)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Injury Prevention
        </button>
       
        <button
          onClick={() => navigate(`/athlete/${id}/career`)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Career Guidance
        </button>
        <button
          onClick={() => navigate(`/athlete/${id}/financial`)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Financial Planning
        </button>
      
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => navigate(`/performanceupdate/${id}`)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Update Performance
        </button>
      </div>
    </div>
  );
}

export default AthleteDetailPage;