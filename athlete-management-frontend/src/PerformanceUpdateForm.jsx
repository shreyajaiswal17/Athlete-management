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
        setInjuryData({ injury: '', severity: '', recoveryTime: '', date: '' }); // Reset form
        // Optionally fetch updated performance data to reflect new injury count in analysis
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
    <div>
      <h2>Performance Data</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {analysis && (
        <div>
          <p><strong>Risk Flag:</strong> {analysis.riskFlag}</p>
          <p><strong>Injury Risk:</strong> {analysis.injuryRisk} (Score: {analysis.injuryPredictionScore.toFixed(4)})</p>
          <p><strong>Trend Analysis:</strong> {analysis.trendAnalysis}</p>
          <p><strong>Fatigue Index:</strong> {analysis.fatigueIndex}</p>
          <p><strong>Recovery Recommendation:</strong> {analysis.recoveryRecommendation}</p>
        </div>
      )}

      {/* Performance Form */}
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <label>
          Select Athlete:
          <select name="athleteId" value={formData.athleteId} onChange={handleChange} required>
            <option value="">Choose an athlete</option>
            {athletes.map((athlete) => (
              <option key={athlete._id} value={athlete._id}>
                {athlete.name} ({athlete.sport})
              </option>
            ))}
          </select>
        </label><br />
        <label>Hours Trained: <input type="number" name="hoursTrained" value={formData.hoursTrained} onChange={handleChange} min="0" max="168" required /></label><br />
        <label>Sessions Per Week: <input type="number" name="sessionsPerWeek" value={formData.sessionsPerWeek} onChange={handleChange} min="0" max="14" required /></label><br />
        <label>Rest Days: <input type="number" name="restDays" value={formData.restDays} onChange={handleChange} min="0" max="7" required /></label><br />
       
        <button type="submit">Log New Performance</button>
        {isRecent && latestPerformanceId && (
          <button type="button" onClick={(e) => handleSubmit(e, true)}>Update Latest Performance</button>
        )}
      </form>

      {/* Injury Form */}
      <h3>Add New Injury</h3>
      {injuryError && <p style={{ color: 'red' }}>{injuryError}</p>}
      <form onSubmit={handleInjurySubmit}>
        <label>Injury: <input type="text" name="injury" value={injuryData.injury} onChange={handleInjuryChange} required /></label><br />
        <label>Severity (1-10): <input type="number" name="severity" value={injuryData.severity} onChange={handleInjuryChange} min="1" max="10" required /></label><br />
        <label>Recovery Time (days): <input type="number" name="recoveryTime" value={injuryData.recoveryTime} onChange={handleInjuryChange} min="0" required /></label><br />
        <label>Date: <input type="date" name="date" value={injuryData.date} onChange={handleInjuryChange} required /></label><br />
        <button type="submit">Add Injury</button>
      </form>
    </div>
  );
};

export default PerformanceUpdateForm;