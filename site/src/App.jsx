import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardRouter } from './pages/DashboardRouter'
import FanLayout from './components/FanLayout'
import Header from './components/Header'
import './App.css'

// Pages
import Home from './pages/Home'
import Discover from './pages/Discover'
import CreatorProfile from './pages/CreatorProfile'
import CreatorSettings from './pages/CreatorSettings'
import SignupBestie from './pages/SignupBestie'
import SignupCreator from './pages/SignupCreator'
import Callback from './pages/Callback'
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
          {/* Public routes (no sidebar) */}
          <Route path="/creator/:id" element={<CreatorProfile />} />
          
          {/* Creator settings - protected route */}
          <Route
            path="/creator-settings"
            element={
              <ProtectedRoute requiredRole="CREATOR">
                <CreatorSettings />
              </ProtectedRoute>
            }
          />
          
          {/* Signup routes */}
          <Route path="/signup/bestie" element={<SignupBestie />} />
          <Route path="/signup/creator" element={<SignupCreator />} />
          <Route path="/become-bestie" element={<BecomeBestie />} />
          
          {/* OAuth callback */}
          <Route path="/callback" element={<Callback />} />
          
          {/* Smart dashboard router - routes to correct dashboard based on user role */}
          <Route path="/dashboard" element={<DashboardRouter />} />
          
          {/* Specific dashboards */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          {/* Creator routes */}
          <Route
            path="/creator/cabinet"
            element={
              <ProtectedRoute requiredRole="CREATOR">
                <CreatorCabinet />
              </ProtectedRoute>
            }
          />
          
          {/* Game routes */}
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <FashionGame />
              </ProtectedRoute>
            }
          />
          
          {/* Episode routes */}
          <Route
            path="/episodes/:episodeId"
            element={
              <ProtectedRoute>
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
          <Route path="/bestie/home" element={<ProtectedRoute><BestieHome /></ProtectedRoute>} />
          <Route path="/bestie/closet" element={<ProtectedRoute><BestieCloset /></ProtectedRoute>} />
          <Route path="/bestie/studio" element={<ProtectedRoute><BestieStudio /></ProtectedRoute>} />
          <Route path="/bestie/scene-club" element={<ProtectedRoute><SceneClub /></ProtectedRoute>} />
          <Route path="/bestie/trends" element={<ProtectedRoute><TrendStudio /></ProtectedRoute>} />
          <Route path="/bestie/stories" element={<ProtectedRoute><BestieStories /></ProtectedRoute>} />
          <Route path="/bestie/inbox" element={<ProtectedRoute><BestieInbox /></ProtectedRoute>} />
          <Route path="/bestie/primebank" element={<ProtectedRoute><PrimeBank /></ProtectedRoute>} />
          <Route path="/bestie/profile" element={<ProtectedRoute><BestieProfile /></ProtectedRoute>} />
          <Route path="/bestie/achievements" element={<ProtectedRoute><AchievementCenter /></ProtectedRoute>} />
          
          {/* Catch-all fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
