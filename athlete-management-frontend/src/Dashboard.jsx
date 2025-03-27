import React, { useEffect, useState } from 'react';
import { Link, useNavigate,useLocation } from 'react-router-dom';
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
  const location = useLocation(); // Add this to detect navigation

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/athlete/data');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Raw Fetched Data:', JSON.stringify(data, null, 2));
      setAthleteData(data);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
      setAthleteData(fallbackAthletes.map(athlete => ({
        athleteId: athlete.athleteId,
        athleteName: athlete.athleteName,
        sport: athlete.sport,
        riskFlag: athlete.riskFlag,
        hoursTrained: 0,
        sessionsPerWeek: 0,
        restDays: 0,
        timestamp: new Date().toISOString()
      })));
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data on mount and when location changes
  }, [location]); // Re-run when location changes (e.g., after navigation)

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Dashboard</h1>
        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={() => logout({ returnTo: window.location.origin })}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-actions">
        <h2>All Athletes</h2>
        <button
          onClick={() => navigate('/create-athlete')}
          className="create-btn"
        >
          Create New Athlete
        </button>
      </div>

      <div className="athlete-list">
        {athleteData.length === 0 ? (
          <p>No athlete data available</p>
        ) : (
          athleteData.map((data) => (
            <Link
              key={data.athleteId} // Use athleteId consistently
              to={`/athlete/${data.athleteId}`} // Navigate using athleteId
              className="athlete-card"
            >
              <h3>{data.athleteName || 'Unknown Athlete'}</h3>
              <p>Sport: {data.sport || 'Not specified'}</p> {/* Changed to sport */}
              <div className={`alert ${data.riskFlag ? 'high' : 'low'}`}>
                Risk: {data.riskFlag ? 'High' : 'Low'} {/* Simplified display */}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="performance-logs">
        <h2>Recent Performance Logs</h2>
        {athleteData.length === 0 ? (
          <p>No recent performance logs</p>
        ) : (
          <ul>
            {athleteData.map((data) => (
              <li key={data._id || data.athleteId}> {/* Fallback to athleteId */}
                {data.athleteName || 'Unknown Athlete'} - 
                Hours: {data.hoursTrained || 0}, 
                Sessions: {data.sessionsPerWeek || 0}, 
                Rest Days: {data.restDays || 0}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;