
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [athleteData, setAthleteData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', sport: '', athleteIds: [], coach: '' });
  const [addAthleteForm, setAddAthleteForm] = useState({ athleteId: '' });
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showAddAthleteForm, setShowAddAthleteForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // Add to state
  const { logout, user } = useAuth0();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      console.log('API URL:', import.meta.env.VITE_API_URL);

      // Fetch teams
      const teamsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/athlete/teams`);
      if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
      const teamsData = await teamsResponse.json();
      console.log('Teams Response:', teamsData);
      setTeams(teamsData);

      // Fetch data based on selectedTeamId
      if (selectedTeamId) {
        // Fetch team-specific performance
        const performanceResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/athlete/team-performance/${selectedTeamId}`
        );
        if (!performanceResponse.ok) throw new Error('Failed to fetch team performance');
        const performanceData = await performanceResponse.json();
        console.log('Performance:', performanceData);
        setTeamPerformance(performanceData);

        // Populate athleteData with team athleteStatuses
        const athleteStatusData = performanceData.athleteStatuses?.map(status => ({
          athleteId: status.athleteId,
          name: status.name,
          sport: status.sport,
          status: status.status,
        })) || [];
        setAthleteData(athleteStatusData);
      } else {
        // Fetch all athletes when no team is selected
        const allAthletesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/athlete/athletes`);
        if (!allAthletesResponse.ok) throw new Error('Failed to fetch all athletes');
        const allAthletesData = await allAthletesResponse.json();
        console.log('All Athletes:', allAthletesData);
        // Normalize to use athleteId instead of _id
        const normalizedAthletes = allAthletesData.map(athlete => ({
          athleteId: athlete.athleteId, // Map _id to athleteId
          name: athlete.name,
          sport: athlete.sport,
          status: athlete.status,
        }));
        console.log('Normalized Athletes:', normalizedAthletes);
        setAthleteData(normalizedAthletes);
        setTeamPerformance(null); // Clear team performance when showing all athletes
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      // Dummy fallback
      setAthleteData([
        { athleteId: '1', name: 'Aditya Singh', sport: 'Sprint', status: 'PEAKING' },
        { athleteId: '2', name: 'Rahul Patel', sport: 'Middle Distance', status: 'MODERATE' },
      ]);
      setTeams([
        {
          _id: '1',
          name: 'Sprint Team',
          sport: 'Sprint',
          athletes: [{ _id: '1' }, { _id: '2' }],
        },
      ]);
      setSelectedTeamId('1');
      setTeamPerformance({
        teamName: 'Sprint Team',
        sport: 'Sprint',
        metrics: {
          totalAthletes: 2,
          averageTrainingLoad: 75,
          averageRecoveryScore: 80,
          teamFatigueIndex: 30,
        },
        historicalMetrics: [
          { date: '2025-04-01', averageTrainingLoad: 70, averageRecoveryScore: 78, teamFatigueIndex: 28 },
          { date: '2025-04-05', averageTrainingLoad: 72, averageRecoveryScore: 79, teamFatigueIndex: 29 },
          { date: '2025-04-10', averageTrainingLoad: 75, averageRecoveryScore: 80, teamFatigueIndex: 30 },
        ],
      });
    }
  };

  // Create Team Handler
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/athlete/create-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setTeams([...teams, result.team]);
      setTeamForm({ name: '', sport: '', athleteIds: [], coach: '' });
      setShowCreateTeamForm(false);
      alert('Team created successfully');
      fetchData(); // Refresh data to include new team
    } catch (error) {
      console.error('Error creating team:', error);
      alert(`Failed to create team: ${error.message}`);
    }
  };

  // Add Athlete to Team Handler
  const handleAddAthlete = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) return alert('Please select a team');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/athlete/team/${selectedTeamId}/add-athlete`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addAthleteForm),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setTeams(teams.map((t) => (t._id === selectedTeamId ? result.team : t)));
      setAddAthleteForm({ athleteId: '' });
      setShowAddAthleteForm(false);
      alert('Athlete added successfully');
      fetchData(); // Refresh data to update athlete statuses
    } catch (error) {
      console.error('Error adding athlete:', error);
      alert(`Failed to add athlete: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTeamId]);

  const handleTeamChange = (e) => {
    setSelectedTeamId(e.target.value);
  };

  // Determine athletes to display
  const selectedTeam = teams.find((team) => team._id === selectedTeamId);
  console.log('Selected Team:', selectedTeam);
  const selectedTeamAthletes = selectedTeam && teamPerformance?.athleteStatuses
    ? teamPerformance.athleteStatuses.filter((athlete) =>
        selectedTeam.athletes.some((teamAthlete) => teamAthlete._id === athlete.athleteId)
      ).map((athlete) => ({
        athleteId: athlete.athleteId,
        name: athlete.name,
        sport: athlete.sport,
        status: athlete.status,
      }))
    : athleteData; // Use all athletes if no team is selected
  console.log('selectedTeamAthletes', selectedTeamAthletes);

  const teamPerformanceChartData = teamPerformance?.historicalMetrics
    ? {
        labels: teamPerformance.historicalMetrics.map((m) => m.date),
        datasets: [
          {
            label: 'Training Load',
            data: teamPerformance.historicalMetrics.map((m) => m.averageTrainingLoad),
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Recovery Score',
            data: teamPerformance.historicalMetrics.map((m) => m.averageRecoveryScore),
            borderColor: 'rgba(153,102,255,1)',
            backgroundColor: 'rgba(153,102,255,0.2)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Fatigue Index',
            data: teamPerformance.historicalMetrics.map((m) => m.teamFatigueIndex),
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const teamPerformanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#E5E7EB' },
      },
      title: {
        display: true,
        text: 'Team Metrics Trend',
        color: '#E5E7EB',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Value', color: '#E5E7EB' },
        ticks: { color: '#E5E7EB' },
      },
      x: {
        title: { display: true, text: 'Date', color: '#E5E7EB' },
        ticks: { color: '#E5E7EB' },
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Navigate to AthleteDetail
  const handleAthleteClick = (athleteId) => {
    if (!athleteId) {
      console.error('Athlete ID is undefined');
      alert('Cannot navigate: Athlete ID is missing');
      return;
    }
    console.log('Athlete ID:', athleteId);
    navigate(`/athlete/${athleteId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white font-sans">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-md sticky top-0 z-20 p-4 flex justify-between items-center shadow-lg border-b border-blue-900">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-blue-300">{user?.name}</span>
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto">
        <div className="text-right text-blue-300 mb-6">April 18, 2025</div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex gap-4"
        >
          <button
            onClick={() => setShowCreateTeamForm(!showCreateTeamForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
          >
            {showCreateTeamForm ? 'Hide Create Team' : 'Create Team'}
          </button>
          <button
            onClick={() => setShowAddAthleteForm(!showAddAthleteForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
          >
            {showAddAthleteForm ? 'Hide Add Athlete' : 'Add Athlete to Team'}
          </button>
        </motion.div>

        {/* Create Team Form */}
        {showCreateTeamForm && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
              <h3 className="text-xl font-semibold text-white mb-4">Create New Team</h3>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-blue-200">Team Name</label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-blue-200">Sport</label>
                  <input
                    type="text"
                    value={teamForm.sport}
                    onChange={(e) => setTeamForm({ ...teamForm, sport: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-blue-200">Athlete IDs (comma-separated)</label>
                  <input
                    type="text"
                    value={teamForm.athleteIds.join(',')}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, athleteIds: e.target.value.split(',').map((id) => id.trim()) })
                    }
                    className="w-full p-2 rounded-lg bg-gray-800/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="e.g., id1,id2,id3"
                  />
                </div>
                <div>
                  <label className="block text-blue-200">Coach</label>
                  <input
                    type="text"
                    value={teamForm.coach}
                    onChange={(e) => setTeamForm({ ...teamForm, coach: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const athleteId = prompt('Enter Athlete ID to add:');
                    if (athleteId) {
                      setTeamForm((prev) => ({
                        ...prev,
                        athleteIds: [...prev.athleteIds, athleteId.trim()],
                      }));
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold transition-colors"
                >
                  Add Athlete to Team
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
                >
                  Create Team
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Add Athlete to Team Form */}
        {showAddAthleteForm && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
              <h3 className="text-xl font-semibold text-white mb-4">Add Athlete to Team</h3>
              <form onSubmit={handleAddAthlete} className="space-y-4">
                <div>
                  <label className="block text-blue-200">Athlete ID</label>
                  <input
                    type="text"
                    value={addAthleteForm.athleteId}
                    onChange={(e) => setAddAthleteForm({ ...addAthleteForm, athleteId: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
                >
                  Add Athlete
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAthleteForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Team Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <label className="font-semibold text-blue-200 mr-2">Select Team:</label>
          <select
            value={selectedTeamId}
            onChange={handleTeamChange}
            className="p-2 rounded-lg bg-gray-900/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="" className="bg-gray-900">
              All Teams
            </option>
            {teams.map((team) => (
              <option key={team._id} value={team._id} className="bg-gray-900">
                {team.name} ({team.sport})
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate('/create-athlete')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold mx-10 px-5 py-2 rounded-2xl shadow transition duration-200"
          >
            + Create New Athlete
          </button>
        </motion.div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Athlete Status */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
  <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
    <h3 className="text-xl font-semibold text-white mb-4">Athlete Status</h3>
    {/* Summary Metrics */}
    <div className="mb-4 p-4 bg-gray-800/30 rounded-lg">
      <h4 className="text-lg font-semibold text-white">All Athletes Summary</h4>
      <div className="grid grid-cols-2 gap-2 text-blue-200">
        <p><strong>Total Athletes:</strong> {selectedTeamAthletes.length}</p>
        <p><strong>Peaking:</strong> {selectedTeamAthletes.filter(a => a.status === 'PEAKING').length}</p>
        <p><strong>Active:</strong> {selectedTeamAthletes.filter(a => a.status === 'ACTIVE').length}</p>
        <p><strong>Injured:</strong> {selectedTeamAthletes.filter(a => a.status === 'INJURED').length}</p>
      </div>
    </div>
    {/* Status Filter */}
    <div className="mb-4">
      <label className="font-semibold text-blue-200 mr-2">Filter by Status:</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="p-2 rounded-lg bg-gray-900/50 text-white border border-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">All Statuses</option>
        <option value="PEAKING">Peaking</option>
        <option value="ACTIVE">Active</option>
        <option value="INJURED">Injured</option>
        <option value="MODERATE">Moderate</option>
        <option value="OVERTRAINING">Overtraining</option>
        <option value="RESTING">Resting</option>
      </select>
    </div>
    {/* Athlete List */}
   
    <div className="space-y-3">
      {selectedTeamAthletes
        .filter((athlete) => !statusFilter || athlete.status === statusFilter)
        .length > 0 ? (
        selectedTeamAthletes
          .filter((athlete) => !statusFilter || athlete.status === statusFilter)
          .map((athlete) => (
            
            <motion.div
              key={athlete.athleteId}
              className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleAthleteClick(athlete.athleteId)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full ${
                    athlete.status === 'PEAKING'
                      ? 'bg-blue-500'
                      : athlete.status === 'INJURED'
                      ? 'bg-red-500'
                      : athlete.status === 'ACTIVE'
                      ? 'bg-green-500'
                      : athlete.status === 'OVERTRAINING'
                      ? 'bg-orange-500'
                      : athlete.status === 'RESTING'
                      ? 'bg-purple-500'
                      : athlete.status === 'MODERATE'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`
                }
                ></div>
                <div>
                  <p className="font-semibold text-white">{athlete.name || 'Unknown'}</p>
                  <p className="text-sm text-blue-300">{athlete.sport || 'Unknown'}</p>
                </div>
              </div>
              <p
                className={`font-semibold ${
                  athlete.status === 'PEAKING' || athlete.status === 'ACTIVE'
                    ? 'text-blue-300'
                    : athlete.status === 'INJURED'
                    ? 'text-red-400'
                    : athlete.status === 'MODERATE'
                    ? 'text-green-400'
                    : athlete.status === 'OVERTRAINING'
                    ? 'text-orange-400'
                    : athlete.status === 'RESTING'
                    ? 'text-purple-400'
                    : 'text-gray-400'
                }`}
              >
                Status: {athlete.status || 'Unknown'}
              </p>
            </motion.div>
          ))
      ) : (
        <p className="text-blue-300">No athletes match the selected status</p>
      )}
    </div>
  </div>
</motion.div>

          {/* Team Performance */}
          {selectedTeamId && teamPerformance && (
            <motion.div variants={cardVariants} initial="hidden" animate="visible">
              <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
                <h3 className="text-xl font-semibold text-white mb-4">Team Performance</h3>
                <div className="space-y-2 text-blue-200">
                  <p>
                    <strong>Team:</strong> {teamPerformance.teamName}
                  </p>
                  <p>
                    <strong>Sport:</strong> {teamPerformance.sport}
                  </p>
                  <p>
                    <strong>Athletes:</strong> {teamPerformance.metrics.totalAthletes}
                  </p>
                  <p>
                    <strong>Training Load:</strong> {teamPerformance.metrics.averageTrainingLoad}
                  </p>
                  <p>
                    <strong>Recovery:</strong> {teamPerformance.metrics.averageRecoveryScore}
                  </p>
                  <p>
                    <strong>Fatigue:</strong> {teamPerformance.metrics.teamFatigueIndex}
                  </p>
                </div>
                {teamPerformanceChartData && (
                  <div className="h-64 mt-4">
                    <Line data={teamPerformanceChartData} options={teamPerformanceChartOptions} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate('/performanceupdate/:athleteId')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-3xl shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            🚀 Update Athlete Performance!
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/90 text-blue-300 mt-18 text-center p-4 border-t border-blue-900">
        <p>© 2025 AthletixHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
