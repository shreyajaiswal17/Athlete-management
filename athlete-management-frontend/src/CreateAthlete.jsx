import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function CreateAthlete() {
  const navigate = useNavigate();
  const { user } = useAuth0();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    athleteId: "",
    name: "",
    sport: "",
    age: "",
    gender: "",
    location: "",
    careerGoals: [],
    currentIncome: "",
    savings: "",
    injuryHistory: [],
    competitionHistory: [],
    education: "",
  });

  const [injuryEntry, setInjuryEntry] = useState({ injury: "", severity: "", recoveryTime: "", date: "" });
  const [competitionEntry, setCompetitionEntry] = useState({ event: "", result: "", date: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCareerGoalsChange = (e) => {
    const goals = e.target.value.split(",").map((goal) => goal.trim()).filter((goal) => goal);
    setFormData({ ...formData, careerGoals: goals });
  };

  const handleInjuryChange = (e) => {
    const { name, value } = e.target;
    setInjuryEntry({ ...injuryEntry, [name]: value });
  };

  const handleCompetitionChange = (e) => {
    const { name, value } = e.target;
    setCompetitionEntry({ ...competitionEntry, [name]: value });
  };

  const addInjury = () => {
    if (injuryEntry.injury) {
      setFormData({
        ...formData,
        injuryHistory: [
          ...formData.injuryHistory,
          {
            injury: injuryEntry.injury,
            severity: parseInt(injuryEntry.severity) || 0,
            recoveryTime: parseInt(injuryEntry.recoveryTime) || 0,
            date: injuryEntry.date || new Date().toISOString().split("T")[0],
          },
        ],
      });
      setInjuryEntry({ injury: "", severity: "", recoveryTime: "", date: "" });
    }
  };

  const addCompetition = () => {
    if (competitionEntry.event) {
      setFormData({
        ...formData,
        competitionHistory: [
          ...formData.competitionHistory,
          {
            event: competitionEntry.event,
            result: competitionEntry.result || "N/A",
            date: competitionEntry.date || new Date().toISOString().split("T")[0],
          },
        ],
      });
      setCompetitionEntry({ event: "", result: "", date: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/athlete/create-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Athlete created successfully!");
        navigate("/dashboard", { state: { refresh: true } });
      } else {
        alert(data.message || "An error occurred");
      }
    } catch (error) {
      alert("An error occurred while creating the athlete");
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const progress = (step / 4) * 100; // 4 steps total

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">🏆 Create Athlete Profile</h1>
        <p className="text-gray-400 text-lg">User: {user.name}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-3xl mb-6">
        <div className="bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-gray-400 mt-2">Step {step} of 4</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-gray-900 p-8 rounded-lg shadow-lg">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg text-gray-300">Athlete ID *</label>
                <input
                  type="text"
                  name="athleteId"
                  value={formData.athleteId}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  required
                  placeholder="e.g., ATH123"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-300">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  required
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-lg text-gray-300">Sport *</label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                required
              >
                <option value="">Select Sport</option>
                <option value="Cricket">Cricket 🏏</option>
                <option value="Kabaddi">Kabaddi 🤼</option>
                <option value="Football">Football ⚽</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                Next ➡️
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg text-gray-300">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  min="1"
                  max="100"
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-300">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male ♂️</option>
                  <option value="Female">Female ♀️</option>
                  <option value="Other">Other ⚧️</option>
                </select>
              </div>
              <div>
                <label className="block text-lg text-gray-300">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="e.g., New York"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-lg text-gray-300">Career Goals (comma-separated)</label>
              <input
                type="text"
                name="careerGoals"
                value={formData.careerGoals.join(", ")}
                onChange={handleCareerGoalsChange}
                className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                placeholder="e.g., Olympic gold, Become a coach"
              />
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                ⬅️ Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                Next ➡️
              </button>
            </div>
          </div>
        )}

        {/* Step 3: History & Education */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">History & Education</h2>

            {/* Injury History */}
            <div className="mb-6">
              <label className="block text-lg text-gray-300 mb-2">Injury History</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  name="injury"
                  value={injuryEntry.injury}
                  onChange={handleInjuryChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="Injury (e.g., Sprained Ankle)"
                />
                <input
                  type="number"
                  name="severity"
                  value={injuryEntry.severity}
                  onChange={handleInjuryChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="Severity (1-10)"
                  min="1"
                  max="10"
                />
                <input
                  type="number"
                  name="recoveryTime"
                  value={injuryEntry.recoveryTime}
                  onChange={handleInjuryChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="Recovery (days)"
                  min="0"
                />
                <input
                  type="date"
                  name="date"
                  value={injuryEntry.date}
                  onChange={handleInjuryChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={addInjury}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-105"
              >
                + Add Injury
              </button>
              <ul className="mt-2 text-gray-400">
                {formData.injuryHistory.map((entry, index) => (
                  <li key={index}>
                    {entry.injury} (Severity: {entry.severity}, Recovery: {entry.recoveryTime} days, Date: {entry.date})
                  </li>
                ))}
              </ul>
            </div>

            {/* Competition History */}
            <div className="mb-6">
              <label className="block text-lg text-gray-300 mb-2">Competition History</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="event"
                  value={competitionEntry.event}
                  onChange={handleCompetitionChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="Event (e.g., National Championship)"
                />
                <input
                  type="text"
                  name="result"
                  value={competitionEntry.result}
                  onChange={handleCompetitionChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  placeholder="Result (e.g., 1st Place)"
                />
                <input
                  type="date"
                  name="date"
                  value={competitionEntry.date}
                  onChange={handleCompetitionChange}
                  className="p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={addCompetition}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-transform transform hover:scale-105"
              >
                + Add Competition
              </button>
              <ul className="mt-2 text-gray-400">
                {formData.competitionHistory.map((entry, index) => (
                  <li key={index}>
                    {entry.event} - {entry.result} (Date: {entry.date})
                  </li>
                ))}
              </ul>
            </div>

            {/* Education */}
            <div className="mb-6">
              <label className="block text-lg text-gray-300">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                placeholder="e.g., B.Sc. in Sports Science"
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                ⬅️ Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                Next ➡️
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Financial Info */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg text-gray-300">Current Income (USD/year)</label>
                <input
                  type="number"
                  name="currentIncome"
                  value={formData.currentIncome}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  min="0"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-300">Savings (USD)</label>
                <input
                  type="number"
                  name="savings"
                  value={formData.savings}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 text-white rounded focus:ring focus:ring-indigo-500 transition-all"
                  min="0"
                  placeholder="e.g., 10000"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                ⬅️ Back
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
              >
                🚀 Create Athlete
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Cancel Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
      >
        ❌ Cancel
      </button>
    </div>
  );
}

export default CreateAthlete;