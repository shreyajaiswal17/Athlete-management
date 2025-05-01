// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';

// function TrainingSchedulePage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [athleteData, setAthleteData] = useState(null);
//   const [trainingSchedule, setTrainingSchedule] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAthleteData = async () => {
//       try {
//         const performanceResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
//         if (!performanceResponse.data || !performanceResponse.data.performanceData) {
//           throw new Error('No performance data found in response');
//         }
//         const athlete = { ...performanceResponse.data.performanceData[0], role: performanceResponse.data.performanceData[0].role || 'General' };
//         setAthleteData(athlete);
//       } catch (err) {
//         console.error('Error fetching athlete data:', err);
//         setError(`Failed to load athlete data: ${err.message}`);
//       }
//     };

//     fetchAthleteData();
//   }, [id]);

//   useEffect(() => {
//     const trainModelAndFetchSchedule = async () => {
//       try {
//         const trainResponse = await axios.post(`${import.meta.env.VITE_API_URL}/training/train`, {
//           xs: [
//             { athleteId: id, features: [25, 70, 85, 2, 5, 0] },
//             { athleteId: "athlete2", features: [30, 65, 90, 1, 3, 1] },
//           ],
//           ys: [
//             [1, 0, 0, 0, 0, 0, 0],
//             [0, 1, 0, 0, 0, 0, 0],
//           ],
//           sport: athleteData?.sport || 'Default'
//         });

//         if (trainResponse.data !== `Model trained successfully for sport: ${athleteData?.sport || 'all sports'}!`) {
//           throw new Error('Model training failed: ' + trainResponse.data);
//         }

//         const scheduleResponse = await axios.post(`${import.meta.env.VITE_API_URL}/training/generate-schedule`, { athleteId: id });
//         setTrainingSchedule(scheduleResponse.data);
//       } catch (err) {
//         console.error('Error training model or fetching training schedule:', err);
//         setError(prev => prev ? `${prev} | Training error: ${err.message}` : `Training error: ${err.message}`);
//       }
//     };

//     if (id && athleteData) trainModelAndFetchSchedule();
//   }, [id, athleteData]);

//   if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
//   if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white p-6 mt-5">
//       <h1 className="text-3xl font-bold mb-6">Personalized Training Schedule</h1>
//       {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
//       {trainingSchedule ? (
//         <>
//           <p className="text-lg"><strong className="text-gray-300">Sport:</strong> <span className="text-teal-400">{trainingSchedule.sport}</span></p>
//           <h3 className="text-lg font-medium text-blue-400 mt-4">Weekly Training Plan</h3>
//           <ul className="list-disc pl-5 mt-2">
//             {trainingSchedule.schedule.map((day, index) => (
//               <li key={index} className="text-gray-300">
//                 <strong>{day.day}:</strong> {day.trainingType}
//                 <p>{day.details}</p>
//               </li>
//             ))}
//           </ul>
//         </>
//       ) : (
//         <p className="text-gray-400">Generating training schedule...</p>
//       )}
      
//     </div>
//   );
// }

// export default TrainingSchedulePage;

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

  if (!athleteData && !error)
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-base">Loading...</div>;

  if (!athleteData)
    return <div className="flex items-center justify-center min-h-screen text-red-400 text-base">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#012A4A] via-[#0077B6] to-[#03045E]text-white px-6 py-10 mt-2">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">📅 Training Schedule</h1>

      {error && (
        <div className="bg-red-800/20 text-red-300 text-sm p-4 rounded-lg mb-8 border border-red-400">
          {error}
        </div>
      )}

      {trainingSchedule ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-xl space-y-6 text-base border border-blue-800">
          <p>
            <span className="font-medium text-gray-300">Sport:</span>{' '}
            <span className="text-white font-semibold">{trainingSchedule.sport}</span>
          </p>

          <h2 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">Weekly Plan</h2>

          <ul className="space-y-4">
            {trainingSchedule.schedule.map((day, index) => (
              <li key={index} className="bg-[#001F3F]/50 p-4 rounded-lg border border-gray-600 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold mb-1 text-white">{day.day}</h3>
                <p className="text-sm text-gray-200">
                  <span className="text-lg font-bold text-blue-50">Type:</span> {day.trainingType}
                </p>
                <p className="text-xl text-gray-300 mt-1">{day.details}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center text-base text-gray-300 mt-10">⏳ Generating training schedule...</div>
      )}

      
    </div>
  );
}

export default TrainingSchedulePage;
