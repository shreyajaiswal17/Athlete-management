import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

const calculatePerformanceEfficiency = (hoursTrained, sessionsPerWeek, restDays, competitionWins, sport, role) => {
  const maxHours = sport === 'Swimming' ? 30 : sport === 'Basketball' ? 25 : sport === 'Cricket' && role === 'Bowler' ? 25 : 20;
  const efficiency = (hoursTrained / maxHours) * 0.4 + (sessionsPerWeek / 7) * 0.3 + (restDays / 7) * 0.2 + (competitionWins / 5) * 0.1;
  return Math.min(100, Math.max(0, efficiency * 100)).toFixed(1);
};

const analyzePerformanceTrends = (performanceData) => {
  if (performanceData.length < 2) return { trend: 'Insufficient data for trend analysis', delta: 0 };
  const latest = performanceData[performanceData.length - 1];
  const previous = performanceData[performanceData.length - 2];
  const hoursDelta = latest.hoursTrained - previous.hoursTrained;
  const sessionsDelta = latest.sessionsPerWeek - previous.sessionsPerWeek;
  const restDelta = latest.restDays - previous.restDays;
  const trend = hoursDelta > 0 ? 'increasing' : hoursDelta < 0 ? 'decreasing' : 'stable';
  return {
    trend: `Training volume is ${trend} (${hoursDelta > 0 ? '+' : ''}${hoursDelta.toFixed(1)} hours, ${sessionsDelta > 0 ? '+' : ''}${sessionsDelta} sessions, ${restDelta > 0 ? '+' : ''}${restDelta} rest days).`,
    delta: { hours: hoursDelta, sessions: sessionsDelta, rest: restDelta }
  };
};

const generatePerformanceRecommendations = (athleteData, performanceData) => {
  const latest = performanceData[performanceData.length - 1] || {};
  const { sport, competitionHistory, role = 'General' } = athleteData;
  const { hoursTrained = 0, sessionsPerWeek = 0, restDays = 0 } = latest;
  const wins = calculateCompetitionWins(competitionHistory);
  const efficiency = calculatePerformanceEfficiency(hoursTrained, sessionsPerWeek, restDays, wins, sport, role);

  let recommendations = [];
  if (sport === 'Basketball') {
    recommendations.push(hoursTrained < 15 ? 'Increase court time to 15-20 hours/week to boost explosiveness.' : 'Maintain volume, focus on agility drills (e.g., ladder drills).');
    recommendations.push(sessionsPerWeek < 4 ? 'Add 1-2 shooting practice sessions.' : 'Incorporate HIIT for stamina.');
  } else if (sport === 'Swimming') {
    recommendations.push(hoursTrained < 20 ? 'Aim for 20-25 hours/week for endurance.' : 'Refine technique (e.g., flip turns).');
    recommendations.push(restDays < 2 ? 'Schedule 2 rest days for aerobic recovery.' : 'Add dryland strength training.');
  } else if (sport === 'Track') {
    recommendations.push(hoursTrained < 18 ? 'Increase to 18-22 hours/week for speed/stamina.' : 'Prioritize sprint intervals.');
    recommendations.push(wins < 3 ? 'Compete more for race experience.' : 'Analyze pacing via footage.');
  } else if (sport === 'Cricket') {
    recommendations.push(hoursTrained < (role === 'Bowler' ? 20 : 15) ? 'Boost to 20-25 hours/week for match readiness.' : `Focus on ${role === 'Bowler' ? 'bowling accuracy' : 'batting drills'}.`);
    recommendations.push(restDays < (role === 'Bowler' ? 2 : 1) ? 'Add rest days for recovery.' : 'Enhance fielding agility.');
  } else if (sport === 'Kabaddi') {
    recommendations.push(hoursTrained < 18 ? 'Increase to 18-22 hours/week for raid/tackle strength.' : 'Refine raid techniques.');
    recommendations.push(sessionsPerWeek < 5 ? 'Add 1-2 contact sessions.' : 'Focus on breath control drills.');
  } else if (sport === 'Football') {
    recommendations.push(hoursTrained < 20 ? 'Aim for 20-28 hours/week for endurance.' : 'Work on sprint conditioning.');
    recommendations.push(restDays < 2 ? 'Add 1-2 rest days for leg recovery.' : 'Incorporate ball control drills.');
  } else {
    recommendations.push(hoursTrained < 15 ? 'Increase to 15-20 hours/week for gains.' : 'Refine sport-specific skills.');
  }

  return { efficiency, recommendations };
};

function PerformanceTrendsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState({
    efficiency: 0,
    trend: '',
    recommendations: [],
  });
  const [performanceSuggestion, setPerformanceSuggestion] = useState('');
  const [error, setError] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
        const data = response.data?.performanceData;
        if (!data || data.length === 0) throw new Error('No performance data found');

        const sorted = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const athlete = { ...data[0], role: data[0].role || 'General' };

        setAthleteData(athlete);
        setPerformanceData(sorted);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
      }
    };

    fetchAthleteData();
  }, [id]);

  useEffect(() => {
    if (athleteData && performanceData.length > 0) {
      const trend = analyzePerformanceTrends(performanceData);
      const { efficiency, recommendations } = generatePerformanceRecommendations(athleteData, performanceData);
      const latest = performanceData[performanceData.length - 1];

      setPerformanceSuggestion(`Training Load: ${latest.hoursTrained} hours/week, ${latest.sessionsPerWeek} sessions, ${latest.restDays} rest days.`);
      setPerformanceAnalysis({ efficiency, trend: trend.trend, recommendations });
    }
  }, [athleteData, performanceData]);

  const chartData = {
    labels: performanceData.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Hours Trained',
        data: performanceData.map(d => d.hoursTrained || 0),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Sessions Per Week',
        data: performanceData.map(d => d.sessionsPerWeek || 0),
        borderColor: 'rgba(153,102,255,1)',
        backgroundColor: 'rgba(153,102,255,0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Rest Days',
        data: performanceData.map(d => d.restDays || 0),
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: '#444' }, title: { display: true, text: 'Value', color: '#fff' } },
      x: { ticks: { color: '#fff' }, grid: { color: '#444' }, title: { display: true, text: 'Date', color: '#fff' } },
    },
    plugins: {
      legend: { labels: { color: '#fff' } },
      tooltip: { enabled: true },
      title: { display: true, text: 'Performance Trends Over Time', color: '#fff' },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const data = performanceData[index];
        setModalContent({
          title: 'Performance Details',
          content: `Date: ${new Date(data.timestamp).toLocaleDateString()}\nHours Trained: ${data.hoursTrained}\nSessions: ${data.sessionsPerWeek}\nRest Days: ${data.restDays}`,
        });
      }
    }
  };

  const efficiencyChartData = {
    labels: performanceData.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [{
      label: 'Efficiency Score (%)',
      data: performanceData.map(data =>
        calculatePerformanceEfficiency(
          data.hoursTrained || 0,
          data.sessionsPerWeek || 0,
          data.restDays || 0,
          calculateCompetitionWins(athleteData?.competitionHistory || []),
          athleteData?.sport || 'General',
          athleteData?.role || 'General'
        )
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }],
  };

  const efficiencyChartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff' } },
      title: { display: true, text: 'Performance Efficiency Over Time', color: '#fff' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { color: '#fff' }, grid: { color: '#444' }, title: { display: true, text: 'Efficiency (%)', color: '#fff' } },
      x: { ticks: { color: '#fff' }, grid: { color: '#444' } },
    },
  };

  const closeModal = () => setModalContent(null);

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Performance Trends</h1>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
      {performanceData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="h-96">
              <Bar data={efficiencyChartData} options={efficiencyChartOptions} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-teal-400">Performance Summary</h3>
            <p className="mt-2">
              <strong>Efficiency Score:</strong> <span className="text-green-400">{performanceAnalysis.efficiency}%</span> 
              {performanceAnalysis.efficiency < 50 ? ' (Room for improvement)' : performanceAnalysis.efficiency < 75 ? ' (Solid performance)' : ' (Elite level)'}
            </p>
            <p className="mt-2"><strong>Trend:</strong> {performanceAnalysis.trend}</p>
            <p className="mt-2"><strong>Latest Metrics:</strong> {performanceSuggestion}</p>
            <h3 className="text-lg font-medium text-blue-400 mt-4">Optimization Recommendations</h3>
            <ul className="list-disc pl-5 mt-2">
              {performanceAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-300">{rec}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>No performance data available.</p>
      )}
      

      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-semibold mb-4">{modalContent.title}</h3>
            <p className="text-sm whitespace-pre-wrap">{modalContent.content}</p>
            <button
              onClick={closeModal}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceTrendsPage;
