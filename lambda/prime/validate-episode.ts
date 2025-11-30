// lambda/prime/validate-episode.ts

/**
 * Prime Studios - Episode Validator
 *
 * Role in pipeline:
 *  - Validate a full episode document before publish.
 *  - Run structural checks on modular components (invite, envelope, closet, etc).
 *  - Optionally respect layout checklist results provided by LayoutEngine.
 *
 * This is intentionally lightweight: pure validation, no DB writes.
 */

type Severity = "INFO" | "WARNING" | "ERROR";

export interface ValidationIssue {
  code: string;
  severity: Severity;
  message: string;
  path?: string; // JSONPath-ish hint, e.g. "components[0].id"
}

export interface EpisodeComponent {
  id?: string;
  kind?: string; // "invite" | "envelope" | "closet" | "outfit" | ...
  [key: string]: any;
}

export interface EpisodeLayoutChecklist {
  passed: boolean;
  issues?: ValidationIssue[];
  checkedAt?: string;
}

export interface EpisodeDocument {
  episodeId?: string;
  slug?: string;
  title?: string;
  status?: string;
  version?: string;
  components?: EpisodeComponent[];
  layout?: any;

  // optional layout checklist from LayoutEngineStack
  layoutChecklist?: EpisodeLayoutChecklist;

  // anything else
  [key: string]: any;
}

export interface ValidateEpisodeEvent {
  /**
   * The episode document to validate.
   */
  episode?: EpisodeDocument;

  /**
   * If true, this Lambda is expected to enforce layoutChecklist presence.
   * If false/undefined, layout is treated as best-effort.
   */
  requireLayoutChecklist?: boolean;
}

export interface ValidateEpisodeResult {
  ok: boolean;
  issues: ValidationIssue[];

  // normalized / minimally enriched episode for the rest of the pipeline
  episode: EpisodeDocument;

  // convenient flags for downstream steps / Step Functions
  summary: {
    hasInvite: boolean;
    hasEnvelope: boolean;
    hasCloset: boolean;
    hasOutfit: boolean;
    hasDialogue: boolean;
    hasSideQuests: boolean;
    hasCoinsConfig: boolean;
    hasLocations: boolean;
    hasPhotoshoots: boolean;
    hasLayoutChecklist: boolean;
    layoutChecklistPassed: boolean | null;
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function issue(
  code: string,
  severity: Severity,
  message: string,
  path?: string,
): ValidationIssue {
  return { code, severity, message, path };
}

function ensureEpisodeId(ep: EpisodeDocument, issues: ValidationIssue[]) {
  if (!ep.episodeId && !ep.slug) {
    issues.push(
      issue(
        "MISSING_EPISODE_ID",
        "ERROR",
        "Episode must have an 'episodeId' or 'slug'.",
      ),
    );
  }
}

function ensureTitle(ep: EpisodeDocument, issues: ValidationIssue[]) {
  if (!ep.title || !ep.title.trim()) {
    issues.push(
      issue("MISSING_TITLE", "ERROR", "Episode must have a title.", "title"),
    );
  } else if (ep.title.length > 140) {
    issues.push(
      issue(
        "TITLE_TOO_LONG",
        "WARNING",
        "Episode title is quite long (over 140 chars).",
        "title",
      ),
    );
  }
}

function ensureComponents(ep: EpisodeDocument, issues: ValidationIssue[]) {
  const comps = ep.components ?? [];

  if (!Array.isArray(comps) || comps.length === 0) {
    issues.push(
      issue(
        "NO_COMPONENTS",
        "ERROR",
        "Episode must contain at least one component.",
        "components",
      ),
    );
    return;
  }

  // Validate basic structure
  comps.forEach((c, idx) => {
    if (!c.kind) {
      issues.push(
        issue(
          "COMPONENT_KIND_MISSING",
          "ERROR",
          `Component at index ${idx} is missing 'kind'.`,
          `components[${idx}]`,
        ),
      );
    }
    if (!c.id) {
      issues.push(
        issue(
          "COMPONENT_ID_MISSING",
          "WARNING",
          `Component at index ${idx} is missing 'id'.`,
          `components[${idx}]`,
        ),
      );
    }
  });
}

function summarizeComponents(ep: EpisodeDocument) {
  const comps = ep.components ?? [];
  const has = (kind: string) =>
    comps.some((c) => typeof c.kind === "string" && c.kind === kind);

  return {
    hasInvite: has("invite"),
    hasEnvelope: has("envelope"),
    hasCloset: has("closet"),
    hasOutfit: has("outfit"),
    hasDialogue: has("dialogue"),
    hasSideQuests: has("side-quest") || has("sideQuest") || has("side_quest"),
    hasCoinsConfig: has("coins") || has("coin-config") || has("rewards"),
    hasLocations: has("location") || has("locations"),
    hasPhotoshoots: has("photoshoot") || has("photoshoots"),
  };
}

function checkBasicStoryFlow(
  summary: ReturnType<typeof summarizeComponents>,
  issues: ValidationIssue[],
) {
  if (!summary.hasInvite) {
    issues.push(
      issue(
        "NO_INVITE",
        "WARNING",
        "No 'invite' component found – consider adding an entry hook.",
      ),
    );
  }
  if (!summary.hasDialogue) {
    issues.push(
      issue(
        "NO_DIALOGUE",
        "WARNING",
        "No 'dialogue' components found – episode may feel silent.",
      ),
    );
  }
  if (!summary.hasCoinsConfig) {
    issues.push(
      issue(
        "NO_COINS_CONFIG",
        "INFO",
        "No coins / rewards configuration found; gig may not reward XP/coins.",
      ),
    );
  }
}

function checkLayoutChecklist(
  ep: EpisodeDocument,
  requireLayoutChecklist: boolean | undefined,
  issues: ValidationIssue[],
): { hasLayoutChecklist: boolean; layoutChecklistPassed: boolean | null } {
  const checklist = ep.layoutChecklist;

  if (!checklist) {
    if (requireLayoutChecklist) {
      issues.push(
        issue(
          "MISSING_LAYOUT_CHECKLIST",
          "ERROR",
          "Layout checklist is required but was not provided.",
          "layoutChecklist",
        ),
      );
    } else {
      issues.push(
        issue(
          "MISSING_LAYOUT_CHECKLIST",
          "WARNING",
          "No layoutChecklist present; episode will skip layout safety checks.",
          "layoutChecklist",
        ),
      );
    }
    return { hasLayoutChecklist: false, layoutChecklistPassed: null };
  }

  if (!checklist.passed) {
    issues.push(
      issue(
        "LAYOUT_CHECKLIST_FAILED",
        requireLayoutChecklist ? "ERROR" : "WARNING",
        "Layout checklist did not pass all rules.",
        "layoutChecklist",
      ),
    );
  }

  if (Array.isArray(checklist.issues)) {
    checklist.issues.forEach((i) =>
      issues.push(
        issue(
          `LAYOUT_${i.code ?? "ISSUE"}`,
          i.severity ?? "WARNING",
          i.message ?? "Layout checklist issue.",
          i.path,
        ),
      ),
    );
  }

  return {
    hasLayoutChecklist: true,
    layoutChecklistPassed: !!checklist.passed,
  };
}

// ─────────────────────────────────────────────
// Lambda handler
// ─────────────────────────────────────────────

export const handler = async (
  event: ValidateEpisodeEvent,
): Promise<ValidateEpisodeResult> => {
  console.log(
    "ValidateEpisode incoming event:",
    JSON.stringify(event, null, 2),
  );

  const issues: ValidationIssue[] = [];

  if (!event || !event.episode) {
    issues.push(
      issue(
        "MISSING_EPISODE",
        "ERROR",
        "ValidateEpisode requires 'episode' in the payload.",
      ),
    );
    return {
      ok: false,
      issues,
      episode: event?.episode ?? ({} as EpisodeDocument),
      summary: {
        hasInvite: false,
        hasEnvelope: false,
        hasCloset: false,
        hasOutfit: false,
        hasDialogue: false,
        hasSideQuests: false,
        hasCoinsConfig: false,
        hasLocations: false,
        hasPhotoshoots: false,
        hasLayoutChecklist: false,
        layoutChecklistPassed: null,
      },
    };
  }

  const ep: EpisodeDocument = {
    status: "draft",
    ...event.episode,
  };

  ensureEpisodeId(ep, issues);
  ensureTitle(ep, issues);
  ensureComponents(ep, issues);

  const summary = summarizeComponents(ep);
  checkBasicStoryFlow(summary, issues);

  const layoutStatus = checkLayoutChecklist(
    ep,
    event.requireLayoutChecklist,
    issues,
  );

  const ok = issues.every((i) => i.severity !== "ERROR");

  const result: ValidateEpisodeResult = {
    ok,
    issues,
    episode: ep,
    summary: {
      ...summary,
      hasLayoutChecklist: layoutStatus.hasLayoutChecklist,
      layoutChecklistPassed: layoutStatus.layoutChecklistPassed,
    },
  };

  console.log("ValidateEpisode result:", JSON.stringify(result, null, 2));

  return result;
};
