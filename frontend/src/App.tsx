import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import CitySelector from './components/CitySelector';
import NavBar from './components/NavBar';
import Spinner from './components/Spinner';
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
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner text="Starting TennisPal…" />
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-2.5 flex justify-between items-center sticky top-0 z-40">
        <span className="font-bold text-green-700 text-lg tracking-tight">🎾 TennisPal</span>
        <CitySelector />
      </header>
      <main className="pb-20">
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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
