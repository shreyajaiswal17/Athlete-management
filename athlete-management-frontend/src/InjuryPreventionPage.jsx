import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
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

function InjuryPreventionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [injuryPrediction, setInjuryPrediction] = useState(null);
  const [injuryPreventionSuggestion, setInjuryPreventionSuggestion] = useState('');
  const [calculatedRecoveryScore, setCalculatedRecoveryScore] = useState(null);
  const [trainingMetrics, setTrainingMetrics] = useState({ trainingLoad: 0, recoveryScore: 0, riskFlag: '', insights: {}, recommendations: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }
        const athlete = { ...performanceResponse.data.performanceData[0], role: performanceResponse.data.performanceData[0].role || 'General' };
        const sortedPerformanceData = performanceResponse.data.performanceData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setAthleteData(athlete);
        setPerformanceData(sortedPerformanceData);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
      }
    };

    const fetchInjuryPrediction = async () => {
      try {
        const injuryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/injury-prediction/${id}`);
        if (!injuryResponse.data || !injuryResponse.data.injuryPrediction) {
          throw new Error('No injury prediction found in response');
        }
        setInjuryPrediction(injuryResponse.data.injuryPrediction);
      } catch (err) {
        console.error('Error fetching injury prediction:', err);
        setError(prev => prev ? `${prev} | Injury prediction error: ${err.message}` : `Injury prediction error: ${err.message}`);
      }
    };

    const fetchTrainingMetrics = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/training-metrics/${id}`);
        setTrainingMetrics(response.data);
      } catch (err) {
        console.error('Error fetching training metrics:', err);
        setError(prev => prev ? `${prev} | Training metrics error: ${err.message}` : `Training metrics error: ${err.message}`);
      }
    };

    fetchAthleteData();
    fetchInjuryPrediction();
    fetchTrainingMetrics();
  }, [id]);

  useEffect(() => {
    if (athleteData && injuryPrediction && performanceData.length > 0) {
      generatePreventionSuggestions(injuryPrediction, athleteData, performanceData);
    }
  }, [athleteData, injuryPrediction, performanceData]);

  const generatePreventionSuggestions = (injuryPrediction, athleteData, perfData) => {
    if (!injuryPrediction || !perfData.length) {
      setInjuryPreventionSuggestion('No specific prevention recommendation available.');
      setCalculatedRecoveryScore(null);
      return;
    }

    const latestPerf = perfData[perfData.length - 1];
    const hoursTrained = latestPerf.hoursTrained || 20;
    const sessionsPerWeek = latestPerf.sessionsPerWeek || 4;
    const restDays = latestPerf.restDays || 0;
    const sport = athleteData.sport || 'General';
    const role = athleteData.role || 'General';

    const sportThresholds = {
      Swimming: { maxHours: 30, minRestDays: 2, maxSessions: 7, commonInjury: 'shoulder strain' },
      Basketball: { maxHours: 25, minRestDays: 2, maxSessions: 6, commonInjury: 'knee/ankle sprain' },
      Track: { maxHours: 22, minRestDays: 2, maxSessions: 6, commonInjury: 'shin splints' },
      Cricket: {
        maxHours: role === 'Bowler' ? 25 : 20,
        minRestDays: role === 'Bowler' ? 2 : 1,
        maxSessions: 6,
        commonInjury: role === 'Bowler' ? 'shoulder strain' : 'hamstring strain'
      },
      Kabaddi: { maxHours: 22, minRestDays: 2, maxSessions: 7, commonInjury: 'knee/ankle sprain' },
      Football: { maxHours: 28, minRestDays: 2, maxSessions: 6, commonInjury: 'hamstring strain' },
      General: { maxHours: 20, minRestDays: 2, maxSessions: 5, commonInjury: 'general fatigue' },
    };
    const thresholds = sportThresholds[sport] || sportThresholds.General;

    const trainingWarnings = monitorTrainingLoad(hoursTrained, sessionsPerWeek, restDays, thresholds, injuryPrediction);
    const intensity = calculateIntensity(sessionsPerWeek, sport);
    const recoveryScore = calculateRecoveryScore(restDays, intensity, injuryPrediction.predictionScore || 0);
    const recoverySuggestions = getRecoverySuggestions(recoveryScore, thresholds, injuryPrediction, sport, role);

    const preventionSuggestion = [...trainingWarnings, recoverySuggestions].join(' ');
    setInjuryPreventionSuggestion(preventionSuggestion || 'No immediate action required—monitor trends.');
    setCalculatedRecoveryScore(recoveryScore);
  };

  const monitorTrainingLoad = (hours, sessions, rest, thresholds, injuryPrediction) => {
    const warnings = [];
    const riskLevel = injuryPrediction.injuryRisk?.toLowerCase() || 'unknown';

    if (hours > thresholds.maxHours) {
      const reduction = (hours - thresholds.maxHours) > 5 ? 'significantly reduce' : 'slightly reduce';
      warnings.push(`${riskLevel === 'high' ? 'Urgent: ' : ''}Excessive training load (${hours} hours exceeds ${thresholds.maxHours} max)—${reduction} volume to avoid ${thresholds.commonInjury}.`);
    }

    if (rest < thresholds.minRestDays && (riskLevel === 'high' || riskLevel === 'moderate')) {
      warnings.push(`Low rest (${rest} days < ${thresholds.minRestDays} recommended)—add ${thresholds.minRestDays - rest} rest day(s) to prevent ${thresholds.commonInjury}.`);
    }

    if (sessions > thresholds.maxSessions) {
      warnings.push(`Too many sessions (${sessions} > ${thresholds.maxSessions} max)—cut back to reduce strain on ${thresholds.commonInjury.split('/')[0]}.`);
    }

    return warnings;
  };

  const calculateIntensity = (sessions, sport) => {
    const intensityPerSession = {
      Swimming: 1.5,
      Basketball: 2.5,
      Track: 2,
      Cricket: 2,
      Kabaddi: 2.5,
      Football: 2.2,
      General: 2,
    };
    return sessions * (intensityPerSession[sport] || intensityPerSession.General);
  };

  const calculateRecoveryScore = (restDays, intensity, predictionScore) => {
    const baseScore = restDays * 20;
    const riskAdjustment = predictionScore * 30;
    return Math.min(100, Math.max(0, baseScore - intensity - riskAdjustment));
  };

  const getRecoverySuggestions = (score, thresholds, injuryPrediction, sport, role) => {
    const riskLevel = injuryPrediction.injuryRisk?.toLowerCase() || 'low';
    const preventionTip = {
      Swimming: 'shoulder mobility',
      Basketball: 'ankle bracing',
      Track: 'calf stretching',
      Cricket: role === 'Bowler' ? 'rotator cuff exercises' : 'hamstring flexibility',
      Kabaddi: 'knee stability drills',
      Football: 'quad stretching',
      General: 'core conditioning',
    };

    if (score < 30 && riskLevel === 'high') {
      return `Critical recovery deficit (score: ${score.toFixed(1)})—prioritize 2-3 rest days this week and target ${thresholds.commonInjury} prevention (e.g., ${preventionTip[sport] || preventionTip.General}).`;
    } else if (score < 50) {
      return `Low recovery (score: ${score.toFixed(1)})—increase rest days by 1 or reduce intensity to protect against ${thresholds.commonInjury}.`;
    } else if (riskLevel === 'high') {
      return `High injury risk detected despite decent recovery (score: ${score.toFixed(1)})—add preventive measures for ${thresholds.commonInjury} (e.g., ${preventionTip[sport] || preventionTip.General}).`;
    } else {
      return `Recovery adequate (score: ${score.toFixed(1)})—maintain routine, monitor for ${thresholds.commonInjury}.`;
    }
  };

  const trainingMetricsData = {
    labels: ['Training Load', 'Recovery Score'],
    datasets: [
      {
        label: 'Metrics',
        data: [trainingMetrics.trainingLoad, calculatedRecoveryScore || trainingMetrics.recoveryScore],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const trainingMetricsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: { display: true, text: 'Training Metrics', color: '#ffffff' },
    },
    scales: {
      y: { beginAtZero: true, max: 400, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
  };

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Injury Prevention</h1>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
      <p className="mt-2">{trainingMetrics.insights.trainingLoad}</p>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-blue-400">Recommendations</h3>
        <ul className="list-disc pl-5 mt-2">
          {trainingMetrics.recommendations.map((rec, index) => (
            <li key={index} className="text-gray-300">
              <strong>{rec.recommendation}:</strong> {rec.explanation}
            </li>
          ))}
        </ul>
      </div>
      <div className="h-64 mt-4">
        <Bar data={trainingMetricsData} options={trainingMetricsOptions} />
      </div>
      {athleteData.injuryHistory?.length > 0 ? (
        <table className="w-full mt-2 text-sm border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 border border-gray-600">Injury</th>
              <th className="p-2 border border-gray-600">Severity</th>
              <th className="p-2 border border-gray-600">Recovery Time</th>
              <th className="p-2 border border-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {athleteData.injuryHistory.map((injury, index) => (
              <tr key={index} className="hover:bg-gray-600">
                <td className="p-2 border border-gray-600">{injury.injury || 'Unknown'}</td>
                <td className="p-2 border border-gray-600">{injury.severity || 'N/A'}</td>
                <td className="p-2 border border-gray-600">{injury.recoveryTime || 'N/A'}</td>
                <td className="p-2 border border-gray-600">{injury.date ? new Date(injury.date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2">No detailed injury history available.</p>
      )}
      {injuryPrediction ? (
        <div className="mt-4">
          {calculatedRecoveryScore !== null && (
            <p className="mt-2">
              <strong>Recovery Score:</strong>{' '}
              <span className={calculatedRecoveryScore < 30 ? 'text-red-400' : calculatedRecoveryScore < 50 ? 'text-yellow-400' : 'text-green-400'}>
                {calculatedRecoveryScore.toFixed(1)}
              </span>{' '}
              {calculatedRecoveryScore < 30 ? '(Poor recovery)' : calculatedRecoveryScore < 50 ? '(Low recovery)' : '(Adequate recovery)'}
            </p>
          )}
          <p className="mt-2">
            <strong>Injury Risk:</strong>{' '}
            <span
              className={
                injuryPrediction.injuryRisk.includes('High') || injuryPrediction.injuryRisk.includes('Critical')
                  ? 'text-red-400'
                  : injuryPrediction.injuryRisk.includes('Moderate') || injuryPrediction.injuryRisk.includes('Medium')
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }
            >
              {injuryPrediction.injuryRisk}
            </span>
            {injuryPrediction.predictionScore && ` (${Math.round(injuryPrediction.predictionScore * 100)}%)`}
          </p>
          {injuryPreventionSuggestion && <p className="mt-2 text-orange-400">{injuryPreventionSuggestion}</p>}
        </div>
      ) : (
        <p className="mt-2">No injury prediction available.</p>
      )}
      <button
        onClick={() => navigate(`/athlete/${id}`)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Back to Athlete Dashboard
      </button>
    </div>
  );
}

export default InjuryPreventionPage;