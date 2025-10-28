// lambda/graphql/index.ts
import * as closet from "./closet";

type AppSyncEvent = {
  info: { fieldName: string; parentTypeName: string };
  arguments: any;
  identity?: any;
};

export const handler = async (event: AppSyncEvent) => {
  const f = event.info.fieldName;

  // Queries
  if (f === "hello") return "Hello from Styling Adventures 👋";
  if (f === "myCloset") return closet.myCloset(event);
  if (f === "adminListPending") return closet.adminListPending(event);

  // Mutations
  if (f === "createClosetItem") return closet.createClosetItem(event);
  if (f === "requestClosetApproval") return closet.requestClosetApproval(event);
  if (f === "adminApproveItem") return closet.adminApproveItem(event);
  if (f === "adminRejectItem") return closet.adminRejectItem(event);

  throw new Error(`Unknown field: ${f}`);
};
