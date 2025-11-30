// lambda/closet/pii-check.ts

/**
 * Very simple PII checker stub.
 *
 * BestiesClosetStack uses this in a Step Functions workflow to screen
 * captions / notes / story text for obvious PII before approving.
 *
 * For now this **does NOT** call any AWS service – it just runs a few
 * basic regex checks and returns a boolean + (optionally) a redacted
 * version of the text. You can wire Comprehend later if you want.
 */

type PiiCheckInput = {
  text?: string;
};

type PiiCheckResult = {
  ok: boolean;
  hasPii: boolean;
  redactedText: string;
  findings: string[];
};

function basicPiiScan(text: string): { hasPii: boolean; redacted: string; findings: string[] } {
  let findings: string[] = [];
  let redacted = text;

  // Very naive email detection
  const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  if (emailRe.test(text)) {
    findings.push("EMAIL");
    redacted = redacted.replace(emailRe, "[redacted-email]");
  }

  // Very naive phone number detection (US-ish)
  const phoneRe = /(\+?\d{1,2}[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
  if (phoneRe.test(text)) {
    findings.push("PHONE");
    redacted = redacted.replace(phoneRe, "[redacted-phone]");
  }

  // Very naive credit-card-ish pattern
  const ccRe = /\b(?:\d[ -]*?){13,16}\b/g;
  if (ccRe.test(text)) {
    findings.push("CARD");
    redacted = redacted.replace(ccRe, "[redacted-card]");
  }

  return {
    hasPii: findings.length > 0,
    redacted,
    findings,
  };
}

export const handler = async (event: PiiCheckInput | any): Promise<PiiCheckResult> => {
  console.log("[pii-check] event =", JSON.stringify(event));

  const text =
    (typeof event?.text === "string" && event.text) ||
    (typeof event?.body === "string" && event.body) ||
    "";

  const { hasPii, redacted, findings } = basicPiiScan(text || "");

  return {
    ok: true,
    hasPii,
    redactedText: redacted,
    findings,
  };
};
