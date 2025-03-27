import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

// Fallback data - aligned with backend schema
const fallbackAthletes = [
  { athleteId: '1', athleteName: 'John Doe', sport: 'Basketball', riskFlag: 'Low' },
  { athleteId: '2', athleteName: 'Jane Smith', sport: 'Swimming', riskFlag: 'Low' },
  { athleteId: '3', athleteName: 'Mike Johnson', sport: 'Track', riskFlag: 'Low' },
];

const Dashboard = () => {
  const [athleteData, setAthleteData] = useState([]);
  const { logout, user } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/athlete/data');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('Raw Fetched Data:', JSON.stringify(data, null, 2));
      setAthleteData(data);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
      setAthleteData(
        fallbackAthletes.map(athlete => ({
          athleteId: athlete.athleteId,
          athleteName: athlete.athleteName,
          sport: athlete.sport,
          riskFlag: athlete.riskFlag,
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
  }, [location]);

  return (
    <div className="min-h-screen bg-black text-white transition-all duration-500">
      {/* Header */}
      <header className="bg-gray-950 shadow-lg py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-400">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium">{user?.name}</span>
          <button 
            onClick={() => logout({ returnTo: window.location.origin })} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-110"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">All Athletes</h2>
          <button 
            onClick={() => navigate('/create-athlete')} 
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-white font-semibold rounded-lg transition-transform transform hover:scale-110 shadow-lg"
          >
            + Create New Athlete
          </button>
        </div>

        {/* Athlete List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {athleteData.length === 0 ? (
            <p className="text-gray-400 text-center col-span-full animate-fade-in">No athlete data available</p>
          ) : (
            athleteData.map(data => (
              <Link 
                key={data.athleteId} 
                to={`/athlete/${data.athleteId}`} 
                className="bg-gray-900 bg-opacity-80 hover:bg-opacity-100 p-5 rounded-lg shadow-xl transition-transform transform hover:scale-105 hover:shadow-indigo-500/50 backdrop-blur-md flex flex-col animate-fade-in"
              >
                <h3 className="text-xl font-bold text-indigo-300">{data.athleteName || 'Unknown Athlete'}</h3>
                <p className="text-gray-400">Sport: {data.sport || 'Not specified'}</p>
                <div className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 
                  ${data.riskFlag === 'High' ? 'bg-red-500 text-white shadow-red-500' : 'bg-green-500 text-white shadow-green-500'}`}
                >
                  Risk: {data.riskFlag || 'Low'}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Performance Logs */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Recent Performance Logs</h2>
          {athleteData.length === 0 ? (
            <p className="text-gray-400 animate-fade-in">No recent performance logs</p>
          ) : (
            <ul className="space-y-3">
              {athleteData.map(data => (
                <li 
                  key={data._id || data.athleteId} 
                  className="bg-gray-900 bg-opacity-80 p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-indigo-500/50 backdrop-blur-md"
                >
                  <span className="font-semibold">{data.athleteName || 'Unknown Athlete'}</span> - 
                  <span className="ml-2 text-gray-300">Hours: {data.hoursTrained || 0}, Sessions: {data.sessionsPerWeek || 0}, Rest Days: {data.restDays || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


