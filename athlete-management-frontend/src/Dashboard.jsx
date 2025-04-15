


import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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
import { useNavigate } from 'react-router-dom';
import './CreateAthlete';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();

  const [athleteData, setAthleteData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamPerformance, setTeamPerformance] = useState(null);

  const fetchData = async () => {
    try {
      const athleteResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/athlete/data`);
      if (!athleteResponse.ok) throw new Error('Failed to fetch athlete data');
      const athletes = await athleteResponse.json();
      setAthleteData(athletes);

      const teamsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/athlete/teams`);
      if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
      const teamsData = await teamsResponse.json();
      setTeams(teamsData);

      if (teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0]._id);
      }

      if (selectedTeamId) {
        const performanceResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/athlete/team-performance/${selectedTeamId}`
        );
        if (!performanceResponse.ok) throw new Error('Failed to fetch team performance');
        const performanceData = await performanceResponse.json();
        setTeamPerformance(performanceData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      // Dummy fallback
      setAthleteData([
        { athleteId: '1', athleteName: 'Aditya Singh', sport: 'Sprint', status: 'PEAKING' },
        { athleteId: '2', athleteName: 'Rahul Patel', sport: 'Middle Distance', status: 'IMPROVING' },
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

  useEffect(() => {
    fetchData();
  }, [selectedTeamId]);

  const handleTeamChange = (e) => {
    setSelectedTeamId(e.target.value);
  };

  const selectedTeam = teams.find((team) => team._id === selectedTeamId);
  const teamAthleteIds = selectedTeam?.athletes.map((a) => a._id.toString()) || [];
  const filteredAthleteData = selectedTeamId
    ? athleteData.filter((athlete) => teamAthleteIds.includes(athlete.athleteId.toString()))
    : athleteData;

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
        <div className="text-right text-blue-300 mb-6">April 10, 2025</div>

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
              <div className="space-y-3">
                {filteredAthleteData.length > 0 ? (
                  filteredAthleteData.map((athlete) => (
                    <motion.div
                      key={athlete.athleteId}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full ${
                            athlete.status === 'PEAKING'
                              ? 'bg-blue-500'
                              : athlete.status === 'INJURED'
                              ? 'bg-red-500'
                              : athlete.status === 'IMPROVING'
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <div>
                          <p className="font-semibold text-white">{athlete.athleteName}</p>
                          <p className="text-sm text-blue-300">{athlete.sport}</p>
                        </div>
                      </div>
                      <p
                        className={`font-semibold ${
                          athlete.status === 'PEAKING'
                            ? 'text-blue-300'
                            : athlete.status === 'INJURED'
                            ? 'text-red-400'
                            : athlete.status === 'IMPROVING'
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {athlete.status}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-blue-300">No athletes in selected team</p>
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
                  <p><strong>Team:</strong> {teamPerformance.teamName}</p>
                  <p><strong>Sport:</strong> {teamPerformance.sport}</p>
                  <p><strong>Athletes:</strong> {teamPerformance.metrics.totalAthletes}</p>
                  <p><strong>Training Load:</strong> {teamPerformance.metrics.averageTrainingLoad}</p>
                  <p><strong>Recovery:</strong> {teamPerformance.metrics.averageRecoveryScore}</p>
                  <p><strong>Fatigue:</strong> {teamPerformance.metrics.teamFatigueIndex}</p>
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
      </main>

      {/* Footer */}
      <footer className="bg-black/90 text-blue-300 mt-18
      text-center p-4 border-t border-blue-900">
        <p>© 2025 AthletixHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
