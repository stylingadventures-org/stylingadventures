// lambda/graphql/index.ts
import {
  myCloset,
  adminListPending,
  createClosetItem,
  requestClosetApproval,
} from "./closet";

type AppSyncHandler = (event: any) => Promise<any>;

const map: Record<string, AppSyncHandler> = {
  // Queries
  myCloset,
  adminListPending,
  // Mutations
  createClosetItem,
  requestClosetApproval,
  // Optional smoke test if you ever route hello here
  hello: async () => "Hello from Styling Adventures 👋",
};

export const handler: AppSyncHandler = async (event) => {
  const field = event?.info?.fieldName as string;
  const fn = map[field];
  if (!fn) throw new Error(`No resolver for field ${field}`);
  return fn(event);
};
