/**
 * lambda/episodes/music-resolver.test.ts
 * 
 * Integration tests for Music resolver
 */

// Mock DynamoDB to avoid AWS SDK dynamic-import errors during tests
const _mockSend = async () => ({ Items: [], Count: 0, LastEvaluatedKey: null });
jest.mock("@aws-sdk/client-dynamodb", () => {
  class PutItemCommand { constructor(public args: any) {} }
  class GetItemCommand { constructor(public args: any) {} }
  class QueryCommand { constructor(public args: any) {} }
  return {
    DynamoDBClient: function () {
      return { send: _mockSend };
    },
    PutItemCommand,
    GetItemCommand,
    QueryCommand,
    __esModule: true,
  };
});

import { handler } from "./music-resolver";

describe("Music Resolver", () => {
  const mockAdminIdentity = {
    sub: "admin-001",
    claims: {
      "cognito:groups": "ADMIN",
    },
  };

  describe("musicEras", () => {
    it("should return array of music eras", async () => {
      const event = {
        info: { fieldName: "musicEras" },
        arguments: {},
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
    });
  });

  describe("musicEra", () => {
    it("should return null for non-existent era", async () => {
      const event = {
        info: { fieldName: "musicEra" },
        arguments: { id: "era-nonexistent" },
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("eraSongs", () => {
    it("should return songs for era", async () => {
      const event = {
        info: { fieldName: "eraSongs" },
        arguments: { eraId: "era-001" },
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
    });
  });

  describe("songMusicVideos", () => {
    it("should return music videos for song", async () => {
      const event = {
        info: { fieldName: "songMusicVideos" },
        arguments: { songId: "song-001" },
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
    });
  });

  describe("musicVideo", () => {
    it("should return null for non-existent video", async () => {
      const event = {
        info: { fieldName: "musicVideo" },
        arguments: { id: "video-nonexistent" },
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("adminCreateMusicEra", () => {
    it("should require ADMIN tier", async () => {
      const event = {
        info: { fieldName: "adminCreateMusicEra" },
        identity: {
          sub: "user",
          claims: { "cognito:groups": "FREE" },
        },
        arguments: {
          name: "Era 1",
          description: "First era",
          aesthetic: "Cyberpunk",
          releaseDate: "2025-01-01T00:00:00Z",
        },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/ADMIN required/i);
      }
    });

    it("should create music era for ADMIN", async () => {
      const event = {
        info: { fieldName: "adminCreateMusicEra" },
        identity: mockAdminIdentity,
        arguments: {
          name: "Neon Dreams",
          description: "Lala's debut era",
          aesthetic: "Cyberpunk-Fashion Fusion",
          releaseDate: "2025-02-01T00:00:00Z",
        },
      };

      const result = await handler(event);
      const era = result as any;
      expect(era).toHaveProperty("id");
      expect(era.name).toBe("Neon Dreams");
      expect(era.description).toBe("Lala's debut era");
      expect(era.status).toBe("IN_PROGRESS");
      expect(Array.isArray(era.songs)).toBe(true);
      expect(Array.isArray(era.musicVideos)).toBe(true);
    });
  });

  describe("adminCreateSong", () => {
    it("should create song for era", async () => {
      const event = {
        info: { fieldName: "adminCreateSong" },
        identity: mockAdminIdentity,
        arguments: {
          eraId: "era-001",
          title: "Digital Hearts",
          inspirationStory: "A story about connection in the digital age",
          audioUrl: "s3://audio/song.mp3",
        },
      };

      const result = await handler(event);
      const song = result as any;
      expect(song).toHaveProperty("id");
      expect(song.title).toBe("Digital Hearts");
      expect(song.eraId).toBe("era-001");
      expect(song).toHaveProperty("studio");
      expect(song.createdAt).toBeDefined();
    });
  });

  describe("adminCreateMusicVideo", () => {
    it("should create music video for song", async () => {
      const event = {
        info: { fieldName: "adminCreateMusicVideo" },
        identity: mockAdminIdentity,
        arguments: {
          songId: "song-001",
          title: "Digital Hearts (Official Video)",
          s3Key: "s3://videos/digital-hearts.mp4",
        },
      };

      const result = await handler(event);
      const video = result as any;
      expect(video).toHaveProperty("id");
      expect(video.title).toBe("Digital Hearts (Official Video)");
      expect(video.songId).toBe("song-001");
      expect(video.status).toBe("IN_PROGRESS");
      expect(video.releaseDate).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle unknown field names", async () => {
      const event = {
        info: { fieldName: "unknownField" },
        arguments: {},
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/Unknown field/i);
      }
    });
  });
});
