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

import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white text-center px-6"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
    >
      <div className="bg-black bg-opacity-85 text-white rounded-2xl shadow-2xl p-10 max-w-lg w-full transform transition duration-500 hover:scale-105 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-indigo-500 mb-4 drop-shadow-lg">
          Welcome to Athlete Management System
        </h1>
        <p className="text-gray-300 text-lg font-medium mb-6 leading-relaxed">
          Manage your athletes efficiently with our comprehensive platform.
        </p>
        <Link to="/login">
          <button className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 hover:scale-105 hover:shadow-md">
            Login
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Home;


