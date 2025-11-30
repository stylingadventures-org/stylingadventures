// lambda/prime/poll-manager.ts

/**
 * Prime Studios - Poll Manager
 *
 * Purpose:
 *  - Manage in-episode fan voting that can feed into story branches.
 *  - Designed for internal Prime Studios workflows (Step Functions, dashboards),
 *    not direct fan access.
 *
 * Current behavior (mock / test-friendly):
 *  - CREATE_POLL: validates and echoes a poll definition with a generated id.
 *  - VOTE: validates a vote and returns a mocked tally.
 *  - GET_RESULTS: returns a mocked result payload.
 *
 * Future work:
 *  - Persist polls + votes in DynamoDB using TABLE_NAME, PK_NAME, SK_NAME.
 *  - Support real aggregation, sharding, and per-episode / per-branch results.
 */

export type PollManagerAction = "CREATE_POLL" | "VOTE" | "GET_RESULTS";

export interface PollOption {
  id: string; // e.g. "opt-a"
  label: string; // e.g. "Team Confidence"
}

export interface CreatePollInput {
  episodeId: string;
  sceneId?: string;
  branchKey?: string; // optional branch identifier
  title: string;
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
  closesAt?: string; // ISO timestamp
}

export interface VoteInput {
  pollId: string;
  userId: string;
  // Either single option or multiple, depending on allowMultiple
  optionIds: string[];
}

export interface GetResultsInput {
  pollId: string;
}

export interface PollManagerEvent {
  action: PollManagerAction;
  createPoll?: CreatePollInput;
  vote?: VoteInput;
  results?: GetResultsInput;
}

export interface PollDefinition {
  pollId: string;
  episodeId: string;
  sceneId?: string;
  branchKey?: string;
  title: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  closesAt?: string;
  createdAt: string;
}

export interface PollVoteReceipt {
  pollId: string;
  userId: string;
  optionIds: string[];
  recordedAt: string;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  byOption: Array<{
    optionId: string;
    label: string;
    votes: number;
    percentage: number;
  }>;
}

export type PollManagerResult =
  | { kind: "created"; poll: PollDefinition }
  | { kind: "voted"; receipt: PollVoteReceipt; resultsPreview: PollResults }
  | { kind: "results"; results: PollResults };

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// CREATE_POLL
// ─────────────────────────────────────────────

async function handleCreatePoll(
  input: CreatePollInput,
): Promise<PollManagerResult> {
  if (!input.episodeId) {
    throw new Error("PollManager CREATE_POLL: missing episodeId");
  }
  if (!input.title) {
    throw new Error("PollManager CREATE_POLL: missing title");
  }
  if (!input.question) {
    throw new Error("PollManager CREATE_POLL: missing question");
  }
  if (!input.options || input.options.length < 2) {
    throw new Error("PollManager CREATE_POLL: need at least 2 options");
  }

  const pollId = randomId("poll");
  const createdAt = nowIso();

  const poll: PollDefinition = {
    pollId,
    episodeId: input.episodeId,
    sceneId: input.sceneId,
    branchKey: input.branchKey,
    title: input.title,
    question: input.question,
    options: input.options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      label: opt.label,
    })),
    allowMultiple: !!input.allowMultiple,
    closesAt: input.closesAt,
    createdAt,
  };

  console.log("PollManager CREATE_POLL:", JSON.stringify(poll, null, 2));

  // 🔜 Future:
  // - If TABLE_NAME is set, we could persist the poll definition:
  //   - pk = `POLL#${pollId}`, sk = `META`
  //   - store episode/scene/branch for Studio lookup.

  return { kind: "created", poll };
}

// ─────────────────────────────────────────────
// VOTE
// ─────────────────────────────────────────────

async function handleVote(input: VoteInput): Promise<PollManagerResult> {
  if (!input.pollId) {
    throw new Error("PollManager VOTE: missing pollId");
  }
  if (!input.userId) {
    throw new Error("PollManager VOTE: missing userId");
  }
  if (!input.optionIds || input.optionIds.length === 0) {
    throw new Error("PollManager VOTE: no optionIds provided");
  }

  const recordedAt = nowIso();

  const receipt: PollVoteReceipt = {
    pollId: input.pollId,
    userId: input.userId,
    optionIds: input.optionIds,
    recordedAt,
  };

  console.log("PollManager VOTE:", JSON.stringify(receipt, null, 2));

  // 🔜 Future:
  // - Persist per-user votes keyed by `POLL#pollId` + `USER#userId`.

  // For now, return a mocked aggregate so Studio UI can render something.
  const mockedResults: PollResults = {
    pollId: input.pollId,
    totalVotes: 42, // 🍿 arbitrary fun number
    byOption: input.optionIds.map((optId, idx) => ({
      optionId: optId,
      label: `Option ${idx + 1}`,
      votes: 10 + idx * 2,
      percentage: 100 / input.optionIds.length,
    })),
  };

  return { kind: "voted", receipt, resultsPreview: mockedResults };
}

// ─────────────────────────────────────────────
// GET_RESULTS
// ─────────────────────────────────────────────

async function handleGetResults(
  input: GetResultsInput,
): Promise<PollManagerResult> {
  if (!input.pollId) {
    throw new Error("PollManager GET_RESULTS: missing pollId");
  }

  // This is currently *mocked* – in the future, we'd aggregate votes
  // from DynamoDB or a streaming pipeline.

  const results: PollResults = {
    pollId: input.pollId,
    totalVotes: 100,
    byOption: [
      { optionId: "opt-1", label: "Option 1", votes: 60, percentage: 60 },
      { optionId: "opt-2", label: "Option 2", votes: 25, percentage: 25 },
      { optionId: "opt-3", label: "Option 3", votes: 15, percentage: 15 },
    ],
  };

  console.log("PollManager GET_RESULTS (mock):", JSON.stringify(results, null, 2));

  return { kind: "results", results };
}

// ─────────────────────────────────────────────
// LAMBDA HANDLER
// ─────────────────────────────────────────────

export const handler = async (
  event: PollManagerEvent,
): Promise<PollManagerResult> => {
  console.log("PollManager incoming event:", JSON.stringify(event, null, 2));

  if (!event || !event.action) {
    throw new Error("PollManager: missing action");
  }

  switch (event.action) {
    case "CREATE_POLL":
      if (!event.createPoll) {
        throw new Error(
          "PollManager CREATE_POLL: missing 'createPoll' payload",
        );
      }
      return handleCreatePoll(event.createPoll);

    case "VOTE":
      if (!event.vote) {
        throw new Error("PollManager VOTE: missing 'vote' payload");
      }
      return handleVote(event.vote);

    case "GET_RESULTS":
      if (!event.results) {
        throw new Error(
          "PollManager GET_RESULTS: missing 'results' payload",
        );
      }
      return handleGetResults(event.results);

    default:
      // Type guard catch-all
      throw new Error(`PollManager: unsupported action ${(event as any).action}`);
  }
};
