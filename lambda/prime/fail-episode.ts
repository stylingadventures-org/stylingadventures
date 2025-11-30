// lambda/prime/fail-episode.ts

/**
 * Prime Studios - Fail Episode Handler
 *
 * This is used as the "catch" / failure branch in the Publishing
 * Step Functions workflow.
 *
 * Responsibilities:
 *  - Normalize any upstream error into a structured failure payload.
 *  - Optionally tag the episode as failed so the UI can surface it.
 *
 * Kept intentionally minimal: no external I/O, just shaping data for
 * Step Functions / API consumers.
 */

export interface EpisodeDocument {
  episodeId?: string;
  slug?: string;
  title?: string;
  status?: string;
  version?: string;
  [key: string]: any;
}

export interface ValidationIssue {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  path?: string;
}

export interface ValidationSummary {
  ok: boolean;
  issues?: ValidationIssue[];
  [key: string]: any;
}

/**
 * Event shape is intentionally loose: we accept anything the
 * Step Functions catch / fail branch passes down.
 */
export interface FailEpisodeEvent {
  episode?: EpisodeDocument;
  validation?: ValidationSummary;
  /**
   * Optional reason from upstream (e.g. thrown Error message).
   */
  reason?: string;
  /**
   * Optional stage hint (e.g. "validation", "layout", "publish_write").
   */
  stage?: string;
  /**
   * Raw error object from Step Functions catch if you want to inspect it.
   */
  error?: any;
}

export interface FailEpisodeResult {
  ok: false;
  failed: true;
  stage?: string;
  reason?: string;
  errorMessage?: string;
  episode?: EpisodeDocument;
  validation?: ValidationSummary;
}

// ─────────────────────────────────────────────
// Lambda handler
// ─────────────────────────────────────────────

export const handler = async (
  event: FailEpisodeEvent,
): Promise<FailEpisodeResult> => {
  console.log("FailEpisode incoming event:", JSON.stringify(event, null, 2));

  const episode: EpisodeDocument | undefined = event.episode
    ? {
        ...event.episode,
        status: event.episode.status ?? "failed",
      }
    : undefined;

  let reason = event.reason;
  let errorMessage: string | undefined;

  if (!reason && event.error) {
    // Common Step Functions error format: { Error, Cause }
    if (typeof event.error === "string") {
      reason = event.error;
    } else if (typeof (event.error as any).Error === "string") {
      reason = (event.error as any).Error;
    }

    if (typeof (event.error as any).Cause === "string") {
      errorMessage = (event.error as any).Cause;
    }
  }

  const result: FailEpisodeResult = {
    ok: false,
    failed: true,
    stage: event.stage,
    reason,
    errorMessage,
    episode,
    validation: event.validation,
  };

  console.log("FailEpisode result:", JSON.stringify(result, null, 2));

  return result;
};
