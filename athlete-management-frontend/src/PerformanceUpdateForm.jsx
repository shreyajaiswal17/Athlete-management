// athlete-management-frontend/src/PerformanceUpdateForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PerformanceUpdateForm = () => {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    athleteId: athleteId || '',
    hoursTrained: '',
    sessionsPerWeek: '',
    pastInjuries: '',
    restDays: ''
  });
  const [athletes, setAthletes] = useState([]);
  const [riskFlag, setRiskFlag] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);

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
        const latest = performanceData.performanceData[0]; // Most recent record
        if (latest) {
          setFormData({
            athleteId,
            hoursTrained: latest.hoursTrained.toString(),
            sessionsPerWeek: latest.sessionsPerWeek.toString(),
            pastInjuries: latest.pastInjuries.toString(),
            restDays: latest.restDays.toString()
          });
          setRiskFlag(latest.riskFlag);
          setIsUpdate(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/athlete/log-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Performance ${isUpdate ? 'updated' : 'logged'} successfully!`);
        setRiskFlag(data.riskFlag);
        if (!isUpdate) {
          setFormData({ athleteId: athleteId || '', hoursTrained: '', sessionsPerWeek: '', pastInjuries: '', restDays: '' });
        }
        navigate(`/athlete/${athleteId}`); // Redirect back to detail page
      } else {
        alert(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div>
      <h2>{isUpdate ? 'Update Performance' : 'Log New Performance'}</h2>
      {riskFlag && <p>Current Risk Flag: {riskFlag}</p>}
      <form onSubmit={handleSubmit}>
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
        <label>Past Injuries: <input type="number" name="pastInjuries" value={formData.pastInjuries} onChange={handleChange} min="0" required /></label><br />
        <label>Rest Days: <input type="number" name="restDays" value={formData.restDays} onChange={handleChange} min="0" max="7" required /></label><br />
        <button type="submit">{isUpdate ? 'Update' : 'Submit'}</button>
      </form>
    </div>
  );
};

export default PerformanceUpdateForm;