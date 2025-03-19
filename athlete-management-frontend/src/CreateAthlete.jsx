import React, { useState } from 'react';

const AthleteCreationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    goal: '',
    age: '',
    gender: '',
    location: '',
    hoursTrained: '',
    sessionsPerWeek: '',
    pastInjuries: '',
    restDays: ''
  });
  const [riskFlag, setRiskFlag] = useState(''); // Show initial riskFlag

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/athlete/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert('Athlete created successfully!');
        setRiskFlag(data.riskFlag); // Display initial riskFlag
        setFormData({
          name: '', sport: '', goal: '', age: '', gender: '', location: '',
          hoursTrained: '', sessionsPerWeek: '', pastInjuries: '', restDays: ''
        });
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
      <h2>Create New Athlete</h2>
      {riskFlag && <p>Initial Risk Flag: {riskFlag}</p>}
      <form onSubmit={handleSubmit}>
        {/* Identity Fields */}
        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <select name="sport" value={formData.sport} onChange={handleChange} required>
          <option value="">Select Sport</option>
          <option value="Cricket">Cricket</option>
          <option value="Kabaddi">Kabaddi</option>
          <option value="Football">Football</option>
        </select>
        <input type="text" name="goal" placeholder="Goal (e.g., Improve speed)" value={formData.goal} onChange={handleChange} />
        <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} min="10" max="100" required />
        <input type="text" name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} />

        {/* Initial Performance Fields */}
        <label>Hours Trained This Week: <input type="number" name="hoursTrained" value={formData.hoursTrained} onChange={handleChange} min="0" max="168" required /></label><br />
        <label>Sessions This Week: <input type="number" name="sessionsPerWeek" value={formData.sessionsPerWeek} onChange={handleChange} min="0" max="14" required /></label><br />
        <label>Past Injuries: <input type="number" name="pastInjuries" value={formData.pastInjuries} onChange={handleChange} min="0" required /></label><br />
        <label>Rest Days This Week: <input type="number" name="restDays" value={formData.restDays} onChange={handleChange} min="0" max="7" required /></label><br />

        <button type="submit">Create Athlete</button>
      </form>
    </div>
  );
};

export default AthleteCreationForm;