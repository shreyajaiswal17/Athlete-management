// import React, { useEffect, useState, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth0 } from '@auth0/auth0-react';
// import { Line, Bar } from 'react-chartjs-2';
// import axios from 'axios';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // Sample fallback data
// const fallbackAthleteData = {
//   1: { id: 1, athleteName: 'John Doe', sport: 'Basketball', age: 25, education: 'BS in Kinesiology', careerGoals: ['Professional Athlete'], performance: 'Excellent', injuryHistory: [], competitionHistory: [] },
//   2: { id: 2, athleteName: 'Jane Smith', sport: 'Swimming', age: 22, education: 'BA in Sports Management', careerGoals: ['Coach'], performance: 'Good', injuryHistory: [], competitionHistory: [] },
//   3: { id: 3, athleteName: 'Mike Johnson', sport: 'Track', age: 28, education: 'MS in Exercise Science', careerGoals: ['Olympian', 'Trainer'], performance: 'Very Good', injuryHistory: [], competitionHistory: [] }
// };

// // Resource mapping for career goals
// const careerResources = {
//   'Professional Athlete': [
//     { name: 'LinkedIn Sports Jobs', url: 'https://www.linkedin.com/jobs/sports-jobs' },
//     { name: 'TeamWork Online', url: 'https://www.teamworkonline.com' },
//   ],
//   'Coach': [
//     { name: 'USA Coaching Certification', url: 'https://www.usacoaching.org' },
//     { name: 'National Coaching Courses', url: 'https://www.ukcoaching.org' },
//   ],
//   'Olympian': [
//     { name: 'Olympic Training Programs', url: 'https://www.teamusa.org' },
//     { name: 'International Olympic Committee', url: 'https://olympics.com/ioc' },
//   ],
//   'Trainer': [
//     { name: 'NASM Certification', url: 'https://www.nasm.org' },
//     { name: 'ACE Fitness', url: 'https://www.acefitness.org' },
//   ],
// };

// // Helper function to calculate competition wins from competitionHistory
// const calculateCompetitionWins = (competitionHistory) => {
//   if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
//   return competitionHistory.filter(comp => {
//     const result = comp.result?.toLowerCase();
//     return result === '1st' || result === 'win';
//   }).length;
// };

// function AthleteDetailPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth0();
//   const [athleteData, setAthleteData] = useState(null);
//   const [performanceData, setPerformanceData] = useState([]);
//   const [injuryPrediction, setInjuryPrediction] = useState(null);
//   const [performanceSuggestion, setPerformanceSuggestion] = useState('');
//   const [injuryPreventionSuggestion, setInjuryPreventionSuggestion] = useState('');
//   const [careerGuidance, setCareerGuidance] = useState({ guidance: '', probabilities: [], analysis: '', yearsToGoal: 0 });
//   const [financialPlanning, setFinancialPlanning] = useState({ advice: '', probabilities: [], analysis: '' });
//   const [error, setError] = useState(null);
//   const chartRef = useRef(null);

//   // Fetch athlete data and injury prediction
//   useEffect(() => {
//     const fetchAthleteData = async () => {
//       try {
//         const performanceResponse = await axios.get(`http://localhost:3000/api/athlete/performance/${id}`);
//         console.log('Performance Response Data:', performanceResponse.data);
//         if (!performanceResponse.data || !performanceResponse.data.performanceData) {
//           throw new Error('No performance data found in response');
//         }
//         const athlete = performanceResponse.data.performanceData[0];
//         const sortedPerformanceData = performanceResponse.data.performanceData.sort(
//           (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//         );
//         setAthleteData(athlete);
//         setPerformanceData(sortedPerformanceData);
//       } catch (err) {
//         console.error('Error fetching athlete data:', err);
//         setError(`Failed to load performance data: ${err.message}`);
//         setAthleteData(fallbackAthleteData[id] ? { ...fallbackAthleteData[id], performanceData: [] } : null);
//       }
//     };

//     const fetchInjuryPrediction = async () => {
//       try {
//         const injuryResponse = await axios.get(`http://localhost:3000/api/athlete/injury-prediction/${id}`);
//         console.log('Injury Prediction Response Data:', injuryResponse.data);
//         if (!injuryResponse.data || !injuryResponse.data.injuryPrediction) {
//           throw new Error('No injury prediction found in response');
//         }
//         setInjuryPrediction(injuryResponse.data.injuryPrediction);
//       } catch (err) {
//         console.error('Error fetching injury prediction:', err);
//         setError(prev => prev ? `${prev} | Injury prediction error: ${err.message}` : `Injury prediction error: ${err.message}`);
//       }
//     };

//     fetchAthleteData();
//     fetchInjuryPrediction();

//     return () => {
//       if (chartRef.current) chartRef.current.destroy();
//     };
//   }, [id]);

//   // Fetch career guidance with tools
//   useEffect(() => {
//     const fetchCareerGuidance = async () => {
//       try {
//         console.log('Training career model...');
//         const trainResponse = await axios.get('http://localhost:3000/api/ai/train');
//         console.log('Train Response:', trainResponse.data);
//         if (trainResponse.data.message !== 'Model trained successfully and stored in memory') {
//           throw new Error('Model training failed: ' + trainResponse.data.message);
//         }

//         const latestPerformance = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
//         const athlete = athleteData || {};

//         // Calculate competitionWins from competitionHistory
//         const competitionWins = calculateCompetitionWins(athlete.competitionHistory);

//         const careerInput = {
//           age: athlete.age || 0,
//           hoursTrained: latestPerformance?.hoursTrained || 0,
//           injuryCount: latestPerformance?.pastInjuries || athlete.injuryHistory?.length || 0,
//           sessionsPerWeek: latestPerformance?.sessionsPerWeek || 0,
//           competitionWins, // Use calculated value
//         };

//         console.log('Career Input:', careerInput);
//         const response = await axios.post('http://localhost:3000/api/ai/career-guidance', careerInput);
//         console.log('Career Guidance Response:', response.data);

//         const guidance = response.data.careerGuidance;
//         const probabilities = response.data.probabilities;
//         const sport = athlete.sport || 'your sport';
//         const education = athlete.education || 'Not specified';
//         const careerGoals = athlete.careerGoals || ['Not specified'];
//         const hoursTrained = careerInput.hoursTrained;
//         const injuryCount = careerInput.injuryCount;
//         const sessionsPerWeek = careerInput.sessionsPerWeek;
//         const age = careerInput.age;
//         const restDays = latestPerformance?.restDays || 0;

//         // Tool 1: Career Path Simulator
//         const baselineYearsToGoal = careerGoals.includes('Olympian') ? 8 : careerGoals.includes('Professional Athlete') ? 5 : 3;
//         const trainingFactor = hoursTrained > 20 ? 0.8 : hoursTrained > 10 ? 1 : 1.2;
//         const winsFactor = competitionWins > 5 ? 0.9 : competitionWins > 2 ? 1 : 1.1;
//         const injuryFactor = injuryCount > 1 ? 1.2 : 1;
//         const yearsToGoal = Math.round(baselineYearsToGoal * trainingFactor * winsFactor * injuryFactor);

//         let analysis = `### Career Analysis (Age ${age}, ${sport})\n\n`;
//         analysis += `**Profile**: Training ${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days, ${injuryCount} injuries, ${competitionWins} wins. Education: ${education}. Goals: ${careerGoals.join(', ')}.\n\n`;

//         if (guidance === 'Focus on Training') {
//           analysis += `#### Focus on Training (Probability: ${Math.round(probabilities[0] * 100)}%)\n`;
//           analysis += `- **Why**: Your ${hoursTrained} hours/week show ${hoursTrained > 20 ? 'solid effort' : 'room to grow'}, with ${competitionWins} wins indicating potential.\n`;
//           analysis += `- **Next Steps**: Increase to ${(hoursTrained * 1.2).toFixed(1)} hours/week with ${sport}-specific drills.\n`;
//         } else if (guidance === 'Competition Ready') {
//           analysis += `#### Competition Ready (Probability: ${Math.round(probabilities[1] * 100)}%)\n`;
//           analysis += `- **Why**: ${competitionWins} wins and ${hoursTrained} hours/week suggest peak form.\n`;
//           analysis += `- **Next Steps**: Schedule mock competitions monthly.\n`;
//         } else if (guidance === 'Injury Prevention') {
//           analysis += `#### Injury Prevention (Probability: ${Math.round(probabilities[2] * 100)}%)\n`;
//           analysis += `- **Why**: ${injuryCount} injuries require recovery focus.\n`;
//           analysis += `- **Next Steps**: Reduce to ${(hoursTrained * 0.7).toFixed(1)} hours/week, add 1-2 rest days.\n`;
//         }

//         analysis += `\n**Probability Breakdown**: Focus on Training (${Math.round(probabilities[0] * 100)}%), Competition Ready (${Math.round(probabilities[1] * 100)}%), Injury Prevention (${Math.round(probabilities[2] * 100)}%).`;

//         setCareerGuidance({
//           guidance,
//           probabilities,
//           analysis,
//           yearsToGoal,
//         });
//       } catch (err) {
//         console.error('Error fetching career guidance:', err);
//         setError(prev => prev ? `${prev} | Career guidance error: ${err.message}` : `Career guidance error: ${err.message}`);
//         setCareerGuidance({ guidance: 'Unable to analyze career at this time.', probabilities: [], analysis: '', yearsToGoal: 0 });
//       }
//     };

//     if (athleteData && performanceData.length > 0) {
//       fetchCareerGuidance();
//     }
//   }, [athleteData, performanceData]);

//   // Fetch financial planning
//   useEffect(() => {
//     const fetchFinancialPlanning = async () => {
//       try {
//         console.log('Training financial model...');
//         const trainResponse = await axios.get('http://localhost:3000/finance/financial-train');
//         console.log('Financial Train Response:', trainResponse.data);
//         if (trainResponse.data.message !== 'Financial model trained successfully and stored in memory') {
//           throw new Error('Financial model training failed: ' + trainResponse.data.message);
//         }

//         const athlete = athleteData || {};
//         const latestPerformance = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;

//         // Calculate competitionWins from competitionHistory
//         const competitionWins = calculateCompetitionWins(athlete.competitionHistory);

//         const financialInput = {
//           age: athlete.age || 0,
//           currentIncome: athlete.currentIncome || 0,
//           expenses: latestPerformance?.expenses || 0,
//           savings: athlete.savings || 0,
//           sport: athlete.sport || 'unknown',
//           competitionWins, // Use calculated value
//           injuryCount: latestPerformance?.pastInjuries || athlete.injuryHistory?.length || 0,
//           careerGoals: athlete.careerGoals || ['Not specified'],
//         };

//         console.log('Financial Input:', financialInput);
//         const response = await axios.post('http://localhost:3000/finance/financial-guidance', financialInput);
//         console.log('Financial Guidance Response:', response.data);

//         const advice = response.data.financialAdvice;
//         const probabilities = response.data.probabilities;
//         const { age, currentIncome: income, expenses, savings, sport, injuryCount, careerGoals } = financialInput;

//         const annualSurplus = income - expenses;
//         const savingsTarget = income * 0.25;
//         const injuryRiskCost = injuryCount > 0 ? expenses * 0.3 : 0;
//         const projectedIncomeGrowth = competitionWins > 2 ? income * 1.1 : income;
//         const savingsIn10Years = savings * (1 + 0.05) ** 10;

//         let analysis = `### Financial Planning Analysis (Age ${age}, ${sport})\n\n`;
//         analysis += `**Current Profile**: Income: $${income}/year, Expenses: $${expenses}/year, Savings: $${savings}, Wins: ${competitionWins}, Injuries: ${injuryCount}. Goals: ${careerGoals.join(', ')}.\n\n`;
//         analysis += `#### Build Emergency Savings (Probability: ${Math.round(probabilities[0] * 100)}%)\n`;
//         analysis += `- **Why**: Your $${annualSurplus} surplus ${annualSurplus > 0 ? 'supports saving' : 'requires expense cuts'}. Injuries may cost $${injuryRiskCost}/year.\n`;
//         analysis += `- **How**: Save $${savingsTarget.toFixed(0)}/year (25% of income).\n`;
//         analysis += `#### Invest for Future Growth (Probability: ${Math.round(probabilities[1] * 100)}%)\n`;
//         analysis += `- **Why**: With $${savings}, ${income > expenses ? 'you can grow wealth' : 'investing waits until surplus increases'}.\n`;
//         analysis += `- **How**: Invest $${Math.min(savings * 0.5, 5000).toFixed(0)} in an S&P 500 ETF.\n`;
//         analysis += `#### Optimize Expenses (Probability: ${Math.round(probabilities[2] * 100)}%)\n`;
//         analysis += `- **Why**: $${expenses} is ${expenses > income * 0.6 ? 'over 60% of income' : 'manageable'}.\n`;
//         analysis += `- **How**: Cut $${(expenses * 0.3).toFixed(0)} (30%) via shared training costs.\n`;
//         analysis += `\n**Summary**: In 10 years, savings could grow to $${savingsIn10Years.toFixed(0)} at 5% APY.`;

//         setFinancialPlanning({
//           advice,
//           probabilities,
//           analysis,
//         });
//       } catch (err) {
//         console.error('Error fetching financial planning:', err);
//         setError(prev => prev ? `${prev} | Financial planning error: ${err.message}` : `Financial planning error: ${err.message}`);
//         setFinancialPlanning({ advice: 'Unable to analyze financial plan at this time.', probabilities: [], analysis: '' });
//       }
//     };

//     if (athleteData && performanceData.length > 0) {
//       fetchFinancialPlanning();
//     }
//   }, [athleteData, performanceData]);

//   // Generate injury prevention suggestions
//   useEffect(() => {
//     if (athleteData && injuryPrediction) {
//       generatePreventionSuggestions(injuryPrediction, athleteData, performanceData);
//     }
//   }, [athleteData, injuryPrediction, performanceData]);

//   const generatePreventionSuggestions = (prediction, data, perfData) => {
//     if (!data || !perfData.length) {
//       setPerformanceSuggestion('Insufficient data to analyze performance trends.');
//       setInjuryPreventionSuggestion(prediction?.preventionRecommendation || 'No specific prevention recommendation available.');
//       return;
//     }

//     const latestPerf = perfData[perfData.length - 1];
//     const hoursTrained = latestPerf.hoursTrained || 0;
//     const sessionsPerWeek = latestPerf.sessionsPerWeek || 0;
//     const restDays = latestPerf.restDays || 0;
//     const pastInjuries = latestPerf.pastInjuries || 0;
//     const age = data.age || 0;
//     const sport = data.sport || 'your sport';

//     const avgHours = perfData.length > 1 ? perfData.slice(0, -1).reduce((sum, d) => sum + d.hoursTrained, 0) / (perfData.length - 1) : hoursTrained;
//     const hoursTrend = hoursTrained > avgHours ? `increased by ${(hoursTrained - avgHours).toFixed(1)} hours` : `stable or decreased by ${(avgHours - hoursTrained).toFixed(1)} hours`;

//     let suggestion = `Your training (${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days) shows a ${hoursTrend} trend. For ${sport} at age ${age} with ${pastInjuries} injuries, adjust to ${(hoursTrained * 0.9).toFixed(1)} hours/week to optimize performance.`;

//     setPerformanceSuggestion(suggestion);
//     setInjuryPreventionSuggestion(prediction?.preventionRecommendation || 'No specific prevention recommendation available.');
//   };

//   // Chart data for performance trends
//   const chartData = {
//     labels: performanceData.map(data => {
//       const date = new Date(data.timestamp);
//       return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString();
//     }),
//     datasets: [
//       { label: 'Hours Trained', data: performanceData.map(data => data.hoursTrained || 0), borderColor: 'rgba(75,192,192,1)', fill: false },
//       { label: 'Sessions Per Week', data: performanceData.map(data => data.sessionsPerWeek || 0), borderColor: 'rgba(153,102,255,1)', fill: false },
//       { label: 'Rest Days', data: performanceData.map(data => data.restDays || 0), borderColor: 'rgba(255,99,132,1)', fill: false },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: { beginAtZero: true, title: { display: true, text: 'Value' } },
//       x: { title: { display: true, text: 'Date' } },
//     },
//     plugins: {
//       legend: { position: 'top' },
//       tooltip: { enabled: true },
//       title: { display: true, text: 'Performance Trends Over Time' },
//     },
//   };

//   // Chart data for career guidance probabilities
//   const careerProbabilityData = {
//     labels: ['Focus on Training', 'Competition Ready', 'Injury Prevention'],
//     datasets: [{
//       label: 'Probability (%)',
//       data: careerGuidance.probabilities.map(p => Math.round(p * 100)),
//       backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
//     }],
//   };

//   const careerProbabilityOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: 'top' },
//       title: { display: true, text: 'Career Guidance Probabilities' },
//     },
//     scales: {
//       y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probability (%)' } },
//     },
//   };

//   const handleUpdatePerformance = () => navigate(`/performanceupdate/${id}`);

//   if (!athleteData && !error) return <div>Loading...</div>;
//   if (!athleteData) return <div className="athlete-detail-container">Athlete not found</div>;

//   return (
//     <div className="athlete-detail-container">
//       <div className="header">
//         <h1>Athlete Details</h1>
//         <span>User: {user.name}</span>
//       </div>

//       {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

//       <div className="athlete-info">
//         <h2>{athleteData.athleteName}</h2>
//         <p>Sport: {athleteData.sport || 'Not specified'}</p>
//         <p>Age: {athleteData.age || 'Not specified'}</p>
//         <p>Education: {athleteData.education || 'Not specified'}</p>
//         <p>Career Goals: {athleteData.careerGoals?.join(', ') || 'Not specified'}</p>
//         <p>Competition Wins: {calculateCompetitionWins(athleteData.competitionHistory)}</p> {/* Display wins */}
//       </div>

//       {/* Rest of the JSX remains unchanged */}
//       <section className="performance-section">
//         <h2>Performance Trends</h2>
//         {performanceData.length > 0 ? (
//           <div style={{ height: '400px', width: '100%' }}>
//             <h3>Performance Analysis Graph</h3>
//             <Line ref={chartRef} data={chartData} options={chartOptions} />
//             {performanceSuggestion && (
//               <p className="suggestion" style={{ color: '#007bff', marginTop: '10px' }}>
//                 <strong>AI Performance Analysis:</strong> {performanceSuggestion}
//               </p>
//             )}
//           </div>
//         ) : (
//           <p>No performance data available.</p>
//         )}
//       </section>

//       <section className="injury-section">
//         <h2>Injury Prevention Analysis</h2>
//         <div>
//           <h3>Past Injuries</h3>
//           <p>Past Injuries Count: {performanceData[0]?.pastInjuries || 0}</p>
//           {athleteData.injuryHistory && athleteData.injuryHistory.length > 0 ? (
//             <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
//               <thead>
//                 <tr>
//                   <th style={{ border: '1px solid #ddd', padding: '8px' }}>Injury</th>
//                   <th style={{ border: '1px solid #ddd', padding: '8px' }}>Severity</th>
//                   <th style={{ border: '1px solid #ddd', padding: '8px' }}>Recovery Time (days)</th>
//                   <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {athleteData.injuryHistory.map((injury, index) => (
//                   <tr key={index}>
//                     <td style={{ border: '1px solid #ddd', padding: '8px' }}>{injury.injury || 'Unknown'}</td>
//                     <td style={{ border: '1px solid #ddd', padding: '8px' }}>{injury.severity || 'N/A'}</td>
//                     <td style={{ border: '1px solid #ddd', padding: '8px' }}>{injury.recoveryTime || 'N/A'}</td>
//                     <td style={{ border: '1px solid #ddd', padding: '8px' }}>
//                       {injury.date ? new Date(injury.date).toLocaleDateString() : 'N/A'}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <p>No detailed injury history available.</p>
//           )}
//           <h3>Injury Risk and Prevention</h3>
//           {injuryPrediction ? (
//             <div>
//               <p>
//                 <strong>Predicted Injury Risk:</strong>{' '}
//                 <span style={{ color: injuryPrediction.injuryRisk.includes('High') || injuryPrediction.injuryRisk.includes('Critical') ? 'red' : 'green' }}>
//                   {injuryPrediction.injuryRisk}
//                 </span>
//                 {injuryPrediction.predictionScore && (
//                   <span> (Probability: {Math.round(injuryPrediction.predictionScore * 100)}%)</span>
//                 )}
//               </p>
//               {injuryPreventionSuggestion && (
//                 <p style={{ color: '#ff9800', marginTop: '10px' }}>
//                   <strong>Prevention Recommendation:</strong> {injuryPreventionSuggestion}
//                 </p>
//               )}
//             </div>
//           ) : (
//             <p>No injury prediction available.</p>
//           )}
//         </div>
//       </section>

//       <section className="ai-career-section">
//         <h2>AI Career Guidance</h2>
//         {careerGuidance.guidance ? (
//           <div>
//             <p><strong>Career Guidance:</strong> {careerGuidance.guidance}</p>
//             <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
//               <strong>Detailed Analysis:</strong> {careerGuidance.analysis}
//             </p>
//             {/* Tool 1: Career Path Simulator */}
//             <div style={{ marginTop: '20px' }}>
//               <h3>Career Path Simulator</h3>
//               <p>
//                 Estimated time to achieve your goal ({athleteData.careerGoals?.join(' or ') || 'Not specified'}): 
//                 <strong> {careerGuidance.yearsToGoal} years</strong> based on current training and performance.
//               </p>
//               <p style={{ fontSize: '0.9em', color: '#555' }}>
//                 (Assumes consistent effort; adjust training or wins to change timeline.)
//               </p>
//             </div>

//             {/* Tool 2: External Resource Links */}
//             <div style={{ marginTop: '20px' }}>
//               <h3>Resources for Your Career Goals</h3>
//               {athleteData.careerGoals?.length > 0 ? (
//                 <ul>
//                   {athleteData.careerGoals.flatMap(goal =>
//                     careerResources[goal]?.map((resource, index) => (
//                       <li key={index}>
//                         <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
//                           {resource.name}
//                         </a>
//                       </li>
//                     ))
//                   )}
//                 </ul>
//               ) : (
//                 <p>No specific resources available for unspecified goals.</p>
//               )}
//             </div>

//             {/* Tool 3: Probability Visualization */}
//             <div style={{ marginTop: '20px', height: '300px' }}>
//               <h3>Guidance Probability Breakdown</h3>
//               <Bar data={careerProbabilityData} options={careerProbabilityOptions} />
//             </div>
//           </div>
//         ) : (
//           <p>Analyzing career guidance...</p>
//         )}
//       </section>

//       <section className="financial-planning-section">
//         <h2>Financial Planning</h2>
//         {financialPlanning.advice ? (
//           <div>
//             <p><strong>Recommended Strategy:</strong> {financialPlanning.advice}</p>
//             <p><strong>Probabilities:</strong></p>
//             <ul>
//               <li>Build Savings: {Math.round(financialPlanning.probabilities[0] * 100)}%</li>
//               <li>Invest for Growth: {Math.round(financialPlanning.probabilities[1] * 100)}%</li>
//               <li>Optimize Expenses: {Math.round(financialPlanning.probabilities[2] * 100)}%</li>
//             </ul>
//             <div style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
//               <strong>Detailed Analysis:</strong>
//               <div dangerouslySetInnerHTML={{ __html: financialPlanning.analysis.replace(/\n/g, '<br>').replace(/####/g, '<h4>').replace(/###/g, '<h3>') }} />
//             </div>
//           </div>
//         ) : (
//           <p>Analyzing financial plan...</p>
//         )}
//       </section>

//       <div className="button-container">
//         <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
//         <button onClick={handleUpdatePerformance} className="update-performance-btn">Update Weekly Performance</button>
//       </div>
//     </div>
//   );
// }

// export default AthleteDetailPage;

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

// Sample fallback data
const fallbackAthleteData = {
  1: { id: 1, athleteName: 'John Doe', sport: 'Basketball', age: 25, education: 'BS in Kinesiology', careerGoals: ['Professional Athlete'], performance: 'Excellent', injuryHistory: [], competitionHistory: [] },
  2: { id: 2, athleteName: 'Jane Smith', sport: 'Swimming', age: 22, education: 'BA in Sports Management', careerGoals: ['Coach'], performance: 'Good', injuryHistory: [], competitionHistory: [] },
  3: { id: 3, athleteName: 'Mike Johnson', sport: 'Track', age: 28, education: 'MS in Exercise Science', careerGoals: ['Olympian', 'Trainer'], performance: 'Very Good', injuryHistory: [], competitionHistory: [] }
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

// Helper function to calculate competition wins from competitionHistory
const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

function AthleteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [injuryPrediction, setInjuryPrediction] = useState(null);
  const [performanceSuggestion, setPerformanceSuggestion] = useState('');
  const [injuryPreventionSuggestion, setInjuryPreventionSuggestion] = useState('');
  const [careerGuidance, setCareerGuidance] = useState({ guidance: '', probabilities: [], analysis: '', yearsToGoal: 0 });
  const [financialPlanning, setFinancialPlanning] = useState({ advice: '', probabilities: [], analysis: '' });
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Fetch athlete data and injury prediction
  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        const performanceResponse = await axios.get(`http://localhost:3000/api/athlete/performance/${id}`);
        console.log('Performance Response Data:', performanceResponse.data);
        if (!performanceResponse.data || !performanceResponse.data.performanceData) {
          throw new Error('No performance data found in response');
        }
        const athlete = performanceResponse.data.performanceData[0];
        const sortedPerformanceData = performanceResponse.data.performanceData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setAthleteData(athlete);
        setPerformanceData(sortedPerformanceData);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError(`Failed to load performance data: ${err.message}`);
        setAthleteData(fallbackAthleteData[id] ? { ...fallbackAthleteData[id], performanceData: [] } : null);
      }
    };

    const fetchInjuryPrediction = async () => {
      try {
        const injuryResponse = await axios.get(`http://localhost:3000/api/athlete/injury-prediction/${id}`);
        console.log('Injury Prediction Response Data:', injuryResponse.data);
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

  // Fetch career guidance with tools
  useEffect(() => {
    const fetchCareerGuidance = async () => {
      try {
        console.log('Training career model...');
        const trainResponse = await axios.get('http://localhost:3000/api/ai/train');
        console.log('Train Response:', trainResponse.data);
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

        console.log('Career Input:', careerInput);
        const response = await axios.post('http://localhost:3000/api/ai/career-guidance', careerInput);
        console.log('Career Guidance Response:', response.data);

        const guidance = response.data.careerGuidance;
        const probabilities = response.data.probabilities;
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

        let analysis = `### Career Analysis (Age ${age}, ${sport})\n\n`;
        analysis += `**Profile**: Training ${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days, ${injuryCount} injuries, ${competitionWins} wins. Education: ${education}. Goals: ${careerGoals.join(', ')}.\n\n`;

        if (guidance === 'Focus on Training') {
          analysis += `#### Focus on Training (Probability: ${Math.round(probabilities[0] * 100)}%)\n`;
          analysis += `- **Why**: Your ${hoursTrained} hours/week show ${hoursTrained > 20 ? 'solid effort' : 'room to grow'}, with ${competitionWins} wins indicating potential.\n`;
          analysis += `- **Next Steps**: Increase to ${(hoursTrained * 1.2).toFixed(1)} hours/week with ${sport}-specific drills.\n`;
        } else if (guidance === 'Competition Ready') {
          analysis += `#### Competition Ready (Probability: ${Math.round(probabilities[1] * 100)}%)\n`;
          analysis += `- **Why**: ${competitionWins} wins and ${hoursTrained} hours/week suggest peak form.\n`;
          analysis += `- **Next Steps**: Schedule mock competitions monthly.\n`;
        } else if (guidance === 'Injury Prevention') {
          analysis += `#### Injury Prevention (Probability: ${Math.round(probabilities[2] * 100)}%)\n`;
          analysis += `- **Why**: ${injuryCount} injuries require recovery focus.\n`;
          analysis += `- **Next Steps**: Reduce to ${(hoursTrained * 0.7).toFixed(1)} hours/week, add 1-2 rest days.\n`;
        }

        analysis += `\n**Probability Breakdown**: Focus on Training (${Math.round(probabilities[0] * 100)}%), Competition Ready (${Math.round(probabilities[1] * 100)}%), Injury Prevention (${Math.round(probabilities[2] * 100)}%).`;

        setCareerGuidance({
          guidance,
          probabilities,
          analysis,
          yearsToGoal,
        });
      } catch (err) {
        console.error('Error fetching career guidance:', err);
        setError(prev => prev ? `${prev} | Career guidance error: ${err.message}` : `Career guidance error: ${err.message}`);
        setCareerGuidance({ guidance: 'Unable to analyze career at this time.', probabilities: [], analysis: '', yearsToGoal: 0 });
      }
    };

    if (athleteData && performanceData.length > 0) {
      fetchCareerGuidance();
    }
  }, [athleteData, performanceData]);

  // Fetch financial planning
  useEffect(() => {
    const fetchFinancialPlanning = async () => {
      try {
        console.log('Training financial model...');
        const trainResponse = await axios.get('http://localhost:3000/finance/financial-train');
        console.log('Financial Train Response:', trainResponse.data);
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

        console.log('Financial Input:', financialInput);
        const response = await axios.post('http://localhost:3000/finance/financial-guidance', financialInput);
        console.log('Financial Guidance Response:', response.data);

        const advice = response.data.financialAdvice;
        const probabilities = response.data.probabilities;
        const { age, currentIncome: income, expenses, savings, sport, injuryCount, careerGoals } = financialInput;

        const annualSurplus = income - expenses;
        const savingsTarget = income * 0.25;
        const injuryRiskCost = injuryCount > 0 ? expenses * 0.3 : 0;
        const projectedIncomeGrowth = competitionWins > 2 ? income * 1.1 : income;
        const savingsIn10Years = savings * (1 + 0.05) ** 10;

        let analysis = `### Financial Planning Analysis (Age ${age}, ${sport})\n\n`;
        analysis += `**Current Profile**: Income: $${income}/year, Expenses: $${expenses}/year, Savings: $${savings}, Wins: ${competitionWins}, Injuries: ${injuryCount}. Goals: ${careerGoals.join(', ')}.\n\n`;
        analysis += `#### Build Emergency Savings (Probability: ${Math.round(probabilities[0] * 100)}%)\n`;
        analysis += `- **Why**: Your $${annualSurplus} surplus ${annualSurplus > 0 ? 'supports saving' : 'requires expense cuts'}. Injuries may cost $${injuryRiskCost}/year.\n`;
        analysis += `- **How**: Save $${savingsTarget.toFixed(0)}/year (25% of income).\n`;
        analysis += `#### Invest for Future Growth (Probability: ${Math.round(probabilities[1] * 100)}%)\n`;
        analysis += `- **Why**: With $${savings}, ${income > expenses ? 'you can grow wealth' : 'investing waits until surplus increases'}.\n`;
        analysis += `- **How**: Invest $${Math.min(savings * 0.5, 5000).toFixed(0)} in an S&P 500 ETF.\n`;
        analysis += `#### Optimize Expenses (Probability: ${Math.round(probabilities[2] * 100)}%)\n`;
        analysis += `- **Why**: $${expenses} is ${expenses > income * 0.6 ? 'over 60% of income' : 'manageable'}.\n`;
        analysis += `- **How**: Cut $${(expenses * 0.3).toFixed(0)} (30%) via shared training costs.\n`;
        analysis += `\n**Summary**: In 10 years, savings could grow to $${savingsIn10Years.toFixed(0)} at 5% APY.`;

        setFinancialPlanning({
          advice,
          probabilities,
          analysis,
        });
      } catch (err) {
        console.error('Error fetching financial planning:', err);
        setError(prev => prev ? `${prev} | Financial planning error: ${err.message}` : `Financial planning error: ${err.message}`);
        setFinancialPlanning({ advice: 'Unable to analyze financial plan at this time.', probabilities: [], analysis: '' });
      }
    };

    if (athleteData && performanceData.length > 0) {
      fetchFinancialPlanning();
    }
  }, [athleteData, performanceData]);

  // Generate injury prevention suggestions
  useEffect(() => {
    if (athleteData && injuryPrediction) {
      generatePreventionSuggestions(injuryPrediction, athleteData, performanceData);
    }
  }, [athleteData, injuryPrediction, performanceData]);

  const generatePreventionSuggestions = (prediction, data, perfData) => {
    if (!data || !perfData.length) {
      setPerformanceSuggestion('Insufficient data to analyze performance trends.');
      setInjuryPreventionSuggestion(prediction?.preventionRecommendation || 'No specific prevention recommendation available.');
      return;
    }

    const latestPerf = perfData[perfData.length - 1];
    const hoursTrained = latestPerf.hoursTrained || 0;
    const sessionsPerWeek = latestPerf.sessionsPerWeek || 0;
    const restDays = latestPerf.restDays || 0;
    const pastInjuries = latestPerf.pastInjuries || 0;
    const age = data.age || 0;
    const sport = data.sport || 'your sport';

    const avgHours = perfData.length > 1 ? perfData.slice(0, -1).reduce((sum, d) => sum + d.hoursTrained, 0) / (perfData.length - 1) : hoursTrained;
    const hoursTrend = hoursTrained > avgHours ? `increased by ${(hoursTrained - avgHours).toFixed(1)} hours` : `stable or decreased by ${(avgHours - hoursTrained).toFixed(1)} hours`;

    let suggestion = `Your training (${hoursTrained} hours/week, ${sessionsPerWeek} sessions, ${restDays} rest days) shows a ${hoursTrend} trend. For ${sport} at age ${age} with ${pastInjuries} injuries, adjust to ${(hoursTrained * 0.9).toFixed(1)} hours/week to optimize performance.`;

    setPerformanceSuggestion(suggestion);
    setInjuryPreventionSuggestion(prediction?.preventionRecommendation || 'No specific prevention recommendation available.');
  };

  // Chart data for performance trends
  const chartData = {
    labels: performanceData.map(data => {
      const date = new Date(data.timestamp);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString();
    }),
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
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Value', color: '#ffffff' },
        ticks: { color: '#ffffff' },
        grid: { color: '#444444' }
      },
      x: {
        title: { display: true, text: 'Date', color: '#ffffff' },
        ticks: { color: '#ffffff' },
        grid: { color: '#444444' }
      }
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      tooltip: { enabled: true },
      title: { display: true, text: 'Performance Trends Over Time', color: '#ffffff' }
    }
  };

  // Chart data for career guidance probabilities
  const careerProbabilityData = {
    labels: ['Focus on Training', 'Competition Ready', 'Injury Prevention'],
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
      title: { display: true, text: 'Career Guidance Probabilities', color: '#ffffff' }
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probability (%)', color: '#ffffff' }, ticks: { color: '#ffffff' }, grid: { color: '#444444' } },
      x: { ticks: { color: '#ffffff' }, grid: { color: '#444444' } }
    }
  };

  const handleUpdatePerformance = () => navigate(`/performanceupdate/${id}`);

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400">Athlete not found</div>;

  return (
    <div className="min-h-screen w-full p-4 bg-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-4">
        <h1 className="text-2xl font-bold text-white">Athlete Details</h1>
        <span className="text-sm text-gray-300">User: {user.name}</span>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-400 text-sm mb-4 px-4">{error}</p>}

      {/* Athlete Info */}
      <div className="bg-gray-800 p-4 rounded mb-6 text-white mx-4">
        <h2 className="text-xl font-semibold mb-2">{athleteData.athleteName}</h2>
        <p className="text-base mb-1">Sport: {athleteData.sport || 'Not specified'}</p>
        <p className="text-base mb-1">Age: {athleteData.age || 'Not specified'}</p>
        <p className="text-base mb-1">Education: {athleteData.education || 'Not specified'}</p>
        <p className="text-base mb-1">Career Goals: {athleteData.careerGoals?.join(', ') || 'Not specified'}</p>
        <p className="text-base mb-1">Competition Wins: {calculateCompetitionWins(athleteData.competitionHistory)}</p>
      </div>

      {/* Performance Trends */}
      <section className="bg-gray-800 p-4 rounded mb-6 text-white mx-4">
        <h2 className="text-xl font-semibold mb-2">Performance Trends</h2>
        {performanceData.length > 0 ? (
          <div className="relative h-96 w-full">
            <h3 className="text-lg font-medium mb-2">Performance Analysis Graph</h3>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
            {performanceSuggestion && (
              <p className="text-sm text-blue-400 mt-2">
                <strong>AI Performance Analysis:</strong> {performanceSuggestion}
              </p>
            )}
          </div>
        ) : (
          <p className="text-base">No performance data available.</p>
        )}
      </section>

      {/* Injury Prevention Analysis */}
      <section className="bg-gray-800 p-4 rounded mb-6 text-white mx-4">
        <h2 className="text-xl font-semibold mb-2">Injury Prevention Analysis</h2>
        <div>
          <h3 className="text-lg font-medium mb-2">Past Injuries</h3>
          <p className="text-base mb-2">Past Injuries Count: {performanceData[0]?.pastInjuries || 0}</p>
          {athleteData.injuryHistory && athleteData.injuryHistory.length > 0 ? (
            <table className="min-w-full border border-gray-600 text-white">
              <thead>
                <tr>
                  <th className="border border-gray-600 p-2">Injury</th>
                  <th className="border border-gray-600 p-2">Severity</th>
                  <th className="border border-gray-600 p-2">Recovery Time (days)</th>
                  <th className="border border-gray-600 p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {athleteData.injuryHistory.map((injury, index) => (
                  <tr key={index}>
                    <td className="border border-gray-600 p-2">{injury.injury || 'Unknown'}</td>
                    <td className="border border-gray-600 p-2">{injury.severity || 'N/A'}</td>
                    <td className="border border-gray-600 p-2">{injury.recoveryTime || 'N/A'}</td>
                    <td className="border border-gray-600 p-2">
                      {injury.date ? new Date(injury.date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-base">No detailed injury history available.</p>
          )}
          <h3 className="text-lg font-medium mb-2 mt-4">Injury Risk and Prevention</h3>
          {injuryPrediction ? (
            <div>
              <p className="text-base">
                <strong>Predicted Injury Risk:</strong>{' '}
                <span className={injuryPrediction.injuryRisk.includes('High') || injuryPrediction.injuryRisk.includes('Critical') ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                  {injuryPrediction.injuryRisk}
                </span>
                {injuryPrediction.predictionScore && (
                  <span> (Probability: {Math.round(injuryPrediction.predictionScore * 100)}%)</span>
                )}
              </p>
              {injuryPreventionSuggestion && (
                <p className="text-sm text-orange-400 mt-2">
                  <strong>Prevention Recommendation:</strong> {injuryPreventionSuggestion}
                </p>
              )}
            </div>
          ) : (
            <p className="text-base">No injury prediction available.</p>
          )}
        </div>
      </section>

      {/* AI Career Guidance */}
      <section className="bg-gray-800 p-4 rounded mb-6 text-white mx-4">
        <h2 className="text-xl font-semibold mb-2">AI Career Guidance</h2>
        {careerGuidance.guidance ? (
          <div>
            <p className="text-base font-medium"><strong>Career Guidance:</strong> {careerGuidance.guidance}</p>
            <div className="text-sm text-gray-200 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
              <strong>Detailed Analysis:</strong> {careerGuidance.analysis}
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Career Path Simulator</h3>
              <p className="text-base">
                Estimated time to achieve your goal ({athleteData.careerGoals?.join(' or ') || 'Not specified'}): 
                <strong> {careerGuidance.yearsToGoal} years</strong> based on current training and performance.
              </p>
              <p className="text-sm text-gray-300">
                (Assumes consistent effort; adjust training or wins to change timeline.)
              </p>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Resources for Your Career Goals</h3>
              {athleteData.careerGoals?.length > 0 ? (
                <ul className="list-disc pl-5">
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
              ) : (
                <p className="text-base">No specific resources available for unspecified goals.</p>
              )}
            </div>
            <div className="mt-4 h-64 w-full">
              <h3 className="text-lg font-medium mb-2">Guidance Probability Breakdown</h3>
              <Bar data={careerProbabilityData} options={careerProbabilityOptions} />
            </div>
          </div>
        ) : (
          <p className="text-base">Analyzing career guidance...</p>
        )}
      </section>

      {/* Financial Planning */}
      <section className="bg-gray-800 p-4 rounded mb-6 text-white mx-4">
        <h2 className="text-xl font-semibold mb-2">Financial Planning</h2>
        {financialPlanning.advice ? (
          <div>
            <p className="text-base font-medium"><strong>Recommended Strategy:</strong> {financialPlanning.advice}</p>
            <p className="text-base mt-2"><strong>Probabilities:</strong></p>
            <ul className="list-disc pl-5">
              <li>Build Savings: {Math.round(financialPlanning.probabilities[0] * 100)}%</li>
              <li>Invest for Growth: {Math.round(financialPlanning.probabilities[1] * 100)}%</li>
              <li>Optimize Expenses: {Math.round(financialPlanning.probabilities[2] * 100)}%</li>
            </ul>
            <div className="text-sm text-gray-200 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
              <strong>Detailed Analysis:</strong>
              <div dangerouslySetInnerHTML={{ __html: financialPlanning.analysis.replace(/\n/g, '<br>').replace(/####/g, '<h4>').replace(/###/g, '<h3>') }} />
            </div>
          </div>
        ) : (
          <p className="text-base">Analyzing financial plan...</p>
        )}
      </section>

      {/* Buttons */}
      <div className="flex justify-between mt-6 px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Back to Dashboard
        </button>
        <button
          onClick={handleUpdatePerformance}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Update Weekly Performance
        </button>
      </div>
    </div>
  );
}

export default AthleteDetailPage;