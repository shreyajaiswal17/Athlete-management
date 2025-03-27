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


// athlete-management-frontend/src/Home.jsx
// athlete-management-frontend/src/Home.jsx


// athlete-management-frontend/src/Home.jsx
// athlete-management-frontend/src/Home.jsx
// athlete-management-frontend/src/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Optional: Add "framer-motion" to package.json if used

const Home = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Check scroll position to show/hide scroll-to-top button
  const checkScrollTop = () => {
    if (window.scrollY > 300) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };

  window.addEventListener('scroll', checkScrollTop);

  // Scroll to top function
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Feature data with elaborated content
  const features = [
    {
      title: 'Performance Tracking',
      desc: 'Gain unparalleled insights into athlete performance with our advanced tracking system. Log detailed metrics such as speed, endurance, and strength, and generate comprehensive reports to analyze progress over time. Coaches can identify strengths, pinpoint areas for improvement, and tailor training plans to maximize results—all from an intuitive dashboard.',
      icon: '📊',
    },
    {
      title: 'Injury Management',
      desc: 'Stay on top of athlete health with a robust injury management tool. Track recovery timelines, document medical history, and monitor rehabilitation progress with precision. This feature helps reduce downtime by providing actionable insights for coaches and medical staff, ensuring athletes return to peak performance safely and efficiently.',
      icon: '🩺',
    },
    {
      title: 'Career Planning',
      desc: 'Plan for success with a visual career management system. Map out key milestones, create detailed training schedules, and set competition goals to keep athletes on track. Whether it’s preparing for a national championship or building a long-term career path, this tool helps athletes and coaches align efforts and achieve ambitious targets.',
      icon: '📅',
    },
    {
      title: 'Financial Management',
      desc: 'Simplify the business side of sports with our all-in-one financial management suite. Organize sponsorship deals, track contract details, and monitor earnings seamlessly. Athletes and managers can stay focused on performance while having full visibility into financial health, ensuring resources are optimized for training and growth.',
      icon: '💰',
    },
    {
      title: 'Real-time Notifications',
      desc: 'Never miss a beat with real-time updates tailored to your needs. Receive instant notifications about training schedule changes, upcoming events, or critical milestones. This feature keeps athletes, coaches, and support teams connected and informed, fostering collaboration and ensuring everyone stays aligned on the path to success.',
      icon: '🔔',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-gray-100 font-sans relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-gray-800 bg-opacity-95 backdrop-blur-lg sticky top-0 z-10 p-5 flex justify-between items-center shadow-xl border-b border-gray-700/50">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">AthletePro</h1>
        <Link to="/login">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
            Sign In
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 relative">
        <motion.h2
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-lg"
        >
          🏅 Revolutionizing Athlete Management
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-200 max-w-3xl mb-10 font-light leading-relaxed"
        >
          Empowering athletes, coaches, and sports organizations in India with a cutting-edge platform to optimize performance, streamline management, and achieve greatness.
        </motion.p>
        <Link to="/login">
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-300">
            Get Started
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-10">
        <h3 className="text-4xl font-bold text-center text-white mb-14 tracking-wide drop-shadow-md">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800 bg-opacity-90 p-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700/30"
            >
              <div className="text-5xl mb-5 text-blue-400 drop-shadow-md">{feature.icon}</div>
              <h4 className="text-2xl font-semibold text-blue-300 mb-4 tracking-tight">{feature.title}</h4>
              <p className="text-gray-200 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-700/50 to-gray-800/50 relative z-10">
        <h3 className="text-4xl font-bold text-center text-white mb-14 tracking-wide drop-shadow-md">What Our Users Say</h3>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-gray-800 bg-opacity-90 p-7 rounded-2xl shadow-xl border border-gray-700/30">
            <p className="text-gray-200 italic mb-5 text-sm leading-relaxed">
              "This platform has transformed how I track my athletes' progress. The real-time insights are a game-changer!"
            </p>
            <p className="text-blue-300 font-semibold tracking-tight">— Coach Priya Sharma</p>
          </div>
          <div className="bg-gray-800 bg-opacity-90 p-7 rounded-2xl shadow-xl border border-gray-700/30">
            <p className="text-gray-200 italic mb-5 text-sm leading-relaxed">
              "Managing my career and finances has never been easier. Highly recommend!"
            </p>
            <p className="text-blue-300 font-semibold tracking-tight">— Athlete Rohan Patel</p>
          </div>
        </div>
      </section>

      {/* CTA Section (without Join Now) */}
      <section className="px-6 py-24 text-center relative z-10">
        <h3 className="text-5xl font-bold text-white mb-8 tracking-tight drop-shadow-lg">Ready to Elevate Your Game?</h3>
        <p className="text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
          Experience the revolution in athlete management and unlock your full potential with AthletePro.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 bg-opacity-95 text-gray-200 text-center p-8 relative z-10 border-t border-gray-700/50">
        <p className="text-sm">© 2025 Athlete Management System. All rights reserved.</p>
        <p className="mt-3 text-xs font-light">Crafted with ❤️ for the future of sports.</p>
      </footer>

      {/* Scroll to Top Button */}
      {showScroll && (
        <button
          onClick={scrollTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default Home;