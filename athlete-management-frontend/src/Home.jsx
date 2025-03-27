// athlete-management-frontend/src/Home.jsx
// import React from 'react'
// import { Link } from 'react-router-dom'

// function Home() {
//   return (
//     <div className="home-container">
//       <h1>Welcome to Athlete Management System</h1>
//       <p>Manage your athletes efficiently with our comprehensive platform</p>
//       <Link to="/login">
//         <button className="login-btn">Login</button>
//       </Link>
//     </div>
//   )
// }

// export default Home

// import React from 'react';
// import { Link } from 'react-router-dom';

// function Home() {
//   return (
//     <div 
//       className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white text-center px-6"
//       style={{ backgroundImage: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
//     >
//       <div className="bg-black bg-opacity-85 text-white rounded-2xl shadow-2xl p-10 max-w-lg w-full transform transition duration-500 hover:scale-105 hover:shadow-2xl">
//         <h1 className="text-4xl font-extrabold text-indigo-500 mb-4 drop-shadow-lg">
//           Welcome to Athlete Management System
//         </h1>
//         <p className="text-gray-300 text-lg font-medium mb-6 leading-relaxed">
//           Manage your athletes efficiently with our comprehensive platform.
//         </p>
//         <Link to="/login">
//           <button className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:scale-105 hover:shadow-md">
//             Login
//           </button>
//         </Link>
//       </div>
//     </div>
//   );
// }

// export default Home;


import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div 
      className="min-h-screen w-screen text-white px-6 py-12 flex flex-col items-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1684713510655-e6e31536168d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
    >
      {/* Top Right Sign In Button */}
      <div className="absolute top-6 right-8">
        <Link to="/login">
          <button className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white font-bold py-2 px-5 rounded-lg transition duration-300 hover:scale-105 hover:shadow-md">
            Sign In
          </button>
        </Link>
      </div>

      {/* Main Heading */}
      <h1 className="text-6xl font-extrabold text-blue-600 mb-6 text-center drop-shadow-lg">
        Athlete Management System
      </h1>

      {/* About Us Section */}
      <section className="text-center max-w-4xl mb-12 mt-12">
        <h2 className="text-5xl font-bold text-blue-600 mb-4">About Us</h2>
        <p className="text-lg text-blue-400 leading-relaxed">
        Our Athlete Management System is a comprehensive, all-in-one platform designed to empower coaches, trainers, and sports organizations by streamlining athlete training, tracking performance, and enhancing communication.
        </p>
      </section>

      {/* Features Heading */}
      <h2 className="text-5xl font-bold text-blue-600 mb-8 mt-12">Features</h2>

      {/* Flashcards Section */}
      <div className="grid grid-cols-3 gap-8 max-w-6xl">
        {/* Flashcard 1 */}
        <div className="bg-black bg-opacity-80 p-11 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">🏋️ Performance Tracking</h3>
          <p className="text-gray-300 text-lg">
            Monitor athlete stats, training progress, and achievements with real-time performance analytics. Keep a close eye on their improvements.
          </p>
        </div>

        {/* Flashcard 2 */}
        <div className="bg-black bg-opacity-80 p-11 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">📅 Training Schedules</h3>
          <p className="text-gray-300 text-lg">
            Plan personalized training routines with automated scheduling and reminders for each athlete. Keep everything organized in one place.
          </p>
        </div>

        {/* Flashcard 3 */}
        <div className="bg-black bg-opacity-80 p-11 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">💬 Team Communication</h3>
          <p className="text-gray-300 text-lg">
            Stay connected with coaches, athletes, and management through instant messaging and notifications. Communicate effortlessly.
          </p>
        </div>

        {/* Flashcard 4 */}
        <div className="bg-black bg-opacity-80 p-12 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">📊 Data & Reports</h3>
          <p className="text-gray-300 text-lg">
            Generate performance reports, injury history, and other analytics for better decision-making. Access insights anytime.
          </p>
        </div>

        {/* Flashcard 5 */}
        <div className="bg-black bg-opacity-80 p-11 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">🏆 Achievements & Rewards</h3>
          <p className="text-gray-300 text-lg">
            Keep track of individual and team achievements, and motivate athletes with rewards and recognition. Celebrate success the right way.
          </p>
        </div>

        {/* Flashcard 6 */}
        <div className="bg-black bg-opacity-80 p-12 rounded-2xl shadow-xl text-center h-80 flex flex-col justify-between transition transform hover:scale-105">
          <h3 className="text-3xl font-bold text-blue-400">🔒 Secure Athlete Data</h3>
          <p className="text-gray-300 text-lg">
            Ensure athlete privacy with a highly secure system for storing personal and medical data. Your information stays safe.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-gray-300 text-center text-sm">
        © 2025 Athlete Management System. All rights reserved.
      </footer>
    </div>
  );
}

export default Home;
