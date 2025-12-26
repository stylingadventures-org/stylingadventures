# Styling Adventures - Implementation Guide

## ✨ What's New

This implementation includes all core features for Styling Adventures:

### 🔐 Authentication System
- **Cognito Integration**: Full OAuth2 flow with Cognito Hosted UI
- **Role-Based Access Control**: FAN, CREATOR, BESTIE, PRIME, ADMIN roles
- **Protected Routes**: React components that enforce role requirements
- **Token Management**: Secure token storage and automatic header injection

**Files:**
- [site/src/context/AuthContext.jsx](site/src/context/AuthContext.jsx) - Auth provider
- [site/src/components/ProtectedRoute.jsx](site/src/components/ProtectedRoute.jsx) - Route protection
- [site/src/api/cognito.js](site/src/api/cognito.js) - Cognito utilities

### 👗 Creator Cabinet
- **Asset Management**: Upload and organize styled looks, outfits, accessories, hairstyles
- **Drag-and-Drop**: Simple file upload with drag-and-drop support
- **S3 Integration**: Direct uploads to S3 with presigned URLs
- **Asset Grid**: Beautiful grid display with filtering by cabinet type

**Files:**
- [site/src/pages/CreatorCabinet.jsx](site/src/pages/CreatorCabinet.jsx) - Main page
- [site/src/components/AssetUploader.jsx](site/src/components/AssetUploader.jsx) - Upload component
- [site/src/components/AssetGrid.jsx](site/src/components/AssetGrid.jsx) - Display component
- [lambda/creator/assets.ts](lambda/creator/assets.ts) - Backend
- [site/src/styles/creator-cabinet.css](site/src/styles/creator-cabinet.css) - Styles

### 🎮 Fashion Game
- **Challenge System**: Randomly generated fashion challenges with themes
- **Outfit Builder**: Select items from cabinet to create outfits
- **Scoring Algorithm**: Evaluate outfits based on color coordination and completion
- **Leaderboard**: Track player rankings and coins
- **Coin Economy**: Earn coins for successful challenges

**Files:**
- [site/src/pages/FashionGame.jsx](site/src/pages/FashionGame.jsx) - Main game
- [site/src/components/ChallengeCard.jsx](site/src/components/ChallengeCard.jsx) - Challenge display
- [site/src/components/OutfitBuilder.jsx](site/src/components/OutfitBuilder.jsx) - Outfit creation
- [lambda/game/index.ts](lambda/game/index.ts) - Game logic
- [site/src/styles/fashion-game.css](site/src/styles/fashion-game.css) - Styles

### 🎬 Episode Theater
- **Video Playback**: Native HTML5 video player
- **Comments System**: Users can comment on episodes
- **Reactions**: Quick reaction buttons (👍, ❤️, 😍, 🔥, 😂)
- **Episode Info**: Title, description, and publication status

**Files:**
- [site/src/pages/EpisodeTheater.jsx](site/src/pages/EpisodeTheater.jsx) - Main page
- [lambda/episodes/index.ts](lambda/episodes/index.ts) - Backend logic
- [site/src/styles/episode-theater.css](site/src/styles/episode-theater.css) - Styles

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd site
npm install
```

### 2. Configure Environment

Ensure `window.__CONFIG__` is properly loaded in [site/index.html](site/index.html) with:
- `cognitoDomain`: Your Cognito domain
- `userPoolWebClientId`: Cognito app client ID
- `appsyncUrl`: AppSync API endpoint
- `assetsBucketUrl`: S3 assets bucket URL
- `uploadsApiUrl`: Backend API URL

### 3. Start Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:5173`

## 📝 GraphQL Queries

All GraphQL operations are defined in [site/src/api/graphql.js](site/src/api/graphql.js):

### Creator Operations
```javascript
// List creator's assets
LIST_CREATOR_ASSETS

// Create/upload new asset
CREATE_ASSET

// Delete asset
DELETE_ASSET
```

### Game Operations
```javascript
// Start new game
INITIALIZE_GAME

// Submit outfit and get score
SUBMIT_OUTFIT

// Get leaderboard
GET_LEADERBOARD

// Get challenge details
GET_CHALLENGE
```

### Episode Operations
```javascript
// List episodes
LIST_EPISODES

// Get episode details
GET_EPISODE

// Add comment to episode
ADD_EPISODE_COMMENT
```

## 🔗 Route Structure

```
/
├── / (Home)
├── /discover (Discover creators)
├── /signup/creator (Creator signup)
├── /signup/bestie (Bestie signup)
├── /callback (OAuth callback)
├── /dashboard (User dashboard)
├── /admin (Admin panel)
├── /creator/cabinet (Creator Cabinet - CREATOR only)
├── /game (Fashion Game - Authenticated)
└── /episodes/:episodeId (Episode Theater - Authenticated)
```

## 🎯 Component Hierarchy

### Creator Cabinet
```
CreatorCabinet
├── Cabinet Navigation (buttons)
├── AssetUploader (drag-drop)
└── AssetGrid (displays assets)
    └── Asset Cards (with delete)
```

### Fashion Game
```
FashionGame
├── Game Header (stats)
├── Game Tabs (game / leaderboard)
└── Game Content
    ├── ChallengeCard (challenge display)
    └── OutfitBuilder (select items)
```

### Episode Theater
```
EpisodeTheater
├── Video Player
├── Episode Info
├── Reactions
└── Comments Section
    ├── Comment Form (if authenticated)
    └── Comments List
```

## 💾 DynamoDB Tables

Expected tables (create in CloudFormation):

```
AssetsTable
├── PK: id (asset ID)
├── SK: userId
├── Attributes: name, type, url, cabinet, createdAt

GamesTable
├── PK: gameId
├── SK: userId
├── Attributes: level, xp, coins, challengeId, status, startedAt, completedAt

EpisodesTable
├── PK: id (episode ID)
├── Attributes: title, description, videoUrl, creatorId, status, reactions, comments, createdAt

EpisodeCommentsTable
├── PK: id (comment ID)
├── SK: episodeId
├── Attributes: userId, text, createdAt
```

## 🔄 Data Flow

### Upload Asset Flow
1. User selects file in CreatorCabinet
2. AssetUploader requests presigned URL from backend
3. File uploaded directly to S3
4. Backend creates asset record in DynamoDB
5. Asset appears in AssetGrid

### Game Flow
1. User navigates to /game
2. FashionGame initializes game state (INITIALIZE_GAME)
3. ChallengeCard displays random challenge
4. User selects 5 items with OutfitBuilder
5. OutfitBuilder submits selection (SUBMIT_OUTFIT)
6. Backend scores outfit, returns result
7. Next challenge loads automatically

### Episode Flow
1. User navigates to /episodes/:episodeId
2. EpisodeTheater loads episode (GET_EPISODE)
3. Video player displays episode
4. User can comment or react
5. Comments are added in real-time

## 🚀 Deployment Checklist

- [ ] Run `npm run codegen` to generate GraphQL types
- [ ] Configure CloudFormation stacks for DynamoDB tables
- [ ] Set up S3 bucket for assets with CORS
- [ ] Deploy Lambda functions for game, episodes, assets
- [ ] Configure Cognito user pool and app client
- [ ] Set config.json values in S3 or environment
- [ ] Run `npm run build:site` for production build
- [ ] Deploy to CloudFront or static hosting

## 🔧 Environment Variables

Backend Lambda functions need:
- `ASSETS_BUCKET`: S3 bucket name for assets
- `ASSETS_TABLE`: DynamoDB table for assets
- `GAMES_TABLE`: DynamoDB table for games
- `EPISODES_TABLE`: DynamoDB table for episodes
- `EPISODE_COMMENTS_TABLE`: DynamoDB table for comments

## 📱 Mobile Responsive

All components are mobile-responsive:
- Creator Cabinet: Grid adjusts for smaller screens
- Fashion Game: Header stacks vertically on mobile
- Episode Theater: Video scales to fit screen
- Comments: Full-width on mobile

## 🎨 Styling

CSS files for customization:
- [site/src/styles/creator-cabinet.css](site/src/styles/creator-cabinet.css)
- [site/src/styles/fashion-game.css](site/src/styles/fashion-game.css)
- [site/src/styles/episode-theater.css](site/src/styles/episode-theater.css)

## 🚨 Error Handling

All components include:
- Loading states
- Error boundaries
- User-friendly error messages
- Retry mechanisms

## 📚 Next Steps

1. **Connect AppSync Schema**: Update [appsync/schema.graphql](appsync/schema.graphql) with resolvers
2. **Implement Lambda Resolvers**: Hook GraphQL mutations to Lambda functions
3. **Database Setup**: Create DynamoDB tables with proper GSI/LSI
4. **S3 Configuration**: Set up bucket with CORS for uploads
5. **Testing**: Unit tests for game logic, integration tests for flows
6. **Analytics**: Add tracking for user actions and game metrics

## 📞 Support

For issues with:
- **Authentication**: Check [site/src/context/AuthContext.jsx](site/src/context/AuthContext.jsx)
- **Uploads**: Verify S3 bucket CORS and presigned URL generation
- **Game Logic**: Review [lambda/game/index.ts](lambda/game/index.ts)
- **API Calls**: Check network tab and AppSync logs
