// lambda/bestie/index.ts
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { AppSyncResolverEvent } from "aws-lambda";

/**
 * This lambda handles:
 *  - Query.meBestieStatus
 *  - Query.isEpisodeEarlyAccess
 *  - Mutation.claimBestieTrial
 *  - Mutation.adminSetBestie
 *  - Mutation.adminRevokeBestie
 *  - Mutation.adminSetBestieByEmail   (NEW)
 *  - Mutation.adminRevokeBestieByEmail(NEW)
 *
 * For demo purposes we store nothing and return computed objects.
 * Replace the stubs that say TODO with your DynamoDB writes when ready.
 */

const USER_POOL_ID = process.env.USER_POOL_ID as string;
const REGION = process.env.AWS_REGION || "us-east-1";

const cognito = new CognitoIdentityProviderClient({ region: REGION });

type Ctx = AppSyncResolverEvent<any>;

function nowIso() {
  return new Date().toISOString();
}

async function meStatus(ctx: Ctx) {
  // TODO: load real status from DynamoDB/user profile
  return {
    active: true,
    since: nowIso(),
    until: null,
    source: "TRIAL", // or ADMIN/GRANT/etc.
  };
}

async function earlyAccess(_ctx: Ctx, id: string) {
  // Simple rule: ep-1 is gated unless user is active Bestie
  const allowed = id !== "ep-1" ? true : (await meStatus(_ctx)).active;
  return { allowed, reason: allowed ? null : "BESTIE_REQUIRED" };
}

async function claimTrial(ctx: Ctx) {
  // TODO: write a trial grant tied to ctx.identity.sub
  return {
    active: true,
    since: nowIso(),
    until: null,
    source: "TRIAL",
  };
}

async function setBestieBySub(_ctx: Ctx, userSub: string, active: boolean) {
  // TODO: persist to single-table (pk=USER#sub, sk=BESTIE, active, since/until/source)
  return {
    active,
    since: nowIso(),
    until: null,
    source: "ADMIN",
  };
}

async function findSubByEmail(email: string): Promise<string | null> {
  // Use ListUsers with a filter on email (works with usernameAttributes=email)
  const cmd = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Filter: `email = \"${email}\"`,
    Limit: 1,
  });
  const res = await cognito.send(cmd);
  const user = (res.Users || [])[0];
  if (!user) return null;
  const attr = (user.Attributes || []).find((a) => a.Name === "sub");
  return attr?.Value || null;
}

export const handler = async (ctx: Ctx) => {
  const field = ctx.info.fieldName;

  switch (field) {
    /* ------------- Queries ------------- */
    case "meBestieStatus":
      return meStatus(ctx);

    case "isEpisodeEarlyAccess": {
      const id: string = ctx.arguments.id;
      if (!id) throw new Error("Missing id");
      return earlyAccess(ctx, id);
    }

    /* ------------- Mutations ------------- */
    case "claimBestieTrial":
      return claimTrial(ctx);

    case "adminSetBestie": {
      const { userSub, active } = ctx.arguments as {
        userSub: string;
        active: boolean;
      };
      if (!userSub) throw new Error("Missing userSub");
      return setBestieBySub(ctx, userSub, !!active);
    }

    case "adminRevokeBestie": {
      const { userSub } = ctx.arguments as { userSub: string };
      if (!userSub) throw new Error("Missing userSub");
      return setBestieBySub(ctx, userSub, false);
    }

    // ------ NEW: by email convenience ------
    case "adminSetBestieByEmail": {
      const { email, active } = ctx.arguments as {
        email: string;
        active: boolean;
      };
      const sub = await findSubByEmail(email);
      if (!sub) throw new Error("User does not exist.");
      return setBestieBySub(ctx, sub, !!active);
    }

    case "adminRevokeBestieByEmail": {
      const { email } = ctx.arguments as { email: string };
      const sub = await findSubByEmail(email);
      if (!sub) throw new Error("User does not exist.");
      return setBestieBySub(ctx, sub, false);
    }

    default:
      throw new Error(`Unknown field ${field}`);
  }
};
