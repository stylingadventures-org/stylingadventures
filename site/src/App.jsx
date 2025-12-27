import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardRouter } from './pages/DashboardRouter'
import FanLayout from './components/FanLayout'
import BestieLayout from './components/BestieLayout'
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
import Community from './pages/Community'
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
import SocialBee from './pages/SocialBee'
import MasterProfile from './pages/MasterProfile'

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
        <Route path="/community" element={<Community />} />
        <Route path="/discover" element={<Discover />} />
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
        
        {/* PUBLIC - SocialBee (read-only for FAN, full features for BESTIE+) */}
        <Route path="/socialbee" element={<SocialBee />} />
        
        {/* BESTIE Tier Routes - PROTECTED, nested under BestieLayout */}
        <Route 
          path="/bestie" 
          element={
            <ProtectedRoute roles={['bestie']}>
              <BestieLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<BestieHome />} />
          <Route path="closet" element={<BestieCloset />} />
          <Route path="studio" element={<BestieStudio />} />
          <Route path="challenges" element={<BestieChallenges />} />
          <Route path="vote" element={<BestieVote />} />
          <Route path="scene-club" element={<SceneClub />} />
          <Route path="trends" element={<TrendStudio />} />
          <Route path="stories" element={<BestieStories />} />
          <Route path="inbox" element={<BestieInbox />} />
          <Route path="master-profile" element={<MasterProfile />} />
          <Route path="primebank" element={<PrimeBank />} />
          <Route path="profile" element={<BestieProfile />} />
          <Route path="achievements" element={<AchievementCenter />} />
        </Route>
        
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
