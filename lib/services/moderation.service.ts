/**
 * Content Moderation Service
 * AWS Rekognition Integration with Two-Threshold System
 */

import {
  ModerationStatus,
  ModerationAnalysis,
  ModerationDecision,
  RekognitionThresholds,
  RepeatOffenderStatus,
  MinorsShadowModerationFlag,
} from "../types/moderation";

const TABLE_MODERATION_AUDIT = "MODERATION_AUDIT";
const TABLE_MODERATION_CONFIG = "MODERATION_CONFIG";
const PROFANITY_LIST = [
  // Standard profanity (expandable)
  "damn",
  "hell",
  "crap",
];

export const DEFAULT_REKOGNITION_THRESHOLDS: RekognitionThresholds = {
  autoRejectThreshold: 0.95, // 95% confidence
  humanReviewThreshold: 0.85, // 85% confidence
  autoApproveThreshold: 0.6, // 60% confidence
  repeatOffenderStrikeThreshold: 3,
  minorsShadowModerationEnabled: true,
  minorsRiskThreshold: 0.75, // 75% confidence for minors+sexual
};

export class ModerationService {
  constructor(
    private dynamoDB: any,
    private rekognition: any,
    private textAnalyzer: any
  ) {}

  /**
   * Analyze Content Item
   * - Text: profanity check, spam detection
   * - Images: AWS Rekognition (explicit, suggestive, weapons)
   * - Metadata: tag/description validation
   * - Repeat offender check
   */
  async analyzeContent(
    itemId: string,
    userId: string,
    content: {
      text?: string;
      imageUrl?: string;
      tags?: string[];
      description?: string;
    }
  ): Promise<ModerationAnalysis | null> {
    try {
      const analysis: ModerationAnalysis = {
        overallConfidence: 0,
        repeatOffender: {
          isRepeatOffender: false,
          strikeCount: 0,
          requiresManualReview: false,
        },
      };

      // Analyze text
      if (content.text) {
        analysis.text = this.analyzeText(content.text);
      }

      // Analyze image with Rekognition
      if (content.imageUrl) {
        analysis.image = await this.analyzeImage(content.imageUrl);

        // Check for minors + sexual content shadow moderation
        if (
          analysis.image &&
          this.hasMinorsAndSexualContent(analysis.image)
        ) {
          analysis.shadowModeration = {
            flagged: true,
            reason: "minors_sexual_content",
            escalated: true,
          };
        }
      }

      // Analyze metadata
      if (content.tags || content.description) {
        analysis.metadata = this.analyzeMetadata(
          content.tags,
          content.description
        );
      }

      // Check repeat offender status
      const repeatStatus = await this.getRepeatOffenderStatus(userId);
      if (repeatStatus) {
        analysis.repeatOffender = {
          isRepeatOffender: repeatStatus.strikeCount >= 3,
          strikeCount: repeatStatus.strikeCount,
          requiresManualReview: repeatStatus.strikeCount >= 3,
        };
      }

      // Calculate overall confidence
      if (analysis.image) {
        analysis.overallConfidence = analysis.image.topConfidence;
      } else if (analysis.text) {
        analysis.overallConfidence = analysis.text.hasProfanity ? 0.95 : 0.3;
      }

      return analysis;
    } catch (error) {
      console.error("Analyze content error:", error);
      return null;
    }
  }

  /**
   * Make Moderation Decision
   * - Auto-reject (95%+): explicit sexual, nudity, violence
   * - Human review (85%): suggestive, partial nudity, weapons
   * - Auto-approve (<60%): low risk
   * - Special: shadow moderation for minors+sexual
   */
  async makeModerationDecision(
    itemId: string,
    userId: string,
    analysis: ModerationAnalysis
  ): Promise<ModerationDecision> {
    let status: ModerationStatus;
    let reason: string;

    // Check shadow moderation first
    if (analysis.shadowModeration?.flagged) {
      status = ModerationStatus.REJECTED;
      reason = "Content violates minors safety policy";
      return {
        itemId,
        status,
        confidence: 1.0,
        reason,
        analysis,
        submittedAt: Date.now(),
        reviewedAt: Date.now(),
        appealable: false,
      };
    }

    // Check repeat offender
    if (analysis.repeatOffender.requiresManualReview) {
      status = ModerationStatus.PENDING_HUMAN_REVIEW;
      reason = "Account under review due to repeat violations";
      return {
        itemId,
        status,
        confidence: analysis.overallConfidence,
        reason,
        analysis,
        submittedAt: Date.now(),
        reviewedAt: Date.now(),
        appealable: true,
      };
    }

    // Apply thresholds
    if (analysis.overallConfidence >= DEFAULT_REKOGNITION_THRESHOLDS.autoRejectThreshold) {
      // Auto-reject
      status = ModerationStatus.REJECTED;
      reason = "Content violates community guidelines";

      // Increment repeat offender strikes
      await this.incrementRepeatOffenderStrikes(userId);
    } else if (
      analysis.overallConfidence >=
      DEFAULT_REKOGNITION_THRESHOLDS.humanReviewThreshold
    ) {
      // Human review
      status = ModerationStatus.PENDING_HUMAN_REVIEW;
      reason = "Content flagged for human review";
    } else if (
      analysis.overallConfidence <
      DEFAULT_REKOGNITION_THRESHOLDS.autoApproveThreshold
    ) {
      // Auto-approve
      status = ModerationStatus.APPROVED;
      reason = "Content passed moderation checks";
    } else {
      // Borderline - human review
      status = ModerationStatus.PENDING_HUMAN_REVIEW;
      reason = "Content requires human review";
    }

    return {
      itemId,
      status,
      confidence: analysis.overallConfidence,
      reason,
      analysis,
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
      appealable: status !== ModerationStatus.REJECTED,
    };
  }

  /**
   * Analyze Text Content
   * - Profanity filtering
   * - Character limits (tags, captions)
   * - Spam detection
   */
  private analyzeText(text: string): {
    hasProfanity: boolean;
    profanityMatches?: string[];
    spamScore: number;
    characterCount: number;
    valid: boolean;
  } {
    const lower = text.toLowerCase();

    // Check profanity
    const profanityMatches = PROFANITY_LIST.filter((word) =>
      lower.includes(word)
    );

    // Check character limits
    const characterCount = text.length;
    const valid = characterCount > 0 && characterCount <= 5000;

    // Spam score (basic heuristics)
    const spamScore = this.calculateSpamScore(text);

    return {
      hasProfanity: profanityMatches.length > 0,
      profanityMatches: profanityMatches.length > 0 ? profanityMatches : undefined,
      spamScore,
      characterCount,
      valid,
    };
  }

  /**
   * Analyze Image with AWS Rekognition
   * - Explicit content detection
   * - Labels (weapons, violence, etc.)
   * - Confidence scoring
   */
  private async analyzeImage(
    imageUrl: string
  ): Promise<{
    rekognitionResults: any[];
    topLabel: string;
    topConfidence: number;
    hasExplicitContent: boolean;
    hasSuggestiveContent: boolean;
    hasWeapons: boolean;
    valid: boolean;
    minorsRisk: { detected: boolean; confidence: number };
  }> {
    try {
      // Call Rekognition DetectModerationLabels
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.CONTENT_BUCKET,
            Name: imageUrl.split("/").pop(), // extract key from URL
          },
        },
        MinConfidence: 60,
      };

      const result = await this.rekognition
        .detectModerationLabels(params)
        .promise();

      const labels = result.ModerationLabels || [];
      const topLabel = labels[0]?.Name || "NONE";
      const topConfidence = labels[0]?.Confidence || 0;

      return {
        rekognitionResults: labels,
        topLabel,
        topConfidence: topConfidence / 100,
        hasExplicitContent: this.hasLabel(labels, ["EXPLICIT"]),
        hasSuggestiveContent: this.hasLabel(labels, ["SUGGESTIVE"]),
        hasWeapons: this.hasLabel(labels, ["WEAPONS", "VIOLENCE"]),
        valid: true,
        minorsRisk: {
          detected: this.hasLabel(labels, ["MINORS"]),
          confidence: this.getLabelConfidence(labels, "MINORS") / 100,
        },
      };
    } catch (error) {
      console.error("Analyze image error:", error);
      return {
        rekognitionResults: [],
        topLabel: "ERROR",
        topConfidence: 0,
        hasExplicitContent: false,
        hasSuggestiveContent: false,
        hasWeapons: false,
        valid: false,
        minorsRisk: { detected: false, confidence: 0 },
      };
    }
  }

  /**
   * Analyze Metadata
   * - Tag validation
   * - Description length
   * - Brand safety
   */
  private analyzeMetadata(
    tags?: string[],
    description?: string
  ): {
    tagsValid: boolean;
    invalidTags?: string[];
    descriptionValid: boolean;
    descriptionLength: number;
    brandSafetyCompliant: boolean;
    valid: boolean;
  } {
    const RESTRICTED_TAGS = ["minors", "explicit", "adult"];

    let invalidTags: string[] = [];
    if (tags) {
      invalidTags = tags.filter((tag) =>
        RESTRICTED_TAGS.some((restricted) =>
          tag.toLowerCase().includes(restricted)
        )
      );
    }

    const descriptionLength = description?.length || 0;

    return {
      tagsValid: invalidTags.length === 0,
      invalidTags: invalidTags.length > 0 ? invalidTags : undefined,
      descriptionValid: descriptionLength > 0 && descriptionLength <= 1000,
      descriptionLength,
      brandSafetyCompliant: invalidTags.length === 0,
      valid: invalidTags.length === 0 && descriptionLength <= 1000,
    };
  }

  /**
   * Check if Minors + Sexual Content Present
   * Shadow moderation trigger
   */
  private hasMinorsAndSexualContent(imageAnalysis: any): boolean {
    const minorsDetected = imageAnalysis.minorsRisk.detected;
    const sexualDetected =
      imageAnalysis.hasExplicitContent ||
      imageAnalysis.hasSuggestiveContent;
    return minorsDetected && sexualDetected;
  }

  /**
   * Get Repeat Offender Status
   */
  private async getRepeatOffenderStatus(
    userId: string
  ): Promise<RepeatOffenderStatus | null> {
    try {
      // Query recent rejections for user
      const result = await this.dynamoDB.query({
        TableName: TABLE_MODERATION_AUDIT,
        IndexName: "userId-timestamp",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ScanIndexForward: false,
        Limit: 10,
      });

      const items = result.Items || [];
      const recentStrikes = items.filter(
        (item: any) => item.status === ModerationStatus.REJECTED
      );

      return {
        userId,
        strikeCount: recentStrikes.length,
        lastStrikeAt:
          recentStrikes.length > 0
            ? recentStrikes[0].timestamp
            : undefined,
        requiresManualReview:
          recentStrikes.length >= DEFAULT_REKOGNITION_THRESHOLDS.repeatOffenderStrikeThreshold,
        strikes: recentStrikes.slice(0, 5),
      };
    } catch (error) {
      console.error("Get repeat offender status error:", error);
      return null;
    }
  }

  /**
   * Increment Repeat Offender Strikes
   */
  private async incrementRepeatOffenderStrikes(userId: string): Promise<void> {
    try {
      const status = await this.getRepeatOffenderStatus(userId);
      if (status) {
        status.strikeCount += 1;
        // Could update a separate REPEAT_OFFENDERS table here
      }
    } catch (error) {
      console.error("Increment strikes error:", error);
    }
  }

  /**
   * Helper: Calculate Spam Score
   */
  private calculateSpamScore(text: string): number {
    let score = 0;

    // Too many emojis
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 10) score += 30;

    // Too many repeated characters
    if (/(.)\1{4,}/.test(text)) score += 20;

    // Too many hashtags
    const hashtagCount = (text.match(/#/g) || []).length;
    if (hashtagCount > 5) score += 20;

    // Suspicious links
    if (/(http|https):\/\//.test(text) && text.length < 50) score += 30;

    return Math.min(score, 100);
  }

  /**
   * Helper: Check if Label Exists
   */
  private hasLabel(labels: any[], labelNames: string[]): boolean {
    return labels.some((label) => labelNames.includes(label.Name));
  }

  /**
   * Helper: Get Label Confidence
   */
  private getLabelConfidence(labels: any[], labelName: string): number {
    const label = labels.find((l: any) => l.Name === labelName);
    return label?.Confidence || 0;
  }
}

export default ModerationService;
