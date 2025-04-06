import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PerformanceUpdateForm() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hoursTrained: '',
    sessionsPerWeek: '',
    restDays: ''
  });
  const [response, setResponse] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, athleteId };
    const url = `${import.meta.env.VITE_API_URL}/api/athlete/performance/update/${athleteId}`;
    console.log('Submitting to:', url, 'Method: PUT', 'Data:', data);

    try {
      const res = await axios.put(url, data);
      console.log('Response:', res.status, res.data);
      setResponse(res.data);
      navigate(`/athlete/${athleteId}`); // Redirect to detail page after success
    } catch (error) {
      console.error('Error:', error.response?.status, error.response?.data);
      setResponse(error.response?.data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Update Performance</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium">Hours Trained</label>
          <input
            type="number"
            name="hoursTrained"
            value={formData.hoursTrained}
            onChange={handleChange}
            className="mt-1 p-2 w-full bg-gray-700 rounded text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Sessions Per Week</label>
          <input
            type="number"
            name="sessionsPerWeek"
            value={formData.sessionsPerWeek}
            onChange={handleChange}
            className="mt-1 p-2 w-full bg-gray-700 rounded text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Rest Days</label>
          <input
            type="number"
            name="restDays"
            value={formData.restDays}
            onChange={handleChange}
            className="mt-1 p-2 w-full bg-gray-700 rounded text-white"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Performance
        </button>
      </form>
      {response && (
        <div className="mt-4 p-2 bg-gray-700 rounded">
          <p>{response.message}</p>
        </div>
      )}
    </div>
  );
}

export default PerformanceUpdateForm;