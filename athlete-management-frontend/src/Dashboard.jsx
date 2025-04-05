


// import React, { useEffect, useState } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth0 } from '@auth0/auth0-react';

// // Fallback data - aligned with backend schema, updated for exertion
// const fallbackAthletes = [
//   { athleteId: '1', athleteName: 'John Doe', sport: 'Basketball', exertionCategory: 'Low', exertionLevel: 20 },
//   { athleteId: '2', athleteName: 'Jane Smith', sport: 'Swimming', exertionCategory: 'Low', exertionLevel: 25 },
//   { athleteId: '3', athleteName: 'Mike Johnson', sport: 'Track', exertionCategory: 'Low', exertionLevel: 15 },
// ];

// const Dashboard = () => {
//   const [athleteData, setAthleteData] = useState([]);
//   const { logout, user } = useAuth0();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Fetch athlete data and injury predictions from API
//   const fetchData = async () => {
//     try {
//       // Fetch basic athlete data
//       const athleteResponse = await fetch('http://localhost:3000/api/athlete/data');
//       if (!athleteResponse.ok) throw new Error(`HTTP error! status: ${athleteResponse.status}`);
//       const athleteDataRaw = await athleteResponse.json();
//       console.log('Raw Athlete Data:', JSON.stringify(athleteDataRaw, null, 2));

//       // Fetch injury predictions and exertion levels for each athlete
//       const updatedAthleteData = await Promise.all(
//         athleteDataRaw.map(async (athlete) => {
//           try {
//             const injuryResponse = await fetch(
//               `http://localhost:3000/api/athlete/injury-prediction/${athlete.athleteId}`
//             );
//             if (!injuryResponse.ok) throw new Error(`Injury fetch error! status: ${injuryResponse.status}`);
//             const injuryData = await injuryResponse.json();
//             const injuryPrediction = injuryData.injuryPrediction || {};
//             return {
//               ...athlete,
//               exertionCategory: injuryPrediction.exertionCategory || athlete.exertionCategory || 'Low', // Prioritize injury prediction
//               exertionLevel: injuryPrediction.exertionLevel || athlete.exertionLevel || 0,
//             };
//           } catch (err) {
//             console.error(`Error fetching injury prediction for ${athlete.athleteId}:`, err);
//             return {
//               ...athlete,
//               exertionCategory: athlete.exertionCategory || 'Low', // Fallback to stored or default
//               exertionLevel: athlete.exertionLevel || 0,
//             };
//           }
//         })
//       );
//       setAthleteData(updatedAthleteData);
//     } catch (error) {
//       console.error('Error fetching athlete data:', error);
//       setAthleteData(
//         fallbackAthletes.map((athlete) => ({
//           athleteId: athlete.athleteId,
//           athleteName: athlete.athleteName,
//           sport: athlete.sport,
//           exertionCategory: athlete.exertionCategory,
//           exertionLevel: athlete.exertionLevel,
//           hoursTrained: 0,
//           sessionsPerWeek: 0,
//           restDays: 0,
//           timestamp: new Date().toISOString(),
//         }))
//       );
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [location, location.state?.refresh]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-blue-950 text-gray-100 font-sans relative overflow-hidden">
//       {/* Header Section */}
//       <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 p-4 md:p-6 flex justify-between items-center shadow-lg border-b border-green-900/30">
//         <h1 className="text-2xl font-bold text-indigo-400">Dashboard</h1>
//         <div className="flex items-center gap-4">
//           <span className="text-lg font-medium">{user?.name}</span>
//           <button
//             onClick={() => logout({ returnTo: window.location.origin })}
//             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-110"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       <main className="container mx-auto px-6 py-10">
//         {/* Actions Section */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-semibold">All Athletes</h2>
//           <button
//             onClick={() => navigate('/create-athlete')}
//             className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-white font-semibold rounded-lg transition-transform transform hover:scale-110 shadow-lg"
//           >
//             + Create New Athlete
//           </button>
//         </div>

//         {/* Athlete List Section */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {athleteData.length === 0 ? (
//             <p className="text-gray-400 text-center col-span-full animate-fade-in">No athlete data available</p>
//           ) : (
//             athleteData.map((data) => (
//               <Link
//                 key={data.athleteId}
//                 to={`/athlete/${data.athleteId}`}
//                 className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 p-5 rounded-lg shadow-xl transition-transform transform hover:scale-105 hover:shadow-indigo-500/50 backdrop-blur-md flex flex-col animate-fade-in"
//               >
//                 <h3 className="text-xl font-bold text-indigo-300">{data.athleteName || 'Unknown Athlete'}</h3>
//                 <p className="text-gray-400">Sport: {data.sport || 'Not specified'}</p>
//                 <div
//                   className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
//                     data.exertionCategory === 'High'
//                       ? 'bg-red-500 text-white shadow-red-500'
//                       : data.exertionCategory === 'Moderate'
//                       ? 'bg-yellow-500 text-black shadow-yellow-500'
//                       : 'bg-green-500 text-white shadow-green-500'
//                   }`}
//                 >
//                   Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
//                 </div>
//               </Link>
//             ))
//           )}
//         </div>

//         {/* Performance Logs Section */}
//         <div className="mt-10">
//           <h2 className="text-2xl font-semibold mb-4">Recent Performance Logs</h2>
//           {athleteData.length === 0 ? (
//             <p className="text-gray-400 animate-fade-in">No recent performance logs</p>
//           ) : (
//             <ul className="space-y-3">
//               {athleteData.map((data) => (
//                 <li
//                   key={data._id || data.athleteId}
//                   className="bg-gray-900 bg-opacity-80 p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-indigo-500/50 backdrop-blur-md"
//                 >
//                   <span className="font-semibold">{data.athleteName || 'Unknown Athlete'}</span> -
//                   <span className="ml-2 text-gray-300">Hours: {data.hoursTrained || 0}, Sessions: {data.sessionsPerWeek || 0}, Rest Days: {data.restDays || 0}</span>
//                   <span className="ml-2 text-gray-300">Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;



import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion'; // Ensure "framer-motion" is installed

// Fallback data - aligned with backend schema, updated for exertion
const fallbackAthletes = [
  { athleteId: '1', athleteName: 'John Doe', sport: 'Basketball', exertionCategory: 'Low', exertionLevel: 20 },
  { athleteId: '2', athleteName: 'Jane Smith', sport: 'Swimming', exertionCategory: 'Low', exertionLevel: 25 },
  { athleteId: '3', athleteName: 'Mike Johnson', sport: 'Track', exertionCategory: 'Low', exertionLevel: 15 },
];

const Dashboard = () => {
  const [athleteData, setAthleteData] = useState([]);
  const { logout, user } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch athlete data and injury predictions from API
  const fetchData = async () => {
    try {
      const athleteResponse = await fetch('http://localhost:3000/api/athlete/data');
      if (!athleteResponse.ok) throw new Error(`HTTP error! status: ${athleteResponse.status}`);
      const athleteDataRaw = await athleteResponse.json();
      console.log('Raw Athlete Data:', JSON.stringify(athleteDataRaw, null, 2));

      const updatedAthleteData = await Promise.all(
        athleteDataRaw.map(async (athlete) => {
          try {
            const injuryResponse = await fetch(
              `http://localhost:3000/api/athlete/injury-prediction/${athlete.athleteId}`
            );
            if (!injuryResponse.ok) throw new Error(`Injury fetch error! status: ${injuryResponse.status}`);
            const injuryData = await injuryResponse.json();
            const injuryPrediction = injuryData.injuryPrediction || {};
            return {
              ...athlete,
              exertionCategory: injuryPrediction.exertionCategory || athlete.exertionCategory || 'Low',
              exertionLevel: injuryPrediction.exertionLevel || athlete.exertionLevel || 0,
            };
          } catch (err) {
            console.error(`Error fetching injury prediction for ${athlete.athleteId}:`, err);
            return {
              ...athlete,
              exertionCategory: athlete.exertionCategory || 'Low',
              exertionLevel: athlete.exertionLevel || 0,
            };
          }
        })
      );
      setAthleteData(updatedAthleteData);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
      setAthleteData(
        fallbackAthletes.map((athlete) => ({
          athleteId: athlete.athleteId,
          athleteName: athlete.athleteName,
          sport: athlete.sport,
          exertionCategory: athlete.exertionCategory,
          exertionLevel: athlete.exertionLevel,
          hoursTrained: 0,
          sessionsPerWeek: 0,
          restDays: 0,
          timestamp: new Date().toISOString(),
        }))
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, [location, location.state?.refresh]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-[#1b0621] text-gray-100 font-sans relative overflow-hidden">
      {/* Sports Stadium Background with Dynamic Elements */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'%3E%3Cpath d=\'M10 100 Q50 50 100 100 Q150 150 190 100\' fill=\'none\' stroke=\'rgba(30,144,255,0.3)\' stroke-width=\'2\'/%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'30\' fill=\'rgba(75,0,130,0.2)\'/%3E%3Cpath d=\'M80 120 Q100 150 120 120\' fill=\'none\' stroke=\'rgba(30,144,255,0.4)\' stroke-width=\'1\' class=\'animate-bounce\'/%3E%3Cpath d=\'M30 30 L40 20 L50 30\' fill=\'rgba(75,0,130,0.3)\' class=\'animate-spin-slow\'/%3E%3C/svg%3E')`,
          animation: 'panBackground 20s infinite linear',
        }}
      />
      <style>
        {`
          @keyframes panBackground {
            0% { background-position: 0 0; }
            100% { background-position: 100% 0; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-bounce { animation: bounce 2s infinite; }
          .animate-spin-slow { animation: spin-slow 10s linear infinite; }
          .animate-fade-in { animation: fadeIn 1s ease-in-out; }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>

      {/* Header Section */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="bg-[#1b0621]/90 backdrop-blur-md sticky top-0 z-20 p-4 md:p-6 flex justify-between items-center shadow-xl border-b border-[#1E90FF]"
      >
        <motion.h1 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-white flex items-center">
          Dashboard <span className="ml-2 text-[#1E90FF]">🏟️</span>
        </motion.h1>
        <div className="flex items-center gap-4">
          <motion.span variants={fadeInUp} className="text-lg md:text-xl font-medium text-gray-300">
            {user?.name || 'Guest'}
          </motion.span>
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => logout({ returnTo: window.location.origin })}
            className="bg-[#1E90FF] hover:bg-[#104E8B] text-white px-4 py-2 rounded-lg transition-transform flex items-center text-sm md:text-base"
          >
            Logout <span className="ml-1">🏃‍♂️</span>
          </motion.button>
        </div>
      </motion.header>

      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="container mx-auto px-6 py-10 relative z-10"
      >
        {/* Actions Section */}
        <motion.div variants={fadeInUp} className="flex justify-between items-center mb-6">
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-semibold text-white">
            All Athletes
          </motion.h2>
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-athlete')}
            className="bg-[#1E90FF] hover:bg-[#104E8B] px-5 py-2 text-white font-semibold rounded-lg shadow-lg transition-transform flex items-center text-sm md:text-base"
          >
            + Create New Athlete <span className="ml-1">🥇</span>
          </motion.button>
        </motion.div>

        {/* Athlete List Section */}
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {athleteData.length === 0 ? (
            <motion.p variants={fadeInUp} className="text-gray-400 text-center col-span-full animate-fade-in">
              No athlete data available
            </motion.p>
          ) : (
            athleteData.map((data) => (
              <motion.div
                key={data.athleteId}
                custom={data.athleteId}
                initial="hidden"
                variants={fadeInUp}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                className="bg-[#2A0040]/50 hover:bg-[#1b0621]/70 p-5 rounded-xl shadow-lg backdrop-blur-md flex flex-col items-center transition-all duration-300 border border-[#1E90FF]/30"
              >
                <h3 className="text-xl md:text-2xl font-bold text-[#1E90FF]">{data.athleteName || 'Unknown Athlete'}</h3>
                <p className="text-gray-400 text-sm md:text-base">Sport: {data.sport || 'Not specified'}</p>
                <div
                  className={`mt-2 px-3 py-1 rounded-full text-sm md:text-base font-semibold transition-all duration-300 ${
                    data.exertionCategory === 'High'
                      ? 'bg-red-500 text-white shadow-red-500/30'
                      : data.exertionCategory === 'Moderate'
                      ? 'bg-yellow-500 text-black shadow-yellow-500/30'
                      : 'bg-green-500 text-white shadow-green-500/30'
                  }`}
                >
                  Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Performance Logs Section */}
        <motion.div variants={fadeInUp} className="mt-10">
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Recent Performance Logs
          </motion.h2>
          {athleteData.length === 0 ? (
            <motion.p variants={fadeInUp} className="text-gray-400 animate-fade-in">
              No recent performance logs
            </motion.p>
          ) : (
            <motion.ul variants={stagger} className="space-y-4">
              {athleteData.map((data) => (
                <motion.li
                  key={data._id || data.athleteId}
                  custom={data.athleteId}
                  initial="hidden"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  className="bg-[#2A0040]/50 p-4 rounded-xl shadow-md backdrop-blur-md flex items-center transition-all duration-300 border border-[#1E90FF]/30"
                >
                  <span className="font-semibold text-white text-lg md:text-xl">{data.athleteName || 'Unknown Athlete'}</span>
                  <span className="ml-2 text-gray-400 text-sm md:text-base">
                    - Hours: {data.hoursTrained || 0}, Sessions: {data.sessionsPerWeek || 0}, Rest Days: {data.restDays || 0}
                  </span>
                  <span className="ml-2 text-gray-400 text-sm md:text-base">
                    Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </motion.main>
    </div>
  );
};

export default Dashboard;