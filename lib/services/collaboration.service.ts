/**
 * Collaboration Service
 * Master Agreement + Project Addendum Management
 */

import { v4 as uuidv4 } from "uuid";
import {
  Collaboration,
  CollaborationStatus,
  CollaborationInvite,
  MasterTerms,
  ProjectAddendum,
} from "../types/collaboration";

const TABLE_COLLABORATIONS = "COLLABORATIONS";
const TABLE_COLLAB_INVITES = "COLLAB_INVITES";

export class CollaborationService {
  constructor(private dynamoDB: any, private s3: any) {}

  /**
   * Create a Master Collaboration Agreement Template
   * (shared across all collabs with versioning support)
   */
  static getMasterTermsTemplate(version: number = 1): MasterTerms {
    return {
      contentOwnership: {
        primeOwnsEdited: true,
        creatorRetainsRaw: true,
        creatorRetainsPreExistingIP: true,
      },
      licenseGrant: {
        worldwide: true,
        royaltyFree: true,
        scope: "deliverables_and_promotion",
      },
      exclusivity: {
        exclusive: false, // default none
      },
      duration: {
        promotionalMonths: 12,
        perpetualArchival: true,
      },
      approvals: {
        creatorReviewPasses: 1,
        finalCutAuthority: "prime_studios",
      },
      brandSafety: {
        noHate: true,
        noMinors: true,
        noExplicitContent: true,
        complianceRequired: true,
      },
      attribution: {
        creditInApp: true,
        creditInCaptions: true,
        creditsStudioIntegration: true,
      },
      termination: {
        primeCanCancelForViolations: true,
        refundPolicyIfPrimeCancels: true,
      },
      version,
    };
  }

  /**
   * Create Collaboration Invite
   * - Generate secure token
   * - Store invite (expires 14 days)
   * - Initialize collaboration record
   */
  async createInvite(
    inviterId: string,
    inviteeId: string,
    addendumConfig: ProjectAddendum
  ): Promise<{
    ok: boolean;
    inviteId?: string;
    token?: string;
    collabId?: string;
    error?: string;
  }> {
    try {
      // Validate inviter is authenticated
      if (!inviterId || inviterId.length === 0) {
        return { ok: false, error: "Inviter not authenticated" };
      }

      // Generate IDs and token
      const collabId = uuidv4();
      const inviteId = uuidv4();
      const token = this.generateSecureToken();

      // Validate addendum config
      if (!this.validateAddendumConfig(addendumConfig)) {
        return { ok: false, error: "Invalid addendum configuration" };
      }

      // Create COLLAB_INVITES record (expires in 14 days)
      const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
      const inviteRecord: CollaborationInvite = {
        inviteId,
        token,
        collabId,
        inviterId,
        inviteeId,
        masterTermsVersion: 1,
        createdAt: Date.now(),
        expiresAt,
      };

      await this.dynamoDB.put({
        TableName: TABLE_COLLAB_INVITES,
        Item: inviteRecord,
      });

      // Create COLLABORATIONS record (status: pending_invite)
      const collabRecord: Collaboration = {
        collabId,
        inviterId,
        inviteeId,
        status: CollaborationStatus.PENDING_INVITE,
        createdAt: Date.now(),
        expiresAt,
        masterTermsVersion: 1,
        masterTermsAccepted: {},
        addendumTermsAccepted: {},
        addendumConfig,
        sharedPrefix: `collabs/${collabId}/`,
        earningsSplit: {
          prime_pct: addendumConfig.earningsSplit.prime_pct,
          creator_pct: addendumConfig.earningsSplit.creator_pct,
        },
        totalEarningsPool: 0,
      };

      await this.dynamoDB.put({
        TableName: TABLE_COLLABORATIONS,
        Item: collabRecord,
      });

      return {
        ok: true,
        inviteId,
        token,
        collabId,
      };
    } catch (error) {
      console.error("Create invite error:", error);
      return { ok: false, error: "Failed to create invite" };
    }
  }

  /**
   * Accept Collaboration Invite
   * - Validate invite not expired
   * - Move to pending_terms status
   * - Provision shared S3 prefix + DynamoDB access
   */
  async acceptInvite(
    inviteToken: string,
    inviteeId: string
  ): Promise<{
    ok: boolean;
    collabId?: string;
    status?: CollaborationStatus;
    sharedWorkspace?: {
      s3Prefix: string;
      readAccess: boolean;
      writeAccess: boolean;
    };
    error?: string;
  }> {
    try {
      // Find invite by token
      const inviteRecord = await this.dynamoDB.query({
        TableName: TABLE_COLLAB_INVITES,
        IndexName: "token-index", // assumes token GSI exists
        KeyConditionExpression: "token = :token",
        ExpressionAttributeValues: { ":token": inviteToken },
        Limit: 1,
      });

      if (!inviteRecord.Items || inviteRecord.Items.length === 0) {
        return { ok: false, error: "Invalid invite token" };
      }

      const invite = inviteRecord.Items[0] as CollaborationInvite;

      // Validate not expired
      if (invite.expiresAt < Date.now()) {
        return { ok: false, error: "Invite expired" };
      }

      // Validate inviteeId matches
      if (invite.inviteeId !== inviteeId) {
        return { ok: false, error: "Invite not for this user" };
      }

      // Load collaboration
      const collab = await this.dynamoDB.get({
        TableName: TABLE_COLLABORATIONS,
        Key: { collabId: invite.collabId },
      });

      if (!collab.Item) {
        return { ok: false, error: "Collaboration not found" };
      }

      const collabRecord = collab.Item as Collaboration;

      // Update to pending_terms
      collabRecord.status = CollaborationStatus.PENDING_TERMS;
      await this.dynamoDB.put({
        TableName: TABLE_COLLABORATIONS,
        Item: collabRecord,
      });

      // Provision shared S3 prefix (create empty marker object)
      const s3Key = `${collabRecord.sharedPrefix}.initialized`;
      await this.s3.putObject({
        Bucket: process.env.CONTENT_BUCKET,
        Key: s3Key,
        Body: JSON.stringify({
          collabId: collabRecord.collabId,
          initializedAt: new Date().toISOString(),
        }),
        ContentType: "application/json",
      });

      return {
        ok: true,
        collabId: collabRecord.collabId,
        status: CollaborationStatus.PENDING_TERMS,
        sharedWorkspace: {
          s3Prefix: collabRecord.sharedPrefix,
          readAccess: true,
          writeAccess: true,
        },
      };
    } catch (error) {
      console.error("Accept invite error:", error);
      return { ok: false, error: "Failed to accept invite" };
    }
  }

  /**
   * Accept Terms (Master + Addendum)
   * - Mark terms as accepted by user
   * - If both accepted → status: active
   */
  async acceptTerms(
    collabId: string,
    userId: string,
    agreeToMaster: boolean,
    agreeToAddendum: boolean
  ): Promise<{
    ok: boolean;
    status?: CollaborationStatus;
    bothAccepted?: boolean;
    error?: string;
  }> {
    try {
      // Load collaboration
      const result = await this.dynamoDB.get({
        TableName: TABLE_COLLABORATIONS,
        Key: { collabId },
      });

      if (!result.Item) {
        return { ok: false, error: "Collaboration not found" };
      }

      const collab = result.Item as Collaboration;

      // Validate user is participant
      if (userId !== collab.inviterId && userId !== collab.inviteeId) {
        return { ok: false, error: "Not a participant in this collaboration" };
      }

      // Mark terms as accepted
      if (agreeToMaster) {
        collab.masterTermsAccepted[userId] = Date.now();
      }
      if (agreeToAddendum) {
        collab.addendumTermsAccepted[userId] = Date.now();
      }

      // Check if both accepted
      const bothAccepted =
        Object.keys(collab.masterTermsAccepted).length === 2 &&
        Object.keys(collab.addendumTermsAccepted).length === 2;

      if (bothAccepted) {
        collab.status = CollaborationStatus.ACTIVE;
      }

      // Update record
      await this.dynamoDB.put({
        TableName: TABLE_COLLABORATIONS,
        Item: collab,
      });

      return {
        ok: true,
        status: collab.status,
        bothAccepted,
      };
    } catch (error) {
      console.error("Accept terms error:", error);
      return { ok: false, error: "Failed to accept terms" };
    }
  }

  /**
   * Get Collaboration Details
   */
  async getCollaboration(collabId: string): Promise<Collaboration | null> {
    try {
      const result = await this.dynamoDB.get({
        TableName: TABLE_COLLABORATIONS,
        Key: { collabId },
      });
      return result.Item || null;
    } catch (error) {
      console.error("Get collaboration error:", error);
      return null;
    }
  }

  /**
   * Validate Addendum Config
   */
  private validateAddendumConfig(config: ProjectAddendum): boolean {
    // Check earnings split totals 100
    if (
      config.earningsSplit.prime_pct + config.earningsSplit.creator_pct !==
      100
    ) {
      return false;
    }

    // Check percentages are valid
    if (
      config.earningsSplit.prime_pct < 0 ||
      config.earningsSplit.prime_pct > 100
    ) {
      return false;
    }

    // Check deliverables exist
    if (!config.deliverables || config.deliverables.length === 0) {
      return false;
    }

    // Check dates are valid
    if (
      !config.deadlines.kickoffDate ||
      !config.deadlines.deliveryDate ||
      config.deadlines.deliveryDate <= config.deadlines.kickoffDate
    ) {
      return false;
    }

    return true;
  }

  /**
   * Generate Secure Token
   */
  private generateSecureToken(): string {
    return Buffer.from(`${uuidv4()}-${Date.now()}`).toString("base64");
  }
}

export default CollaborationService;
