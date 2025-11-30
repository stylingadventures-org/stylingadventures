// lambda/prime/episode-assembler.ts

/**
 * Episode Assembler Lambda
 *
 * This is a minimal stub used by PrimeStudiosStack to assemble a full
 * episode structure from modular components (invite, envelope, closet, etc).
 *
 * For now it just echoes inputs and ensures the Step Functions workflow
 * has something predictable to work with. You can expand this later to:
 * - Fetch component JSON from S3/DynamoDB
 * - Validate against JSON Schemas
 * - Build a full episode graph with branches, polls, etc.
 */

export interface EpisodeComponentRef {
  type:
    | "INVITE"
    | "ENVELOPE"
    | "CLOSET"
    | "OUTFIT"
    | "DIALOGUE"
    | "SIDE_QUEST"
    | "COINS"
    | "LOCATION"
    | "PHOTOSHOOT"
    | string;
  id: string; // component id / key (e.g. S3 key or DDB pk)
}

export interface AssembleEpisodeInput {
  episodeId?: string;
  seasonId?: string;
  showId?: string;

  // Ordered list of modular components to stitch together
  components?: EpisodeComponentRef[];

  // Free-form metadata for now (rating, tags, etc)
  metadata?: Record<string, unknown>;

  // Who is running this (for audit)
  requestedBy?: {
    userId?: string;
    role?: string;
  };
}

export interface EpisodeNode {
  id: string;
  kind: string;
  ref?: EpisodeComponentRef;
}

export interface AssembledEpisode {
  episodeId: string;
  seasonId?: string;
  showId?: string;
  status: "DRAFT" | "READY_FOR_REVIEW" | "PUBLISHED";

  createdAt: string;
  updatedAt: string;

  // Very simple graph for now — linear sequence of nodes
  nodes: EpisodeNode[];

  metadata?: Record<string, unknown>;
  requestedBy?: AssembleEpisodeInput["requestedBy"];
}

/**
 * Generic handler so it works both from:
 * - Step Functions Task state
 * - Direct Lambda test events
 */
export const handler = async (
  event: AssembleEpisodeInput,
): Promise<AssembledEpisode> => {
  const now = new Date().toISOString();

  const episodeId =
    event.episodeId ?? `ep-${Math.random().toString(36).slice(2, 10)}`;

  const components = event.components ?? [];

  const nodes: EpisodeNode[] = components.map((ref, idx) => ({
    id: `${episodeId}-node-${idx}`,
    kind: ref.type,
    ref,
  }));

  const assembled: AssembledEpisode = {
    episodeId,
    seasonId: event.seasonId,
    showId: event.showId,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    nodes,
    metadata: event.metadata ?? {},
    requestedBy: event.requestedBy,
  };

  // For now, just log + return. Step Functions will pass this forward.
  console.log("Assembled episode:", JSON.stringify(assembled, null, 2));

  return assembled;
};
