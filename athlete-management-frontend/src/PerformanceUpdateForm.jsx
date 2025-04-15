import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PerformanceUpdateForm() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    hoursTrained: '',
    sessionsPerWeek: '',
    restDays: '',
    rpe: '',
  });

  const [response, setResponse] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, athleteId };
    const url = `${import.meta.env.VITE_API_URL}/api/athlete/performance/update/${athleteId}`;

    try {
      const res = await axios.put(url, data);
      setResponse(res.data);
      navigate(`/athlete/${athleteId}`);
    } catch (error) {
      setResponse(error.response?.data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03045e] via-[#023e8a] to-[#000000] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-gray-900 bg-opacity-90 p-10 rounded-2xl shadow-2xl border border-blue-800">
        <h1 className="text-4xl font-bold text-blue-300 mb-10 text-center">Update Performance</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-lg font-medium text-blue-200 mb-2">Hours Trained</label>
            <input
              type="number"
              name="hoursTrained"
              value={formData.hoursTrained}
              onChange={handleChange}
              className="w-full text-lg p-4 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-blue-200 mb-2">Sessions Per Week</label>
            <input
              type="number"
              name="sessionsPerWeek"
              value={formData.sessionsPerWeek}
              onChange={handleChange}
              className="w-full text-lg p-4 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-blue-200 mb-2">Rest Days</label>
            <input
              type="number"
              name="restDays"
              value={formData.restDays}
              onChange={handleChange}
              className="w-full text-lg p-4 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-blue-200 mb-2">Rate of Perceived Exertion (1-10)</label>
            <input
              type="number"
              name="rpe"
              value={formData.rpe}
              onChange={handleChange}
              min="1"
              max="10"
              className="w-full text-lg p-4 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition duration-200"
          >
            Update Performance
          </button>
        </form>

        {response && (
          <div className="mt-8 p-5 bg-gray-800 border border-blue-700 rounded-xl text-blue-200 text-center text-lg">
            <p>{response.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceUpdateForm;
