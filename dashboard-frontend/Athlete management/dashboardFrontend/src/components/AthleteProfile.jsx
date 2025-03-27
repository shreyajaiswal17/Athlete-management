import React from "react";
import PerformanceGraph from "./PerformanceGraph";
import TrainingReport from "./TrainingReport";

const AthleteProfile = () => {
  return (
    <div>
      {/* Profile Card */}
      <div className="profile-card">
        <img src="https://www.pexels.com/photo/woman-sitting-and-smiling-1858175/" alt="Athlete" />
        <div className="profile-info">
          <h2>John Doe</h2>
          <h4>🏀 Basketball | National Level</h4>

          <div className="athlete-stats">
            <div className="stat-box">
              <h3>Performance</h3>
              <p>87%</p>
            </div>
            <div className="stat-box">
              <h3>Injury Risk</h3>
              <p className="health-status">Low</p>
            </div>
            <div className="stat-box">
              <h3>Career Progress</h3>
              <p>3 Tournaments Won</p>
            </div>
            <div className="stat-box">
              <h3>Sponsorship</h3>
              <p>$50,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Graph */}
      <PerformanceGraph />

      {/* Training Report */}
      <TrainingReport />
    </div>
  );
};

export default AthleteProfile;