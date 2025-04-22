import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

function FinancialPlanningPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [financialPlanning, setFinancialPlanning] = useState({ advice: '', probabilities: [], analysis: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/athlete/performance/${id}`);
        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }
        const athlete = { ...performanceResponse.data.performanceData[0], role: performanceResponse.data.performanceData[0].role || 'General' };
        const sortedPerformanceData = performanceResponse.data.performanceData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setAthleteData(athlete);
        setPerformanceData(sortedPerformanceData);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
      }
    };

    fetchAthleteData();
  }, [id]);

  useEffect(() => {
    const fetchFinancialPlanning = async () => {
      try {
        const trainResponse = await axios.get(`${import.meta.env.VITE_API_URL}/finance/financial-train`);
        if (trainResponse.data.message !== 'Financial model trained successfully and stored in memory') {
          throw new Error('Financial model training failed: ' + trainResponse.data.message);
        }
        const athlete = athleteData || {};
        const latestPerformance = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
        const competitionWins = calculateCompetitionWins(athlete.competitionHistory);
        const financialInput = {
          age: athlete.age || 0,
          currentIncome: athlete.currentIncome || 0,
          expenses: latestPerformance?.expenses || 0,
          savings: athlete.savings || 0,
          sport: athlete.sport || 'unknown',
          competitionWins,
          injuryCount: latestPerformance?.pastInjuries || athlete.injuryHistory?.length || 0,
          careerGoals: athlete.careerGoals || ['Not specified'],
        };
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/finance/financial-guidance`, financialInput);
        const { financialAdvice: advice, probabilities } = response.data;
        const { age, currentIncome: income, savings, sport, injuryCount, careerGoals } = financialInput;

        const expenses = latestPerformance?.expenses || (income > 0 ? income * 0.75 : 0);
        const annualSurplus = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        const savingsTarget = income * 0.25;
        const injuryRiskCost = injuryCount > 0 ? expenses * 0.3 : 0;
        const savingsIn10Years = savings * (1 + 0.05) ** 10;

        let analysis = `<h3 class="text-purple-400 text-lg font-semibold">Financial Planning Analysis (Age ${age}, ${sport})</h3>`;
        analysis += `<p class="mt-2"><strong class="text-gray-300">Financial Profile:</strong> Income: <span class="text-green-400">$${income.toLocaleString()}</span>, Expenses: <span class="text-red-400">$${expenses.toLocaleString()}</span>, Savings: <span class="text-blue-400">$${savings.toLocaleString()}</span>, Savings Rate: <span class="${savingsRate < 25 ? 'text-yellow-400' : 'text-green-400'}">${savingsRate.toFixed(1)}%</span>, Wins: ${competitionWins}, Injuries: ${injuryCount}.</p>`;
        analysis += `<p class="mt-2"><strong class="text-gray-300">Goals:</strong> ${careerGoals.join(', ')}</p>`;

        if (advice === 'Build Wealth') {
          analysis += `<h4 class="text-blue-400 mt-4">Build Wealth (Probability: ${Math.round(probabilities[0] * 100)}%)</h4>`;
          analysis += `<ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> Your income ($${income.toLocaleString()}) and savings ($${savings.toLocaleString()}) are solid, but a ${savingsRate.toFixed(1)}% savings rate needs growth to secure ${sport} career goals.</li>`;
          analysis += `<li><strong class="text-gray-300">Next Steps:</strong> Aim for a <span class="text-green-400">25% savings rate</span> by saving $${savingsTarget.toLocaleString()}/year. Invest in low-risk funds.</li></ul>`;
        } else if (advice === 'Stabilize Finances') {
          analysis += `<h4 class="text-yellow-400 mt-4">Stabilize Finances (Probability: ${Math.round(probabilities[1] * 100)}%)</h4>`;
          analysis += `<ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> Expenses ($${expenses.toLocaleString()}) are high relative to income ($${income.toLocaleString()}), leaving a ${savingsRate.toFixed(1)}% savings rate.</li>`;
          analysis += `<li><strong class="text-gray-300">Next Steps:</strong> Cut expenses by 10-15% (e.g., reduce non-essential costs) to boost savings.</li></ul>`;
        } else if (advice === 'Plan for Retirement') {
          analysis += `<h4 class="text-orange-400 mt-4">Plan for Retirement (Probability: ${Math.round(probabilities[2] * 100)}%)</h4>`;
          analysis += `<ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> At age ${age} with $${savings.toLocaleString()} saved, you need a long-term plan for post-${sport} career.</li>`;
          analysis += `<li><strong class="text-gray-300">Next Steps:</strong> Start a retirement account (e.g., IRA) and contribute $${(income * 0.1).toLocaleString()}/year.</li></ul>`;
        }

        analysis += `<p class="mt-4"><strong class="text-gray-300">Projected Savings (10 Years, 5% Growth):</strong> <span class="text-green-400">$${Math.round(savingsIn10Years).toLocaleString()}</span></p>`;
        if (injuryCount > 0) {
          analysis += `<p class="mt-2 text-yellow-400">Warning: ${injuryCount} injuries may increase costs by $${injuryRiskCost.toLocaleString()}/year—consider insurance.</p>`;
        }

        setFinancialPlanning({
          advice,
          probabilities,
          analysis,
        });
      } catch (err) {
        console.error('Error fetching financial planning:', err);
        setError(prev => prev ? `${prev} | Financial planning error: ${err.message}` : `Financial planning error: ${err.message}`);
        setFinancialPlanning({ advice: 'Unable to generate financial plan at this time.', probabilities: [], analysis: '' });
      }
    };

    if (athleteData && performanceData.length > 0) fetchFinancialPlanning();
  }, [athleteData, performanceData]);

  const financialChartData = {
    labels: ['Income', 'Expenses', 'Savings'],
    datasets: [{
      label: 'Financial Metrics ($)',
      data: [
        athleteData?.currentIncome || 0,
        performanceData.length > 0 ? performanceData[performanceData.length - 1]?.expenses || 0 : 0,
        athleteData?.savings || 0,
      ],
      backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
    }],
  };

  const financialChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: { display: true, text: 'Financial Overview', color: '#ffffff' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Amount ($)', color: '#ffffff' },
        ticks: { color: '#ffffff' },
        grid: { color: '#444' },
      },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
  };

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Planning</h1>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
      {financialPlanning.advice ? (
        <>
          <p className="text-lg"><strong className="text-gray-300">Financial Advice:</strong> <span className="text-teal-400">{financialPlanning.advice}</span></p>
          <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: financialPlanning.analysis }} />
          <div className="h-96 mt-4">
            <Bar data={financialChartData} options={financialChartOptions} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-blue-400">Probability Breakdown</h3>
            <p className="mt-2">
              Build Wealth: <span className="text-blue-400">{Math.round(financialPlanning.probabilities[0] * 100)}%</span>, 
              Stabilize Finances: <span className="text-yellow-400">{Math.round(financialPlanning.probabilities[1] * 100)}%</span>, 
              Plan for Retirement: <span className="text-orange-400">{Math.round(financialPlanning.probabilities[2] * 100)}%</span>
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-400">Generating financial plan...</p>
      )}
      <button
        onClick={() => navigate(`/athlete/${id}`)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Back to Athlete Dashboard
      </button>
    </div>
  );
}

export default FinancialPlanningPage;