import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function TrainingSchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athleteData, setAthleteData] = useState(null);
  const [trainingSchedule, setTrainingSchedule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }
        const athlete = { ...performanceResponse.data.performanceData[0], role: performanceResponse.data.performanceData[0].role || 'General' };
        setAthleteData(athlete);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load athlete data: ${err.message}`);
      }
    };

    fetchAthleteData();
  }, [id]);

  useEffect(() => {
    const trainModelAndFetchSchedule = async () => {
      try {
        const trainResponse = await axios.post(`${import.meta.env.VITE_API_URL}/training/train`, {
          xs: [
            { athleteId: id, features: [25, 70, 85, 2, 5, 0] },
            { athleteId: "athlete2", features: [30, 65, 90, 1, 3, 1] },
          ],
          ys: [
            [1, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0],
          ],
          sport: athleteData?.sport || 'Default'
        });

        if (trainResponse.data !== `Model trained successfully for sport: ${athleteData?.sport || 'all sports'}!`) {
          throw new Error('Model training failed: ' + trainResponse.data);
        }

        const scheduleResponse = await axios.post(`${import.meta.env.VITE_API_URL}/training/generate-schedule`, { athleteId: id });
        setTrainingSchedule(scheduleResponse.data);
      } catch (err) {
        console.error('Error training model or fetching training schedule:', err);
        setError(prev => prev ? `${prev} | Training error: ${err.message}` : `Training error: ${err.message}`);
      }
    };

    if (id && athleteData) trainModelAndFetchSchedule();
  }, [id, athleteData]);

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white p-6 mt-5">
      <h1 className="text-3xl font-bold mb-6">Personalized Training Schedule</h1>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
      {trainingSchedule ? (
        <>
          <p className="text-lg"><strong className="text-gray-300">Sport:</strong> <span className="text-teal-400">{trainingSchedule.sport}</span></p>
          <h3 className="text-lg font-medium text-blue-400 mt-4">Weekly Training Plan</h3>
          <ul className="list-disc pl-5 mt-2">
            {trainingSchedule.schedule.map((day, index) => (
              <li key={index} className="text-gray-300">
                <strong>{day.day}:</strong> {day.trainingType}
                <p>{day.details}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-gray-400">Generating training schedule...</p>
      )}
      
    </div>
  );
}

export default TrainingSchedulePage;