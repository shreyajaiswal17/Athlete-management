import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS } from 'chart.js/auto';

const AthleteDetailPage = () => {
  const { id } = useParams();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [injuryPredictions, setInjuryPredictions] = useState(null); // New state for injury predictions
  const [performanceSuggestion, setPerformanceSuggestion] = useState('');
  const [injurySuggestion, setInjurySuggestion] = useState('');
  const [error, setError] = useState(null);

  const chartRef = useRef(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        // Fetch performance data
        const performanceResponse = await axios.get(`http://localhost:3000/api/athlete/performance/${id}`);
        console.log('Performance Response Data:', performanceResponse.data);

        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }

        setAthleteData(performanceResponse.data);
        setPerformanceData(performanceResponse.data.performanceData);
        generateSuggestions(performanceResponse.data.performanceData[0] || {});
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
      }
    };

    const fetchInjuryPredictions = async () => {
      try {
        // Fetch injury predictions
        const injuryResponse = await axios.get(`http://localhost:3000/api/athlete/injury-prediction`);
        console.log('Injury Prediction Response Data:', injuryResponse.data);

        if (!injuryResponse.data || !injuryResponse.data.injuryPredictions) {
          throw new Error('No injury predictions found in response');
        }

        // Filter prediction for the current athlete
        const athletePrediction = injuryResponse.data.injuryPredictions.find(
          pred => (pred.athleteId?._id || pred.athleteId) === id
        );
        setInjuryPredictions(athletePrediction || null);
      } catch (err) {
        console.error('Error fetching injury predictions:', err);
        setError(prev => prev ? `${prev} | Injury prediction error: ${err.message}` : `Injury prediction error: ${err.message}`);
      }
    };

    fetchAthleteData();
    fetchInjuryPredictions();

    // Cleanup on unmount
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

  return (
    <div>
      <h1>Athlete Detail Page</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <section>
        <h2>Performance</h2>
        <p>Track and analyze athlete performance metrics.</p>
        {performanceData.length > 0 ? (
          <div>
            <h3>Performance Analysis Graph</h3>
            <Line
              ref={chartRef}
              data={chartData}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
            <p>{performanceSuggestion}</p>
          </div>
        ) : (
          <p>No performance data available.</p>
        )}
      </section>
      <section>
        <h2>Injuries</h2>
        <p>Monitor and manage athlete injuries.</p>
        {athleteData && (
          <div>
            <h3>Past Injuries</h3>
            <p>Past Injuries Count: {athleteData.performanceData[0]?.pastInjuries || 0}</p>
            <p>{injurySuggestion}</p>
            <h3>Injury Prediction Analysis</h3>
            {injuryPredictions ? (
              <p>
                Predicted Injury Risk: <strong>{injuryPredictions.injuryRisk}</strong>
                {injuryPredictions.injuryRisk === 'High Risk' && ' - Consider reducing training intensity or consulting a professional.'}
              </p>
            ) : (
              <p>No injury prediction available for this athlete in the recent data.</p>
            )}
          </div>
        )}
      </section>
      <section>
        <h2>Career/Financial Tools</h2>
        <p>Access tools for career planning and financial management.</p>
      </section>
      <section>
        <h2>AI Suggestions</h2>
        <p>Get AI-driven insights and predictions.</p>
      </section>
    </div>
  );
};

export default AthleteDetailPage;