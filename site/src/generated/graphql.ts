import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDate: { input: string; output: string; }
  AWSDateTime: { input: string; output: string; }
  AWSJSON: { input: any; output: any; }
};

export type AdminCreateClosetItemInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  audience?: InputMaybe<ClosetAudience>;
  backgroundStatus?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  coinValue?: InputMaybe<Scalars['Int']['input']>;
  colorTags?: InputMaybe<Array<Scalars['String']['input']>>;
  episodeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  mediaKey?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['ID']['input']>;
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  rawMediaKey?: InputMaybe<Scalars['String']['input']>;
  season?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ClosetStatus>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vibes?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ClosetVisibility>;
};

export type AdminUpdateClosetItemInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  audience?: InputMaybe<ClosetAudience>;
  backgroundStatus?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  coinValue?: InputMaybe<Scalars['Int']['input']>;
  colorTags?: InputMaybe<Array<Scalars['String']['input']>>;
  episodeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  id: Scalars['ID']['input'];
  mediaKey?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['ID']['input']>;
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  rawMediaKey?: InputMaybe<Scalars['String']['input']>;
  scheduledAt?: InputMaybe<Scalars['AWSDateTime']['input']>;
  season?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ClosetStatus>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vibes?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ClosetVisibility>;
};

export type AffiliateLink = {
  __typename?: 'AffiliateLink';
  commissionRate: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  retailer: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type AnalyticsMetrics = {
  __typename?: 'AnalyticsMetrics';
  avgComments: Scalars['Float']['output'];
  avgLikes: Scalars['Float']['output'];
  avgShares: Scalars['Float']['output'];
  contentPosted: Scalars['Int']['output'];
  engagement: Scalars['Float']['output'];
  engagementThisWeek: Scalars['Float']['output'];
  followers: Scalars['Int']['output'];
  followersThisWeek: Scalars['Int']['output'];
  peakEngagementTime: Scalars['String']['output'];
  topContentType: Scalars['String']['output'];
};

export type AnalyticsMetricsInput = {
  avgComments: Scalars['Float']['input'];
  avgLikes: Scalars['Float']['input'];
  avgShares: Scalars['Float']['input'];
  contentPosted: Scalars['Int']['input'];
  engagement: Scalars['Float']['input'];
  followers: Scalars['Int']['input'];
};

export type Article = {
  __typename?: 'Article';
  author: Scalars['String']['output'];
  category: ArticleCategory;
  content: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  featuredImages: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  magazineId: Scalars['ID']['output'];
  readTime: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export enum ArticleCategory {
  BehindTheScenes = 'BEHIND_THE_SCENES',
  Business = 'BUSINESS',
  CreatorSpotlight = 'CREATOR_SPOTLIGHT',
  Editorial = 'EDITORIAL',
  Interview = 'INTERVIEW',
  Lifestyle = 'LIFESTYLE',
  Wellness = 'WELLNESS'
}

export type Bts = {
  __typename?: 'BTS';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  s3Key: Scalars['String']['output'];
  thumbnailKey: Scalars['String']['output'];
  title: Scalars['String']['output'];
  videoId: Scalars['ID']['output'];
};

/**
 * Background Change System
 * Allows creators to request and manage background changes for closet items.
 */
export type BackgroundChangeRequest = {
  __typename?: 'BackgroundChangeRequest';
  closetItemId: Scalars['ID']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  creatorId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  originalS3Key: Scalars['String']['output'];
  processedS3Key?: Maybe<Scalars['String']['output']>;
  requestedBackground: Scalars['String']['output'];
  status: BackgroundChangeStatus;
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type BackgroundChangeRequestConnection = {
  __typename?: 'BackgroundChangeRequestConnection';
  items: Array<BackgroundChangeRequest>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export enum BackgroundChangeStatus {
  Approved = 'APPROVED',
  Completed = 'COMPLETED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Rejected = 'REJECTED'
}

export type BestieCheckoutSession = {
  __typename?: 'BestieCheckoutSession';
  checkoutUrl: Scalars['String']['output'];
};

export type BestieCreateClosetItemInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  colorTags?: InputMaybe<Array<Scalars['String']['input']>>;
  episodeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  mediaKey?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rawMediaKey?: InputMaybe<Scalars['String']['input']>;
  season?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vibes?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ClosetVisibility>;
};

export type BestieReaction = {
  __typename?: 'BestieReaction';
  bestieId: Scalars['ID']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  episodeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  likes: Scalars['Int']['output'];
  reactionType: ReactionType;
  timestamp: Scalars['AWSDateTime']['output'];
};

export type BestieSpotlight = {
  __typename?: 'BestieSpotlight';
  bestieAvatar?: Maybe<Scalars['String']['output']>;
  bestieId: Scalars['ID']['output'];
  bestieUsername: Scalars['String']['output'];
  featuredOn?: Maybe<Scalars['AWSDate']['output']>;
  id: Scalars['ID']['output'];
  platforms?: Maybe<Array<Scalars['String']['output']>>;
  reactionCount: Scalars['Int']['output'];
  spotlightRank: Scalars['Int']['output'];
  theoryCount: Scalars['Int']['output'];
  topReactions: Array<BestieReaction>;
  topTheories: Array<BestieTheory>;
  totalEngagement: Scalars['Int']['output'];
};

export type BestieSpotlightPage = {
  __typename?: 'BestieSpotlightPage';
  nextToken?: Maybe<Scalars['String']['output']>;
  spots: Array<BestieSpotlight>;
};

export type BestieStatus = {
  __typename?: 'BestieStatus';
  isBestie: Scalars['Boolean']['output'];
  renewsAt?: Maybe<Scalars['AWSDateTime']['output']>;
  tier?: Maybe<Scalars['String']['output']>;
  trialActive?: Maybe<Scalars['Boolean']['output']>;
  trialEndsAt?: Maybe<Scalars['AWSDateTime']['output']>;
  userId: Scalars['ID']['output'];
};

export type BestieStory = {
  __typename?: 'BestieStory';
  body?: Maybe<Scalars['String']['output']>;
  closetItemIds?: Maybe<Array<Scalars['ID']['output']>>;
  createdAt: Scalars['AWSDateTime']['output'];
  episodeId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  mediaKeys?: Maybe<Array<Scalars['String']['output']>>;
  status: BestieStoryStatus;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type BestieStoryConnection = {
  __typename?: 'BestieStoryConnection';
  items: Array<BestieStory>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export enum BestieStoryStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED'
}

export type BestieTheory = {
  __typename?: 'BestieTheory';
  bestieId: Scalars['ID']['output'];
  category: TheoryCategory;
  description: Scalars['String']['output'];
  downvotes: Scalars['Int']['output'];
  evidenceLinks?: Maybe<Array<Scalars['String']['output']>>;
  featuredAt?: Maybe<Scalars['AWSDateTime']['output']>;
  id: Scalars['ID']['output'];
  isFeatured: Scalars['Boolean']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
  title: Scalars['String']['output'];
  upvotes: Scalars['Int']['output'];
};

export type BestieUpdateClosetItemInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  colorTags?: InputMaybe<Array<Scalars['String']['input']>>;
  episodeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  mediaKey?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rawMediaKey?: InputMaybe<Scalars['String']['input']>;
  season?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vibes?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ClosetVisibility>;
};

export type BgChangeRequestInput = {
  itemId: Scalars['ID']['input'];
  newBackgroundKey: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type BgChangeRequestResult = {
  __typename?: 'BgChangeRequestResult';
  ok: Scalars['Boolean']['output'];
  requestId?: Maybe<Scalars['ID']['output']>;
};

export enum ClosetAudience {
  Besties = 'BESTIES',
  Exclusive = 'EXCLUSIVE',
  Public = 'PUBLIC'
}

export type ClosetConnection = {
  __typename?: 'ClosetConnection';
  items: Array<ClosetItem>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export enum ClosetFeedSort {
  LalasPick = 'LALAS_PICK',
  MostLoved = 'MOST_LOVED',
  MyFaves = 'MY_FAVES',
  Newest = 'NEWEST'
}

export type ClosetItem = {
  __typename?: 'ClosetItem';
  affiliateUrl?: Maybe<Scalars['String']['output']>;
  audience?: Maybe<ClosetAudience>;
  backgroundStatus?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  coinValue?: Maybe<Scalars['Int']['output']>;
  colorTags?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  episodeIds?: Maybe<Array<Scalars['ID']['output']>>;
  favoriteCount?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  mediaKey?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['ID']['output']>;
  ownerSub?: Maybe<Scalars['ID']['output']>;
  pinned?: Maybe<Scalars['Boolean']['output']>;
  rawMediaKey?: Maybe<Scalars['String']['output']>;
  scheduledAt?: Maybe<Scalars['AWSDateTime']['output']>;
  season?: Maybe<Scalars['String']['output']>;
  status: ClosetStatus;
  subcategory?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
  vibes?: Maybe<Scalars['String']['output']>;
  visibility: ClosetVisibility;
};

export enum ClosetStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  PendingPublish = 'PENDING_PUBLISH',
  Published = 'PUBLISHED',
  Rejected = 'REJECTED'
}

export enum ClosetVisibility {
  Bestie = 'BESTIE',
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Comment = {
  __typename?: 'Comment';
  createdAt: Scalars['AWSDateTime']['output'];
  id: Scalars['ID']['output'];
  itemId: Scalars['ID']['output'];
  text: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type CommentConnection = {
  __typename?: 'CommentConnection';
  items: Array<Comment>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type CommentOnClosetItemInput = {
  itemId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};

export type CreateClosetItemInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  colorTags?: InputMaybe<Array<Scalars['String']['input']>>;
  episodeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  mediaKey?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rawMediaKey?: InputMaybe<Scalars['String']['input']>;
  season?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vibes?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ClosetVisibility>;
};

export type CreateStoryInput = {
  closetItemIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  title: Scalars['String']['input'];
};

export type Creator = {
  __typename?: 'Creator';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  cognitoSub: Scalars['ID']['output'];
  collabAvailability?: Maybe<Scalars['String']['output']>;
  coverUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  displayName: Scalars['String']['output'];
  followers: Scalars['Int']['output'];
  genres?: Maybe<Array<Scalars['String']['output']>>;
  handle?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isFollowing?: Maybe<Scalars['Boolean']['output']>;
  posts: Scalars['Int']['output'];
  socialLinks?: Maybe<SocialLinks>;
  tier: Scalars['String']['output'];
  tracks: Scalars['Int']['output'];
  updatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};

export type CreatorConnection = {
  __typename?: 'CreatorConnection';
  items: Array<Creator>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

/**
 * Creator Forecast & Predictive Model System (PCFM)
 * Forecasts creator growth, audience sentiment, and trend predictions.
 * Powered by analytics and machine learning insights.
 */
export type CreatorForecast = {
  __typename?: 'CreatorForecast';
  audienceSentiment: SentimentAnalysis;
  confidence: Scalars['Float']['output'];
  creatorId: Scalars['ID']['output'];
  forecastId: Scalars['String']['output'];
  forecastPeriod: ForecastPeriod;
  generatedAt: Scalars['AWSDateTime']['output'];
  growthPrediction: GrowthMetrics;
  id: Scalars['ID']['output'];
  lastUpdated: Scalars['AWSDateTime']['output'];
  opportunities: Array<Opportunity>;
  recommendations: Array<Recommendation>;
  riskFactors: Array<RiskFactor>;
  trendPredictions: Array<TrendPrediction>;
};

export type CreatorForecastConnection = {
  __typename?: 'CreatorForecastConnection';
  items: Array<CreatorForecast>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type CreatorReport = {
  __typename?: 'CreatorReport';
  analyticsSnapshot: AnalyticsMetrics;
  creatorId: Scalars['ID']['output'];
  forecasts: Array<CreatorForecast>;
  historicalComparison: HistoricalTrend;
  id: Scalars['ID']['output'];
  recommendations: Array<Scalars['String']['output']>;
  reportDate: Scalars['AWSDateTime']['output'];
};

export type EditorialLook = {
  __typename?: 'EditorialLook';
  description: Scalars['String']['output'];
  editorialId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageKey: Scalars['String']['output'];
  inspirationStory?: Maybe<Scalars['String']['output']>;
  items: Array<ShoppableItem>;
  name: Scalars['String']['output'];
};

export type ExactMatchResult = {
  __typename?: 'ExactMatchResult';
  confidence: Scalars['Float']['output'];
  item: ShoppableItem;
  matchType: Scalars['String']['output'];
  source: Scalars['String']['output'];
};

export type ExclusiveFeature = {
  __typename?: 'ExclusiveFeature';
  description: Scalars['String']['output'];
  exclusivityLevel: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  magazineId: Scalars['ID']['output'];
  mediaFiles: Array<MediaFile>;
  title: Scalars['String']['output'];
  viewsCount: Scalars['Int']['output'];
};

export type FashionEditorial = {
  __typename?: 'FashionEditorial';
  behindTheScenes?: Maybe<Array<Scalars['String']['output']>>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  looks: Array<EditorialLook>;
  magazineId: Scalars['ID']['output'];
  photographyCredit: Scalars['String']['output'];
  stylist: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export enum ForecastPeriod {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Weekly = 'WEEKLY',
  Yearly = 'YEARLY'
}

export type GrowthMetrics = {
  __typename?: 'GrowthMetrics';
  currentFollowers: Scalars['Int']['output'];
  engagementRate: Scalars['Float']['output'];
  estRevenueImpact: Scalars['Float']['output'];
  growthRate: Scalars['Float']['output'];
  projectedEngagementRate: Scalars['Float']['output'];
  projectedFollowers: Scalars['Int']['output'];
};

export type HistoricalTrend = {
  __typename?: 'HistoricalTrend';
  avgGrowth: Scalars['Float']['output'];
  bestPerformingContent: Scalars['String']['output'];
  period: Scalars['String']['output'];
  sentimentChange: Scalars['Float']['output'];
  worstPerformingContent: Scalars['String']['output'];
};

export type HotTake = {
  __typename?: 'HotTake';
  author: Scalars['String']['output'];
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  reactionCount: Scalars['Int']['output'];
  sentiment: Scalars['String']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
};

export type Like = {
  __typename?: 'Like';
  createdAt: Scalars['AWSDateTime']['output'];
  itemId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

export type LikeConnection = {
  __typename?: 'LikeConnection';
  items: Array<Like>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export enum MagazineStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED'
}

export type Me = {
  __typename?: 'Me';
  createdAt?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type MeCreatorApplicationStatus = {
  __typename?: 'MeCreatorApplicationStatus';
  hasApplied: Scalars['Boolean']['output'];
  shopStatus?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type MediaFile = {
  __typename?: 'MediaFile';
  duration?: Maybe<Scalars['Int']['output']>;
  featureId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  s3Key: Scalars['String']['output'];
  thumbnailKey?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: MediaType;
};

export enum MediaType {
  Audio = 'AUDIO',
  Document = 'DOCUMENT',
  Image = 'IMAGE',
  Video = 'VIDEO'
}

/**
 * Music System
 * Lala's music career, studio sessions, music videos, and era arcs.
 */
export type MusicEra = {
  __typename?: 'MusicEra';
  aesthetic: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  musicVideos: Array<MusicVideo>;
  name: Scalars['String']['output'];
  relatedOutfits?: Maybe<Array<ClosetItem>>;
  releaseDate: Scalars['AWSDateTime']['output'];
  songs: Array<Song>;
  status: ReleaseStatus;
  storyArcs?: Maybe<Array<Scalars['String']['output']>>;
};

export type MusicFeature = {
  __typename?: 'MusicFeature';
  eraFocus?: Maybe<Scalars['String']['output']>;
  featuredArtist: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  magazineId: Scalars['ID']['output'];
  producerInterview?: Maybe<Scalars['String']['output']>;
  songs: Array<Song>;
  studio?: Maybe<StudioSession>;
  title: Scalars['String']['output'];
};

export type MusicVideo = {
  __typename?: 'MusicVideo';
  behindTheScenes?: Maybe<Array<Bts>>;
  description: Scalars['String']['output'];
  duration: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  releaseDate: Scalars['AWSDateTime']['output'];
  s3Key: Scalars['String']['output'];
  shoppableItems?: Maybe<Array<ShoppableItem>>;
  songId: Scalars['ID']['output'];
  status: ReleaseStatus;
  thumbnailKey?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _root?: Maybe<Scalars['String']['output']>;
  addClosetItemToCommunityFeed: ClosetItem;
  addReaction: BestieReaction;
  /** Add item to shopping cart */
  addToCart: ShoppingCart;
  /** Admin: Add affiliate link */
  adminAddAffiliateLink: AffiliateLink;
  /** Admin: Add article to magazine */
  adminAddArticle: Article;
  /** Admin: Add a hot take to a report */
  adminAddHotTake: HotTake;
  /** Admin: Approve a background change request */
  adminApproveBackgroundChange: BackgroundChangeRequest;
  adminApproveItem: ClosetItem;
  adminCreateClosetItem: ClosetItem;
  /** Admin: Create fashion editorial */
  adminCreateFashionEditorial: FashionEditorial;
  /** Admin: Create a new magazine issue */
  adminCreateMagazineIssue: PrimeMagazine;
  /** Admin: Create a new music era */
  adminCreateMusicEra: MusicEra;
  /** Admin: Release a music video */
  adminCreateMusicVideo: MusicVideo;
  /** Admin: Create shoppable item */
  adminCreateShoppableItem: ShoppableItem;
  /** Admin: Add a song to an era */
  adminCreateSong: Song;
  adminFeatureBestie: BestieSpotlight;
  adminFeatureTheory: BestieTheory;
  /** Admin: Generate creator forecast */
  adminGenerateCreatorForecast: CreatorForecast;
  /** Admin: Generate platform-wide trend predictions */
  adminGeneratePlatformTrends: Array<TrendPrediction>;
  adminGenerateSpotlightReport: BestieSpotlight;
  /** Admin: Generate a new Tea Report */
  adminGenerateTeaReport: TeaReport;
  adminPublishClosetItem: ClosetItem;
  /** Admin: Publish magazine issue */
  adminPublishMagazine: PrimeMagazine;
  /** Admin: Reject a background change request */
  adminRejectBackgroundChange: BackgroundChangeRequest;
  adminRejectItem: ClosetItem;
  adminSetClosetAudience: ClosetItem;
  /** Admin: Update analytics for forecast model */
  adminUpdateAnalyticsSnapshot: AnalyticsMetrics;
  adminUpdateClosetItem: ClosetItem;
  /** Admin: Update relationship status */
  adminUpdateRelationshipStatus: RelationshipStatus;
  bestieCreateClosetItem: ClosetItem;
  bestieDeleteClosetItem: Scalars['Boolean']['output'];
  bestieUpdateClosetItem: ClosetItem;
  commentOnClosetItem: Comment;
  createClosetItem: ClosetItem;
  createStory: Story;
  downvoteTheory: BestieTheory;
  followCreator: Scalars['Boolean']['output'];
  likeClosetItem: ClosetItem;
  pinHighlight: ClosetItem;
  publishStory: Story;
  removeClosetItemFromCommunityFeed: ClosetItem;
  /** Remove item from shopping cart */
  removeFromCart: ShoppingCart;
  removeReaction: Scalars['Boolean']['output'];
  requestClosetApproval: ClosetItem;
  /** Bestie workflow: request a background swap for a closet item. */
  requestClosetBackgroundChange: BgChangeRequestResult;
  /** Request a background change for a closet item */
  requestClosetBackgroundChangeExtended: BackgroundChangeRequest;
  setUserRole: RoleResult;
  shareClosetItemToPinterest: Scalars['AWSJSON']['output'];
  submitTheory: BestieTheory;
  toggleFavoriteClosetItem: ClosetItem;
  toggleWishlistItem: ClosetItem;
  unfollowCreator: Scalars['Boolean']['output'];
  updateClosetItemStory: ClosetItem;
  updateClosetMediaKey: ClosetItem;
  updateCreatorProfile: Creator;
  upvoteTheory: BestieTheory;
};


export type MutationAddClosetItemToCommunityFeedArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAddReactionArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  episodeId: Scalars['ID']['input'];
  reactionType: ReactionType;
};


export type MutationAddToCartArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationAdminAddAffiliateLinkArgs = {
  commissionRate: Scalars['Float']['input'];
  itemId: Scalars['ID']['input'];
  retailer: Scalars['String']['input'];
  url: Scalars['String']['input'];
};


export type MutationAdminAddArticleArgs = {
  author: Scalars['String']['input'];
  category: ArticleCategory;
  content: Scalars['String']['input'];
  magazineId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationAdminAddHotTakeArgs = {
  authorCharacter: Scalars['String']['input'];
  content: Scalars['String']['input'];
  reportId: Scalars['ID']['input'];
};


export type MutationAdminApproveBackgroundChangeArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationAdminApproveItemArgs = {
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminCreateClosetItemArgs = {
  input: AdminCreateClosetItemInput;
};


export type MutationAdminCreateFashionEditorialArgs = {
  magazineId: Scalars['ID']['input'];
  photographyCredit: Scalars['String']['input'];
  stylist: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationAdminCreateMagazineIssueArgs = {
  coverImageKey: Scalars['String']['input'];
  issueNumber: Scalars['Int']['input'];
  theme: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationAdminCreateMusicEraArgs = {
  aesthetic: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  releaseDate: Scalars['AWSDateTime']['input'];
};


export type MutationAdminCreateMusicVideoArgs = {
  s3Key: Scalars['String']['input'];
  songId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationAdminCreateShoppableItemArgs = {
  brand: Scalars['String']['input'];
  category: Scalars['String']['input'];
  imageUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  sku: Scalars['String']['input'];
};


export type MutationAdminCreateSongArgs = {
  audioUrl: Scalars['String']['input'];
  eraId: Scalars['ID']['input'];
  inspirationStory: Scalars['String']['input'];
  spotifyUrl?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};


export type MutationAdminFeatureBestieArgs = {
  bestieId: Scalars['ID']['input'];
  platforms?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationAdminFeatureTheoryArgs = {
  theoryId: Scalars['ID']['input'];
};


export type MutationAdminGenerateCreatorForecastArgs = {
  creatorId: Scalars['ID']['input'];
  forecastPeriod: ForecastPeriod;
};


export type MutationAdminGenerateTeaReportArgs = {
  period: TeaPeriod;
  sourceEpisodes?: InputMaybe<Array<Scalars['String']['input']>>;
  sourceMusic?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationAdminPublishClosetItemArgs = {
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminPublishMagazineArgs = {
  magazineId: Scalars['ID']['input'];
};


export type MutationAdminRejectBackgroundChangeArgs = {
  reason: Scalars['String']['input'];
  requestId: Scalars['ID']['input'];
};


export type MutationAdminRejectItemArgs = {
  closetItemId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAdminSetClosetAudienceArgs = {
  audience: ClosetAudience;
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminUpdateAnalyticsSnapshotArgs = {
  creatorId: Scalars['ID']['input'];
  metrics: AnalyticsMetricsInput;
};


export type MutationAdminUpdateClosetItemArgs = {
  input: AdminUpdateClosetItemInput;
};


export type MutationAdminUpdateRelationshipStatusArgs = {
  character1: Scalars['String']['input'];
  character2: Scalars['String']['input'];
  status: Scalars['String']['input'];
};


export type MutationBestieCreateClosetItemArgs = {
  input: BestieCreateClosetItemInput;
};


export type MutationBestieDeleteClosetItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationBestieUpdateClosetItemArgs = {
  id: Scalars['ID']['input'];
  input: BestieUpdateClosetItemInput;
};


export type MutationCommentOnClosetItemArgs = {
  input: CommentOnClosetItemInput;
};


export type MutationCreateClosetItemArgs = {
  input: CreateClosetItemInput;
};


export type MutationCreateStoryArgs = {
  input: CreateStoryInput;
};


export type MutationDownvoteTheoryArgs = {
  theoryId: Scalars['ID']['input'];
};


export type MutationFollowCreatorArgs = {
  creatorId: Scalars['ID']['input'];
};


export type MutationLikeClosetItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationPinHighlightArgs = {
  id: Scalars['ID']['input'];
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationPublishStoryArgs = {
  storyId: Scalars['ID']['input'];
};


export type MutationRemoveClosetItemFromCommunityFeedArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveFromCartArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationRemoveReactionArgs = {
  reactionId: Scalars['ID']['input'];
};


export type MutationRequestClosetApprovalArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationRequestClosetBackgroundChangeArgs = {
  input: BgChangeRequestInput;
};


export type MutationRequestClosetBackgroundChangeExtendedArgs = {
  closetItemId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  requestedBackground: Scalars['String']['input'];
};


export type MutationSetUserRoleArgs = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationShareClosetItemToPinterestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSubmitTheoryArgs = {
  category: TheoryCategory;
  description: Scalars['String']['input'];
  evidenceLinks?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};


export type MutationToggleFavoriteClosetItemArgs = {
  favoriteOn?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationToggleWishlistItemArgs = {
  id: Scalars['ID']['input'];
  wishlistOn?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUnfollowCreatorArgs = {
  creatorId: Scalars['ID']['input'];
};


export type MutationUpdateClosetItemStoryArgs = {
  input: UpdateClosetItemStoryInput;
};


export type MutationUpdateClosetMediaKeyArgs = {
  itemId: Scalars['ID']['input'];
  mediaKey: Scalars['String']['input'];
};


export type MutationUpdateCreatorProfileArgs = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  collabAvailability?: InputMaybe<Scalars['String']['input']>;
  coverUrl?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  genres?: InputMaybe<Array<Scalars['String']['input']>>;
  handle?: InputMaybe<Scalars['String']['input']>;
  socialLinks?: InputMaybe<SocialLinksInput>;
};


export type MutationUpvoteTheoryArgs = {
  theoryId: Scalars['ID']['input'];
};

export type Opportunity = {
  __typename?: 'Opportunity';
  actionItems: Array<Scalars['String']['output']>;
  category: OpportunityCategory;
  difficulty: Scalars['String']['output'];
  estimatedValue: Scalars['Float']['output'];
  forecastId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  opportunityName: Scalars['String']['output'];
  timeWindow: Scalars['String']['output'];
};

export enum OpportunityCategory {
  Collaboration = 'COLLABORATION',
  ContentPivot = 'CONTENT_PIVOT',
  Expansion = 'EXPANSION',
  Monetization = 'MONETIZATION',
  ProductLaunch = 'PRODUCT_LAUNCH',
  Sponsorship = 'SPONSORSHIP'
}

/**
 * Prime Magazine System
 * Premium digital magazine with exclusive editorials, photoshoots, and behind-the-scenes content.
 * Only accessible to PRIME members.
 */
export type PrimeMagazine = {
  __typename?: 'PrimeMagazine';
  articles: Array<Article>;
  coverImageKey: Scalars['String']['output'];
  coverStory: Scalars['String']['output'];
  exclusiveContent: Array<ExclusiveFeature>;
  fashionEditorial?: Maybe<FashionEditorial>;
  id: Scalars['ID']['output'];
  issueNumber: Scalars['Int']['output'];
  likeCount: Scalars['Int']['output'];
  musicFeature?: Maybe<MusicFeature>;
  publishedAt: Scalars['AWSDateTime']['output'];
  status: MagazineStatus;
  theme: Scalars['String']['output'];
  title: Scalars['String']['output'];
  viewCount: Scalars['Int']['output'];
};

export type PrimeMagazineConnection = {
  __typename?: 'PrimeMagazineConnection';
  items: Array<PrimeMagazine>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  _root?: Maybe<Scalars['String']['output']>;
  adminClosetItemComments: CommentConnection;
  adminClosetItemLikes: LikeConnection;
  /** Admin: List all pending background change requests */
  adminListBackgroundChangeRequests: BackgroundChangeRequestConnection;
  adminListBestieClosetItems: ClosetConnection;
  adminListClosetItems: ClosetConnection;
  adminListPending: ClosetConnection;
  bestieClosetItems: ClosetConnection;
  bestieSpotlight?: Maybe<BestieSpotlight>;
  bestieSpotlights: BestieSpotlightPage;
  /** Get drama details for a specific character */
  characterDrama: Array<TeaItem>;
  closetFeed: ClosetConnection;
  /** Get background change requests for a closet item */
  closetItemBackgroundChanges: Array<BackgroundChangeRequest>;
  closetItemComments: CommentConnection;
  /** Get forecast history for a creator */
  creatorForecastHistory: CreatorForecastConnection;
  /** Get growth recommendations for a creator */
  creatorGrowthRecommendations: Array<Recommendation>;
  /** Get latest forecast for a creator */
  creatorLatestForecast?: Maybe<CreatorForecast>;
  /** Get comprehensive creator report with analytics and forecasts */
  creatorReport?: Maybe<CreatorReport>;
  /** Get the current/latest Prime Magazine issue */
  currentPrimeMagazine?: Maybe<PrimeMagazine>;
  episodeReactions: Array<BestieReaction>;
  episodeTheories: Array<BestieTheory>;
  /** Get songs from an era */
  eraSongs: Array<Song>;
  /** Search for exact item match */
  findExactItem: Array<ExactMatchResult>;
  getCreator?: Maybe<Creator>;
  hello?: Maybe<Scalars['String']['output']>;
  /** Get the latest Prime Tea Report */
  latestTeaReport?: Maybe<TeaReport>;
  listCreators?: Maybe<CreatorConnection>;
  /** Get articles from a magazine */
  magazineArticles: Array<Article>;
  me: Me;
  meAsCreator?: Maybe<Creator>;
  meBestieStatus?: Maybe<BestieStatus>;
  meCreatorApplicationStatus?: Maybe<MeCreatorApplicationStatus>;
  /** Get a specific music era */
  musicEra?: Maybe<MusicEra>;
  /** Get all music eras */
  musicEras: Array<MusicEra>;
  /** Get music video details (with shoppable items) */
  musicVideo?: Maybe<MusicVideo>;
  /** Get user's pending background change requests */
  myBackgroundChangeRequests: Array<BackgroundChangeRequest>;
  myCloset: ClosetConnection;
  /** Get user's shopping cart */
  myShoppingCart?: Maybe<ShoppingCart>;
  myStories?: Maybe<BestieStoryConnection>;
  myWishlist: ClosetConnection;
  pinnedClosetItems: Array<ClosetItem>;
  /** Get trend predictions for the platform */
  platformTrendPredictions: Array<TrendPrediction>;
  /** Get a specific magazine issue */
  primeMagazine?: Maybe<PrimeMagazine>;
  /** Get all published Prime Magazine issues */
  primeMagazineArchive: PrimeMagazineConnection;
  /** Get relationship status between two characters */
  relationshipStatus?: Maybe<RelationshipStatus>;
  /** Get shoppable items from a scene */
  sceneShoppableItems: Array<ShoppableItem>;
  searchTheories: Array<BestieTheory>;
  /** Get music videos for a song */
  songMusicVideos: Array<MusicVideo>;
  stories?: Maybe<BestieStoryConnection>;
  /** Get historical Tea Reports */
  teaReportHistory: TeaReportConnection;
  trendingReactions: Array<BestieReaction>;
  trendingTheories: Array<BestieTheory>;
  /** Get shoppable items from a music video */
  videoShoppableItems: Array<ShoppableItem>;
};


export type QueryAdminClosetItemCommentsArgs = {
  itemId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminClosetItemLikesArgs = {
  itemId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminListBackgroundChangeRequestsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<BackgroundChangeStatus>;
};


export type QueryAdminListBestieClosetItemsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ClosetStatus>;
};


export type QueryAdminListClosetItemsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ClosetStatus>;
};


export type QueryAdminListPendingArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBestieClosetItemsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBestieSpotlightArgs = {
  bestieId: Scalars['ID']['input'];
};


export type QueryBestieSpotlightsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCharacterDramaArgs = {
  characterName: Scalars['String']['input'];
};


export type QueryClosetFeedArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<ClosetFeedSort>;
};


export type QueryClosetItemBackgroundChangesArgs = {
  closetItemId: Scalars['ID']['input'];
};


export type QueryClosetItemCommentsArgs = {
  itemId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCreatorForecastHistoryArgs = {
  creatorId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCreatorGrowthRecommendationsArgs = {
  creatorId: Scalars['ID']['input'];
};


export type QueryCreatorLatestForecastArgs = {
  creatorId: Scalars['ID']['input'];
};


export type QueryCreatorReportArgs = {
  creatorId: Scalars['ID']['input'];
};


export type QueryEpisodeReactionsArgs = {
  episodeId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEpisodeTheoriesArgs = {
  episodeId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEraSongsArgs = {
  eraId: Scalars['ID']['input'];
};


export type QueryFindExactItemArgs = {
  brandName: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  itemName: Scalars['String']['input'];
};


export type QueryGetCreatorArgs = {
  id: Scalars['ID']['input'];
};


export type QueryListCreatorsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMagazineArticlesArgs = {
  category?: InputMaybe<ArticleCategory>;
  magazineId: Scalars['ID']['input'];
};


export type QueryMusicEraArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMusicVideoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyClosetArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyStoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyWishlistArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPrimeMagazineArgs = {
  issueNumber: Scalars['Int']['input'];
};


export type QueryPrimeMagazineArchiveArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRelationshipStatusArgs = {
  character1: Scalars['String']['input'];
  character2: Scalars['String']['input'];
};


export type QuerySceneShoppableItemsArgs = {
  sceneId: Scalars['ID']['input'];
};


export type QuerySearchTheoriesArgs = {
  category?: InputMaybe<TheoryCategory>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySongMusicVideosArgs = {
  songId: Scalars['ID']['input'];
};


export type QueryStoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTeaReportHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<TeaPeriod>;
};


export type QueryTrendingReactionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTrendingTheoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryVideoShoppableItemsArgs = {
  videoId: Scalars['ID']['input'];
};

export enum ReactionType {
  Crying = 'CRYING',
  Fire = 'FIRE',
  Laughing = 'LAUGHING',
  Love = 'LOVE',
  Shocked = 'SHOCKED',
  Tea = 'TEA'
}

export type Recommendation = {
  __typename?: 'Recommendation';
  description: Scalars['String']['output'];
  expectedOutcome: Scalars['String']['output'];
  forecastId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  priority: Scalars['Int']['output'];
  resourcesNeeded: Array<Scalars['String']['output']>;
  successMetrics: Array<Scalars['String']['output']>;
  timeframe: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type RelationshipStatus = {
  __typename?: 'RelationshipStatus';
  character1: Scalars['String']['output'];
  character2: Scalars['String']['output'];
  confidence: Scalars['Float']['output'];
  lastUpdated: Scalars['AWSDateTime']['output'];
  status: Scalars['String']['output'];
};

export enum ReleaseStatus {
  Archived = 'ARCHIVED',
  InProgress = 'IN_PROGRESS',
  Released = 'RELEASED',
  TeaserReleased = 'TEASER_RELEASED'
}

export type RiskFactor = {
  __typename?: 'RiskFactor';
  forecastId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  mitigationStrategy: Scalars['String']['output'];
  potentialImpact: Scalars['String']['output'];
  probability: Scalars['Float']['output'];
  riskName: Scalars['String']['output'];
  severity: RiskLevel;
};

export enum RiskLevel {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type RoleResult = {
  __typename?: 'RoleResult';
  role: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type SentimentAnalysis = {
  __typename?: 'SentimentAnalysis';
  communityHealth: Scalars['Int']['output'];
  keyTopics: Array<Scalars['String']['output']>;
  negativePercent: Scalars['Float']['output'];
  neutralPercent: Scalars['Float']['output'];
  overallSentiment: Scalars['String']['output'];
  positivePercent: Scalars['Float']['output'];
  sentimentTrend: Scalars['String']['output'];
};

/**
 * Shopping & Affiliate System
 * Powers "Shop Lala's Look" and exact item finder across all surfaces.
 */
export type ShoppableItem = {
  __typename?: 'ShoppableItem';
  affiliateLinks: Array<AffiliateLink>;
  alternativeProducts?: Maybe<Array<ShoppableItem>>;
  brand: Scalars['String']['output'];
  category: Scalars['String']['output'];
  closetItemId?: Maybe<Scalars['ID']['output']>;
  episodeId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  lastSeenInScene: Scalars['AWSDateTime']['output'];
  likeCount: Scalars['Int']['output'];
  musicVideoId?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  sku: Scalars['String']['output'];
};

export type ShoppingCart = {
  __typename?: 'ShoppingCart';
  affiliateCredit: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  items: Array<ShoppableItem>;
  total: Scalars['Float']['output'];
  userId: Scalars['ID']['output'];
};

export type SocialLinks = {
  __typename?: 'SocialLinks';
  instagram?: Maybe<Scalars['String']['output']>;
  shopLink?: Maybe<Scalars['String']['output']>;
  tiktok?: Maybe<Scalars['String']['output']>;
  twitter?: Maybe<Scalars['String']['output']>;
  youtube?: Maybe<Scalars['String']['output']>;
};

export type SocialLinksInput = {
  instagram?: InputMaybe<Scalars['String']['input']>;
  shopLink?: InputMaybe<Scalars['String']['input']>;
  tiktok?: InputMaybe<Scalars['String']['input']>;
  twitter?: InputMaybe<Scalars['String']['input']>;
  youtube?: InputMaybe<Scalars['String']['input']>;
};

export type Song = {
  __typename?: 'Song';
  appleMusicUrl?: Maybe<Scalars['String']['output']>;
  audioUrl: Scalars['String']['output'];
  conflict?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  duration: Scalars['Int']['output'];
  eraId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  inspirationStory: Scalars['String']['output'];
  lyrics?: Maybe<Scalars['String']['output']>;
  spotifyUrl?: Maybe<Scalars['String']['output']>;
  studio: StudioSession;
  title: Scalars['String']['output'];
};

export type Story = {
  __typename?: 'Story';
  createdAt?: Maybe<Scalars['AWSDateTime']['output']>;
  id: Scalars['ID']['output'];
  ownerId: Scalars['ID']['output'];
  publishedAt?: Maybe<Scalars['AWSDateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type StudioSession = {
  __typename?: 'StudioSession';
  dramaNotes?: Maybe<Scalars['String']['output']>;
  engineerNotes: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  producer: Scalars['String']['output'];
  recordedAt: Scalars['AWSDateTime']['output'];
  s3RecordingKey?: Maybe<Scalars['String']['output']>;
  songId: Scalars['ID']['output'];
  studio: Scalars['String']['output'];
};

export enum TeaCategory {
  BehindTheScenes = 'BEHIND_THE_SCENES',
  CreativeTension = 'CREATIVE_TENSION',
  FanDrama = 'FAN_DRAMA',
  FashionTake = 'FASHION_TAKE',
  Friendship = 'FRIENDSHIP',
  MusicBeef = 'MUSIC_BEEF',
  Romance = 'ROMANCE',
  TourLife = 'TOUR_LIFE'
}

export type TeaItem = {
  __typename?: 'TeaItem';
  category: TeaCategory;
  characters: Array<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  relatedEpisode?: Maybe<Scalars['String']['output']>;
  relatedMusic?: Maybe<Scalars['String']['output']>;
  reportId: Scalars['ID']['output'];
  teaLevel: Scalars['Int']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
  title: Scalars['String']['output'];
};

export enum TeaPeriod {
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  Weekly = 'WEEKLY'
}

/**
 * Prime Tea Report System
 * Generates daily/weekly gossip reports about Lala & The Crew's drama, relationships, and hot takes.
 * Exclusive content for PRIME members.
 */
export type TeaReport = {
  __typename?: 'TeaReport';
  dramaMeter: Scalars['Int']['output'];
  generatedAt: Scalars['AWSDateTime']['output'];
  headline: Scalars['String']['output'];
  hotTakes: Array<HotTake>;
  id: Scalars['ID']['output'];
  period: TeaPeriod;
  relationshipUpdates: Array<RelationshipStatus>;
  reportId: Scalars['String']['output'];
  shareCount: Scalars['Int']['output'];
  summary: Scalars['String']['output'];
  teaItems: Array<TeaItem>;
  viewCount: Scalars['Int']['output'];
};

export type TeaReportConnection = {
  __typename?: 'TeaReportConnection';
  items: Array<TeaReport>;
  nextToken?: Maybe<Scalars['String']['output']>;
};

export enum TheoryCategory {
  Drama = 'DRAMA',
  Fashion = 'FASHION',
  Lore = 'LORE',
  Music = 'MUSIC',
  Prediction = 'PREDICTION',
  Ship = 'SHIP'
}

export enum TrendCategory {
  AudienceDemographic = 'AUDIENCE_DEMOGRAPHIC',
  ContentFormat = 'CONTENT_FORMAT',
  Fashion = 'FASHION',
  Lifestyle = 'LIFESTYLE',
  Music = 'MUSIC',
  PlatformShift = 'PLATFORM_SHIFT',
  SocialBehavior = 'SOCIAL_BEHAVIOR'
}

export type TrendPrediction = {
  __typename?: 'TrendPrediction';
  actionItems: Array<Scalars['String']['output']>;
  category: TrendCategory;
  forecastId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  peakTime?: Maybe<Scalars['AWSDateTime']['output']>;
  probability: Scalars['Float']['output'];
  relevance: Scalars['String']['output'];
  trendName: Scalars['String']['output'];
};

export type UpdateClosetItemStoryInput = {
  itemId: Scalars['ID']['input'];
  storyId?: InputMaybe<Scalars['ID']['input']>;
  storyPosition?: InputMaybe<Scalars['Int']['input']>;
};
