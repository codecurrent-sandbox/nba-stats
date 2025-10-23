import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import TeamsPage from './pages/TeamsPage';
import GamesPage from './pages/GamesPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navigation />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:playerId" element={<PlayerDetailPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/games" element={<GamesPage />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
