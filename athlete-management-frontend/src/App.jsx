import React from 'react';
import { BrowserRouter as Router, Route,Routes} from 'react-router-dom';
import AuthForm from './Login'; // Corrected to use AuthForm
import AthleteDetailPage from './AthleteDetailPage';
import CreateAthlete from './CreateAthlete';
import {useAuth0} from '@auth0/auth0-react';
import Dashboard from './Dashboard';
import WeeklyPerformanceForm from './WeeklyPerformanceForm';
const App = () => {
  const {user,loginWithRedirect,isAuthenticated, logout} = useAuth0();
  console.log("Current User", user)
  return (
    <>
    {isAuthenticated ? <button onClick={(e) => logout()}>Logout</button> : <button onClick={(e) => loginWithRedirect()}>Login</button>}
    {isAuthenticated && <h3> Hello {user.name}</h3>}
    <Router>
<Routes>
<Route path="/" element={<AuthForm />} /> 
        <Route path="/login" element={<AuthForm />} /> {/* Updated to use element prop */}

        <Route path="/athlete-detail" element={<AthleteDetailPage />} />

        <Route path="/create-athlete" element={<CreateAthlete />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/weeklyperformance" element={<WeeklyPerformanceForm/>} />

        {/* Add other routes as needed */}
        </Routes>
    </Router>
    </>
  );
};

export default App;
