import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [athleteData, setAthleteData] = useState([]);
  const [riskFlag, setRiskFlag] = useState('');

  useEffect(() => {
const fetchData = async () => {
const response = await fetch('http://localhost:3000/api/athlete/data');

      const data = await response.json();
      console.log(data);
      setAthleteData(data);
      if (data.length > 0) setRiskFlag(data[0].riskFlag);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {athleteData.length > 0 && athleteData.map((data) => (

<div key={data._id} className={`alert ${data.riskFlag.toLowerCase()}`}>
          {data.athleteName} - Risk: {data.riskFlag}
        
      
        </div>
        
      ))}

      <h2>Recent Performance Logs</h2>
      <div>
        <h2>Recent Performance Logs</h2>
        <ul>
          {athleteData.map((data) => (
         
            <li key={data._id}>
              {data.athleteName} - Hours: {data.hoursTrained}, Sessions: {data.sessionsPerWeek}
            </li>
             
          ))
          }
        </ul>
      </div>

    </div>
  );
};

export default Dashboard;
