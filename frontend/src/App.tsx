import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import CreatePost from './pages/CreatePost';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Invite from './pages/Invite';
import Leaderboard from './pages/Leaderboard';
import AvailabilityPage from './pages/AvailabilityPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-green-600">
      <span className="text-4xl mb-4">🎾</span>
      <svg className="animate-spin h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-gray-500">Loading TennisPal...</span>
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/post" element={<CreatePost />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/invite/:id" element={<Invite />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-green-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
