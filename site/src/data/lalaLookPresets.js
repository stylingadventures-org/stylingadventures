/**
 * LALA LOOK PRESETS
 * 
 * Pre-composed looks combining outfit, hair, makeup, mood, pose, scene
 * Organized by stage (Basic, Glow-Up, Prime) and mood
 */

export const LALA_LOOKS = {
  // ============================================
  // BASIC STAGE LOOKS
  // ============================================
  basic_playful_home: {
    id: "basic_playful_home",
    name: "Playful Me",
    stage: "basic",
    mood: "playful",
    outfitId: "pink_wrap_top",
    bottomId: "pink_shorts",
    hairId: "waves_long",
    makeupId: "playful_bright",
    sceneId: "bedroom",
    poseId: "playful_laugh",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'%3E%3Ccircle cx='100' cy='70' r='40' fill='%23D4A574'/%3E%3Ccircle cx='80' cy='60' r='6' fill='%23333'/%3E%3Ccircle cx='120' cy='60' r='6' fill='%23333'/%3E%3Cpath d='M 80 85 Q 100 100 120 85' stroke='%23333' stroke-width='2' fill='none'/%3E%3Cpath d='M 85 95 Q 100 105 115 95' stroke='%23FF69B4' stroke-width='2' fill='none'/%3E%3Cpath d='M 40 110 Q 100 180 160 110 L 160 200 Q 100 220 40 200 Z' fill='%23FFB6C1'/%3E%3C/svg%3E",
    description: "Ready for fun and games",
  },

  basic_soft_chill: {
    id: "basic_soft_chill",
    name: "Soft & Chill",
    stage: "basic",
    mood: "soft",
    outfitId: "oversized_pink_shirt",
    bottomId: "pink_shorts",
    hairId: "waves_long",
    makeupId: "soft_glow",
    sceneId: "bedroom",
    poseId: "soft_head_tilt",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'%3E%3Ccircle cx='100' cy='70' r='40' fill='%23D4A574'/%3E%3Ccircle cx='85' cy='65' r='5' fill='%23333'/%3E%3Ccircle cx='115' cy='65' r='5' fill='%23333'/%3E%3Cpath d='M 85 90 Q 100 95 115 90' stroke='%23D4A574' stroke-width='2' fill='none'/%3E%3Cpath d='M 30 120 Q 100 190 170 120 L 170 220 Q 100 240 30 220 Z' fill='%23FFC0CB'/%3E%3Ccircle cx='100' cy='100' r='35' fill='%23FFE4E1' opacity='0.8'/%3E%3C/svg%3E",
    description: "Cozy and comfortable",
  },

  basic_confident_golden: {
    id: "basic_confident_golden",
    name: "Golden Hour",
    stage: "basic",
    mood: "confident",
    outfitId: "pink_wrap_top",
    bottomId: "pink_shorts",
    hairId: "braids_long",
    makeupId: "natural_glam",
    sceneId: "rooftop_sunset",
    poseId: "confident_pose",
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'%3E%3Ccircle cx='100' cy='70' r='40' fill='%23D4A574'/%3E%3Ccircle cx='85' cy='60' r='5' fill='%23333'/%3E%3Ccircle cx='115' cy='60' r='5' fill='%23333'/%3E%3Cpath d='M 85 100 Q 100 110 115 100' stroke='%23333' stroke-width='2' fill='none'/%3E%3Cpath d='M 40 100 L 160 100 Q 160 120 100 180 Q 40 120 40 100' fill='%23FFD700'/%3E%3Crect x='55' y='150' width='90' height='80' rx='5' fill='%23FF69B4'/%3E%3C/svg%3E",
    description: "Shining in the golden hour",
  },

  // ============================================
  // GLOW-UP STAGE LOOKS
  // ============================================
  glowup_confident_business: {
    id: "glowup_confident_business",
    name: "Business Power",
    stage: "glowup",
    mood: "confident",
    outfitId: "white_corset",
    bottomId: "black_pants",
    hairId: "braids_long",
    makeupId: "natural_glam",
    sceneId: "boardroom",
    poseId: "confident_hands_on_hips",
    imageUrl: "/assets/lala/glowup/confident_business.png",
    description: "Professional and powerful",
  },

  glowup_spicy_night_out: {
    id: "glowup_spicy_night_out",
    name: "Night Out",
    stage: "glowup",
    mood: "spicy",
    outfitId: "black_crop_top",
    bottomId: "leather_pants",
    hairId: "braids_long",
    makeupId: "bold_spicy",
    sceneId: "neon_city",
    poseId: "spicy_attitude",
    imageUrl: "/assets/lala/glowup/spicy_night_out.png",
    description: "Edgy and bold",
  },

  glowup_focused_strategic: {
    id: "glowup_focused_strategic",
    name: "Strategic Mind",
    stage: "glowup",
    mood: "focused",
    outfitId: "white_corset",
    bottomId: "black_pants",
    hairId: "braids_bun",
    makeupId: "focused_minimal",
    sceneId: "boardroom",
    poseId: "focused_thinking",
    imageUrl: "/assets/lala/glowup/focused_strategic.png",
    description: "In planning mode",
  },

  glowup_soft_garden: {
    id: "glowup_soft_garden",
    name: "Garden Moment",
    stage: "glowup",
    mood: "soft",
    outfitId: "pink_wrap_top",
    bottomId: "pink_shorts",
    hairId: "braids_half_up",
    makeupId: "soft_glow",
    sceneId: "garden",
    poseId: "soft_seated",
    imageUrl: "/assets/lala/glowup/soft_garden.png",
    description: "Peaceful and centered",
  },

  // ============================================
  // PRIME STAGE LOOKS
  // ============================================
  prime_spicy_gold_luxe: {
    id: "prime_spicy_gold_luxe",
    name: "Gold Standard",
    stage: "prime",
    mood: "spicy",
    outfitId: "gold_bodysuit",
    bottomId: "gold_skirt",
    hairId: "braids_long",
    makeupId: "bold_spicy",
    sceneId: "neon_city",
    poseId: "spicy_fierce",
    imageUrl: "/assets/lala/prime/spicy_gold_luxe.png",
    description: "Ultimate confidence and luxury",
  },

  prime_confident_boss: {
    id: "prime_confident_boss",
    name: "Boss Level",
    stage: "prime",
    mood: "confident",
    outfitId: "gold_bodysuit",
    bottomId: "black_pants",
    hairId: "braids_long",
    makeupId: "natural_glam",
    sceneId: "boardroom",
    poseId: "confident_stride",
    imageUrl: "/assets/lala/prime/confident_boss.png",
    description: "Ready to lead",
  },

  prime_mysterious_dark: {
    id: "prime_mysterious_dark",
    name: "Mysterious",
    stage: "prime",
    mood: "shadow",
    outfitId: "black_crop_top",
    bottomId: "leather_pants",
    hairId: "braids_long",
    makeupId: "dark_mysterious",
    sceneId: "neon_city",
    poseId: "shadow_looking_away",
    imageUrl: "/assets/lala/prime/mysterious_dark.png",
    description: "Introspective and deep",
  },

  prime_focused_luxury_planning: {
    id: "prime_focused_luxury_planning",
    name: "Luxury Planning",
    stage: "prime",
    mood: "focused",
    outfitId: "gold_bodysuit",
    bottomId: "black_pants",
    hairId: "braids_bun",
    makeupId: "focused_minimal",
    sceneId: "boardroom",
    poseId: "focused_pointing",
    imageUrl: "/assets/lala/prime/focused_luxury_planning.png",
    description: "Strategic visionary",
  },

  prime_playful_premium: {
    id: "prime_playful_premium",
    name: "Premium Play",
    stage: "prime",
    mood: "playful",
    outfitId: "gold_bodysuit",
    bottomId: "gold_skirt",
    hairId: "waves_long",
    makeupId: "playful_bright",
    sceneId: "rooftop_sunset",
    poseId: "playful_spin",
    imageUrl: "/assets/lala/prime/playful_premium.png",
    description: "Joyfully thriving",
  },
};

/**
 * GET ALL LOOKS FOR A STAGE
 */
export const getLooksForStage = (stage) => {
  return Object.values(LALA_LOOKS).filter((look) => look.stage === stage);
};

/**
 * GET ALL LOOKS FOR A MOOD
 */
export const getLooksForMood = (mood) => {
  return Object.values(LALA_LOOKS).filter((look) => look.mood === mood);
};

/**
 * GET A SPECIFIC LOOK
 */
export const getLookById = (lookId) => {
  return LALA_LOOKS[lookId] || null;
};

/**
 * GET DEFAULT LOOKS (one per mood, basic stage)
 * Used when user first logs in
 */
export const getDefaultLooks = () => {
  return [
    "basic_playful_home",
    "basic_soft_chill",
    "basic_confident_golden",
  ];
};
