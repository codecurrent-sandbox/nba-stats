import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to NBA Stats
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Explore comprehensive NBA statistics, player profiles, team data, and game results
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <Link
          to="/players"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Players</h3>
            <p className="text-gray-600">
              Browse player profiles, stats, and performance metrics
            </p>
          </div>
        </Link>
        
        <Link
          to="/teams"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Teams</h3>
            <p className="text-gray-600">
              Explore team rosters, standings, and statistics
            </p>
          </div>
        </Link>
        
        <Link
          to="/games"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Games</h3>
            <p className="text-gray-600">
              View game schedules, results, and matchups
            </p>
          </div>
        </Link>
      </div>
      
      <div className="mt-16 bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Latest NBA Highlights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Top Scorers</h3>
            <p className="text-gray-600">
              Discover which players are leading the league in points per game
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Recent Games</h3>
            <p className="text-gray-600">
              Check out the latest game results and upcoming matchups
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Team Standings</h3>
            <p className="text-gray-600">
              See how teams are performing in their respective conferences
            </p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Player Stats</h3>
            <p className="text-gray-600">
              Dive deep into individual player statistics and achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;