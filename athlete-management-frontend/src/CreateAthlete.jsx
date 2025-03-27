import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function CreateAthlete() {
  const navigate = useNavigate();
  const { user } = useAuth0();

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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCareerGoalsChange = (e) => {
    const goals = e.target.value.split(",").map((goal) => goal.trim()).filter((goal) => goal);
    setFormData({ ...formData, careerGoals: goals });
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
        navigate("/dashboard");
      } else {
        alert(data.message || "An error occurred");
      }
    } catch (error) {
      alert("An error occurred while creating the athlete");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">🏆 Create Athlete Profile</h1>
        <p className="text-gray-400 text-lg">User: {user.name}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-gray-900 p-8 rounded-lg shadow-lg mt-6">
        {/* Athlete ID & Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg text-gray-300">Athlete ID *</label>
            <input
              type="text"
              name="athleteId"
              value={formData.athleteId}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-lg text-gray-300">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Sport */}
        <div className="mt-6">
          <label className="block text-lg text-gray-300">Sport *</label>
          <select
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
            required
          >
            <option value="">Select Sport</option>
            <option value="Cricket">Cricket</option>
            <option value="Kabaddi">Kabaddi</option>
            <option value="Football">Football</option>
          </select>
        </div>

        {/* Age, Gender, Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <label className="block text-lg text-gray-300">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-lg text-gray-300">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-lg text-gray-300">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Career Goals */}
        <div className="mt-6">
          <label className="block text-lg text-gray-300">Career Goals (comma-separated)</label>
          <input
            type="text"
            name="careerGoals"
            value={formData.careerGoals.join(", ")}
            onChange={handleCareerGoalsChange}
            className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
            placeholder="e.g., Olympic gold, Become a coach"
          />
        </div>

        {/* Financial Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-lg text-gray-300">Current Income (USD/year)</label>
            <input
              type="number"
              name="currentIncome"
              value={formData.currentIncome}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-lg text-gray-300">Savings (USD)</label>
            <input
              type="number"
              name="savings"
              value={formData.savings}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 text-white text-lg rounded focus:ring focus:ring-indigo-500"
              min="0"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-between">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-lg font-semibold rounded-lg transition duration-300"
          >
            🚀 Create Athlete
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 text-lg font-semibold rounded-lg transition duration-300"
          >
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAthlete;
