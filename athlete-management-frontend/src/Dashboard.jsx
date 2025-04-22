
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
        
{/* Dashboard Cards with Dynamic Layout */}
<div className={`grid grid-cols-1 ${selectedTeamId && teamPerformance ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
  {/* Athlete Status - will take full width when no team selected */}
  <motion.div 
    variants={cardVariants} 
    initial="hidden" 
    animate="visible"
    className={selectedTeamId && teamPerformance ? '' : 'md:col-span-1'}
  >
    <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
      <h3 className="text-xl font-semibold text-white mb-4">Athlete Status</h3>
      
      {/* Enhanced Summary Metrics with Visual Indicators */}
      <div className="mb-6 p-5 bg-gray-800/50 rounded-lg border border-blue-800/20 shadow-inner">
        <h4 className="text-lg font-semibold text-white mb-3">Athletes Summary</h4>
        
        {/* Status Distribution Chart */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-48 h-48">
            {/* This is a simplified visual representation - in real app you might use a proper chart library */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-bold text-white">{selectedTeamAthletes.length}</div>
              <div className="text-xs text-blue-300">Athletes</div>
            </div>
            
            {/* Status Distribution Circle */}
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Calculate percentages for visual representation */}
              {(() => {
                const statuses = [
                  { name: 'PEAKING', color: 'rgb(59, 130, 246)', count: selectedTeamAthletes.filter(a => a.status === 'PEAKING').length },
                  { name: 'ACTIVE', color: 'rgb(34, 197, 94)', count: selectedTeamAthletes.filter(a => a.status === 'ACTIVE').length },
                  { name: 'INJURED', color: 'rgb(239, 68, 68)', count: selectedTeamAthletes.filter(a => a.status === 'INJURED').length },
                  { name: 'MODERATE', color: 'rgb(234, 179, 8)', count: selectedTeamAthletes.filter(a => a.status === 'MODERATE').length },
                  { name: 'OVERTRAINING', color: 'rgb(249, 115, 22)', count: selectedTeamAthletes.filter(a => a.status === 'OVERTRAINING').length },
                  { name: 'RESTING', color: 'rgb(168, 85, 247)', count: selectedTeamAthletes.filter(a => a.status === 'RESTING').length },
                ];
                
                const total = selectedTeamAthletes.length || 1; // Avoid division by zero
                let currentAngle = 0;
                
                return statuses.map((status, index) => {
                  if (status.count === 0) return null;
                  
                  const percentage = status.count / total;
                  const angle = percentage * 360;
                  
                  // Create the SVG arc
                  const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                  
                  // Determine if the arc should be drawn as a large arc
                  const largeArc = angle > 180 ? 1 : 0;
                  
                  const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  
                  const path = <path key={index} d={pathData} fill={status.color} stroke="rgb(17, 24, 39)" strokeWidth="1" />;
                  
                  currentAngle += angle;
                  return path;
                });
              })()}
            </svg>
          </div>
        </div>
        
        {/* Status Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { status: 'PEAKING', color: 'bg-blue-500', text: 'text-blue-500' },
            { status: 'ACTIVE', color: 'bg-green-500', text: 'text-green-500' },
            { status: 'INJURED', color: 'bg-red-500', text: 'text-red-500' },
            { status: 'MODERATE', color: 'bg-yellow-500', text: 'text-yellow-500' },
            { status: 'OVERTRAINING', color: 'bg-orange-500', text: 'text-orange-500' },
            { status: 'RESTING', color: 'bg-purple-500', text: 'text-purple-500' }
          ].map(item => {
            const count = selectedTeamAthletes.filter(a => a.status === item.status).length;
            const percentage = selectedTeamAthletes.length ? Math.round((count / selectedTeamAthletes.length) * 100) : 0;
            
            return (
              <div key={item.status} className="flex items-center p-2 rounded hover:bg-gray-800/30 transition-colors">
                <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                <div className="flex-1">
                  <div className="font-medium text-white">{item.status}</div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className={`${item.text} ml-2 font-semibold`}>{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status Filter with enhanced visual */}
      <div className="mb-5">
        <label className="font-semibold text-blue-200 mb-2 block">Filter by Status:</label>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              statusFilter === '' 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-gray-800/50 border-blue-900/20 text-blue-300 hover:bg-gray-700/50'
            }`}
          >
            All
          </button>
          {['PEAKING', 'ACTIVE', 'INJURED', 'MODERATE', 'OVERTRAINING', 'RESTING'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                statusFilter === status
                  ? status === 'PEAKING' ? 'bg-blue-600 border-blue-400 text-white' :
                    status === 'ACTIVE' ? 'bg-green-600 border-green-400 text-white' :
                    status === 'INJURED' ? 'bg-red-600 border-red-400 text-white' :
                    status === 'MODERATE' ? 'bg-yellow-600 border-yellow-400 text-white' :
                    status === 'OVERTRAINING' ? 'bg-orange-600 border-orange-400 text-white' :
                    'bg-purple-600 border-purple-400 text-white'
                  : 'bg-gray-800/50 border-blue-900/20 text-blue-300 hover:bg-gray-700/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      {/* Athlete List with enhanced design */}
      <div className={`grid grid-cols-1 ${selectedTeamId ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-3`}>
        {selectedTeamAthletes.filter((athlete) => !statusFilter || athlete.status === statusFilter).length > 0 ? (
          selectedTeamAthletes
            .filter((athlete) => !statusFilter || athlete.status === statusFilter)
            .map((athlete) => (
              <motion.div
                key={athlete.athleteId}
                className="p-4 bg-gray-800/40 rounded-lg border border-blue-900/30 hover:bg-gray-700/40 cursor-pointer shadow-md backdrop-blur-sm transition-all"
                whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)" }}
                onClick={() => handleAthleteClick(athlete.athleteId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                    athlete.status === 'PEAKING' ? 'bg-blue-900/50' :
                    athlete.status === 'ACTIVE' ? 'bg-green-900/50' :
                    athlete.status === 'INJURED' ? 'bg-red-900/50' :
                    athlete.status === 'MODERATE' ? 'bg-yellow-900/50' :
                    athlete.status === 'OVERTRAINING' ? 'bg-orange-900/50' :
                    athlete.status === 'RESTING' ? 'bg-purple-900/50' : 'bg-gray-800/50'
                  } border-2 ${
                    athlete.status === 'PEAKING' ? 'border-blue-500' :
                    athlete.status === 'ACTIVE' ? 'border-green-500' :
                    athlete.status === 'INJURED' ? 'border-red-500' :
                    athlete.status === 'MODERATE' ? 'border-yellow-500' :
                    athlete.status === 'OVERTRAINING' ? 'border-orange-500' :
                    athlete.status === 'RESTING' ? 'border-purple-500' : 'border-gray-500'
                  }`}>
                    <div className="text-xl font-bold text-white">{athlete.name?.charAt(0) || '?'}</div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-gray-900 ${
                      athlete.status === 'PEAKING' ? 'bg-blue-500' :
                      athlete.status === 'ACTIVE' ? 'bg-green-500' :
                      athlete.status === 'INJURED' ? 'bg-red-500' :
                      athlete.status === 'MODERATE' ? 'bg-yellow-500' :
                      athlete.status === 'OVERTRAINING' ? 'bg-orange-500' :
                      athlete.status === 'RESTING' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-white">{athlete.name || 'Unknown'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-300">{athlete.sport || 'Unknown'}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        athlete.status === 'PEAKING' ? 'bg-blue-900/50 text-blue-300' :
                        athlete.status === 'ACTIVE' ? 'bg-green-900/50 text-green-300' :
                        athlete.status === 'INJURED' ? 'bg-red-900/50 text-red-300' :
                        athlete.status === 'MODERATE' ? 'bg-yellow-900/50 text-yellow-300' :
                        athlete.status === 'OVERTRAINING' ? 'bg-orange-900/50 text-orange-300' :
                        athlete.status === 'RESTING' ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {athlete.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
        ) : (
          <div className="p-8 text-center bg-gray-800/30 rounded-lg border border-blue-900/20 col-span-full">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-blue-200 font-medium">No athletes match the selected status</p>
            <button 
              onClick={() => setStatusFilter('')}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
            >
              Show All Athletes
            </button>
          </div>
        )}
      </div>
      
      {/* Show the no team selected view if needed */}
      {!selectedTeamId && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
          <div className="flex items-center gap-3 text-blue-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Select a team above to see team-specific performance metrics</p>
          </div>
        </div>
      )}
    </div>
  </motion.div>

  {/* Team Performance - Only render when a team is selected */}
  {selectedTeamId && teamPerformance && (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
        <h3 className="text-xl font-semibold text-white mb-4">Team Performance</h3>
        <div className="space-y-4">
          {/* Team Information */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-800/20">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-white">{teamPerformance.teamName}</h4>
                <p className="text-blue-300">{teamPerformance.sport}</p>
              </div>
              <div className="bg-blue-900/50 px-3 py-1 rounded-lg border border-blue-800/30">
                <span className="text-sm text-blue-200">{teamPerformance.metrics.totalAthletes} Athletes</span>
              </div>
            </div>
          </div>
          
          {/* Team Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {/* Training Load */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-800/20 flex flex-col items-center">
              <div className="text-blue-300 text-sm mb-1">Training Load</div>
              <div className="text-2xl font-bold text-white">{teamPerformance.metrics.averageTrainingLoad}</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${(teamPerformance.metrics.averageTrainingLoad / 100) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Recovery Score */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-800/20 flex flex-col items-center">
              <div className="text-purple-300 text-sm mb-1">Recovery</div>
              <div className="text-2xl font-bold text-white">{teamPerformance.metrics.averageRecoveryScore}</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full" 
                  style={{ width: `${(teamPerformance.metrics.averageRecoveryScore / 100) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Fatigue Index */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-800/20 flex flex-col items-center">
              <div className="text-red-300 text-sm mb-1">Fatigue</div>
              <div className="text-2xl font-bold text-white">{teamPerformance.metrics.teamFatigueIndex}</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-red-500 h-1.5 rounded-full" 
                  style={{ width: `${(teamPerformance.metrics.teamFatigueIndex / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Team Performance Chart */}
          {teamPerformanceChartData && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-800/20">
              <h4 className="text-lg font-semibold text-white mb-3">Performance Trends</h4>
              <div className="h-64">
                <Line data={teamPerformanceChartData} options={teamPerformanceChartOptions} />
              </div>
            </div>
          )}
          
          {/* Team Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
              onClick={() => {/* Add functionality to view detailed team performance */}}
            >
              Full Team Analysis
            </button>
          </div>
        </div>
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
