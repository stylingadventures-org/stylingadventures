import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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
  Pending = 'PENDING',
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

export type Me = {
  __typename?: 'Me';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  tier: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _root?: Maybe<Scalars['String']['output']>;
  adminApproveItem: ClosetItem;
  adminCreateClosetItem: ClosetItem;
  adminPublishClosetItem?: Maybe<ClosetItem>;
  adminRejectItem: ClosetItem;
  adminSetClosetAudience: ClosetItem;
  adminUpdateClosetItem: ClosetItem;
  bestieCreateClosetItem: ClosetItem;
  bestieDeleteClosetItem: Scalars['Boolean']['output'];
  bestieUpdateClosetItem: ClosetItem;
  commentOnClosetItem: Comment;
  createClosetItem: ClosetItem;
  createStory: Story;
  likeClosetItem: ClosetItem;
  publishStory: Story;
  requestClosetApproval: ClosetItem;
  /** Bestie workflow: request a background swap for a closet item. */
  requestClosetBackgroundChange: BgChangeRequestResult;
  setUserRole: RoleResult;
  updateClosetItemStory: ClosetItem;
  updateClosetMediaKey: ClosetItem;
};


export type MutationAdminApproveItemArgs = {
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminCreateClosetItemArgs = {
  input: AdminCreateClosetItemInput;
};


export type MutationAdminPublishClosetItemArgs = {
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminRejectItemArgs = {
  closetItemId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAdminSetClosetAudienceArgs = {
  audience: ClosetAudience;
  closetItemId: Scalars['ID']['input'];
};


export type MutationAdminUpdateClosetItemArgs = {
  input: AdminUpdateClosetItemInput;
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


export type MutationLikeClosetItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationPublishStoryArgs = {
  storyId: Scalars['ID']['input'];
};


export type MutationRequestClosetApprovalArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationRequestClosetBackgroundChangeArgs = {
  input: BgChangeRequestInput;
};


export type MutationSetUserRoleArgs = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationUpdateClosetItemStoryArgs = {
  input: UpdateClosetItemStoryInput;
};


export type MutationUpdateClosetMediaKeyArgs = {
  itemId: Scalars['ID']['input'];
  mediaKey: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  _root?: Maybe<Scalars['String']['output']>;
  adminClosetItemComments: CommentConnection;
  adminClosetItemLikes: LikeConnection;
  adminListClosetItems: ClosetConnection;
  adminListPending: ClosetConnection;
  bestieClosetItems: ClosetConnection;
  closetFeed: ClosetConnection;
  closetItemComments: CommentConnection;
  hello?: Maybe<Scalars['String']['output']>;
  me: Me;
  myCloset: ClosetConnection;
  myStories?: Maybe<BestieStoryConnection>;
  myWishlist: ClosetConnection;
  stories?: Maybe<BestieStoryConnection>;
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


export type QueryClosetFeedArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<ClosetFeedSort>;
};


export type QueryClosetItemCommentsArgs = {
  itemId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
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


export type QueryStoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  nextToken?: InputMaybe<Scalars['String']['input']>;
};

export type RoleResult = {
  __typename?: 'RoleResult';
  role: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
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

export type UpdateClosetItemStoryInput = {
  itemId: Scalars['ID']['input'];
  storyId?: InputMaybe<Scalars['ID']['input']>;
  storyPosition?: InputMaybe<Scalars['Int']['input']>;
};

export type HelloQueryVariables = Exact<{ [key: string]: never; }>;


export type HelloQuery = { __typename?: 'Query', hello?: string | null };


export const HelloDocument = gql`
    query Hello {
  hello
}
    `;

/**
 * __useHelloQuery__
 *
 * To run a query within a React component, call `useHelloQuery` and pass it any options that fit your needs.
 * When your component renders, `useHelloQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHelloQuery({
 *   variables: {
 *   },
 * });
 */
export function useHelloQuery(baseOptions?: Apollo.QueryHookOptions<HelloQuery, HelloQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HelloQuery, HelloQueryVariables>(HelloDocument, options);
      }
export function useHelloLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HelloQuery, HelloQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HelloQuery, HelloQueryVariables>(HelloDocument, options);
        }
// @ts-ignore
export function useHelloSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HelloQuery, HelloQueryVariables>): Apollo.UseSuspenseQueryResult<HelloQuery, HelloQueryVariables>;
export function useHelloSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HelloQuery, HelloQueryVariables>): Apollo.UseSuspenseQueryResult<HelloQuery | undefined, HelloQueryVariables>;
export function useHelloSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HelloQuery, HelloQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HelloQuery, HelloQueryVariables>(HelloDocument, options);
        }
export type HelloQueryHookResult = ReturnType<typeof useHelloQuery>;
export type HelloLazyQueryHookResult = ReturnType<typeof useHelloLazyQuery>;
export type HelloSuspenseQueryHookResult = ReturnType<typeof useHelloSuspenseQuery>;
export type HelloQueryResult = Apollo.QueryResult<HelloQuery, HelloQueryVariables>;