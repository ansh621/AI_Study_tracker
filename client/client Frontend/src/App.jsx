import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/student/Dashboard';
import Onboarding from './pages/student/Onboarding';
import ParentDash from './pages/parent/ParentDash';
import SubjectSelection from './pages/student/SubjectSelection';
import ProfilePage from './pages/student/ProfilePage';
import FocusSetup from './pages/student/FocusSetup';
import FocusSession from './pages/student/FocusSession';
import QuizSetup from './pages/student/QuizSetup';
import QuizSession from './pages/student/QuizSession';
import Insights from './pages/student/Insights';
function App(){
  return (
    <Router>
      <Routes>
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="/parentDash" element={<ParentDash />} />
        <Route path="/SubjectSelection" element={<SubjectSelection />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
        <Route path="/focus-setup" element={<FocusSetup />} />
        <Route path="/focus-session/:sessionId" element={<FocusSession />} />
        <Route path="/quiz-setup" element={<QuizSetup />} />
        <Route path="/quiz-session" element={<QuizSession />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}


export default App
