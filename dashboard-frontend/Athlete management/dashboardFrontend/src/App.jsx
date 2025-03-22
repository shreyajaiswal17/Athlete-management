import React from "react";
import Sidebar from "./components/Sidebar";
import AthleteProfile from "./components/AthleteProfile";

function App() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <AthleteProfile />
      </div>
    </div>
  );
}

export default App;
