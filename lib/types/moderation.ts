/**
 * Content Moderation Types
 * AWS Rekognition Integration with Two-Threshold System
 */

export enum ModerationStatus {
  PENDING = "pending_moderation",
  APPROVED = "approved",
  REJECTED = "rejected",
  PENDING_HUMAN_REVIEW = "pending_human_review",
  FLAGGED = "flagged",
}

export enum ModerationType {
  TEXT = "text",
  IMAGE = "image",
  METADATA = "metadata",
}

export interface RekognitionThresholds {
  // Auto-reject threshold: explicit sexual content, nudity, graphic violence
  autoRejectThreshold: number; // 95%

  // Human review threshold: suggestive, partial nudity, weapons, moderation flags
  humanReviewThreshold: number; // 85%

  // Auto-approve threshold: low-risk items
  autoApproveThreshold: number; // 60%

  // Repeat offender enforcement
  repeatOffenderStrikeThreshold: number; // strikes required to require manual review

  // Shadow moderation for minors
  minorsShadowModerationEnabled: boolean;
  minorsRiskThreshold: number; // confidence % for minors+sexual content
}

export interface RekognitionResult {
  confidence: number; // 0-100
  label: string; // "EXPLICIT", "SUGGESTIVE", "WEAPONS", etc.
  parentLabel?: string;
  instances?: Array<{
    boundingBox: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;
}

export interface ModerationAnalysis {
  // Text analysis
  text?: {
    hasProfanity: boolean;
    profanityMatches?: string[];
    spamScore: number; // 0-100
    characterCount: number;
    valid: boolean;
  };

  // Image analysis
  image?: {
    rekognitionResults: RekognitionResult[];
    topLabel: string;
    topConfidence: number;
    hasExplicitContent: boolean;
    hasSuggestiveContent: boolean;
    hasWeapons: boolean;
    valid: boolean;
    minorsRisk: {
      detected: boolean;
      confidence: number;
    };
  };

  // Metadata analysis
  metadata?: {
    tagsValid: boolean;
    invalidTags?: string[];
    descriptionValid: boolean;
    descriptionLength: number;
    brandSafetyCompliant: boolean;
    valid: boolean;
  };

  // Repeat offender check
  repeatOffender: {
    isRepeatOffender: boolean;
    strikeCount: number;
    requiresManualReview: boolean;
  };

  // Overall decision
  overallConfidence: number;
  shadowModeration?: {
    flagged: boolean;
    reason: string; // "minors_sexual_content", etc.
    escalated: boolean;
  };
}

export interface ModerationDecision {
  itemId: string;
  status: ModerationStatus;
  confidence: number;
  reason: string;

  // Analysis details
  analysis: ModerationAnalysis;

  // Timeline
  submittedAt: number;
  reviewedAt: number;
  reviewedBy?: string; // admin user if manual review

  // Appeals
  appealable: boolean;
  appealedAt?: number;
  appealReason?: string;
  appealStatus?: "pending" | "approved" | "rejected";
}

export interface ProfanityRule {
  pattern: string; // regex or exact match
  severity: "high" | "medium" | "low";
  replacement?: string;
  context?: "any" | "hashtag" | "caption" | "comment";
}

export interface ModerationAuditLog {
  itemId: string;
  timestamp: number;
  reviewer: string; // system or admin userId
  status: ModerationStatus;
  rekognitionResults: RekognitionResult[];
  confidence: number;
  decision: ModerationDecision;
  actionTaken: string;
  notes?: string;
}

export interface ModerationResponse {
  ok: boolean;
  itemId?: string;
  status?: ModerationStatus;
  confidence?: number;
  reason?: string;
  message?: string;
  error?: string;
  notificationSent?: boolean;
  appealable?: boolean;
  shadowModerated?: boolean;
  escalated?: boolean;
}

export interface RepeatOffenderStatus {
  userId: string;
  strikeCount: number;
  lastStrikeAt?: number;
  requiresManualReview: boolean;
  strikes: {
    itemId: string;
    reason: string;
    timestamp: number;
    status: "active" | "resolved";
  }[];
}

export interface MinorsShadowModerationFlag {
  itemId: string;
  userId: string;
  minorsDetected: boolean;
  sexualContentDetected: boolean;
  combinedRisk: number; // confidence %
  flaggedAt: number;
  escalated: boolean;
  escalatedTo?: string[]; // admin userIds
  action: "blocked" | "pending_review";
}

export interface ContentModerationNotification {
  userId: string;
  itemId: string;
  status: ModerationStatus;
  reason: string;
  decidedAt: number;
  appealable: boolean;
  appealLink?: string;
  nextSteps?: string;
  supportLink?: string;
}
