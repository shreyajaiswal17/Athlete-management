// import React, { useEffect, useState } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth0 } from '@auth0/auth0-react';

// // Fallback data
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

//   const fetchData = async () => {
//     try {
//       const athleteResponse = await fetch('http://localhost:3000/api/athlete/data');
//       if (!athleteResponse.ok) throw new Error(`HTTP error! status: ${athleteResponse.status}`);
//       const athleteDataRaw = await athleteResponse.json();

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
//               exertionCategory: injuryPrediction.exertionCategory || athlete.exertionCategory || 'Low',
//               exertionLevel: injuryPrediction.exertionLevel || athlete.exertionLevel || 0,
//             };
//           } catch (err) {
//             console.error(`Error fetching injury prediction for ${athlete.athleteId}:`, err);
//             return {
//               ...athlete,
//               exertionCategory: athlete.exertionCategory || 'Low',
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
//     <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-blue-900 text-gray-100 font-sans relative overflow-hidden">
//       {/* Header Section */}
//       <header className="bg-black/80 backdrop-blur-md sticky top-0 z-20 p-4 md:p-6 flex justify-between items-center shadow-lg border-b border-blue-900/50">
//         <h1 className="text-3xl font-bold text-blue-400">Athlete Dashboard</h1>
//         <div className="flex items-center gap-4">
//           <span className="text-lg font-medium text-blue-200">{user?.name}</span>
//           <button
//             onClick={() => logout({ returnTo: window.location.origin })}
//             className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-105 shadow-md"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       <main className="container mx-auto px-6 py-10">
//         {/* Actions Section */}
//         <div className="flex justify-between items-center mb-8">
//           <h2 className="text-2xl font-semibold text-blue-300">All Athletes</h2>
//           <button
//             onClick={() => navigate('/create-athlete')}
//             className="bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 shadow-lg"
//           >
//             + New Athlete
//           </button>
//         </div>

//         {/* Athlete List Section */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {athleteData.length === 0 ? (
//             <p className="text-blue-300/70 text-center col-span-full animate-fade-in">
//               No athlete data available
//             </p>
//           ) : (
//             athleteData.map((data) => (
//               <Link
//                 key={data.athleteId}
//                 to={`/athlete/${data.athleteId}`}
//                 className="bg-black/70 hover:bg-black/90 p-5 rounded-lg shadow-xl transition-transform transform hover:scale-105 hover:shadow-blue-500/30 backdrop-blur-md flex flex-col animate-fade-in border border-blue-900/50"
//               >
//                 <h3 className="text-xl font-bold text-blue-300">
//                   {data.athleteName || 'Unknown Athlete'}
//                 </h3>
//                 <p className="text-blue-200/80">Sport: {data.sport || 'Not specified'}</p>
//                 <div
//                   className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
//                     data.exertionCategory === 'High'
//                       ? 'bg-red-600 text-white shadow-red-500/50'
//                       : data.exertionCategory === 'Moderate'
//                       ? 'bg-yellow-600 text-black shadow-yellow-500/50'
//                       : 'bg-blue-600 text-white shadow-blue-500/50'
//                   }`}
//                 >
//                   Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
//                 </div>
//               </Link>
//             ))
//           )}
//         </div>

//         {/* Performance Logs Section */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-semibold mb-4 text-blue-300">Recent Performance Logs</h2>
//           {athleteData.length === 0 ? (
//             <p className="text-blue-200/70 animate-fade-in">No recent performance logs</p>
//           ) : (
//             <ul className="space-y-4">
//               {athleteData.map((data) => (
//                 <li
//                   key={data._id || data.athleteId}
//                   className="bg-black/70 p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-blue-500/30 backdrop-blur-md border border-blue-900/50"
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="font-semibold text-blue-300">
//                       {data.athleteName || 'Unknown Athlete'}
//                     </span>
//                     <span className="text-blue-200/80 text-sm">
//                       {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
//                     </span>
//                   </div>
//                   <div className="mt-2 text-blue-200/90">
//                     <span>
//                       Hours: <span className="text-blue-400">{data.hoursTrained || 0}</span>
//                     </span>
//                     <span className="ml-4">
//                       Sessions: <span className="text-blue-400">{data.sessionsPerWeek || 0}</span>
//                     </span>
//                     <span className="ml-4">
//                       Rest Days: <span className="text-blue-400">{data.restDays || 0}</span>
//                     </span>
//                   </div>
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





import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-200 font-sans relative overflow-hidden">
      {/* Header Section */}
      <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 p-4 md:p-6 flex justify-between items-center shadow-lg border-b border-gray-700/50">
        <h1 className="text-2xl font-bold text-gray-100">Athlete Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-gray-300">{user?.name}</span>
          <button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-105 shadow-md"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Actions Section */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-100">All Athletes</h2>
          <button
            onClick={() => navigate('/create-athlete')}
            className="bg-gray-600 hover:bg-gray-500 px-5 py-2 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 shadow-lg"
          >
            + New Athlete
          </button>
        </div>

        {/* Athlete List Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {athleteData.length === 0 ? (
            <p className="text-gray-400 text-center col-span-full animate-fade-in">
              No athlete data available
            </p>
          ) : (
            athleteData.map((data) => (
              <Link
                key={data.athleteId}
                to={`/athlete/${data.athleteId}`}
                className="bg-gray-800/70 hover:bg-gray-800/90 p-5 rounded-lg shadow-xl transition-transform transform hover:scale-105 hover:shadow-gray-500/30 backdrop-blur-md flex flex-col animate-fade-in border border-gray-700/50"
              >
                <h3 className="text-xl font-bold text-gray-100">
                  {data.athleteName || 'Unknown Athlete'}
                </h3>
                <p className="text-gray-400">Sport: {data.sport || 'Not specified'}</p>
                <div
                  className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
                    data.exertionCategory === 'High'
                      ? 'bg-red-600 text-white shadow-red-500/50'
                      : data.exertionCategory === 'Moderate'
                      ? 'bg-yellow-600 text-black shadow-yellow-500/50'
                      : 'bg-gray-600 text-white shadow-gray-500/50'
                  }`}
                >
                  Exertion: {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Performance Logs Section */}
        {/* <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100">Recent Performance Logs</h2>
          {athleteData.length === 0 ? (
            <p className="text-gray-400 animate-fade-in">No recent performance logs</p>
          ) : (
            <ul className="space-y-4">
              {athleteData.map((data) => (
                <li
                  key={data._id || data.athleteId}
                  className="bg-gray-800/70 p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-gray-500/30 backdrop-blur-md border border-gray-700/50"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-100">
                      {data.athleteName || 'Unknown Athlete'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {data.exertionCategory} ({data.exertionLevel.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-2 text-gray-300">
                    <span>
                      Hours: <span className="text-gray-100">{data.hoursTrained || 0}</span>
                    </span>
                    <span className="ml-4">
                      Sessions: <span className="text-gray-100">{data.sessionsPerWeek || 0}</span>
                    </span>
                    <span className="ml-4">
                      Rest Days: <span className="text-gray-100">{data.restDays || 0}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div> */}
      </main>
    </div>
  );
};

export default Dashboard;