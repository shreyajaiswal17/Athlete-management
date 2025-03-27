import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function CreateAthlete() {
  const navigate = useNavigate();
  const { user } = useAuth0();

  const [formData, setFormData] = useState({
    athleteId: '',
    name: '',
    sport: '',
    goal: '',
    age: '',
    gender: '',
    location: '',
    injuryHistory: [],
    competitionHistory: [],
    hoursTrained: '',
    sessionsPerWeek: '',
    restDays: '',
    education: '', // New field
    careerGoals: [], // New field (array)
    currentIncome: '', // New financial field
    savings: '', // New financial field
    sponsorships: [], // New financial field (array)
  });

  const [injury, setInjury] = useState({ injury: '', severity: '', recoveryTime: '', date: '' });
  const [competition, setCompetition] = useState({ event: '', result: '', date: '' });
  const [sponsorship, setSponsorship] = useState({ sponsor: '', amount: '', startDate: '', endDate: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInjuryChange = (e) => {
    const { name, value } = e.target;
    setInjury({
      ...injury,
      [name]: value,
    });
  };

  const handleCompetitionChange = (e) => {
    const { name, value } = e.target;
    setCompetition({
      ...competition,
      [name]: value,
    });
  };

  const handleSponsorshipChange = (e) => {
    const { name, value } = e.target;
    setSponsorship({
      ...sponsorship,
      [name]: value,
    });
  };

  const addInjury = () => {
    if (injury.injury && injury.severity && injury.recoveryTime) {
      setFormData({
        ...formData,
        injuryHistory: [
          ...formData.injuryHistory,
          { ...injury, severity: Number(injury.severity), recoveryTime: Number(injury.recoveryTime), date: injury.date || undefined },
        ],
      });
      setInjury({ injury: '', severity: '', recoveryTime: '', date: '' });
    } else {
      alert('Please fill out all required injury fields (injury, severity, recovery time)');
    }
  };

  const addCompetition = () => {
    if (competition.event && competition.result) {
      setFormData({
        ...formData,
        competitionHistory: [...formData.competitionHistory, { ...competition, date: competition.date || undefined }],
      });
      setCompetition({ event: '', result: '', date: '' });
    } else {
      alert('Please fill out all required competition fields (event, result)');
    }
  };

  const addSponsorship = () => {
    if (sponsorship.sponsor && sponsorship.amount) {
      setFormData({
        ...formData,
        sponsorships: [
          ...formData.sponsorships,
          { 
            ...sponsorship, 
            amount: Number(sponsorship.amount), 
            startDate: sponsorship.startDate || undefined, 
            endDate: sponsorship.endDate || undefined 
          },
        ],
      });
      setSponsorship({ sponsor: '', amount: '', startDate: '', endDate: '' });
    } else {
      alert('Please fill out all required sponsorship fields (sponsor, amount)');
    }
  };

  const handleCareerGoalsChange = (e) => {
    const goals = e.target.value.split(',').map(goal => goal.trim()).filter(goal => goal);
    setFormData({
      ...formData,
      careerGoals: goals,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate age
    const parsedAge = formData.age ? parseFloat(formData.age) : undefined;
    if (parsedAge !== undefined) {
      if (isNaN(parsedAge) || parsedAge < 0) {
        alert('Age must be a positive number');
        return;
      }
    }

    // Validate performance fields
    const parsedHours = formData.hoursTrained ? parseFloat(formData.hoursTrained) : 0;
    const parsedSessions = formData.sessionsPerWeek ? parseFloat(formData.sessionsPerWeek) : 0;
    const parsedRestDays = formData.restDays ? parseFloat(formData.restDays) : 0;
    if (parsedHours < 0 || parsedSessions < 0 || parsedRestDays < 0) {
      alert('Performance fields (hours trained, sessions per week, rest days) must be positive numbers');
      return;
    }

    // Validate financial fields
    const parsedIncome = formData.currentIncome ? parseFloat(formData.currentIncome) : 0;
    const parsedSavings = formData.savings ? parseFloat(formData.savings) : 0;
    if (parsedIncome < 0 || parsedSavings < 0) {
      alert('Financial fields (income, savings) must be positive numbers');
      return;
    }

    const submitData = {
      ...formData,
      age: parsedAge,
      hoursTrained: parsedHours,
      sessionsPerWeek: parsedSessions,
      restDays: parsedRestDays,
      currentIncome: parsedIncome,
      savings: parsedSavings,
      careerGoals: formData.careerGoals.length > 0 ? formData.careerGoals : undefined, // Send undefined if empty
    };

    try {
      const response = await fetch('http://localhost:3000/api/athlete/create-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Athlete created successfully!');
        setFormData({
          athleteId: '',
          name: '',
          sport: '',
          goal: '',
          age: '',
          gender: '',
          location: '',
          injuryHistory: [],
          competitionHistory: [],
          hoursTrained: '',
          sessionsPerWeek: '',
          restDays: '',
          education: '',
          careerGoals: [],
          currentIncome: '',
          savings: '',
          sponsorships: [],
        });
        navigate('/dashboard');
      } else {
        alert(data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while creating the athlete');
    }
  };

  return (
    <div className="create-athlete-container">
      <div className="header">
        <h1>Create New Athlete</h1>
        <span>User: {user.name}</span>
      </div>

      <form onSubmit={handleSubmit} className="athlete-form">
        {/* Required Fields */}
        <div className="form-group">
          <label htmlFor="athleteId">Athlete ID *</label>
          <input
            type="text"
            id="athleteId"
            name="athleteId"
            value={formData.athleteId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
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
          <label htmlFor="sport">Sport *</label>
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

        {/* Optional Fields */}
        <div className="form-group">
          <label htmlFor="goal">Goal</label>
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
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="1"
            max="100"
          />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        {/* New Performance Fields */}
        <div className="form-group">
          <label htmlFor="hoursTrained">Hours Trained (Initial)</label>
          <input
            type="number"
            id="hoursTrained"
            name="hoursTrained"
            value={formData.hoursTrained}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 20"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sessionsPerWeek">Sessions Per Week (Initial)</label>
          <input
            type="number"
            id="sessionsPerWeek"
            name="sessionsPerWeek"
            value={formData.sessionsPerWeek}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 5"
          />
        </div>
        <div className="form-group">
          <label htmlFor="restDays">Rest Days (Initial)</label>
          <input
            type="number"
            id="restDays"
            name="restDays"
            value={formData.restDays}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 2"
          />
        </div>

        {/* New Education Field */}
        <div className="form-group">
          <label htmlFor="education">Education</label>
          <input
            type="text"
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            placeholder="e.g., BS in Kinesiology"
          />
        </div>

        {/* New Career Goals Field */}
        <div className="form-group">
          <label htmlFor="careerGoals">Career Goals (comma-separated)</label>
          <input
            type="text"
            id="careerGoals"
            name="careerGoals"
            value={formData.careerGoals.join(', ')}
            onChange={handleCareerGoalsChange}
            placeholder="e.g., Compete, Coach"
          />
        </div>

        {/* New Financial Fields */}
        <div className="form-group">
          <label htmlFor="currentIncome">Current Income (USD/year)</label>
          <input
            type="number"
            id="currentIncome"
            name="currentIncome"
            value={formData.currentIncome}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 50000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="savings">Savings (USD)</label>
          <input
            type="number"
            id="savings"
            name="savings"
            value={formData.savings}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 10000"
          />
        </div>

        {/* Sponsorships */}
        <div className="form-group">
          <label>Sponsorships</label>
          <div>
            <input
              type="text"
              name="sponsor"
              value={sponsorship.sponsor}
              onChange={handleSponsorshipChange}
              placeholder="Sponsor Name"
            />
            <input
              type="number"
              name="amount"
              value={sponsorship.amount}
              onChange={handleSponsorshipChange}
              placeholder="Amount (USD)"
              min="0"
            />
            <input
              type="date"
              name="startDate"
              value={sponsorship.startDate}
              onChange={handleSponsorshipChange}
            />
            <input
              type="date"
              name="endDate"
              value={sponsorship.endDate}
              onChange={handleSponsorshipChange}
            />
            <button type="button" onClick={addSponsorship}>Add Sponsorship</button>
          </div>
          <ul>
            {formData.sponsorships.map((sponsor, index) => (
              <li key={index}>
                {sponsor.sponsor} - ${sponsor.amount} (Start: {sponsor.startDate || 'N/A'}, End: {sponsor.endDate || 'N/A'})
              </li>
            ))}
          </ul>
        </div>

        {/* Injury History */}
        <div className="form-group">
          <label>Injury History</label>
          <div>
            <input
              type="text"
              name="injury"
              value={injury.injury}
              onChange={handleInjuryChange}
              placeholder="Injury"
            />
            <input
              type="number"
              name="severity"
              value={injury.severity}
              onChange={handleInjuryChange}
              placeholder="Severity (1-10)"
              min="1"
              max="10"
            />
            <input
              type="number"
              name="recoveryTime"
              value={injury.recoveryTime}
              onChange={handleInjuryChange}
              placeholder="Recovery Time (days)"
              min="1"
            />
            <input
              type="date"
              name="date"
              value={injury.date}
              onChange={handleInjuryChange}
            />
            <button type="button" onClick={addInjury}>Add Injury</button>
          </div>
          <ul>
            {formData.injuryHistory.map((inj, index) => (
              <li key={index}>
                {inj.injury} (Severity: {inj.severity}, Recovery: {inj.recoveryTime} days, Date: {inj.date || 'N/A'})
              </li>
            ))}
          </ul>
        </div>

        {/* Competition History */}
        <div className="form-group">
          <label>Competition History</label>
          <div>
            <input
              type="text"
              name="event"
              value={competition.event}
              onChange={handleCompetitionChange}
              placeholder="Event"
            />
            <input
              type="text"
              name="result"
              value={competition.result}
              onChange={handleCompetitionChange}
              placeholder="Result"
            />
            <input
              type="date"
              name="date"
              value={competition.date}
              onChange={handleCompetitionChange}
            />
            <button type="button" onClick={addCompetition}>Add Competition</button>
          </div>
          <ul>
            {formData.competitionHistory.map((comp, index) => (
              <li key={index}>
                {comp.event} - {comp.result} (Date: {comp.date || 'N/A'})
              </li>
            ))}
          </ul>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="submit-btn">Create Athlete</button>
          <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CreateAthlete;