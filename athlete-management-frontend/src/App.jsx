// athlete-management-frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import AthleteDetailPage from './AthleteDetailPage.jsx'
import CreateAthlete from './CreateAthlete.jsx'
import Home from './Home.jsx'
import { useAuth0 } from '@auth0/auth0-react'

function App() {
  const { isAuthenticated } = useAuth0()

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/athlete/:id" 
          element={isAuthenticated ? <AthleteDetailPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-athlete" 
          element={isAuthenticated ? <CreateAthlete /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  )
}

export default App