import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
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
  // Routes that should NOT show header/sidebar (auth pages)
  const isAuthPage = (pathname) => {
    return ['/login', '/signup', '/callback', '/choose-your-path'].some(path => 
      pathname === path || pathname.startsWith(path)
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes isAuthPage={isAuthPage} />
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppRoutes({ isAuthPage }) {
  const location = useLocation()
  const showHeader = !isAuthPage(location.pathname)

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        {/* Auth Routes - NO header/sidebar */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/choose-your-path" element={<ChooseYourPath />} />
        
        {/* Upgrade Routes */}
        <Route path="/upgrade/bestie" element={<UpgradeBestie />} />
        <Route path="/upgrade/creator" element={<UpgradeCreator />} />
        
        {/* Signup routes (no header) */}
        <Route path="/signup/bestie" element={<SignupBestie />} />
        <Route path="/signup/creator" element={<SignupCreator />} />
        
        {/* Public route pages with header/sidebar */}
        <Route path="/become-bestie" element={<BecomeBestie />} />
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
        
        {/* FAN Tier Routes - PUBLIC, nested under FanLayout */}
        <Route path="/fan" element={<FanLayout />}>
          <Route path="home" element={<FanHome />} />
          <Route path="episodes" element={<FanEpisodes />} />
          <Route path="styling" element={<FanStyling />} />
          <Route path="closet" element={<FanCloset />} />
          <Route path="blog" element={<FanBlog />} />
          <Route path="magazine" element={<FanMagazine />} />
          <Route path="discover" element={<Discover />} />
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
        
        {/* Bestie redirect - /bestie goes to /bestie/home */}
        <Route path="/bestie" element={<BestieHomeRedirect />} />
        
        {/* Home - wrapped in FanLayout for sidebar */}
        <Route path="/" element={<FanLayout />}>
          <Route index element={<Home />} />
        </Route>
        
        {/* Catch-all fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

// Helper component to redirect /bestie to /bestie/home
function BestieHomeRedirect() {
  const navigate = useNavigate()
  const { isAuthenticated, userContext } = useAuth()
  
  useEffect(() => {
    if (isAuthenticated && (userContext?.isBestie || userContext?.tier === 'BESTIE')) {
      navigate('/bestie/home', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, userContext, navigate])
  
  return null
}

export default App
