import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import AthleteDetailPage from './AthleteDetailPage.jsx';
import CreateAthlete from './CreateAthlete.jsx';
import Home from './Home.jsx';
import { useAuth0 } from '@auth0/auth0-react';
import PerformanceUpdateForm from './PerformanceUpdateForm.jsx';
import Chatbot from './Chatbot';

function App() {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>; // Display Auth0 errors if they occur
  }

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
          <Route path="/performanceupdate/:athleteId" element={<PerformanceUpdateForm />} />
          <Route
            path="/create-athlete"
            element={isAuthenticated ? <CreateAthlete /> : <Navigate to="/login" />}
          />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
        <Chatbot/>
      </div>


   
  );
}

export default App;




