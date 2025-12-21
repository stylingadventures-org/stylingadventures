/**
 * Collaboration System Types
 * Master Agreement + Project Addendum Model
 */

export enum CollaborationStatus {
  PENDING_INVITE = "pending_invite",
  PENDING_TERMS = "pending_terms",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

export enum CollaborationTier {
  STANDARD = "standard",
  BRAND = "brand",
  EXCLUSIVE = "exclusive",
}

export interface MasterTerms {
  // Content Ownership: Prime owns final edited assets; creator retains pre-existing IP
  contentOwnership: {
    primeOwnsEdited: boolean;
    creatorRetainsRaw: boolean;
    creatorRetainsPreExistingIP: boolean;
  };

  // License Grant: Worldwide, royalty-free for deliverables + promotion
  licenseGrant: {
    worldwide: boolean;
    royaltyFree: boolean;
    scope: "deliverables_and_promotion";
  };

  // Exclusivity: Default none; negotiable per brand/tier
  exclusivity: {
    exclusive: boolean;
    tier?: CollaborationTier;
    duration?: number; // in days
  };

  // Duration: 12 months promotional; perpetual archival for published
  duration: {
    promotionalMonths: number; // default 12
    perpetualArchival: boolean; // for published episodes
  };

  // Approvals: Creator gets one review pass; final cut by Prime Studios
  approvals: {
    creatorReviewPasses: number; // default 1
    finalCutAuthority: "prime_studios";
  };

  // Brand Safety
  brandSafety: {
    noHate: boolean;
    noMinors: boolean;
    noExplicitContent: boolean;
    complianceRequired: boolean;
  };

  // Attribution & Tagging
  attribution: {
    creditInApp: boolean;
    creditInCaptions: boolean;
    creditsStudioIntegration: boolean;
  };

  // Termination
  termination: {
    primeCanCancelForViolations: boolean;
    refundPolicyIfPrimeCancels: boolean;
  };

  // Metadata
  version: number;
  acceptedAt?: {
    [userId: string]: number; // timestamp
  };
}

export interface ProjectAddendum {
  // Deliverables list (episode segment, TikToks, "Shop the Look", etc.)
  deliverables: {
    type: string; // "episode", "tiktok", "shop_the_look", etc.
    description: string;
    dueDate: number; // timestamp
    revisionLimit?: number;
  }[];

  // Custom earnings split (if non-default)
  earningsSplit: {
    prime_pct: number; // 0-100
    creator_pct: number; // 0-100
    // Must total 100; validated on creation
  };

  // Deadlines + revision limits
  deadlines: {
    kickoffDate: number;
    deliveryDate: number;
    approvalDeadline: number;
  };

  // Exclusivity clause (if applicable)
  exclusivityClause?: {
    exclusive: boolean;
    tier: CollaborationTier;
    duration: number; // in days
    restrictedCategories?: string[];
  };
}

export interface Collaboration {
  // Identifiers
  collabId: string; // uuid
  inviterId: string; // creator who initiated
  inviteeId: string; // creator being invited

  // Status & Timeline
  status: CollaborationStatus;
  createdAt: number; // timestamp
  expiresAt?: number; // for pending invites
  deadline?: number; // project deadline

  // Terms & Agreements
  masterTermsVersion: number;
  masterTermsAccepted: {
    [userId: string]: number; // timestamp when accepted
  };
  addendumTermsAccepted: {
    [userId: string]: number; // timestamp when accepted
  };

  // Project Configuration
  addendumConfig: ProjectAddendum;

  // Shared Workspace
  sharedPrefix: string; // S3 prefix: collabs/{collabId}/

  // Earnings
  earningsSplit: {
    prime_pct: number;
    creator_pct: number;
  };
  totalEarningsPool: number; // cumulative coins earned

  // Notifications
  notifications?: {
    [userId: string]: {
      type: "reminder" | "deadline" | "approval" | "rejection";
      sentAt: number;
      read: boolean;
    }[];
  };
}

export interface CollaborationInvite {
  inviteId: string; // uuid
  token: string; // secure token for accepting invite
  collabId: string;
  inviterId: string;
  inviteeId: string;
  masterTermsVersion: number;
  createdAt: number;
  expiresAt: number; // 14 days from creation
}

export interface CollaborationResponse {
  ok: boolean;
  collabId?: string;
  inviteId?: string;
  token?: string;
  status?: CollaborationStatus;
  message?: string;
  error?: string;
  sharedWorkspace?: {
    s3Prefix: string;
    readAccess: boolean;
    writeAccess: boolean;
  };
}

export interface DeadlineReminder {
  collabId: string;
  daysUntilDeadline: number;
  remindedAt: number;
  usersNotified: string[];
  deliverables: {
    type: string;
    dueDate: number;
  }[];
}
