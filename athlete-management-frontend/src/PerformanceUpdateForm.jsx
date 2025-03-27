import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PerformanceUpdateForm = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  // Performance form data
  const [formData, setFormData] = useState({
    athleteId: athleteId || '',
    hoursTrained: '',
    sessionsPerWeek: '',
    restDays: ''
  });

  // Injury form data
  const [injuryData, setInjuryData] = useState({
    injury: '',
    severity: '',
    recoveryTime: '',
    date: ''
  });

  const [athletes, setAthletes] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [latestPerformanceId, setLatestPerformanceId] = useState(null);
  const [isRecent, setIsRecent] = useState(false);
  const [error, setError] = useState('');
  const [injuryError, setInjuryError] = useState('');

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/athlete/athletes');
        const data = await response.json();
        setAthletes(data);
        if (athleteId && data.some(athlete => athlete._id === athleteId)) {
          setFormData(prev => ({ ...prev, athleteId }));
        }
      } catch (error) {
        console.error('Error fetching athletes:', error);
      }
    };

    const fetchLatestPerformance = async () => {
      if (!athleteId) return;
      try {
        const response = await fetch(`http://localhost:3000/api/athlete/performance/${athleteId}`);
        const performanceData = await response.json();
        const latest = performanceData.performanceData[0];
        if (latest) {
          setFormData({
            athleteId,
            hoursTrained: latest.hoursTrained.toString(),
            sessionsPerWeek: latest.sessionsPerWeek.toString(),
            restDays: latest.restDays.toString()
          });
          setLatestPerformanceId(latest._id);
          const isRecent = (new Date() - new Date(latest.timestamp)) < 24 * 60 * 60 * 1000;
          setIsRecent(isRecent);
        }
      } catch (error) {
        console.error('Error fetching latest performance:', error);
      }
    };

    fetchAthletes();
    fetchLatestPerformance();
  }, [athleteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInjuryChange = (e) => {
    const { name, value } = e.target;
    setInjuryData({ ...injuryData, [name]: value });
  };

  const handleSubmit = async (e, isUpdate = false) => {
    e.preventDefault();
    setError('');
    try {
      const url = isUpdate && latestPerformanceId 
        ? `http://localhost:3000/api/athlete/performance/${latestPerformanceId}`
        : 'http://localhost:3000/api/athlete/log-performance';
      const method = isUpdate && latestPerformanceId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        if (data.suggestion) {
          setLatestPerformanceId(data.performanceId);
          setIsRecent(true);
          setError('Recent performance exists. Choose to update or log new.');
        } else {
          alert(`Performance ${isUpdate && latestPerformanceId ? 'updated' : 'logged'} successfully!`);
          setAnalysis(data.analysis);
          if (!isUpdate) {
            setFormData({ athleteId: athleteId || '', hoursTrained: '', sessionsPerWeek: '', restDays: '' });
          }
          navigate(`/athlete/${athleteId}`);
        }
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to the server');
    }
  };

  const handleInjurySubmit = async (e) => {
    e.preventDefault();
    setInjuryError('');
    try {
      const response = await fetch(`http://localhost:3000/api/athlete/${athleteId}/injuries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(injuryData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Injury added successfully!');
        setInjuryData({ injury: '', severity: '', recoveryTime: '', date: '' });
        const performanceResponse = await fetch(`http://localhost:3000/api/athlete/performance/${athleteId}`);
        const performanceData = await performanceResponse.json();
        const latest = performanceData.performanceData[0];
        if (latest) {
          setFormData(prev => ({ ...prev, pastInjuries: latest.pastInjuries.toString() }));
        }
      } else {
        setInjuryError(data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Error adding injury:', error);
      setInjuryError('Failed to connect to the server');
    }
  };

  return (
    <div className="min-h-screen w-full p-4 bg-black flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg text-white w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Performance Data</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {analysis && (
          <div className="mb-6 bg-gray-700 p-4 rounded">
            <p className="text-base"><strong>Risk Flag:</strong> {analysis.riskFlag}</p>
            <p className="text-base"><strong>Injury Risk:</strong> {analysis.injuryRisk} (Score: {analysis.injuryPredictionScore.toFixed(4)})</p>
            <p className="text-base"><strong>Trend Analysis:</strong> {analysis.trendAnalysis}</p>
            <p className="text-base"><strong>Fatigue Index:</strong> {analysis.fatigueIndex}</p>
            <p className="text-base"><strong>Recovery Recommendation:</strong> {analysis.recoveryRecommendation}</p>
          </div>
        )}

        {/* Performance Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Athlete:</label>
            <select
              name="athleteId"
              value={formData.athleteId}
              onChange={handleChange}
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-900">Choose an athlete</option>
              {athletes.map((athlete) => (
                <option key={athlete._id} value={athlete._id} className="bg-gray-900">
                  {athlete.name} ({athlete.sport})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hours Trained:</label>
            <input
              type="number"
              name="hoursTrained"
              value={formData.hoursTrained}
              onChange={handleChange}
              min="0"
              max="168"
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sessions Per Week:</label>
            <input
              type="number"
              name="sessionsPerWeek"
              value={formData.sessionsPerWeek}
              onChange={handleChange}
              min="0"
              max="14"
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rest Days:</label>
            <input
              type="number"
              name="restDays"
              value={formData.restDays}
              onChange={handleChange}
              min="0"
              max="7"
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log New Performance
            </button>
            {isRecent && latestPerformanceId && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Update Latest Performance
              </button>
            )}
          </div>
        </form>

        {/* Injury Form */}
        <h3 className="text-xl font-semibold mt-6 mb-4">Add New Injury</h3>
        {injuryError && <p className="text-red-400 text-sm mb-4">{injuryError}</p>}
        <form onSubmit={handleInjurySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Injury:</label>
            <input
              type="text"
              name="injury"
              value={injuryData.injury}
              onChange={handleInjuryChange}
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Severity (1-10):</label>
            <input
              type="number"
              name="severity"
              value={injuryData.severity}
              onChange={handleInjuryChange}
              min="1"
              max="10"
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recovery Time (days):</label>
            <input
              type="number"
              name="recoveryTime"
              value={injuryData.recoveryTime}
              onChange={handleInjuryChange}
              min="0"
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date:</label>
            <input
              type="date"
              name="date"
              value={injuryData.date}
              onChange={handleInjuryChange}
              required
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Injury
          </button>
        </form>
      </div>
    </div>
  );
};

export default PerformanceUpdateForm;