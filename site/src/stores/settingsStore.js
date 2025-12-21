import { useEffect, useState } from "react";
import { getSA } from "../lib/sa";

const defaultSettings = {
  animationsEnabled: true,
  soundsEnabled: true,
  autoBadgeGrant: true,
  badgeRules: [
    {
      id: "first-checkin",
      label: "First Check-In!",
      trigger: (p) => p?.streak === 1,
    },
    {
      id: "fashion-lover",
      label: "Fashion Lover!",
      trigger: (p) => p?.tasksCompleted >= 10,
    },
    {
      id: "loyal-bestie",
      label: "7-Day Streak!",
      trigger: (p) => p?.streak >= 7,
    },
  ],
};

const GET_SETTINGS = `
  query GetAdminSettings {
    getAdminSettings {
      animationsEnabled
      soundsEnabled
      autoBadgeGrant
      badgeRules {
        id
        label
        trigger
      }
    }
  }
`;

const UPDATE_SETTINGS = `
  mutation UpdateAdminSettings($input: AdminSettingsInput!) {
    updateAdminSettings(input: $input) {
      animationsEnabled
      soundsEnabled
      autoBadgeGrant
      badgeRules {
        id
        label
        trigger
      }
    }
  }
`;

// ---------- helpers ----------

async function callGraphQL(query, variables = {}) {
  const SA = await getSA();
  // SA.gql already uses cfg.appsyncUrl and Authorization header
  return SA.gql(query, variables);
}

function reviveSettings(obj) {
  const revived = { ...obj };
  if (Array.isArray(revived.badgeRules)) {
    revived.badgeRules = revived.badgeRules.map((rule) => {
      // Safely create function from stored string representation
      try {
        const fn = new Function('p', 'return ' + rule.trigger);
        return {
          ...rule,
          trigger: fn,
        };
      } catch (e) {
        console.warn('[settingsStore] Failed to revive trigger function:', e);
        return {
          ...rule,
          trigger: () => false, // Safe fallback
        };
      }
    });
  }
  return revived;
}

// ---------- export API ----------

export async function fetchSettings() {
  const data = await callGraphQL(GET_SETTINGS);
  return reviveSettings(data.getAdminSettings);
}

export async function updateSettings(payload) {
  const cloned = JSON.parse(JSON.stringify(payload));
  if (Array.isArray(cloned.badgeRules)) {
    cloned.badgeRules = cloned.badgeRules.map((rule) => ({
      ...rule,
      trigger: rule.trigger.toString(),
    }));
  }

  const data = await callGraphQL(UPDATE_SETTINGS, { input: cloned });
  return reviveSettings(data.updateAdminSettings);
}

export function useSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const s = await fetchSettings();
        if (active) setSettings(s);
      } catch (err) {
        console.error("Error loading admin settings", err);
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const save = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    const serverSaved = await updateSettings(next);
    setSettings(serverSaved);
  };

  return { settings, save, loading, error };
}
