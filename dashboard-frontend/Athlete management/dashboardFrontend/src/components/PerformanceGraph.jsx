import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", performance: 70, injuryRisk: 20 },
  { month: "Feb", performance: 75, injuryRisk: 18 },
  { month: "Mar", performance: 80, injuryRisk: 15 },
  { month: "Apr", performance: 85, injuryRisk: 12 },
  { month: "May", performance: 90, injuryRisk: 10 },
];

const PerformanceGraph = () => {
  return (
    <div style={{ width: "900px", background: "#222", padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
      <h3 style={{ color: "white", marginBottom: "10px" }}>Performance & Injury Risk</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#ccc" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Line type="monotone" dataKey="performance" stroke="#32CD32" strokeWidth={2} />
          <Line type="monotone" dataKey="injuryRisk" stroke="#FF6347" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceGraph;
