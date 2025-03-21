// athlete-management-frontend/src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

// Sample data as fallback - in real app, this comes from backend
const fallbackAthletes = [
  { id: 1, name: 'John Doe', sportType: 'Basketball' }, // Changed to sportType
  { id: 2, name: 'Jane Smith', sportType: 'Swimming' },
  { id: 3, name: 'Mike Johnson', sportType: 'Track' },
];

const Dashboard = () => {
  const [athleteData, setAthleteData] = useState([]);
  const [riskFlag, setRiskFlag] = useState('');
  const { logout, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/athlete/data');
        const data = await response.json();
        console.log('Dashboard Response:', response);
        console.log('Fetched Athlete Data:', data);
        // Log sportType for each athlete
        data.forEach((athlete, index) => console.log(`Athlete ${index} sportType:`, athlete.sportType));
        setAthleteData(data);
        if (data.length > 0) setRiskFlag(data[0].riskFlag);
      } catch (error) {
        console.error('Error fetching athlete data:', error);
        setAthleteData(fallbackAthletes.map(athlete => ({
          _id: athlete.id,
          athleteId: athlete.id,
          athleteName: athlete.name,
          sportType: athlete.sportType, // Use sportType in fallback
          riskFlag: 'Low',
          hoursTrained: 0,
          sessionsPerWeek: 0
        })));
      }
    };
    fetchData();
  }, []);

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
        {athleteData.map((data) => (
          <Link
            key={data.athleteId || data._id} // Fallback to _id if athleteId is missing
            to={`/athlete/${data.athleteId || data._id}`} // Use athleteId or _id
            className="athlete-card"
          >
            <h3>{data.athleteName || 'Unknown Athlete'}</h3>
            <p>Sport: {data.sportType || 'Not specified'}</p> {/* Use sportType */}
            <div className={`alert ${data.riskFlag?.toLowerCase().replace(/\s+/g, '-') || 'low'}`}>
              Risk: {data.riskFlag || 'Low'}
            </div>
          </Link>
        ))}
      </div>

      <div className="performance-logs">
        <h2>Recent Performance Logs</h2>
        <ul>
          {athleteData.map((data) => (
            <li key={data._id}>
              {data.athleteName || 'Unknown Athlete'} - Hours: {data.hoursTrained || 0}, Sessions: {data.sessionsPerWeek || 0}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;