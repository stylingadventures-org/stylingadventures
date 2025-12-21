/**
 * useLalaProfile Hook
 * 
 * Manages Lala character profile state
 * - Fetches user's profile from AppSync
 * - Manages current mood and look
 * - Unlocks new items
 * - Tracks styling history
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { runGraphQL } from "../api/runGraphQL";
import { LALA_BASE_FEATURES } from "../data/lalaCharacterConfig";
import { getLookById, getDefaultLooks } from "../data/lalaLookPresets";

// GraphQL Queries
const GET_LALA_PROFILE = `
  query GetLalaProfile {
    myLalaProfile {
      userId
      currentMood
      currentLookId
      unlockedLookIds
      unlockedCosmeticIds
      lastMoodChangeAt
      tier
      evolutionStage
      stylingHistory {
        id
        lookId
        mood
        appliedAt
        context
      }
      createdAt
      updatedAt
    }
  }
`;

const CHANGE_MOOD = `
  mutation ChangeMood($mood: String!) {
    changeLalaMood(mood: $mood) {
      success
      mood
      profile {
        userId
        currentMood
        currentLookId
        unlockedLookIds
        unlockedCosmeticIds
        lastMoodChangeAt
        tier
        evolutionStage
        updatedAt
      }
      message
    }
  }
`;

const CHANGE_LOOK = `
  mutation ChangeLook($lookId: String!) {
    changeLalaLook(lookId: $lookId) {
      success
      lookId
      profile {
        userId
        currentMood
        currentLookId
        unlockedLookIds
        unlockedCosmeticIds
        tier
        evolutionStage
        updatedAt
      }
      message
    }
  }
`;

const UNLOCK_LOOK = `
  mutation UnlockLook($lookId: String!) {
    unlockLalaLook(lookId: $lookId) {
      userId
      unlockedLookIds
      updatedAt
    }
  }
`;

const UNLOCK_COSMETIC = `
  mutation UnlockCosmetic($cosmeticId: String!) {
    unlockLalaCosmeticItem(cosmeticId: $cosmeticId) {
      userId
      unlockedCosmeticIds
      updatedAt
    }
  }
`;

/**
 * DEFAULT PROFILE
 * Used when user's profile doesn't exist yet
 */
export const getDefaultProfile = (userId, tier = "FAN") => ({
  userId,
  currentMood: "playful",
  currentLookId: "basic_playful_home",
  unlockedLookIds: getDefaultLooks(),
  unlockedCosmeticIds: ["braids_long", "waves_long", "natural_glam", "soft_glow", "playful_bright"],
  lastMoodChangeAt: new Date().toISOString(),
  tier,
  evolutionStage: "basic",
  stylingHistory: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * useLalaProfile Hook
 */
export const useLalaProfile = () => {
  const { user, groups } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine tier from groups
  const getUserTier = useCallback(() => {
    if (!groups) return "FAN";
    // Priority: ADMIN > PRIME > CREATOR > BESTIE > COLLAB > FAN
    if (groups.includes("ADMIN")) return "ADMIN";
    if (groups.includes("PRIME")) return "PRIME";
    if (groups.includes("CREATOR")) return "CREATOR";
    if (groups.includes("BESTIE")) return "BESTIE";
    if (groups.includes("COLLAB")) return "COLLAB";
    return "FAN";
  }, [groups]);

  // FETCH PROFILE
  const fetchProfile = useCallback(async () => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await runGraphQL({
        query: GET_LALA_PROFILE,
        variables: {},
      });

      if (response?.data?.myLalaProfile) {
        setProfile(response.data.myLalaProfile);
      } else {
        // Create default profile if not found
        const tier = getUserTier();
        const defaultProfile = getDefaultProfile(user.username, tier);
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error("[useLalaProfile] Error fetching profile:", err);
      // Fallback to default profile
      const tier = getUserTier();
      const defaultProfile = getDefaultProfile(user.username, tier);
      setProfile(defaultProfile);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, getUserTier]);

  // Initial fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // CHANGE MOOD
  const changeMood = useCallback(
    async (mood) => {
      if (!profile) return null;

      // Validate mood exists
      if (!LALA_BASE_FEATURES.moods[mood]) {
        console.error(`[useLalaProfile] Invalid mood: ${mood}`);
        return null;
      }

      try {
        const response = await runGraphQL({
          query: CHANGE_MOOD,
          variables: { mood },
        });

        if (response?.data?.changeLalaMood?.success) {
          const updatedProfile = response.data.changeLalaMood.profile;
          setProfile(updatedProfile);
          console.log(`[useLalaProfile] Mood changed to: ${mood}`);
          return updatedProfile;
        } else {
          throw new Error(response?.data?.changeLalaMood?.message || "Failed to change mood");
        }
      } catch (err) {
        console.error("[useLalaProfile] Error changing mood:", err);
        setError(err.message);
        return null;
      }
    },
    [profile]
  );

  // CHANGE LOOK
  const changeLook = useCallback(
    async (lookId) => {
      if (!profile) return null;

      // Validate look exists
      const look = getLookById(lookId);
      if (!look) {
        console.error(`[useLalaProfile] Invalid look: ${lookId}`);
        return null;
      }

      // Check if user has unlocked this look
      if (!profile.unlockedLookIds?.includes(lookId)) {
        console.warn(`[useLalaProfile] Look not unlocked: ${lookId}`);
        return null;
      }

      try {
        const response = await runGraphQL({
          query: CHANGE_LOOK,
          variables: { lookId },
        });

        if (response?.data?.changeLalaLook?.success) {
          const updatedProfile = response.data.changeLalaLook.profile;
          setProfile(updatedProfile);
          console.log(`[useLalaProfile] Look changed to: ${lookId}`);
          return updatedProfile;
        } else {
          throw new Error(response?.data?.changeLalaLook?.message || "Failed to change look");
        }
      } catch (err) {
        console.error("[useLalaProfile] Error changing look:", err);
        setError(err.message);
        return null;
      }
    },
    [profile]
  );

  // UNLOCK LOOK
  const unlockLook = useCallback(
    async (lookId) => {
      if (!profile) return null;

      const look = getLookById(lookId);
      if (!look) {
        console.error(`[useLalaProfile] Invalid look: ${lookId}`);
        return null;
      }

      if (profile.unlockedLookIds?.includes(lookId)) {
        console.warn(`[useLalaProfile] Look already unlocked: ${lookId}`);
        return profile;
      }

      try {
        const response = await runGraphQL({
          query: UNLOCK_LOOK,
          variables: { lookId },
        });

        if (response?.data?.unlockLalaLook) {
          const updatedProfile = {
            ...profile,
            unlockedLookIds: response.data.unlockLalaLook.unlockedLookIds,
            updatedAt: response.data.unlockLalaLook.updatedAt,
          };
          setProfile(updatedProfile);
          console.log(`[useLalaProfile] Look unlocked: ${lookId}`);
          return updatedProfile;
        }
      } catch (err) {
        console.error("[useLalaProfile] Error unlocking look:", err);
        setError(err.message);
        return null;
      }
    },
    [profile]
  );

  // UNLOCK COSMETIC
  const unlockCosmetic = useCallback(
    async (cosmeticId) => {
      if (!profile) return null;

      if (profile.unlockedCosmeticIds?.includes(cosmeticId)) {
        console.warn(`[useLalaProfile] Cosmetic already unlocked: ${cosmeticId}`);
        return profile;
      }

      try {
        const response = await runGraphQL({
          query: UNLOCK_COSMETIC,
          variables: { cosmeticId },
        });

        if (response?.data?.unlockLalaCosmeticItem) {
          const updatedProfile = {
            ...profile,
            unlockedCosmeticIds: response.data.unlockLalaCosmeticItem.unlockedCosmeticIds,
            updatedAt: response.data.unlockLalaCosmeticItem.updatedAt,
          };
          setProfile(updatedProfile);
          console.log(`[useLalaProfile] Cosmetic unlocked: ${cosmeticId}`);
          return updatedProfile;
        }
      } catch (err) {
        console.error("[useLalaProfile] Error unlocking cosmetic:", err);
        setError(err.message);
        return null;
      }
    },
    [profile]
  );

  // GET CURRENT LOOK
  const getCurrentLook = useCallback(() => {
    if (!profile?.currentLookId) return null;
    return getLookById(profile.currentLookId);
  }, [profile?.currentLookId]);

  // GET CURRENT MOOD DATA
  const getCurrentMoodData = useCallback(() => {
    if (!profile?.currentMood) return null;
    return LALA_BASE_FEATURES.moods[profile.currentMood];
  }, [profile?.currentMood]);

  return {
    // State
    profile,
    loading,
    error,

    // Current state getters
    currentMood: profile?.currentMood,
    currentLookId: profile?.currentLookId,
    tier: profile?.tier,
    evolutionStage: profile?.evolutionStage,
    unlockedLooks: profile?.unlockedLookIds || [],
    unlockedCosmetics: profile?.unlockedCosmeticIds || [],

    // Methods
    changeMood,
    changeLook,
    unlockLook,
    unlockCosmetic,
    refetch: fetchProfile,

    // Getters
    getCurrentLook,
    getCurrentMoodData,

    // Helpers
    isLookUnlocked: (lookId) => profile?.unlockedLookIds?.includes(lookId) || false,
    isCosmeticUnlocked: (cosmeticId) =>
      profile?.unlockedCosmeticIds?.includes(cosmeticId) || false,
  };
};

export default useLalaProfile;
