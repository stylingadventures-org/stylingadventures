// site/src/types/auth.ts
// User context types for role-based UI

export type UserRole = "FAN" | "BESTIE" | "CREATOR" | "CREATOR_PENDING" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface BestieStatus {
  active: boolean;
  tier?: string;
  trialStatus?: string;
  renewsAt?: string;
}

export interface CreatorApplicationStatus {
  hasApplied: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | null;
  shopStatus?: string;
}

export interface UserContext {
  // JWT claims
  sub: string;
  email: string;
  
  // Groups from JWT (source of truth for coarse roles)
  isAdmin: boolean;
  isCreator: boolean; // has CREATOR group
  isPrime: boolean;
  
  // Entitlements from DynamoDB (fine-grained state)
  profile?: UserProfile;
  bestieStatus?: BestieStatus;
  creatorApplicationStatus?: CreatorApplicationStatus;
  
  // Derived role for UI routing
  role: UserRole;
  
  // Loading/error state
  loading: boolean;
  error?: string;
}
