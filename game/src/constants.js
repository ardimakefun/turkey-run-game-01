window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.CONFIG = {
  LOGICAL_WIDTH: 1280,
  LOGICAL_HEIGHT: 720,
  GROUND_Y: 602,

  ESCAPE_DISTANCE: 1000,
  FRENZY_START: 855,
  FRENZY_END: 965,
  BASE_METERS_PER_SEC: 17.5,
  MAX_METERS_PER_SEC: 29.5,
  PX_PER_METER: 25,

  PLAYER: {
    BASE_X: 315,
    WIDTH: 58,
    STAND_HEIGHT: 68,
    SLIDE_HEIGHT: 36,
    GRAVITY: 2680,
    JUMP_VELOCITY: -900,
    DOUBLE_JUMP_VELOCITY: -775,
    PUMPKIN_BOUNCE_VELOCITY: -1120,
    JUMP_CUT_MULTIPLIER: 0.54,
    GLIDE_MAX_FALL: 195,
    FAST_FALL_VELOCITY: 1180,
    SLIDE_DURATION: 0.56,
    DASH_DURATION: 0.27,
    DASH_COOLDOWN: 2.3,
    DASH_SPEED_MULT: 1.72,
    WAVE_COOLDOWN: 4.2,
    WAVE_RADIUS: 250,
    CHILI_DURATION: 4.4,
    CHILI_SPEED_MULT: 1.52,
    INVULN_DURATION: 1.45,
    MAX_LIVES: 3,
    COYOTE_TIME: 0.09,
    JUMP_BUFFER: 0.11
  },

  FARMER: {
    MIN_GAP: 110,
    COMFORT_GAP: 198,
    MAX_GAP: 275,
    HIT_SURGE: 66,
    DASH_PUSHBACK: 62,
    BONK_PUSHBACK: 95,
    CHILI_PUSHBACK: 96,
    THROW_INTERVAL_MIN: 4.0,
    THROW_INTERVAL_MAX: 7.0
  },

  SCORE: {
    CORN: 25,
    BERRY: 50,
    CHILI: 100,
    WISHBONE: 150,
    PUMPKIN_BOUNCE: 80,
    NEAR_MISS: 65,
    CLUTCH_DODGE: 120,
    PARRY_KNIFE: 160,
    FARMER_BONK: 260,
    SMASH_OBSTACLE: 130,
    TAUNT_BONUS: 25,
    DISTANCE_TICK: 10,
    ESCAPE_BONUS: 1500,
    LIFE_BONUS: 400
  },

  SKINS: [
    {
      id: "classic",
      name: "Classic Tom",
      badge: "🦃",
      body: "#78350f",
      chest: "#92400e",
      wing: "#b45309",
      tail: ["#991b1b", "#ea580c", "#f59e0b", "#d97706", "#b45309"],
      trailColor: "#f59e0b",
      hat: "none"
    },
    {
      id: "pilgrim",
      name: "Pilgrim",
      badge: "🎩",
      body: "#5c2b14",
      chest: "#7c3b1d",
      wing: "#a16207",
      tail: ["#7c2d12", "#d97706", "#fde047", "#b45309", "#78350f"],
      trailColor: "#fde047",
      hat: "pilgrim"
    },
    {
      id: "chef",
      name: "Rogue Chef",
      badge: "👨‍🍳",
      body: "#6d3b26",
      chest: "#f8fafc",
      wing: "#cbd5e1",
      tail: ["#dc2626", "#f8fafc", "#f59e0b", "#f8fafc", "#dc2626"],
      trailColor: "#f8fafc",
      hat: "chef"
    },
    {
      id: "golden",
      name: "Golden King",
      badge: "👑",
      body: "#ca8a04",
      chest: "#facc15",
      wing: "#fde047",
      tail: ["#f59e0b", "#fde047", "#fef08a", "#fb923c", "#eab308"],
      trailColor: "#fde047",
      hat: "crown"
    }
  ],

  ACHIEVEMENTS: {
    blade_dancer: { title: "Blade Dancer", desc: "3 knife near-misses in one run", icon: "🔪" },
    knife_parry: { title: "Iron Feathers", desc: "Parry a hazard with Feather Dash", icon: "⚡" },
    return_sender: { title: "Return to Sender!", desc: "Deflect a knife back into Farmer Barnaby", icon: "📣" },
    spicy_smash: { title: "Spicy Bulldozer", desc: "Smash 3 hazards during Chili Rush", icon: "🌶️" },
    untouchable: { title: "Untouchable", desc: "Reach Barn Yard with all 3 lives", icon: "🛡️" },
    sky_hopper: { title: "Pumpkin Flyer", desc: "Bounce off 2 harvest pumpkins", icon: "🎃" },
    freedom_hero: { title: "Sanctuary Hero", desc: "Escape 1,000m to Freedom Woods", icon: "🌲" }
  },

  ZONES: [
    {
      id: "kitchen",
      name: "Farmhouse Kitchen",
      startDist: 0,
      endDist: 350,
      skyTop: "#4f2515",
      skyBottom: "#8a4626",
      wallAccent: "#b45309",
      floorTop: "#d97706",
      floorMain: "#7c2d12",
      floorTrim: "#fde68a"
    },
    {
      id: "barn",
      name: "Barn & Harvest Yard",
      startDist: 350,
      endDist: 700,
      skyTop: "#ea580c",
      skyBottom: "#fcd34d",
      wallAccent: "#991b1b",
      floorTop: "#ca8a04",
      floorMain: "#5c3a21",
      floorTrim: "#fef08a"
    },
    {
      id: "woods",
      name: "Autumn Freedom Woods",
      startDist: 700,
      endDist: 1000,
      skyTop: "#1e3a5f",
      skyBottom: "#f59e0b",
      wallAccent: "#166534",
      floorTop: "#65a30d",
      floorMain: "#3f2e1d",
      floorTrim: "#bbf7d0"
    },
    {
      id: "endless",
      name: "Midnight Harvest Madness",
      startDist: 1000,
      endDist: Infinity,
      skyTop: "#1e1b4b",
      skyBottom: "#9d174d",
      wallAccent: "#7c2d12",
      floorTop: "#ea580c",
      floorMain: "#291811",
      floorTrim: "#fde047"
    }
  ],

  QUIPS: {
    caught: [
      "Farmer Barnaby preheated the oven to 425°F just for you!",
      "Tip: Press F or G to fire a Gobble Wave that sends knives flying back at the Farmer!",
      "Gobble-oh-no! That basting brush had your name on it.",
      "Tip: Feather Dash (Shift / Middle-Click) SMASHES knives & ovens for +160 pts!",
      "Tip: Right-click or hold S to belly-slide right beneath spinning high knives!"
    ],
    escaped: [
      "Not today, Thanksgiving! You soared straight past the Sanctuary Gate!",
      "Farmer Barnaby is eating mashed potatoes alone tonight!",
      "Feathers intact, spirit unbroken — undisputed champion of the barnyard!",
      "From sizzling kitchen cloche to golden autumn freedom!"
    ]
  }
};
