// lambda/closet/notify-admin.ts

/**
 * Placeholder Lambda for notifying admins about closet / background requests.
 *
 * BestiesClosetStack wires this into a Step Functions workflow.
 * For now it just logs the event and returns a simple "ok" result so
 * the workflow can continue without doing any real notification work yet.
 */

type NotifyAdminEvent = {
  itemId?: string;
  storyId?: string;
  ownerId?: string;
  reason?: string;
  type?: string;
  [key: string]: any;
};

type NotifyAdminResult = {
  ok: boolean;
  notified: boolean;
  itemId?: string;
  storyId?: string;
  note?: string;
};

export const handler = async (
  event: NotifyAdminEvent | any
): Promise<NotifyAdminResult> => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));

  const itemId = event.itemId || event.closetItemId || undefined;
  const storyId = event.storyId || undefined;

  // ✨ In the future you could:
  // - send an email via SES
  // - push a message to an SNS topic / Slack webhook
  // - create an "AdminTask" record in DynamoDB, etc.

  return {
    ok: true,
    notified: false, // flip to true once you actually notify someone
    itemId,
    storyId,
    note: "Admin notification stub – no real notifications sent yet.",
  };
};
