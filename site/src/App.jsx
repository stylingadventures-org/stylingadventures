import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardRouter } from './pages/DashboardRouter'
import FanLayout from './components/FanLayout'
import Header from './components/Header'
import './App.css'

// Auth Pages
import Signup from './pages/Signup'
import Login from './pages/Login'
import Callback from './pages/Callback'
import ChooseYourPath from './pages/ChooseYourPath'

// Upgrade Pages
import UpgradeBestie from './pages/Upgrade/UpgradeBestie'
import UpgradeCreator from './pages/Upgrade/UpgradeCreator'

// Pages
import Home from './pages/Home'
import Discover from './pages/Discover'
import CreatorProfile from './pages/CreatorProfile'
import CreatorSettings from './pages/CreatorSettings'
import SignupBestie from './pages/SignupBestie'
import SignupCreator from './pages/SignupCreator'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import BecomeBestie from './pages/BecomeBestie'
import CreatorCabinet from './pages/CreatorCabinet'
import FashionGame from './pages/FashionGame'
import EpisodeTheater from './pages/EpisodeTheater'

// FAN Tier Pages
import FanHome from './pages/FanHome'
import FanEpisodes from './pages/FanEpisodes'
import FanStyling from './pages/FanStyling'
import FanCloset from './pages/FanCloset'
import FanBlog from './pages/FanBlog'
import FanMagazine from './pages/FanMagazine'

// BESTIE Tier Pages
import BestieHome from './pages/Bestie/BestieHome'
import BestieCloset from './pages/Bestie/BestieCloset'
import BestieStudio from './pages/Bestie/BestieStudio'
import BestieChallenges from './pages/Bestie/BestieChallenges'
import BestieVote from './pages/Bestie/BestieVote'
import SceneClub from './pages/Bestie/SceneClub'
import TrendStudio from './pages/Bestie/TrendStudio'
import BestieStories from './pages/Bestie/BestieStories'
import BestieInbox from './pages/Bestie/BestieInbox'
import PrimeBank from './pages/Bestie/PrimeBank'
import BestieProfile from './pages/Bestie/BestieProfile'
import AchievementCenter from './pages/Bestie/AchievementCenter'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          {/* Auth Routes - PUBLIC, no header */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/choose-your-path" element={<ChooseYourPath />} />
          
          {/* Upgrade Routes */}
          <Route path="/upgrade/bestie" element={<UpgradeBestie />} />
          <Route path="/upgrade/creator" element={<UpgradeCreator />} />
          
          {/* Public routes (with sidebar) */}
          <Route path="/creator/:id" element={<CreatorProfile />} />
          
          {/* Creator settings - protected route */}
          <Route
            path="/creator-settings"
            element={
              <ProtectedRoute roles={['creator']}>
                <CreatorSettings />
              </ProtectedRoute>
            }
          />
          
          {/* Signup routes */}
          <Route path="/signup/bestie" element={<SignupBestie />} />
          <Route path="/signup/creator" element={<SignupCreator />} />
          <Route path="/become-bestie" element={<BecomeBestie />} />
          
          {/* Smart dashboard router - routes to correct dashboard based on user role */}
          <Route path="/dashboard" element={<DashboardRouter />} />
          
          {/* Specific dashboards */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          {/* Creator routes */}
          <Route
            path="/creator/cabinet"
            element={
              <ProtectedRoute roles={['creator']}>
                <CreatorCabinet />
              </ProtectedRoute>
            }
          />
          
          {/* Game routes */}
          <Route
            path="/game"
            element={
              <ProtectedRoute roles={['fan', 'bestie', 'creator']}>
                <FashionGame />
              </ProtectedRoute>
            }
          />
          
          {/* Episode routes */}
          <Route
            path="/episodes/:episodeId"
            element={
              <ProtectedRoute roles={['fan', 'bestie', 'creator']}>
                <EpisodeTheater />
              </ProtectedRoute>
            }
          />
          
          {/* FAN Tier Routes - PUBLIC, nested under FanLayout (renders ONCE) */}
          <Route path="/fan" element={<FanLayout />}>
            <Route path="home" element={<FanHome />} />
            <Route path="episodes" element={<FanEpisodes />} />
            <Route path="styling" element={<FanStyling />} />
            <Route path="closet" element={<FanCloset />} />
            <Route path="blog" element={<FanBlog />} />
            <Route path="magazine" element={<FanMagazine />} />
            <Route path="discover" element={<Discover />} />
          </Route>
          
          {/* Home - now nested under FanLayout for sidebar */}
          <Route path="/" element={<FanLayout />}>
            <Route index element={<Home />} />
          </Route>
          
          {/* BESTIE Tier Routes */}
          <Route path="/bestie/home" element={<ProtectedRoute roles={['bestie']}><BestieHome /></ProtectedRoute>} />
          <Route path="/bestie/closet" element={<ProtectedRoute roles={['bestie']}><BestieCloset /></ProtectedRoute>} />
          <Route path="/bestie/studio" element={<ProtectedRoute roles={['bestie']}><BestieStudio /></ProtectedRoute>} />
          <Route path="/bestie/challenges" element={<ProtectedRoute roles={['bestie']}><BestieChallenges /></ProtectedRoute>} />
          <Route path="/bestie/vote" element={<ProtectedRoute roles={['bestie']}><BestieVote /></ProtectedRoute>} />
          <Route path="/bestie/scene-club" element={<ProtectedRoute roles={['bestie']}><SceneClub /></ProtectedRoute>} />
          <Route path="/bestie/trends" element={<ProtectedRoute roles={['bestie']}><TrendStudio /></ProtectedRoute>} />
          <Route path="/bestie/stories" element={<ProtectedRoute roles={['bestie']}><BestieStories /></ProtectedRoute>} />
          <Route path="/bestie/inbox" element={<ProtectedRoute roles={['bestie']}><BestieInbox /></ProtectedRoute>} />
          <Route path="/bestie/primebank" element={<ProtectedRoute roles={['bestie']}><PrimeBank /></ProtectedRoute>} />
          <Route path="/bestie/profile" element={<ProtectedRoute roles={['bestie']}><BestieProfile /></ProtectedRoute>} />
          <Route path="/bestie/achievements" element={<ProtectedRoute roles={['bestie']}><AchievementCenter /></ProtectedRoute>} />
          
          {/* Catch-all fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
