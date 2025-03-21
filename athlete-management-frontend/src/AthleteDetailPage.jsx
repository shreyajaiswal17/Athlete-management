// athlete-management-frontend/src/AthleteDetailPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS } from 'chart.js/auto';

// Sample data as fallback
const fallbackAthleteData = {
  1: { id: 1, name: 'John Doe', sport: 'Basketball', age: 25, performance: 'Excellent' },
  2: { id: 2, name: 'Jane Smith', sport: 'Swimming', age: 22, performance: 'Good' },
  3: { id: 3, name: 'Mike Johnson', sport: 'Track', age: 28, performance: 'Very Good' }
};

function AthleteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [injuryPrediction, setInjuryPrediction] = useState(null);
  const [performanceSuggestion, setPerformanceSuggestion] = useState('');
  const [injurySuggestion, setInjurySuggestion] = useState('');
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`http://localhost:3000/api/athlete/performance/${id}`);
        console.log('Performance Response Data:', performanceResponse.data);

        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }

        setAthleteData(performanceResponse.data.performanceData[0]);
        setPerformanceData(performanceResponse.data.performanceData);
        generateSuggestions(performanceResponse.data.performanceData[0] || {});
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
        setAthleteData(fallbackAthleteData[id] ? { ...fallbackAthleteData[id], performanceData: [] } : null);
      }
    };

    const fetchInjuryPrediction = async () => {
      try {
        const injuryResponse = await axios.get(`http://localhost:3000/api/athlete/injury-prediction/${id}`);
        console.log('Injury Prediction Response Data:', injuryResponse.data);

        if (!injuryResponse.data || !injuryResponse.data.injuryPrediction) {
          throw new Error('No injury prediction found in response');
        }

        setInjuryPrediction(injuryResponse.data.injuryPrediction);
      } catch (err) {
        console.error('Error fetching injury prediction:', err);
        setError(prev => prev ? `${prev} | Injury prediction error: ${err.message}` : `Injury prediction error: ${err.message}`);
      }
    };

    fetchAthleteData();
    fetchInjuryPrediction();

    return () => {
      if (chartRef.current?.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
    };
  }, [id]);

  const generateSuggestions = (data) => {
    if (data.hoursTrained < 5) {
      setPerformanceSuggestion(`Your hours trained are ${data.hoursTrained}, consider increasing your training time.`);
    } else if (data.sessionsPerWeek < 3) {
      setPerformanceSuggestion(`You are training ${data.sessionsPerWeek} times a week, try to increase to at least 3 sessions.`);
    }

    if (data.pastInjuries > 0) {
      setInjurySuggestion(`You have had ${data.pastInjuries} past injuries. Consider monitoring your activity levels.`);
    }
  };

  const chartData = {
    labels: performanceData.map(data => new Date(data.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Hours Trained',
        data: performanceData.map(data => data.hoursTrained),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
      {
        label: 'Sessions Per Week',
        data: performanceData.map(data => data.sessionsPerWeek),
        borderColor: 'rgba(153,102,255,1)',
        fill: false,
      },
    ],
  };

  if (!athleteData && !error) {
    return <div>Loading...</div>;
  }

  if (!athleteData) {
    return <div className="athlete-detail-container">Athlete not found</div>;
  }

  return (
    <div className="athlete-detail-container">
      <div className="header">
        <h1>Athlete Details</h1>
        <span>User: {user.name}</span>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="athlete-info">
        <h2>{athleteData.athleteName}</h2>
        <p>Sport: {athleteData.sport || 'Not specified'}</p>
        <p>Age: {athleteData.athleteId?.age || 'Not specified'}</p>
        {athleteData.riskFlag && <p>Risk Flag: {athleteData.riskFlag}</p>}
      </div>

      <section className="performance-section">
        <h2>Performance</h2>
        {performanceData.length > 0 ? (
          <div>
            <h3>Performance Analysis Graph</h3>
            <Line
              ref={chartRef}
              data={chartData}
              options={{
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
            {performanceSuggestion && <p className="suggestion">{performanceSuggestion}</p>}
          </div>
        ) : (
          <p>No performance data available.</p>
        )}
      </section>

      <section className="injury-section">
        <h2>Injuries</h2>
        <div>
          <h3>Past Injuries</h3>
          <p>Past Injuries Count: {performanceData[0]?.pastInjuries || 0}</p>
          {injurySuggestion && <p className="suggestion">{injurySuggestion}</p>}
          <h3>Injury Prediction Analysis</h3>
          {injuryPrediction ? (
            <p>
              Predicted Injury Risk: <strong>{injuryPrediction.injuryRisk}</strong>
              {injuryPrediction.injuryRisk === 'High Risk' && ' - Consider reducing training intensity or consulting a professional.'}
              {injuryPrediction.predictionScore && (
                <span> (Probability: {Math.round(injuryPrediction.predictionScore * 100)}%)</span>
              )}
            </p>
          ) : (
            <p>No injury prediction available for this athlete in the recent data.</p>
          )}
        </div>
      </section>

      <section className="additional-section">
        <h2>Career/Financial Tools</h2>
        <p>Access tools for career planning and financial management (coming soon).</p>
      </section>

      <section className="additional-section">
        <h2>AI Suggestions</h2>
        <p>Get AI-driven insights and predictions (coming soon).</p>
      </section>

      <button onClick={() => navigate('/dashboard')} className="back-btn">
        Back to Dashboard
      </button>
    </div>
  );
}

export default AthleteDetailPage;