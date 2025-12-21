/**
 * lambda/episodes/music-resolver.ts
 * 
 * Handles Music system queries and mutations:
 * - Get music eras and songs
 * - Retrieve music videos with shoppable items
 * - Admin: Create music eras, add songs, release music videos
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { AppSyncIdentityCognito } from "aws-lambda";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

type SAIdentity = (AppSyncIdentityCognito & { groups?: string[] | null }) | null | undefined;

// ────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────

function isAdmin(identity: SAIdentity): boolean {
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "").split(",").map((g) => g.trim()).filter(Boolean);
  return groups.includes("ADMIN") || groups.includes("PRIME");
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface MusicEra {
  id: string;
  name: string;
  description: string;
  aesthetic: string;
  releaseDate: string;
  songs: Song[];
  musicVideos: MusicVideo[];
  storyArcs: string[];
  status: "IN_PROGRESS" | "TEASER_RELEASED" | "RELEASED" | "ARCHIVED";
}

interface Song {
  id: string;
  title: string;
  eraId: string;
  inspirationStory: string;
  lyrics?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  audioUrl: string;
  duration: number;
  conflict?: string;
  studio: StudioSession;
  createdAt: string;
}

interface MusicVideo {
  id: string;
  songId: string;
  title: string;
  description: string;
  s3Key: string;
  thumbnailKey?: string;
  duration: number;
  releaseDate: string;
  status: "IN_PROGRESS" | "TEASER_RELEASED" | "RELEASED" | "ARCHIVED";
}

interface StudioSession {
  id: string;
  songId: string;
  producer: string;
  engineerNotes: string;
  recordedAt: string;
  studio: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForMusicEra() {
  return "MUSIC#ERA";
}

function skForMusicEra(eraId: string) {
  return `ERA#${eraId}`;
}

function pkForSong(eraId: string) {
  return `MUSIC#ERA#${eraId}`;
}

function skForSong(songId: string) {
  return `SONG#${songId}`;
}

function pkForMusicVideo(songId: string) {
  return `MUSIC#SONG#${songId}`;
}

function skForMusicVideo(videoId: string) {
  return `VIDEO#${videoId}`;
}

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

async function handleMusicEras(): Promise<MusicEra[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForMusicEra(),
      }),
    }),
  );

  return (res.Items ?? []).map((raw) => unmarshall(raw) as MusicEra);
}

async function handleMusicEra(args: { id: string }): Promise<MusicEra | null> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForMusicEra(),
        ":sk": skForMusicEra(args.id),
      }),
    }),
  );

  const raw = (res.Items ?? [])[0];
  if (!raw) return null;

  return unmarshall(raw) as MusicEra;
}

async function handleEraSongs(args: { eraId: string }): Promise<Song[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForSong(args.eraId),
        ":sk": "SONG#",
      }),
    }),
  );

  return (res.Items ?? []).map((raw) => unmarshall(raw) as Song);
}

async function handleSongMusicVideos(args: { songId: string }): Promise<MusicVideo[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForMusicVideo(args.songId),
        ":sk": "VIDEO#",
      }),
    }),
  );

  return (res.Items ?? []).map((raw) => unmarshall(raw) as MusicVideo);
}

async function handleMusicVideo(args: { id: string }): Promise<MusicVideo | null> {
  // In production, would scan or use GSI to find video by id
  // For now returning null as placeholder
  return null;
}

// ────────────────────────────────────────────────────────────
// Admin Mutations
// ────────────────────────────────────────────────────────────

async function handleAdminCreateMusicEra(
  args: {
    name: string;
    description: string;
    aesthetic: string;
    releaseDate: string;
  },
  identity: SAIdentity,
): Promise<MusicEra> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const eraId = randomUUID();
  const now = nowIso();

  const era: MusicEra = {
    id: eraId,
    name: args.name,
    description: args.description,
    aesthetic: args.aesthetic,
    releaseDate: args.releaseDate,
    songs: [],
    musicVideos: [],
    storyArcs: [],
    status: "IN_PROGRESS",
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForMusicEra(),
        sk: skForMusicEra(eraId),
        entityType: "MUSIC_ERA",
        gsi1pk: "MUSIC#ERA#STATUS#IN_PROGRESS",
        gsi1sk: now,
        ...era,
      }),
    }),
  );

  return era;
}

async function handleAdminCreateSong(
  args: {
    eraId: string;
    title: string;
    inspirationStory: string;
    spotifyUrl?: string;
    audioUrl: string;
  },
  identity: SAIdentity,
): Promise<Song> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const songId = randomUUID();
  const now = nowIso();

  const studio: StudioSession = {
    id: randomUUID(),
    songId,
    producer: "TBD",
    engineerNotes: "",
    recordedAt: now,
    studio: "TBD",
  };

  const song: Song = {
    id: songId,
    title: args.title,
    eraId: args.eraId,
    inspirationStory: args.inspirationStory,
    spotifyUrl: args.spotifyUrl,
    audioUrl: args.audioUrl,
    duration: 0,
    studio,
    createdAt: now,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForSong(args.eraId),
        sk: skForSong(songId),
        entityType: "SONG",
        gsi1pk: `MUSIC#ERA#${args.eraId}`,
        gsi1sk: now,
        ...song,
      }),
    }),
  );

  return song;
}

async function handleAdminCreateMusicVideo(
  args: {
    songId: string;
    title: string;
    s3Key: string;
  },
  identity: SAIdentity,
): Promise<MusicVideo> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const videoId = randomUUID();
  const now = nowIso();

  const video: MusicVideo = {
    id: videoId,
    songId: args.songId,
    title: args.title,
    description: "",
    s3Key: args.s3Key,
    duration: 0,
    releaseDate: now,
    status: "IN_PROGRESS",
  };

  // Note: Would need to know eraId to properly store
  // For now storing under song
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForMusicVideo(args.songId),
        sk: skForMusicVideo(videoId),
        entityType: "MUSIC_VIDEO",
        gsi1pk: `MUSIC#VIDEO#STATUS#IN_PROGRESS`,
        gsi1sk: now,
        ...video,
      }),
    }),
  );

  return video;
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("MusicResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "musicEras":
        return await handleMusicEras();

      case "musicEra":
        return await handleMusicEra(event.arguments);

      case "eraSongs":
        return await handleEraSongs(event.arguments);

      case "songMusicVideos":
        return await handleSongMusicVideos(event.arguments);

      case "musicVideo":
        return await handleMusicVideo(event.arguments);

      case "adminCreateMusicEra":
        return await handleAdminCreateMusicEra(event.arguments, event.identity);

      case "adminCreateSong":
        return await handleAdminCreateSong(event.arguments, event.identity);

      case "adminCreateMusicVideo":
        return await handleAdminCreateMusicVideo(event.arguments, event.identity);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("MusicResolverFn error", err);
    throw err;
  }
};
