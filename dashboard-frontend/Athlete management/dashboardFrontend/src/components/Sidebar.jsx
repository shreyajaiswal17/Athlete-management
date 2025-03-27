import React from "react";
import { FaUser, FaChartLine, FaHeartbeat, FaBriefcase, FaMoneyBillWave } from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="w-72 h-screen bg-black/30 backdrop-blur-lg p-6 text-white shadow-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center tracking-wider">Dashboard</h1>
      <nav className="space-y-4">
        <SidebarItem icon={<FaUser />} label="Athlete Profiles" />
        <SidebarItem icon={<FaChartLine />} label="Performance Tracking" />
        <SidebarItem icon={<FaHeartbeat />} label="Injury Prevention" />
        <SidebarItem icon={<FaBriefcase />} label="Career Development" />
        <SidebarItem icon={<FaMoneyBillWave />} label="Financial Planning" />
      </nav>
    </div>
  );
};

const SidebarItem = ({ icon, label }) => (
  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-600/30 transition cursor-pointer">
    {icon}
    <span className="text-lg">{label}</span>
  </div>
);

export default Sidebar;
