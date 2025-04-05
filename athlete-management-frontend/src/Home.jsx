import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Ensure "framer-motion" is installed
import Chatbot from './Chatbot'; // Ensure Chatbot component is imported

const Home = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Check scroll position for scroll-to-top button
  const checkScrollTop = () => {
    setShowScroll(window.scrollY > 300);
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  // Scroll to top function
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sports-related feature data
  const features = [
    {
      title: 'Performance Trends',
      desc: 'Analyze your game with real-time stats. Track speed, endurance, and power, and review match-ready performance charts to dominate the field.',
      icon: '📊',
    },
    {
      title: 'Injury Prevention',
      desc: 'Stay in the game with smart injury tracking. Monitor recovery, log injuries, and follow tailored rehab plans to return to peak play.',
      icon: '🛡️',
    },
    {
      title: 'Personalized Training',
      desc: 'Build your champion’s edge with custom drills. Adapt your regimen to crush goals and excel in every match or practice session.',
      icon: '🏋️',
    },
    {
      title: 'Career Guidance',
      desc: 'Plan your rise to stardom with expert coaching. Set competition targets, map your pro journey, and aim for the podium.',
      icon: '🎖️',
    },
    {
      title: 'Financial Planning',
      desc: 'Secure your athletic future. Manage sponsorships, contracts, and winnings with a pro-level financial playbook.',
      icon: '💰',
    },
    {
      title: 'Meal Plan Generator',
      desc: 'Fuel your victories with nutrition. Get sport-specific meal plans to boost stamina, recovery, and on-field performance.',
      icon: '🥗',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2e0351] via-[#3f0a5e] to-[#1b0621] text-white font-sans relative overflow-hidden">
      {/* Navigation Bar */}
      <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-20 p-4 md:p-6 flex justify-between items-center shadow-lg border-b border-blue-900">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">AthletePro</h1>
          <p className="ml-2 text-sm md:text-base text-blue-300 opacity-90">athlete management system</p>
        </div>
        <div className="flex space-x-6">
          <Link to="/" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">
            Dashboard
          </Link>
          <Link to="/training" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">
            Training
          </Link>
          <Link to="/nutrition" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">
            Nutrition
          </Link>
          <Link to="/analytics" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">
            Analytics
          </Link>
          <Link to="/community" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">
            Community
          </Link>
        </div>
        <div className="flex space-x-4">
          <button className="text-sm md:text-base text-gray-400 hover:text-blue-300 focus:outline-none">
            <span className="material-icons">notifications</span>
          </button>
          <button className="text-sm md:text-base text-gray-400 hover:text-blue-300 focus:outline-none">
            <span className="material-icons">account_circle</span>
          </button>
          <Link to="/login">
            <button className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm md:text-base transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-12 md:py-16">
        <div className="text-center md:text-left mb-8 md:mb-0">
          <p className="text-sm md:text-base text-blue-300 opacity-90 mb-2">Athlete management system</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Elevate Your Athletic Performance</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-lg">
            A comprehensive platform designed to optimize every aspect of your athletic journey, from training and nutrition to career planning and financial success.
          </p>
          <button className="bg-white text-blue-900 px-6 py-2 rounded-lg font-semibold text-lg md:text-xl hover:bg-gray-100 transition-colors">
            Start Free Trial
          </button>
        </div>
        <div className="w-full md:w-1/2">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" // Cyclists image
            alt="Athletes in action"
            className="rounded-lg shadow-2xl object-cover w-full h-64 md:h-80"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-12 md:py-16 bg-black/50">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-8">Elite Features for Elite Athletes</h2>
        <p className="text-center text-lg md:text-xl text-gray-200 mb-12 max-w-4xl mx-auto">
          Comprehensive tools designed to elevate your athletic performance and career.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-blue-900/30"
            >
              <div className="text-3xl md:text-4xl mb-4 text-blue-300">{feature.icon}</div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm md:text-base text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-12 md:py-16 bg-black/80">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-8">Champions Speak</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
            <p className="text-sm md:text-base text-gray-400 italic mb-4">
              "This platform revolutionized my team’s training. The insights helped us win the season!"
            </p>
            <p className="text-blue-300 font-semibold">— Coach Vikram Singh</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg shadow-lg border border-blue-900/30">
            <p className="text-sm md:text-base text-gray-400 italic mb-4">
              "My career took off with AthletePro’s guidance. A must-have for every athlete!"
            </p>
            <p className="text-blue-300 font-semibold">— Athlete Aarav Mehta</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center p-6 md:p-8 border-t border-blue-900">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white">AthletePro</h3>
            <p className="text-sm md:text-base text-blue-300 opacity-90">Empowering athletes to reach their full potential</p>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">About</a>
            <a href="#" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">Features</a>
            <a href="#" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">Testimonials</a>
            <a href="#" className="text-sm md:text-base text-gray-400 hover:text-blue-300 transition-colors">Contact</a>
          </div>
        </div>
        <p className="text-sm md:text-base">© 2025 AthletePro. All rights reserved.</p>
      </footer>

      {/* Scroll to Top Button */}
      {showScroll && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 360 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollTop}
          className="fixed bottom-6 right-6 bg-blue-900 hover:bg-blue-800 text-white p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center text-sm md:text-base"
        >
          🏃‍♂️ <span className="ml-1 text-xs md:text-sm">🏁</span>
        </motion.button>
      )}

      {/* Floating Chatbot Widget */}
      <Chatbot />
    </div>
  );
};

export default Home;