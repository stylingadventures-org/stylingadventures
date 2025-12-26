/**
 * Main App Component with Routing
 * Routes between all FAN and BESTIE tier pages
 */

import React, { useState } from 'react';
// FAN Tier Pages
import FanHome from './pages/FanHome';
import FanEpisodes from './pages/FanEpisodes';
import FanStyling from './pages/FanStyling';
import FanCloset from './pages/FanCloset';
import FanBlog from './pages/FanBlog';
import FanMagazine from './pages/FanMagazine';

// BESTIE Tier Pages
import BestieHome from './pages/Bestie/BestieHome';
import BestieCloset from './pages/Bestie/BestieCloset';
import BestieStudio from './pages/Bestie/BestieStudio';
import SceneClub from './pages/Bestie/SceneClub';
import TrendStudio from './pages/Bestie/TrendStudio';
import BestieStories from './pages/Bestie/BestieStories';
import BestieInbox from './pages/Bestie/BestieInbox';
import PrimeBank from './pages/Bestie/PrimeBank';
import BestieProfile from './pages/Bestie/BestieProfile';
import AchievementCenter from './pages/Bestie/AchievementCenter';

type PageType = 
  // FAN pages
  | 'home' | 'episodes' | 'styling' | 'closet' | 'blog' | 'magazine'
  // BESTIE pages
  | 'bestie-home' | 'bestie-closet' | 'bestie-studio' | 'scene-club' | 'trends' 
  | 'stories' | 'inbox' | 'primebank' | 'profile' | 'achievements';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const renderPage = () => {
    switch (currentPage) {
      // FAN Tier Routes (All Public)
      case 'home':
        return <FanHome />;
      case 'episodes':
        return <FanEpisodes />;
      case 'styling':
        return <FanStyling />;
      case 'closet':
        return <FanCloset />;
      case 'blog':
        return <FanBlog />;
      case 'magazine':
        return <FanMagazine />;
      
      // BESTIE Tier Routes
      case 'bestie-home':
        return <BestieHome />;
      case 'bestie-closet':
        return <BestieCloset />;
      case 'bestie-studio':
        return <BestieStudio />;
      case 'scene-club':
        return <SceneClub />;
      case 'trends':
        return <TrendStudio />;
      case 'stories':
        return <BestieStories />;
      case 'inbox':
        return <BestieInbox />;
      case 'primebank':
        return <PrimeBank />;
      case 'profile':
        return <BestieProfile />;
      case 'achievements':
        return <AchievementCenter />;
      
      default:
        return <FanHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {renderPage()}
    </div>
  );
}

export default App;
