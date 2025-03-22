import React from "react";

const trainingData = [
  { title: "🏋️ Strength Training", status: "✅ Completed", bgColor: "bg-[#ff6b81]" },  
  { title: "🏃 Speed Drills", status: "🔄 In Progress", bgColor: "bg-[#ff9f43]" }, 
  { title: "🩹 Injury Rehab", status: "🔴 Needs Attention", bgColor: "bg-[#6a0572]" }, 
  { title: "🎯 Mental Conditioning", status: "✅ Completed", bgColor: "bg-[#1e3a8a]" },
  { title: "🥗 Diet & Nutrition", status: "🔄 In Progress", bgColor: "bg-[#ffcc70]" }, 
];

const TrainingReport = () => {
  return (
    <div className="training-report w-full mt-5">
      <h3 className="text-white text-2xl font-bold mb-4">Training Report</h3>
      <div className="grid grid-cols-2 gap-4">
        {trainingData.map((item, index) => (
          <div key={index} className={`p-5 rounded-xl ${item.bgColor} text-white shadow-md`}>
            <h4 className="text-lg font-semibold">{item.title}</h4>
            <p className="text-md mt-1">{item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingReport;
