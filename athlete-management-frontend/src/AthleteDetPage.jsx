// 

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

  if (!athleteData && !error)
    return <div className="flex items-center justify-center min-h-screen text-gray-300 text-xl">Loading...</div>;

  if (!athleteData)
    return <div className="flex items-center justify-center min-h-screen text-red-400 text-xl">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#012A4A] via-[#0077B6] to-[#03045E] text-white p-10 text-xl leading-relaxed">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-wide">{athleteData.athleteName}</h1>
        <span className="text-lg text-blue-100">User: {user?.name}</span>
      </div>

      {error && <div className="bg-red-900/20 text-red-300 p-5 rounded-xl mb-10 text-lg">{error}</div>}

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl mb-12 shadow-xl hover:shadow-2xl transition duration-300 text-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
          <p><span className="font-bold">🏀 Sport:</span> {athleteData.sport || 'Not specified'}</p>
          <p><span className="font-bold">🎯 Role:</span> {athleteData.role || 'General'}</p>
          <p><span className="font-bold">📅 Age:</span> {athleteData.age || 'Not specified'}</p>
          <p><span className="font-bold">🎓 Education:</span> {athleteData.education || 'Not specified'}</p>
          <p><span className="font-bold">🚀 Career Goals:</span> {athleteData.careerGoals?.join(', ') || 'Not specified'}</p>
          <p><span className="font-bold">🏆 Competition Wins:</span> {calculateCompetitionWins(athleteData.competitionHistory)}</p>
        </div>
      </div>

      <PerformanceTrendsPage />
      <TrainingSchedulePage />
      <MealPlan />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
        
        <button
          onClick={() => navigate(`/athlete/${id}/career`)}
          className="bg-white/10 backdrop-blur-md  hover:bg-blue-800 text-white font-semibold px-6 py-4 rounded-xl shadow-lg transition"
        >
          🎓 Career Guidance
        </button>
        <button
          onClick={() => navigate(`/athlete/${id}/financial`)}
          className="bg-white/10 backdrop-blur-md  hover:bg-blue-800 text-white font-semibold px-6 py-4 rounded-xl shadow-lg transition"
        >
          💰 Financial Planning
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-6 mt-14">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto bg-white/10 backdrop-blur-md  hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow transition"
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={() => navigate(`/performanceupdate/${id}`)}
          className="w-full sm:w-auto bg-white/10 backdrop-blur-md  hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow transition"
        >
          ✏️ Update Performance
        </button>
      </div>
    </div>
  );
}

export default AthleteDetailPage;

