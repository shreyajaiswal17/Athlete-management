// athlete-management-frontend/src/CreateAthlete.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function CreateAthlete() {
  const navigate = useNavigate();
  const { user } = useAuth0();
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
  const [riskFlag, setRiskFlag] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
        // Optionally reset form or navigate based on your preference
        setFormData({
          name: '', sport: '', goal: '', age: '', gender: '', location: '',
          hoursTrained: '', sessionsPerWeek: '', pastInjuries: '', restDays: ''
        });
        navigate('/dashboard'); // Navigate back to dashboard after success
      } else {
        alert(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="create-athlete-container">
      <div className="header">
        <h1>Create New Athlete</h1>
        <span>User: {user.name}</span>
      </div>

      {riskFlag && <p className="risk-flag">Initial Risk Flag: {riskFlag}</p>}

      <form onSubmit={handleSubmit} className="athlete-form">
        {/* Identity Fields */}
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sport">Sport:</label>
          <select
            id="sport"
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            required
          >
            <option value="">Select Sport</option>
            <option value="Cricket">Cricket</option>
            <option value="Kabaddi">Kabaddi</option>
            <option value="Football">Football</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="goal">Goal:</label>
          <input
            type="text"
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            placeholder="e.g., Improve speed"
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="10"
            max="100"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender:</label>
          <input
            type="text"
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        {/* Performance Fields */}
        <div className="form-group">
          <label htmlFor="hoursTrained">Hours Trained This Week:</label>
          <input
            type="number"
            id="hoursTrained"
            name="hoursTrained"
            value={formData.hoursTrained}
            onChange={handleChange}
            min="0"
            max="168"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sessionsPerWeek">Sessions This Week:</label>
          <input
            type="number"
            id="sessionsPerWeek"
            name="sessionsPerWeek"
            value={formData.sessionsPerWeek}
            onChange={handleChange}
            min="0"
            max="14"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pastInjuries">Past Injuries:</label>
          <input
            type="number"
            id="pastInjuries"
            name="pastInjuries"
            value={formData.pastInjuries}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="restDays">Rest Days This Week:</label>
          <input
            type="number"
            id="restDays"
            name="restDays"
            value={formData.restDays}
            onChange={handleChange}
            min="0"
            max="7"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Create Athlete
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAthlete;