import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/student/dashboard';
import Onboarding from './pages/student/Onboarding';
import ParentDash from './pages/parent/ParentDash';
function App(){
  return (
    <Router>
      <Routes>
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="/parentDash" element={<ParentDash />} />
        
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}


export default App