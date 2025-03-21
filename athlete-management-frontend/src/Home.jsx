// athlete-management-frontend/src/Home.jsx
import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Athlete Management System</h1>
      <p>Manage your athletes efficiently with our comprehensive platform</p>
      <Link to="/login">
        <button className="login-btn">Login</button>
      </Link>
    </div>
  )
}

export default Home