// lambda/prime/career-archive.ts

/**
 * Career Archive Lambda (Prime Studios)
 *
 * Purpose:
 *  - Track long-term viewer / story progression and character arcs.
 *  - Designed for internal Studio tools & workflows (Step Functions),
 *    not direct fan access.
 *
 * Current behavior:
 *  - Supports two simple operations:
 *      1) RECORD_EVENT → normalize and return a story progression event.
 *      2) GET_TIMELINE → return a mocked timeline summary.
 *
 * Future evolution:
 *  - Persist events into DynamoDB using TABLE_NAME, PK_NAME, SK_NAME.
 *  - Support richer queries: arc per character, per season, per viewer.
 */

export type CareerArchiveAction = "RECORD_EVENT" | "GET_TIMELINE";

export type ProgressEventType =
  | "EPISODE_STARTED"
  | "EPISODE_COMPLETED"
  | "BRANCH_SELECTED"
  | "CHARACTER_MILESTONE"
  | "ACHIEVEMENT_UNLOCKED";

export interface RecordEventInput {
  userId: string; // viewer / fan id
  episodeId?: string;
  characterId?: string;
  arcId?: string; // e.g. "prime.S1.C1.confidence-arc"

  eventType: ProgressEventType;
  at?: string; // ISO timestamp, optional (defaults to now)

  // Arbitrary extra data (branch id, poll option, etc.)
  payload?: Record<string, unknown>;
}

export interface GetTimelineInput {
  userId: string;
  characterId?: string;
  arcId?: string;

  // Optional pagination / filtering, not implemented yet
  limit?: number;
  cursor?: string;
}

export interface CareerArchiveEvent {
  action: CareerArchiveAction;
  record?: RecordEventInput;
  timeline?: GetTimelineInput;
}

export interface RecordedProgressEvent {
  eventId: string;
  userId: string;
  episodeId?: string;
  characterId?: string;
  arcId?: string;
  eventType: ProgressEventType;
  at: string;
  payload?: Record<string, unknown>;
}

export interface TimelineNode {
  eventId: string;
  label: string;
  episodeId?: string;
  characterId?: string;
  arcId?: string;
  eventType: ProgressEventType;
  at: string;
}

export interface TimelineSummary {
  userId: string;
  characterId?: string;
  arcId?: string;
  nodes: TimelineNode[];

  // Helpful for Studio dashboards
  stats: {
    totalEvents: number;
    episodesCompleted: number;
    achievementsUnlocked: number;
  };
}

export type CareerArchiveResult =
  | {
      kind: "recorded";
      event: RecordedProgressEvent;
    }
  | {
      kind: "timeline";
      summary: TimelineSummary;
    };

function ensureIsoTimestamp(ts?: string): string {
  if (!ts) return new Date().toISOString();
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
}

function buildEventId(): string {
  return `arc-${Math.random().toString(36).slice(2, 10)}`;
}

async function handleRecordEvent(
  input: RecordEventInput,
): Promise<CareerArchiveResult> {
  if (!input.userId) {
    throw new Error("CareerArchive RECORD_EVENT: missing userId");
  }
  if (!input.eventType) {
    throw new Error("CareerArchive RECORD_EVENT: missing eventType");
  }

  const at = ensureIsoTimestamp(input.at);

  const event: RecordedProgressEvent = {
    eventId: buildEventId(),
    userId: input.userId,
    episodeId: input.episodeId,
    characterId: input.characterId,
    arcId: input.arcId,
    eventType: input.eventType,
    at,
    payload: input.payload,
  };

  console.log(
    "CareerArchive RECORD_EVENT normalized:",
    JSON.stringify(event, null, 2),
  );

  // 🔜 Future:
  //   - If TABLE_NAME is set, persist event into DynamoDB.
  //   - pk = `USER#${userId}`, sk = `ARC#${arcId}#${at}` or similar.
  //
  // const tableName = process.env.TABLE_NAME;
  // if (tableName) { ... }

  return { kind: "recorded", event };
}

async function handleGetTimeline(
  input: GetTimelineInput,
): Promise<CareerArchiveResult> {
  if (!input.userId) {
    throw new Error("CareerArchive GET_TIMELINE: missing userId");
  }

  // Mocked timeline — this is where you'd:
  //   - Query DynamoDB for events scoped by userId + character/arc.
  //   - Sort by time and project into a Studio-friendly format.

  const now = new Date().toISOString();

  const nodes: TimelineNode[] = [
    {
      eventId: "mock-1",
      label: "Started first episode",
      episodeId: "EP-001",
      eventType: "EPISODE_STARTED",
      at: now,
    },
    {
      eventId: "mock-2",
      label: "Completed first episode",
      episodeId: "EP-001",
      eventType: "EPISODE_COMPLETED",
      at: now,
    },
  ];

  const summary: TimelineSummary = {
    userId: input.userId,
    characterId: input.characterId,
    arcId: input.arcId,
    nodes,
    stats: {
      totalEvents: nodes.length,
      episodesCompleted: nodes.filter(
        (n) => n.eventType === "EPISODE_COMPLETED",
      ).length,
      achievementsUnlocked: nodes.filter(
        (n) => n.eventType === "ACHIEVEMENT_UNLOCKED",
      ).length,
    },
  };

  console.log(
    "CareerArchive GET_TIMELINE summary (mock):",
    JSON.stringify(summary, null, 2),
  );

  return { kind: "timeline", summary };
}

export const handler = async (
  event: CareerArchiveEvent,
): Promise<CareerArchiveResult> => {
  console.log(
    "CareerArchive incoming event:",
    JSON.stringify(event, null, 2),
  );

  if (!event || !event.action) {
    throw new Error("CareerArchive: missing action");
  }

  switch (event.action) {
    case "RECORD_EVENT":
      if (!event.record) {
        throw new Error("CareerArchive RECORD_EVENT: missing 'record' payload");
      }
      return handleRecordEvent(event.record);

    case "GET_TIMELINE":
      if (!event.timeline) {
        throw new Error(
          "CareerArchive GET_TIMELINE: missing 'timeline' payload",
        );
      }
      return handleGetTimeline(event.timeline);

    default:
      // Type guard safety; should never hit with the union above.
      throw new Error(`CareerArchive: unsupported action ${(event as any).action}`);
  }
};
