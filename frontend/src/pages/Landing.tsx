import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Stats {
  players: number;
  matches: number;
}

export default function Landing() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <span className="font-bold text-green-700 text-lg tracking-tight">🎾 TennisPal</span>
        <div className="flex gap-2">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 transition">Log in</Link>
          <Link to="/register" className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-16 pb-20 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
          Find Your Next<br /><span className="text-green-600">Tennis Match</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Post when you're free, get matched with players at your level, and hit the courts — no group chats or endless texting required.
        </p>
        <Link to="/register" className="mt-8 inline-block px-8 py-3.5 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition">
          Get Started — It's Free
        </Link>
      </section>

      {/* How It Works */}
      <section id="how" className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: '📅', title: 'Post When You\'re Free', desc: 'Share your availability in seconds — day, time, and preferred court.' },
              { icon: '🎯', title: 'Get Matched by Skill', desc: 'We connect you with nearby players at your level. No mismatches.' },
              { icon: '🏆', title: 'Play & Track Results', desc: 'Log scores, build your match history, and climb the leaderboard.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-green-600 mb-1">STEP {i + 1}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Everything You Need</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '🎯', title: 'Skill-Based Matchmaking', desc: 'Get paired with players who match your NTRP level for competitive, fun games.' },
              { icon: '📍', title: 'Nearby Courts', desc: 'Browse courts in your area and pick your favorite spot to play.' },
              { icon: '📊', title: 'Match History & Stats', desc: 'Track your wins, losses, and improvement over time.' },
              { icon: '🔔', title: 'SMS & Email Notifications', desc: 'Never miss an invite — get notified instantly when someone wants to play.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      {stats && (stats.players > 0 || stats.matches > 0) && (
        <section className="bg-green-600 py-14 px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-8">Join the Community</h2>
          <div className="flex justify-center gap-12 sm:gap-20">
            <div>
              <div className="text-4xl font-extrabold">{stats.players}</div>
              <div className="text-green-100 text-sm mt-1">Players</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold">{stats.matches}</div>
              <div className="text-green-100 text-sm mt-1">Matches Played</div>
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to Play?</h2>
        <p className="text-gray-600 mb-8">Sign up in 30 seconds and find your next match today.</p>
        <Link to="/register" className="inline-block px-8 py-3.5 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition">
          Create Your Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} TennisPal. All rights reserved.
      </footer>
    </div>
  );
}
