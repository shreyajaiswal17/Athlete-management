
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

const careerResources = {
  'Basketball': {
    'Build Elite Potential': [
      { name: 'NBA Combine Training', url: 'https://www.nba.com/combine', desc: 'Prepare for professional tryouts.' },
      { name: 'Hoop Skills Camps', url: 'https://www.hoopskills.com', desc: 'Develop fundamental skills.' },
      { name: 'Strength & Conditioning Guide', url: 'https://www.nsca.com', desc: 'Build physical foundation.' },
    ],
    'Competition Ready': [
      { name: 'Basketball Analytics (Synergy)', url: 'https://www.synergysports.com', desc: 'Analyze game footage.' },
      { name: 'AAU Tournaments', url: 'https://www.aausports.org', desc: 'Gain competitive exposure.' },
      { name: 'ScoutMe App', url: 'https://www.scoutme.com', desc: 'Connect with scouts.' },
    ],
    'Refine and Sustain': [
      { name: 'NBA G League Opportunities', url: 'https://gleague.nba.com', desc: 'Maintain pro-level play.' },
      { name: 'Injury Prevention Workshops', url: 'https://www.sportsinjuryclinic.net', desc: 'Sustain career longevity.' },
      { name: 'Basketball Coaching Cert', url: 'https://www.usab.com', desc: 'Transition to coaching.' },
    ],
  },
  'Swimming': {
    'Build Elite Potential': [
      { name: 'USA Swimming Drills', url: 'https://www.usaswimming.org', desc: 'Master stroke technique.' },
      { name: 'Swim Camps', url: 'https://www.swimclinics.com', desc: 'Intensive skill training.' },
      { name: 'Endurance Training Plans', url: 'https://www.active.com', desc: 'Boost aerobic capacity.' },
    ],
    'Competition Ready': [
      { name: 'SwimSwam Meet Results', url: 'https://swimswam.com', desc: 'Track performance benchmarks.' },
      { name: 'FINA Events', url: 'https://www.fina.org', desc: 'Compete internationally.' },
      { name: 'Swim Coach App', url: 'https://www.swimcoachapp.com', desc: 'Plan race strategies.' },
    ],
    'Refine and Sustain': [
      { name: 'Masters Swimming', url: 'https://www.usms.org', desc: 'Stay competitive long-term.' },
      { name: 'Dryland Training Guide', url: 'https://www.swimmingworldmagazine.com', desc: 'Prevent shoulder injuries.' },
      { name: 'Coaching Certification', url: 'https://www.teamusa.org', desc: 'Shift to coaching.' },
    ],
  },
  'Track': {
    'Build Elite Potential': [
      { name: 'USATF Training Plans', url: 'https://www.usatf.org', desc: 'Develop speed and stamina.' },
      { name: 'Sprint Technique Camps', url: 'https://www.trackcamps.com', desc: 'Refine form.' },
      { name: 'Plyometric Workouts', url: 'https://www.stack.com', desc: 'Increase explosiveness.' },
    ],
    'Competition Ready': [
      { name: 'Track & Field News', url: 'https://www.trackandfieldnews.com', desc: 'Monitor rankings.' },
      { name: 'IAAF Competitions', url: 'https://www.worldathletics.org', desc: 'Enter elite races.' },
      { name: 'Race Analysis Tools', url: 'https://www.hudl.com', desc: 'Review performance.' },
    ],
    'Refine and Sustain': [
      { name: 'Masters Track Events', url: 'https://www.usatf.org', desc: 'Compete as a veteran.' },
      { name: 'Injury Rehab Resources', url: 'https://www.runnersworld.com', desc: 'Maintain leg health.' },
      { name: 'USATF Coaching Cert', url: 'https://www.usatf.org', desc: 'Become a trainer.' },
    ],
  },
  'Cricket': {
    'Build Elite Potential': [
      { name: 'ECB Skill Drills', url: 'https://www.ecb.co.uk', desc: 'Hone batting/bowling skills.' },
      { name: 'Cricket Academy Camps', url: 'https://www.cricketaustralia.com.au', desc: 'Intensive training.' },
      { name: 'Fitness for Cricket', url: 'https://www.pitchvision.com', desc: 'Build match fitness.' },
    ],
    'Competition Ready': [
      { name: 'Cricbuzz Stats', url: 'https://www.cricbuzz.com', desc: 'Track performance metrics.' },
      { name: 'ICC Tournaments', url: 'https://www.icc-cricket.com', desc: 'Gain global exposure.' },
      { name: 'Video Analysis Tools', url: 'https://www.dartfish.com', desc: 'Analyze match play.' },
    ],
    'Refine and Sustain': [
      { name: 'Veteran Cricket Leagues', url: 'https://www.mastersgames.com', desc: 'Stay in the game.' },
      { name: 'Bowling Injury Prevention', url: 'https://www.physio-pedia.com', desc: 'Protect shoulders.' },
      { name: 'ECB Coaching Pathway', url: 'https://www.ecb.co.uk', desc: 'Transition to coaching.' },
    ],
  },
  'Kabaddi': {
    'Build Elite Potential': [
      { name: 'Kabaddi Academy Drills', url: 'https://www.kabaddiindia.in', desc: 'Master raid/tackle.' },
      { name: 'Strength Training Plans', url: 'https://www.bodybuilding.com', desc: 'Build power.' },
      { name: 'Agility Workouts', url: 'https://www.sportfitnessadvisor.com', desc: 'Enhance quickness.' },
    ],
    'Competition Ready': [
      { name: 'Pro Kabaddi Stats', url: 'https://www.prokabaddi.com', desc: 'Analyze match performance.' },
      { name: 'IKF Events', url: 'https://www.kabaddiikf.com', desc: 'Compete internationally.' },
      { name: 'Kabaddi Scout Network', url: 'https://www.kabaddiscout.com', desc: 'Get noticed.' },
    ],
    'Refine and Sustain': [
      { name: 'Veteran Kabaddi Leagues', url: 'https://www.kabaddiindia.in', desc: 'Keep playing.' },
      { name: 'Knee Injury Prevention', url: 'https://www.sportsinjuryclinic.net', desc: 'Sustain mobility.' },
      { name: 'Kabaddi Coaching Cert', url: 'https://www.kabaddiikf.com', desc: 'Coach others.' },
    ],
  },
  'Football': {
    'Build Elite Potential': [
      { name: 'NFL Combine Prep', url: 'https://www.nfl.com/combine', desc: 'Train for pro standards.' },
      { name: 'Football Skills Camps', url: 'https://www.footballcamps.com', desc: 'Refine techniques.' },
      { name: 'Speed Training Plans', url: 'https://www.active.com', desc: 'Boost sprint speed.' },
    ],
    'Competition Ready': [
      { name: 'FIFA Match Analysis', url: 'https://www.fifa.com', desc: 'Study game footage.' },
      { name: 'Scout Connections', url: 'https://www.footballscouts.com', desc: 'Link with recruiters.' },
      { name: 'Regional Tournaments', url: 'https://www.ussoccer.com', desc: 'Showcase talent.' },
    ],
    'Refine and Sustain': [
      { name: 'Masters Football Leagues', url: 'https://www.usasa.com', desc: 'Play competitively.' },
      { name: 'Hamstring Rehab Guide', url: 'https://www.webmd.com', desc: 'Maintain leg health.' },
      { name: 'FIFA Coaching Cert', url: 'https://www.fifa.com', desc: 'Become a coach.' },
    ],
  },
  'General': {
    'Build Elite Potential': [
      { name: 'Sports Performance Training', url: 'https://www.nsca.com', desc: 'Build athletic base.' },
      { name: 'Athlete Network', url: 'https://www.athletenetwork.com', desc: 'Connect with mentors.' },
      { name: 'Fitness Tracking Apps', url: 'https://www.strava.com', desc: 'Monitor progress.' },
    ],
    'Competition Ready': [
      { name: 'Sports Career Finder', url: 'https://www.sportscareerfinder.com', desc: 'Find opportunities.' },
      { name: 'Competition Listings', url: 'https://www.active.com', desc: 'Enter events.' },
      { name: 'Performance Analytics', url: 'https://www.hudl.com', desc: 'Review stats.' },
    ],
    'Refine and Sustain': [
      { name: 'Veteran Sports Programs', url: 'https://www.teamusa.org', desc: 'Stay active.' },
      { name: 'Injury Prevention Tips', url: 'https://www.mayoclinic.org', desc: 'Protect longevity.' },
      { name: 'Coaching Basics Course', url: 'https://www.ukcoaching.org', desc: 'Teach others.' },
    ],
  },
};

const calculateCompetitionWins = (competitionHistory) => {
  if (!competitionHistory || !Array.isArray(competitionHistory) || competitionHistory.length === 0) return 0;
  return competitionHistory.filter(comp => {
    const result = comp.result?.toLowerCase();
    return result === '1st' || result === 'win';
  }).length;
};

function CareerGuidancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athleteData, setAthleteData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [careerGuidance, setCareerGuidance] = useState({ guidance: '', probabilities: [], analysis: '', yearsToGoal: 0 });
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
    const fetchCareerGuidance = async () => {
      try {
        const trainResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/train`);
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
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/career-guidance`, careerInput);
        const { careerGuidance: guidance, probabilities } = response.data;
        const sport = athlete.sport || 'General';
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

        let analysis = `<h3 class="text-teal-400 text-xl font-semibold">Career Analysis (Age ${age}, ${sport})</h3><p class="mt-2 text-lg"><strong class="text-gray-300">Profile:</strong> Training <span class="text-yellow-300">${hoursTrained} hours/week</span>, ${sessionsPerWeek} sessions, ${restDays} rest days, ${injuryCount} injuries, ${competitionWins} wins. <em class="text-gray-400">Education:</em> ${education}. <em class="text-gray-400">Goals:</em> ${careerGoals.join(', ')}</p>`;
        
        if (guidance === 'Focus on Training') {
          analysis += `<h4 class="text-blue-400 mt-4 text-lg">Build Elite Potential (Probability: ${Math.round(probabilities[0] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300 text-lg">Why:</strong> Your ${hoursTrained} hours/week and ${competitionWins} win(s) show promise, but reaching elite ${sport} levels requires a bigger push.</li><li><strong class="text-gray-300 text-lg">Next Steps:</strong> Boost to <span class="text-green-400">${(hoursTrained * 1.2).toFixed(1)} hours/week</span> with ${sport}-specific skills (e.g., ${sport === 'Swimming' ? 'flip turns' : sport === 'Track' ? 'sprint starts' : sport === 'Cricket' ? 'bowling accuracy' : 'core drills'}).</li></ul>`;
        } else if (guidance === 'Competition Ready') {
          analysis += `<h4 class="text-green-400 mt-4 text-lg">Competition Ready (Probability: ${Math.round(probabilities[1] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300 text-lg">Why:</strong> With ${competitionWins} win(s) and a strong ${hoursTrained} hours/week base, you’re ready to shine in ${sport} events.</li><li><strong class="text-gray-300 text-lg">Next Steps:</strong> Compete quarterly to sharpen skills under pressure.</li></ul>`;
        } else if (guidance === 'Sustain Performance') {
          analysis += `<h4 class="text-orange-400 mt-4 text-lg">Refine and Sustain (Probability: ${Math.round(probabilities[2] * 100)}%)</h4><ul class="list-disc pl-5 mt-2"><li><strong class="text-gray-300 text-lg">Why:</strong> Your ${hoursTrained} hours/week and ${injuryCount} injuries show strength, but balance is key to avoid setbacks.</li><li><strong className="text-gray-300 text-lg">Next Steps:</strong> Keep <span class="text-green-400">${hoursTrained} hours/week</span>, spread into ${Math.min(sessionsPerWeek + 1, 6)} sessions, and add 1-2 rest days.</li></ul>`;
        }
        analysis += `<p class="mt-4 text-lg"><strong class="text-gray-300">Probability Breakdown:</strong> Build Elite Potential (<span class="text-blue-400">${Math.round(probabilities[0] * 100)}%</span>), Competition Ready (<span class="text-green-400">${Math.round(probabilities[1] * 100)}%</span>), Refine and Sustain (<span class="text-orange-400">${Math.round(probabilities[2] * 100)}%</span>)</p>`;

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
    maintainAspectRatio: false, // Allows custom height without distorting
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff', font: { size: 16 } } },
      title: { display: true, text: 'Career Guidance Probabilities', color: '#ffffff', font: { size: 20 } },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probability (%)', color: '#ffffff' }, ticks: { color: '#ffffff', font: { size: 14 } }, grid: { color: '#444' } },
      x: { ticks: { color: '#ffffff', font: { size: 14 } }, grid: { color: '#444' } },
    },
    layout: {
      padding: 20,
    },
  };

  if (!athleteData && !error) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">Loading...</div>;
  if (!athleteData) return <div className="flex items-center justify-center min-h-screen text-red-400 text-xl">Athlete not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E8A] via-[#0077B6] text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Career Guidance</h1>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded text-lg">{error}</p>}
      {careerGuidance.guidance ? (
        <>
          <p className="text-xl"><strong className="text-gray-300">Guidance:</strong> <span className="text-teal-400">{careerGuidance.guidance}</span></p>
          <div className="mt-4 text-lg" dangerouslySetInnerHTML={{ __html: careerGuidance.analysis }} />
          <p className="mt-4 text-xl"><strong className="text-gray-300">Estimated Time to Goal:</strong> <span className="text-green-400">{careerGuidance.yearsToGoal} years</span></p>
          <div className="h-64 mt-4 w-full"> {/* Increased height to 64 */}
            <Bar data={careerProbabilityData} options={careerProbabilityOptions} />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-medium text-blue-400">Career Tools ({athleteData.sport || 'General'})</h3>
            <ul className="list-disc pl-5 mt-2">
              {careerResources[athleteData.sport]?.[careerGuidance.guidance]?.map((resource, index) => (
                <li key={index} className="text-lg">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {resource.name}
                  </a>
                  <span className="text-gray-400"> - {resource.desc}</span>
                </li>
              )) || careerResources['General'][careerGuidance.guidance].map((resource, index) => (
                <li key={index} className="text-lg">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {resource.name}
                  </a>
                  <span className="text-gray-400"> - {resource.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="text-lg">Analyzing career guidance...</p>
      )}
      <button
        onClick={() => navigate(`/athlete/${id}`)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-lg"
      >
        Back to Athlete Dashboard
      </button>
    </div>
  );
}

export default CareerGuidancePage;