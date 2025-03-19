import React, { useState, useEffect } from 'react';

const WeeklyPerformanceForm = () => {
  const [formData, setFormData] = useState({
    athleteId: '',
    hoursTrained: '',
    sessionsPerWeek: '',
    pastInjuries: '',
    restDays: ''
  });
  const [athletes, setAthletes] = useState([]);
  const [riskFlag, setRiskFlag] = useState('');

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/athlete/athletes');
        const data = await response.json();
        setAthletes(data);
      } catch (error) {
        console.error('Error fetching athletes:', error);
      }
    };
    fetchAthletes();
  }, []);

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
        alert('Weekly performance logged successfully!');
        setRiskFlag(data.riskFlag); // Show updated riskFlag
        setFormData({ athleteId: '', hoursTrained: '', sessionsPerWeek: '', pastInjuries: '', restDays: '' });
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
      <h2>Weekly Performance Update</h2>
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
        <label>Hours Trained This Week: <input type="number" name="hoursTrained" value={formData.hoursTrained} onChange={handleChange} min="0" max="168" required /></label><br />
        <label>Sessions This Week: <input type="number" name="sessionsPerWeek" value={formData.sessionsPerWeek} onChange={handleChange} min="0" max="14" required /></label><br />
        <label>Past Injuries: <input type="number" name="pastInjuries" value={formData.pastInjuries} onChange={handleChange} min="0" required /></label><br />
        <label>Rest Days This Week: <input type="number" name="restDays" value={formData.restDays} onChange={handleChange} min="0" max="7" required /></label><br />
        <button type="submit">Update Performance</button>
      </form>
    </div>
  );
};

export default WeeklyPerformanceForm;