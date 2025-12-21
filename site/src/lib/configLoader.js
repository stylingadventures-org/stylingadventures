/**
 * Frontend Configuration Loader
 * 
 * Loads environment-specific configuration from public/config.{env}.json
 * Injected at build-time via Vite's import.meta.env
 */

let cachedConfig = null;

/**
 * Load configuration for the current environment
 * Falls back to config.dev.json if import.meta.env is unavailable
 * @returns {Promise<Object>} Configuration object with API URLs, pool IDs, etc.
 */
export async function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try to use Vite-injected environment variable
  const env = import.meta.env.VITE_APP_ENV || "dev";
  
  try {
    const response = await fetch(`/config.${env}.json`);
    if (!response.ok) {
      console.warn(
        `[Config] Failed to load config.${env}.json (${response.status}), falling back to config.dev.json`
      );
      return loadConfigFallback();
    }
    cachedConfig = await response.json();
    console.log(`[Config] Loaded config for env: ${env}`);
    return cachedConfig;
  } catch (error) {
    console.error(`[Config] Error loading config.${env}.json:`, error);
    return loadConfigFallback();
  }
}

/**
 * Fallback: load development configuration
 */
async function loadConfigFallback() {
  try {
    const response = await fetch("/config.dev.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    cachedConfig = await response.json();
    console.log("[Config] Loaded fallback config (config.dev.json)");
    return cachedConfig;
  } catch (error) {
    console.error("[Config] Failed to load fallback config:", error);
    // Return minimal emergency config
    return {
      env: "dev",
      region: "us-east-1",
      appsyncUrl: "",
      presignApiUrl: "",
      adminApiUrl: "",
      cognitoDomain: "",
      redirectUri: window.location.origin + "/callback",
      logoutUri: window.location.origin + "/",
    };
  }
}

/**
 * Get a specific config value
 * @param {string} key - The config key (e.g., 'appsyncUrl', 'presignApiUrl')
 * @returns {Promise<any>} The config value
 */
export async function getConfigValue(key) {
  const config = await loadConfig();
  return config[key];
}
