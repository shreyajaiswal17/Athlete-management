import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Sample fallback data with role added
const fallbackAthleteData = {
  1: { id: 1, athleteName: 'John Doe', sport: 'Basketball', role: 'Guard', age: 25, education: 'BS in Kinesiology', careerGoals: ['Professional Athlete'], performance: 'Excellent', injuryHistory: [], competitionHistory: [] },
  2: { id: 2, athleteName: 'Jane Smith', sport: 'Swimming', role: 'Freestyler', age: 22, education: 'BA in Sports Management', careerGoals: ['Coach'], performance: 'Good', injuryHistory: [], competitionHistory: [] },
  3: { id: 3, athleteName: 'Mike Johnson', sport: 'Track', role: 'Sprinter', age: 28, education: 'MS in Exercise Science', careerGoals: ['Olympian', 'Trainer'], performance: 'Very Good', injuryHistory: [], competitionHistory: [] }
};

// Resource mapping for career goals
const careerResources = {
  'Professional Athlete': [
    { name: 'LinkedIn Sports Jobs', url: 'https://www.linkedin.com/jobs/sports-jobs' },
    { name: 'TeamWork Online', url: 'https://www.teamworkonline.com' },
  ],
  'Coach': [
    { name: 'USA Coaching Certification', url: 'https://www.usacoaching.org' },
    { name: 'National Coaching Courses', url: 'https://www.ukcoaching.org' },
  ],
  'Olympian': [
    { name: 'Olympic Training Programs', url: 'https://www.teamusa.org' },
    { name: 'International Olympic Committee', url: 'https://olympics.com/ioc' },
  ],
  'Trainer': [
    { name: 'NASM Certification', url: 'https://www.nasm.org' },
    { name: 'ACE Fitness', url: 'https://www.acefitness.org' },
  ],
};

// Helper function to calculate competition wins
const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

// Calculate Performance Efficiency Score (0-100) with role as parameter
const calculatePerformanceEfficiency = (hoursTrained, sessionsPerWeek, restDays, competitionWins, sport, role) => {
  const maxHours = sport === 'Swimming' ? 30 : sport === 'Basketball' ? 25 : sport === 'Cricket' && role === 'Bowler' ? 25 : 20;
  const efficiency = (hoursTrained / maxHours) * 0.4 + (sessionsPerWeek / 7) * 0.3 + (restDays / 7) * 0.2 + (competitionWins / 5) * 0.1;
  return Math.min(100, Math.max(0, efficiency * 100)).toFixed(1);
};

// Analyze performance trends
const analyzePerformanceTrends = (performanceData, sport) => {
  if (performanceData.length < 2) return { trend: 'Insufficient data for trend analysis', delta: 0 };
  const latest = performanceData[performanceData.length - 1];
  const previous = performanceData[performanceData.length - 2];
  const hoursDelta = latest.hoursTrained - previous.hoursTrained;
  const sessionsDelta = latest.sessionsPerWeek - previous.sessionsPerWeek;
  const restDelta = latest.restDays - previous.restDays;
  const trend = hoursDelta > 0 ? 'increasing' : hoursDelta < 0 ? 'decreasing' : 'stable';
  return {
    trend: `Training volume is ${trend} (${hoursDelta > 0 ? '+' : ''}${hoursDelta.toFixed(1)} hours, ${sessionsDelta > 0 ? '+' : ''}${sessionsDelta} sessions, ${restDelta > 0 ? '+' : ''}${restDelta} rest days).`,
    delta: { hours: hoursDelta, sessions: sessionsDelta, rest: restDelta }
  };
};

// Generate sport-specific performance recommendations
const generatePerformanceRecommendations = (athleteData, performanceData) => {
  const latest = performanceData[performanceData.length - 1] || {};
  const { sport, competitionHistory, role = 'General' } = athleteData; // Default role to 'General'
  const { hoursTrained = 0, sessionsPerWeek = 0, restDays = 0 } = latest;
  const wins = calculateCompetitionWins(competitionHistory);
  const efficiency = calculatePerformanceEfficiency(hoursTrained, sessionsPerWeek, restDays, wins, sport, role);

  let recommendations = [];
  if (sport === 'Basketball') {
    recommendations.push(hoursTrained < 15 ? 'Increase court time to 15-20 hours/week to boost explosiveness.' : 'Maintain volume, focus on agility drills (e.g., ladder drills).');
    recommendations.push(sessionsPerWeek < 4 ? 'Add 1-2 shooting practice sessions.' : 'Incorporate HIIT for stamina.');
  } else if (sport === 'Swimming') {
    recommendations.push(hoursTrained < 20 ? 'Aim for 20-25 hours/week for endurance.' : 'Refine technique (e.g., flip turns).');
    recommendations.push(restDays < 2 ? 'Schedule 2 rest days for aerobic recovery.' : 'Add dryland strength training.');
  } else if (sport === 'Track') {
    recommendations.push(hoursTrained < 18 ? 'Increase to 18-22 hours/week for speed/stamina.' : 'Prioritize sprint intervals.');
    recommendations.push(wins < 3 ? 'Compete more for race experience.' : 'Analyze pacing via footage.');
  } else if (sport === 'Cricket') {
    recommendations.push(hoursTrained < (role === 'Bowler' ? 20 : 15) ? 'Boost to 20-25 hours/week for match readiness.' : `Focus on ${role === 'Bowler' ? 'bowling accuracy' : 'batting drills'}.`);
    recommendations.push(restDays < (role === 'Bowler' ? 2 : 1) ? 'Add rest days for recovery.' : 'Enhance fielding agility.');
  } else if (sport === 'Kabaddi') {
    recommendations.push(hoursTrained < 18 ? 'Increase to 18-22 hours/week for raid/tackle strength.' : 'Refine raid techniques.');
    recommendations.push(sessionsPerWeek < 5 ? 'Add 1-2 contact sessions.' : 'Focus on breath control drills.');
  } else if (sport === 'Football') {
    recommendations.push(hoursTrained < 20 ? 'Aim for 20-28 hours/week for endurance.' : 'Work on sprint conditioning.');
    recommendations.push(restDays < 2 ? 'Add 1-2 rest days for leg recovery.' : 'Incorporate ball control drills.');
  } else {
    recommendations.push(hoursTrained < 15 ? 'Increase to 15-20 hours/week for gains.' : 'Refine sport-specific skills.');
  }
  return { efficiency, recommendations };
};

function AthleteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState({
    efficiency: 0,
    trend: '',
    recommendations: [],
  });
  const [injuryPrediction, setInjuryPrediction] = useState(null);
  const [performanceSuggestion, setPerformanceSuggestion] = useState('');
  const [injuryPreventionSuggestion, setInjuryPreventionSuggestion] = useState('');
  const [careerGuidance, setCareerGuidance] = useState({ guidance: '', probabilities: [], analysis: '', yearsToGoal: 0 });
  const [financialPlanning, setFinancialPlanning] = useState({ advice: '', probabilities: [], analysis: '' });
  const [trainingSchedule, setTrainingSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [trainingMetrics, setTrainingMetrics] = useState({ trainingLoad: 0, recoveryScore: 0, riskFlag: '', insights: {}, recommendations: [] });
  const [mealPlanInput, setMealPlanInput] = useState({ height: '', weight: '', goal: '' });
  const [mealPlan, setMealPlan] = useState(null);
  const [mealPlanError, setMealPlanError] = useState(null);
  const chartRef = useRef(null);

  const handleMealPlanInputChange = (e) => {
    const { name, value } = e.target;
    setMealPlanInput((prev) => ({ ...prev, [name]: value }));
  };

  const generateMealPlan = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/nutrition/meal-plan', {
        athleteId: id,
        height: parseFloat(mealPlanInput.height),
        weight: parseFloat(mealPlanInput.weight),
        goal: mealPlanInput.goal,
      });
      setMealPlan(response.data);
      setMealPlanError(null);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setMealPlanError('Failed to generate meal plan. Please check your inputs.');
    }
  };

  // Fetch athlete data and injury prediction
  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`http://localhost:3000/api/athlete/performance/${id}`);
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
        setAthleteData(fallbackAthleteData[id] ? { ...fallbackAthleteData[id], performanceData: [], role: fallbackAthleteData[id].role || 'General' } : null);
      }
    };

    const fetchInjuryPrediction = async () => {
      try {
        const injuryResponse = await axios.get(`http://localhost:3000/api/athlete/injury-prediction/${id}`);
        if (!injuryResponse.data || !injuryResponse.data.injuryPrediction) {
          throw new Error('No injury prediction found in response');
        }
        setInjuryPrediction(injuryResponse.data.injuryPrediction);
      } catch (err) {
        console.error('Error fetching injury prediction:', err);
        setError(prev => prev ? `${prev} | Injury prediction error: ${err.message}` : `Injury prediction error: ${err.message}`);
      }
    };

    fetchAthleteData();
    fetchInjuryPrediction();

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [id]);

  // Fetch training metrics
  useEffect(() => {
    const fetchTrainingMetrics = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/athlete/training-metrics/${id}`);
        setTrainingMetrics(response.data);
      } catch (err) {
        console.error('Error fetching training metrics:', err);
        setError(prev => prev ? `${prev} | Training metrics error: ${err.message}` : `Training metrics error: ${err.message}`);
      }
    };

    if (id) fetchTrainingMetrics();
  }, [id]);

  // Train the model and fetch training schedule
  useEffect(() => {
    const trainModelAndFetchSchedule = async () => {
      try {
        const trainResponse = await axios.post('http://localhost:3000/training/train', {
          xs: [
            { athleteId: id, features: [25, 70, 85, 2, 5, 0] },
            { athleteId: "athlete2", features: [30, 65, 90, 1, 3, 1] },
          ],
          ys: [
            [1, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0],
          ],
          sport: athleteData?.sport || 'Default'
        });

        if (trainResponse.data !== `Model trained successfully for sport: ${athleteData?.sport || 'all sports'}!`) {
          throw new Error('Model training failed: ' + trainResponse.data);
        }

        const scheduleResponse = await axios.post('http://localhost:3000/training/generate-schedule', { athleteId: id });
        setTrainingSchedule(scheduleResponse.data);
      } catch (err) {
        console.error('Error training model or fetching training schedule:', err);
        setError(prev => prev ? `${prev} | Training error: ${err.message}` : `Training error: ${err.message}`);
      }
    };

    if (id && athleteData) trainModelAndFetchSchedule();
  }, [id, athleteData]);

  // Fetch career guidance
  useEffect(() => {
    const fetchCareerGuidance = async () => {
      try {
        const trainResponse = await axios.get('http://localhost:3000/api/ai/train');
        if (trainResponse.data.message !== 'Model trained successfully and stored in memory') {
          throw new Error('Model training failed: ' + trainResponse.data.message);
        }
        const latestPerformance = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
        const athlete = athleteData || {};
        const competitionWins = calculateCompetitionWins(athlete.competitionHistory);
        const careerInput = {
          age: athlete.age || 0,
          hoursTrained: latestPerformance?.hoursTrained || 0,
          injuryCount: latestPerformance?.pastInjuries || athlete.injuryHistory?.length || 0,
          sessionsPerWeek: latestPerformance?.sessionsPerWeek || 0,
          competitionWins,
        };
        const response = await axios.post('http://localhost:3000/api/ai/career-guidance', careerInput);
        const { careerGuidance: guidance, probabilities } = response.data;
        const sport = athlete.sport || 'your sport';
        const education = athlete.education || 'Not specified';
        const careerGoals = athlete.careerGoals || ['Not specified'];
        const hoursTrained = careerInput.hoursTrained;
        const injuryCount = careerInput.injuryCount;
        const sessionsPerWeek = careerInput.sessionsPerWeek;
        const age = careerInput.age;
        const restDays = latestPerformance?.restDays || 0;

        const baselineYearsToGoal = careerGoals.includes('Olympian') ? 8 : careerGoals.includes('Professional Athlete') ? 5 : 3;
        const trainingFactor = hoursTrained > 20 ? 0.8 : hoursTrained > 10 ? 1 : 1.2;
        const winsFactor = competitionWins > 5 ? 0.9 : competitionWins > 2 ? 1 : 1.1;
        const injuryFactor = injuryCount > 1 ? 1.2 : 1;
        const yearsToGoal = Math.round(baselineYearsToGoal * trainingFactor * winsFactor * injuryFactor);

        let analysis = `<h3 class="text-teal-400 text-lg font-semibold">Career Analysis (Age ${age}, ${sport})</h3><p class="mt-2"><strong class="text-gray-300">Profile:</strong> Training <span class="text-yellow-300">${hoursTrained} hours/week</span>, ${sessionsPerWeek} sessions, ${restDays} rest days, ${injuryCount} injuries, ${competitionWins} wins. <em class="text-gray-400">Education:</em> ${education}. <em class="text-gray-400">Goals:</em> ${careerGoals.join(', ')}</p>`;
        
        if (guidance === 'Focus on Training') {
          analysis += `<h4 class="text-blue-400 mt-4">Build Elite Potential (Probability: ${Math.round(probabilities[0] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> Your ${hoursTrained} hours/week and ${competitionWins} win(s) show promise, but reaching elite ${sport} levels requires a bigger push.</li><li><strong class="text-gray-300">Next Steps:</strong> Boost to <span class="text-green-400">${(hoursTrained * 1.2).toFixed(1)} hours/week</span> with ${sport}-specific skills (e.g., ${sport === 'Swimming' ? 'flip turns' : sport === 'Track' ? 'sprint starts' : sport === 'Cricket' ? 'bowling accuracy' : 'core drills'}).</li></ul>`;
        } else if (guidance === 'Competition Ready') {
          analysis += `<h4 class="text-green-400 mt-4">Competition Ready (Probability: ${Math.round(probabilities[1] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> With ${competitionWins} win(s) and a strong ${hoursTrained} hours/week base, you’re ready to shine in ${sport} events.</li><li><strong class="text-gray-300">Next Steps:</strong> Compete quarterly to sharpen skills under pressure.</li></ul>`;
        } else if (guidance === 'Sustain Performance') {
          analysis += `<h4 class="text-orange-400 mt-4">Refine and Sustain (Probability: ${Math.round(probabilities[2] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> Your ${hoursTrained} hours/week and ${injuryCount} injuries show strength, but balance is key to avoid setbacks.</li><li><strong class="text-gray-300">Next Steps:</strong> Keep <span class="text-green-400">${hoursTrained} hours/week</span>, spread into ${Math.min(sessionsPerWeek + 1, 6)} sessions, and add 1-2 rest days.</li></ul>`;
        }
        analysis += `<p class="mt-4"><strong class="text-gray-300">Probability Breakdown:</strong> Build Elite Potential (<span class="text-blue-400">${Math.round(probabilities[0] * 100)}%</span>), Competition Ready (<span class="text-green-400">${Math.round(probabilities[1] * 100)}%</span>), Refine and Sustain (<span class="text-orange-400">${Math.round(probabilities[2] * 100)}%</span>)</p>`;

        setCareerGuidance({ 
          guidance: guidance === 'Focus on Training' ? 'Build Elite Potential' : guidance === 'Sustain Performance' ? 'Refine and Sustain' : guidance, 
          probabilities, 
          analysis, 
          yearsToGoal 
        });
      } catch (err) {
        console.error('Error fetching career guidance:', err);
        setError(prev => prev ? `${prev} | Career guidance error: ${err.message}` : `Career guidance error: ${err.message}`);
        setCareerGuidance({ guidance: 'Unable to analyze career at this time.', probabilities: [], analysis: '', yearsToGoal: 0 });
      }
    };

    if (athleteData && performanceData.length > 0) fetchCareerGuidance();
  }, [athleteData, performanceData]);

  // Fetch financial planning
  useEffect(() => {
    const fetchFinancialPlanning = async () => {
      try {
        const trainResponse = await axios.get('http://localhost:3000/finance/financial-train');
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
        const response = await axios.post('http://localhost:3000/finance/financial-guidance', financialInput);
        const { financialAdvice: advice, probabilities } = response.data;
        const { age, currentIncome: income, expenses, savings, sport, injuryCount, careerGoals } = financialInput;

        const annualSurplus = income - expenses;
        const savingsTarget = income * 0.25;
        const injuryRiskCost = injuryCount > 0 ? expenses * 0.3 : 0;
        const savingsIn10Years = savings * (1 + 0.05) ** 10;

        let analysis = `<h3 class="text-purple-400 text-lg font-semibold">Financial Planning Analysis (Age ${age}, ${sport})</h3><p class="mt-2"><strong class="text-gray-300">Current Profile:</strong> Income: <span class="text-green-400">$${income}/year</span>, Expenses: <span class="text-red-400">$${expenses}/year</span>, Savings: <span class="text-yellow-300">$${savings}</span>, Wins: ${competitionWins}, Injuries: ${injuryCount}. <em class="text-gray-400">Goals:</em> ${careerGoals.join(', ')}</p>`;
        analysis += `<h4 class="text-teal-400 mt-4">Build Emergency Savings (Probability: ${Math.round(probabilities[0] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> Your <span class="text-yellow-300">$${annualSurplus} surplus</span> ${annualSurplus > 0 ? '<span class="text-green-400">supports saving</span>' : '<span class="text-red-400">requires expense cuts</span>'}. Injuries may cost <span class="text-red-400">$${injuryRiskCost}/year</span>.</li><li><strong class="text-gray-300">How:</strong> Save <span class="text-green-400">$${savingsTarget.toFixed(0)}/year</span> (25% of income).</li></ul>`;
        analysis += `<h4 class="text-green-400 mt-4">Invest for Future Growth (Probability: ${Math.round(probabilities[1] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> With <span class="text-yellow-300">$${savings}</span>, ${income > expenses ? '<span class="text-green-400">you can grow wealth</span>' : '<span class="text-red-400">investing waits until surplus increases</span>'}.</li><li><strong class="text-gray-300">How:</strong> Invest <span class="text-green-400">$${Math.min(savings * 0.5, 5000).toFixed(0)}</span> in an S&P 500 ETF.</li></ul>`;
        analysis += `<h4 class="text-orange-400 mt-4">Optimize Expenses (Probability: ${Math.round(probabilities[2] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300">Why:</strong> <span class="text-red-400">$${expenses}</span> is ${expenses > income * 0.6 ? '<span class="text-red-400">over 60% of income</span>' : '<span class="text-green-400">manageable</span>'}.</li><li><strong class="text-gray-300">How:</strong> Cut <span class="text-green-400">$${(expenses * 0.3).toFixed(0)}</span> (30%) via shared training costs.</li></ul>`;
        analysis += `<p class="mt-4"><strong class="text-gray-300">Summary:</strong> In 10 years, savings could grow to <span class="text-green-400">$${savingsIn10Years.toFixed(0)}</span> at 5% APY.</p>`;

        setFinancialPlanning({ advice, probabilities, analysis });
      } catch (err) {
        console.error('Error fetching financial planning:', err);
        setError(prev => prev ? `${prev} | Financial planning error: ${err.message}` : `Financial planning error: ${err.message}`);
        setFinancialPlanning({ advice: 'Unable to analyze financial plan at this time.', probabilities: [], analysis: '' });
      }
    };

    if (athleteData && performanceData.length > 0) fetchFinancialPlanning();
  }, [athleteData, performanceData]);

  // Generate performance analysis
  useEffect(() => {
    if (athleteData && performanceData.length > 0) {
      const trendAnalysis = analyzePerformanceTrends(performanceData, athleteData.sport);
      const { efficiency, recommendations } = generatePerformanceRecommendations(athleteData, performanceData);
      const latest = performanceData[performanceData.length - 1];
      setPerformanceSuggestion(`Training Load: ${latest.hoursTrained} hours/week, ${latest.sessionsPerWeek} sessions, ${latest.restDays} rest days.`);
      setPerformanceAnalysis({
        efficiency,
        trend: trendAnalysis.trend,
        recommendations,
      });
    }
  }, [athleteData, performanceData]);

  // Generate prevention suggestions with sport-specific rules and injury prediction integration
  useEffect(() => {
    if (athleteData && injuryPrediction && performanceData.length > 0) {
      generatePreventionSuggestions(injuryPrediction, athleteData, performanceData);
    }
  }, [athleteData, injuryPrediction, performanceData]);

  const generatePreventionSuggestions = (injuryPrediction, athleteData, perfData) => {
    if (!injuryPrediction || !perfData.length) {
      setInjuryPreventionSuggestion('No specific prevention recommendation available.');
      return;
    }

    const latestPerf = perfData[perfData.length - 1];
    const hoursTrained = latestPerf.hoursTrained || 20;
    const sessionsPerWeek = latestPerf.sessionsPerWeek || 4;
    const restDays = latestPerf.restDays || 0;
    const sport = athleteData.sport || 'General';
    const role = athleteData.role || 'General'; // Default to 'General' if undefined

    // Sport-specific thresholds
    const sportThresholds = {
      Swimming: { maxHours: 30, minRestDays: 2, maxSessions: 7, commonInjury: 'shoulder strain' },
      Basketball: { maxHours: 25, minRestDays: 2, maxSessions: 6, commonInjury: 'knee/ankle sprain' },
      Track: { maxHours: 22, minRestDays: 2, maxSessions: 6, commonInjury: 'shin splints' },
      Cricket: {
        maxHours: role === 'Bowler' ? 25 : 20,
        minRestDays: role === 'Bowler' ? 2 : 1,
        maxSessions: 6,
        commonInjury: role === 'Bowler' ? 'shoulder strain' : 'hamstring strain'
      },
      Kabaddi: { maxHours: 22, minRestDays: 2, maxSessions: 7, commonInjury: 'knee/ankle sprain' },
      Football: { maxHours: 28, minRestDays: 2, maxSessions: 6, commonInjury: 'hamstring strain' },
      General: { maxHours: 20, minRestDays: 2, maxSessions: 5, commonInjury: 'general fatigue' },
    };
    const thresholds = sportThresholds[sport] || sportThresholds.General;

    // Step 1: Monitor training load with sport-specific rules
    const trainingWarnings = monitorTrainingLoad(hoursTrained, sessionsPerWeek, restDays, thresholds, injuryPrediction);

    // Step 2: Calculate intensity and recovery score with injury risk adjustment
    const intensity = calculateIntensity(sessionsPerWeek, sport);
    const recoveryScore = calculateRecoveryScore(restDays, intensity, injuryPrediction.predictionScore || 0);

    // Step 3: Generate recovery and risk-based suggestions
    const recoverySuggestions = getRecoverySuggestions(recoveryScore, thresholds, injuryPrediction, sport, role);

    // Combine all suggestions
    const preventionSuggestion = [...trainingWarnings, recoverySuggestions].join(' ');
    setInjuryPreventionSuggestion(preventionSuggestion || 'No immediate action required—monitor trends.');
  };

  // Helper function: Monitor training load with sport-specific thresholds and injury risk
  const monitorTrainingLoad = (hours, sessions, rest, thresholds, injuryPrediction) => {
    const warnings = [];
    const riskLevel = injuryPrediction.injuryRisk?.toLowerCase() || 'unknown';

    if (hours > thresholds.maxHours) {
      const reduction = (hours - thresholds.maxHours) > 5 ? 'significantly reduce' : 'slightly reduce';
      warnings.push(`${riskLevel === 'high' ? 'Urgent: ' : ''}Excessive training load (${hours} hours exceeds ${thresholds.maxHours} max)—${reduction} volume to avoid ${thresholds.commonInjury}.`);
    }

    if (rest < thresholds.minRestDays && (riskLevel === 'high' || riskLevel === 'moderate')) {
      warnings.push(`Low rest (${rest} days < ${thresholds.minRestDays} recommended)—add ${thresholds.minRestDays - rest} rest day(s) to prevent ${thresholds.commonInjury}.`);
    }

    if (sessions > thresholds.maxSessions) {
      warnings.push(`Too many sessions (${sessions} > ${thresholds.maxSessions} max)—cut back to reduce strain on ${thresholds.commonInjury.split('/')[0]}.`);
    }

    return warnings;
  };

  // Helper function: Calculate intensity based on sport
  const calculateIntensity = (sessions, sport) => {
    const intensityPerSession = {
      Swimming: 1.5,
      Basketball: 2.5,
      Track: 2,
      Cricket: 2,
      Kabaddi: 2.5,
      Football: 2.2,
      General: 2,
    };
    return sessions * (intensityPerSession[sport] || intensityPerSession.General);
  };

  // Helper function: Calculate recovery score with injury prediction weighting
  const calculateRecoveryScore = (restDays, intensity, predictionScore) => {
    const baseScore = restDays * 20;
    const riskAdjustment = predictionScore * 30;
    return Math.min(100, Math.max(0, baseScore - intensity - riskAdjustment));
  };

  // Helper function: Generate recovery suggestions with sport-specific and risk-based nuance
  const getRecoverySuggestions = (score, thresholds, injuryPrediction, sport, role) => {
    const riskLevel = injuryPrediction.injuryRisk?.toLowerCase() || 'low';
    const preventionTip = {
      Swimming: 'shoulder mobility',
      Basketball: 'ankle bracing',
      Track: 'calf stretching',
      Cricket: role === 'Bowler' ? 'rotator cuff exercises' : 'hamstring flexibility',
      Kabaddi: 'knee stability drills',
      Football: 'quad stretching',
      General: 'core conditioning',
    };

    if (score < 30 && riskLevel === 'high') {
      return `Critical recovery deficit (score: ${score})—prioritize 2-3 rest days this week and target ${thresholds.commonInjury} prevention (e.g., ${preventionTip[sport] || preventionTip.General}).`;
    } else if (score < 50) {
      return `Low recovery (score: ${score})—increase rest days by 1 or reduce intensity to protect against ${thresholds.commonInjury}.`;
    } else if (riskLevel === 'high') {
      return `High injury risk detected despite decent recovery (score: ${score})—add preventive measures for ${thresholds.commonInjury} (e.g., ${preventionTip[sport] || preventionTip.General}).`;
    } else {
      return `Recovery adequate (score: ${score})—maintain routine, monitor for ${thresholds.commonInjury}.`;
    }
  };

  // Chart data for performance trends
  const chartData = {
    labels: performanceData.map(data => new Date(data.timestamp).toLocaleDateString()),
    datasets: [
      { label: 'Hours Trained', data: performanceData.map(data => data.hoursTrained || 0), borderColor: 'rgba(75,192,192,1)', fill: false },
      { label: 'Sessions Per Week', data: performanceData.map(data => data.sessionsPerWeek || 0), borderColor: 'rgba(153,102,255,1)', fill: false },
      { label: 'Rest Days', data: performanceData.map(data => data.restDays || 0), borderColor: 'rgba(255,99,132,1)', fill: false },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Value', color: '#ffffff' }, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
      x: { title: { display: true, text: 'Date', color: '#ffffff' }, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      tooltip: { enabled: true },
      title: { display: true, text: 'Performance Trends Over Time', color: '#ffffff' },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const dataPoint = performanceData[index];
        setModalContent({
          title: 'Performance Details',
          content: `Date: ${new Date(dataPoint.timestamp).toLocaleDateString()}\nHours Trained: ${dataPoint.hoursTrained}\nSessions: ${dataPoint.sessionsPerWeek}\nRest Days: ${dataPoint.restDays}`,
        });
      }
    },
  };

  // Efficiency chart data
  const efficiencyChartData = {
    labels: performanceData.map(data => new Date(data.timestamp).toLocaleDateString()),
    datasets: [{
      label: 'Efficiency Score (%)',
      data: performanceData.map(data => 
        calculatePerformanceEfficiency(
          data.hoursTrained || 0,
          data.sessionsPerWeek || 0,
          data.restDays || 0,
          calculateCompetitionWins(athleteData?.competitionHistory || []),
          athleteData?.sport || 'General',
          athleteData?.role || 'General' // Pass role here
        )
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }],
  };

  const efficiencyChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: { display: true, text: 'Performance Efficiency Over Time', color: '#ffffff' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Efficiency (%)', color: '#ffffff' }, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
  };

  const careerProbabilityData = {
    labels: ['Build Elite Potential', 'Competition Ready', 'Refine and Sustain'],
    datasets: [{
      label: 'Probability (%)',
      data: careerGuidance.probabilities.map(p => Math.round(p * 100)),
      backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
    }],
  };

  const careerProbabilityOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: { display: true, text: 'Career Guidance Probabilities', color: '#ffffff' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probability (%)', color: '#ffffff' }, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
  };

  const trainingMetricsData = {
    labels: ['Training Load', 'Recovery Score'],
    datasets: [
      {
        label: 'Metrics',
        data: [trainingMetrics.trainingLoad, trainingMetrics.recoveryScore],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  const trainingMetricsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: { display: true, text: 'Training Metrics', color: '#ffffff' },
    },
    scales: {
      y: { beginAtZero: true, max: 400, ticks: { color: '#ffffff' }, grid: { color: '#444' } },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444' } },
    },
  };

  const toggleSection = (section) => setActiveSection(activeSection === section ? null : section);
  const closeModal = () => setModalContent(null);
  const handleUpdatePerformance = () => navigate(`/performanceupdate/${id}`);

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{athleteData.athleteName}</h1>
        <span className="text-sm text-gray-400">User: {user.name}</span>
      </div>

      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded">{error}</p>}

      {/* Athlete Info Card */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <p><strong>Sport:</strong> {athleteData.sport || 'Not specified'}</p>
          <p><strong>Role:</strong> {athleteData.role || 'General'}</p>
          <p><strong>Age:</strong> {athleteData.age || 'Not specified'}</p>
          <p><strong>Education:</strong> {athleteData.education || 'Not specified'}</p>
          <p><strong>Career Goals:</strong> {athleteData.careerGoals?.join(', ') || 'Not specified'}</p>
          <p><strong>Competition Wins:</strong> {calculateCompetitionWins(athleteData.competitionHistory)}</p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Performance Trends */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('performance')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Performance Trends</h2>
            <span>{activeSection === 'performance' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'performance' && (
            <div className="p-4">
              {performanceData.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-96">
                      <Line ref={chartRef} data={chartData} options={chartOptions} />
                    </div>
                    <div className="h-96">
                      <Bar data={efficiencyChartData} options={efficiencyChartOptions} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-teal-400">Performance Summary</h3>
                    <p className="mt-2">
                      <strong>Efficiency Score:</strong> <span className="text-green-400">{performanceAnalysis.efficiency}%</span> 
                      {performanceAnalysis.efficiency < 50 ? ' (Room for improvement)' : performanceAnalysis.efficiency < 75 ? ' (Solid performance)' : ' (Elite level)'}
                    </p>
                    <p className="mt-2"><strong>Trend:</strong> {performanceAnalysis.trend}</p>
                    <p className="mt-2"><strong>Latest Metrics:</strong> {performanceSuggestion}</p>
                    <h3 className="text-lg font-medium text-blue-400 mt-4">Optimization Recommendations</h3>
                    <ul className="list-disc pl-5 mt-2">
                      {performanceAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p>No performance data available.</p>
              )}
            </div>
          )}
        </div>

        {/* Injury Prevention */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('injury')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Injury Prevention</h2>
            <span>{activeSection === 'injury' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'injury' && (
            <div className="p-4">
              <p><strong>Risk Level:</strong> <span className={trainingMetrics.riskFlag === 'High Risk' ? 'text-red-400' : trainingMetrics.riskFlag === 'Moderate Risk' ? 'text-yellow-400' : 'text-green-400'}>{trainingMetrics.riskFlag}</span></p>
              <p className="mt-2">{trainingMetrics.insights.trainingLoad}</p>
              <p className="mt-2">{trainingMetrics.insights.recoveryScore}</p>
              <p className="mt-2">{trainingMetrics.insights.riskFlag}</p>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-blue-400">Recommendations</h3>
                <ul className="list-disc pl-5 mt-2">
                  {trainingMetrics.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-300">
                      <strong>{rec.recommendation}:</strong> {rec.explanation}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="h-64 mt-4">
                <Bar data={trainingMetricsData} options={trainingMetricsOptions} />
              </div>
              {athleteData.injuryHistory?.length > 0 ? (
                <table className="w-full mt-2 text-sm border border-gray-600">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="p-2 border border-gray-600">Injury</th>
                      <th className="p-2 border border-gray-600">Severity</th>
                      <th className="p-2 border border-gray-600">Recovery Time</th>
                      <th className="p-2 border border-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athleteData.injuryHistory.map((injury, index) => (
                      <tr key={index} className="hover:bg-gray-600">
                        <td className="p-2 border border-gray-600">{injury.injury || 'Unknown'}</td>
                        <td className="p-2 border border-gray-600">{injury.severity || 'N/A'}</td>
                        <td className="p-2 border border-gray-600">{injury.recoveryTime || 'N/A'}</td>
                        <td className="p-2 border border-gray-600">{injury.date ? new Date(injury.date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2">No detailed injury history available.</p>
              )}
              {injuryPrediction ? (
                <div className="mt-4">
                  <p>
                    <strong>Risk:</strong>{' '}
                    <span className={
                      injuryPrediction.injuryRisk.includes('High') || injuryPrediction.injuryRisk.includes('Critical') 
                        ? 'text-red-400' 
                        : injuryPrediction.injuryRisk.includes('Moderate') || injuryPrediction.injuryRisk.includes('Medium') 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }>
                      {injuryPrediction.injuryRisk}
                    </span>
                    {injuryPrediction.predictionScore && ` (${Math.round(injuryPrediction.predictionScore * 100)}%)`}
                  </p>
                  {injuryPreventionSuggestion && <p className="mt-2 text-orange-400">{injuryPreventionSuggestion}</p>}
                </div>
              ) : (
                <p className="mt-2">No injury prediction available.</p>
              )}
            </div>
          )}
        </div>

        {/* Personalized Training Schedule */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('training')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Personalized Training Schedule</h2>
            <span>{activeSection === 'training' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'training' && (
            <div className="p-4">
              {trainingSchedule ? (
                <>
                  <p className="text-lg"><strong className="text-gray-300">Sport:</strong> <span className="text-teal-400">{trainingSchedule.sport}</span></p>
                  <h3 className="text-lg font-medium text-blue-400 mt-4">Weekly Training Plan</h3>
                  <ul className="list-disc pl-5 mt-2">
                    {trainingSchedule.schedule.map((day, index) => (
                      <li key={index} className="text-gray-300">
                        <strong>{day.day}:</strong> {day.trainingType}
                        <p>{day.details}</p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-400">Generating training schedule...</p>
              )}
            </div>
          )}
        </div>

        {/* Career Guidance */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('career')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Career Guidance</h2>
            <span>{activeSection === 'career' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'career' && (
            <div className="p-4">
              {careerGuidance.guidance ? (
                <>
                  <p className="text-lg"><strong className="text-gray-300">Guidance:</strong> <span className="text-teal-400">{careerGuidance.guidance}</span></p>
                  <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: careerGuidance.analysis }} />
                  <p className="mt-4"><strong className="text-gray-300">Estimated Time to Goal:</strong> <span className="text-green-400">{careerGuidance.yearsToGoal} years</span></p>
                  <div className="h-64 mt-4">
                    <Bar data={careerProbabilityData} options={careerProbabilityOptions} />
                  </div>
                  {athleteData.careerGoals?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-blue-400">Resources</h3>
                      <ul className="list-disc pl-5 mt-2">
                        {athleteData.careerGoals.flatMap(goal =>
                          careerResources[goal]?.map((resource, index) => (
                            <li key={index}>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                {resource.name}
                              </a>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Analyzing career guidance...</p>
              )}
            </div>
          )}
        </div>

        {/* Financial Planning */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('financial')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Financial Planning</h2>
            <span>{activeSection === 'financial' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'financial' && (
            <div className="p-4">
              {financialPlanning.advice ? (
                <>
                  <p className="text-lg"><strong className="text-gray-300">Strategy:</strong> <span className="text-purple-400">{financialPlanning.advice}</span></p>
                  <ul className="list-disc pl-5 mt-4 text-sm">
                    <li><strong className="text-gray-300">Build Savings:</strong> <span className="text-teal-400">{Math.round(financialPlanning.probabilities[0] * 100)}%</span></li>
                    <li><strong class="text-gray-300">Invest for Growth:</strong> <span className="text-green-400">${Math.round(financialPlanning.probabilities[1] * 100)}%</span></li>
                    <li><strong class="text-gray-300">Optimize Expenses:</strong> <span className="text-orange-400">${Math.round(financialPlanning.probabilities[2] * 100)}%</span></li>
                  </ul>
                  <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: financialPlanning.analysis }} />
                </>
              ) : (
                <p className="text-gray-400">Analyzing financial plan...</p>
              )}
            </div>
          )}
        </div>

        {/* Meal Plan Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          <button
            onClick={() => toggleSection('mealPlan')}
            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold">Generate Meal Plan</h2>
            <span>{activeSection === 'mealPlan' ? '▲' : '▼'}</span>
          </button>
          {activeSection === 'mealPlan' && (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={mealPlanInput.height}
                    onChange={handleMealPlanInputChange}
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
                    placeholder="Enter height in cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={mealPlanInput.weight}
                    onChange={handleMealPlanInputChange}
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Goal</label>
                  <select
                    name="goal"
                    value={mealPlanInput.goal}
                    onChange={handleMealPlanInputChange}
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
                  >
                    <option value="">Select Goal</option>
                    <option value="weight loss">Weight Loss</option>
                    <option value="muscle gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <button
                onClick={generateMealPlan}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Generate Meal Plan
              </button>
              {mealPlanError && <p className="text-red-400 mt-2">{mealPlanError}</p>}
              {mealPlan && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-blue-400">Weekly Meal Plan</h3>
                  <p className="mt-2 text-gray-300">Total Calories: {mealPlan.totalCalories}</p>
                  <p className="mt-2 text-gray-300">
                    Macronutrients: Protein: {mealPlan.macronutrients.protein}, Carbs: {mealPlan.macronutrients.carbs}, Fats: {mealPlan.macronutrients.fats}
                  </p>
                  <div className="mt-4">
                    {mealPlan.weeklyMealPlan.map((dayPlan, index) => (
                      <div key={index} className="mb-4">
                        <h4 className="text-md font-semibold text-teal-400 capitalize">{dayPlan.day}</h4>
                        <ul className="list-disc pl-5 mt-2">
                          {dayPlan.meals.map((meal, mealIndex) => (
                            <li key={mealIndex} className="text-gray-300">
                              <strong>{meal.title}</strong> - Ready in {meal.readyInMinutes} minutes, Servings: {meal.servings}
                              <a
                                href={meal.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline ml-2"
                              >
                                View Recipe
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleUpdatePerformance}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Update Performance
        </button>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-semibold mb-4">{modalContent.title}</h3>
            <p className="text-sm whitespace-pre-wrap">{modalContent.content}</p>
            <button
              onClick={closeModal}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AthleteDetailPage;