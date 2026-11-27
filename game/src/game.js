window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.App = (function () {
  var CONFIG = window.TurkeyGame.CONFIG;
  var Storage = window.TurkeyGame.Storage;
  var Audio = window.TurkeyGame.Audio;
  var ParticleSystem = window.TurkeyGame.ParticleSystem;
  var PatternDirector = window.TurkeyGame.PatternDirector;
  var Renderer = window.TurkeyGame.Renderer;

  var W = CONFIG.LOGICAL_WIDTH;
  var H = CONFIG.LOGICAL_HEIGHT;
  var GY = CONFIG.GROUND_Y;

  var canvas = document.getElementById("game-canvas");
  var ctx = canvas.getContext("2d");

  var ui = {
    hud: document.getElementById("hud"),
    hearts: document.getElementById("hud-hearts"),
    scorePill: document.getElementById("hud-score-pill"),
    score: document.getElementById("hud-score"),
    combo: document.getElementById("hud-combo"),
    dashFill: document.getElementById("hud-dash-fill"),
    dashState: document.getElementById("hud-dash-state"),
    waveFill: document.getElementById("hud-wave-fill"),
    waveState: document.getElementById("hud-wave-state"),
    btnHudDash: document.getElementById("btn-hud-dash"),
    btnHudWave: document.getElementById("btn-hud-wave"),
    zoneChip: document.getElementById("hud-zone"),
    distance: document.getElementById("hud-distance"),
    progressFill: document.getElementById("hud-progress-fill"),
    farmerMarker: document.getElementById("hud-farmer-marker"),
    turkeyMarker: document.getElementById("hud-turkey-marker"),
    goalMarker: document.getElementById("hud-goal-marker"),
    powerupBanner: document.getElementById("hud-powerup"),
    powerupFill: document.getElementById("hud-powerup-fill"),
    zoneBanner: document.getElementById("zone-banner"),
    zoneBannerEyebrow: document.getElementById("zone-banner-eyebrow"),
    zoneBannerTitle: document.getElementById("zone-banner-title"),
    achToast: document.getElementById("achievement-toast"),
    achIcon: document.getElementById("ach-icon"),
    achTitle: document.getElementById("ach-title"),
    btnMute: document.getElementById("btn-mute"),
    btnPause: document.getElementById("btn-pause"),

    screenTitle: document.getElementById("screen-title"),
    titleBestScore: document.getElementById("title-best-score"),
    titleBestDist: document.getElementById("title-best-dist"),
    titleEscapes: document.getElementById("title-escapes"),
    titleAchievements: document.getElementById("title-achievements"),
    skinButtons: document.getElementById("skin-buttons"),
    btnStart: document.getElementById("btn-start"),
    btnTitleMute: document.getElementById("btn-title-mute"),
    modeButtons: document.querySelectorAll(".mode-btn"),

    screenPause: document.getElementById("screen-pause"),
    btnResume: document.getElementById("btn-resume"),
    btnPauseRestart: document.getElementById("btn-pause-restart"),
    btnPauseTitle: document.getElementById("btn-pause-title"),

    screenEnd: document.getElementById("screen-end"),
    endCard: document.getElementById("end-card"),
    endBadge: document.getElementById("end-badge"),
    endHeading: document.getElementById("end-heading"),
    endQuip: document.getElementById("end-quip"),
    endRankRow: document.getElementById("end-rank-row"),
    endRankLetter: document.getElementById("end-rank-letter"),
    endScore: document.getElementById("end-score"),
    endDistance: document.getElementById("end-distance"),
    endNearMiss: document.getElementById("end-nearmiss"),
    endZone: document.getElementById("end-zone"),
    endCombo: document.getElementById("end-combo"),
    endCollected: document.getElementById("end-collected"),
    endNewScore: document.getElementById("end-new-score"),
    endNewDist: document.getElementById("end-new-dist"),
    endAchievements: document.getElementById("end-achievements"),
    btnRestart: document.getElementById("btn-restart"),
    btnContinueEndless: document.getElementById("btn-continue-endless"),
    btnEndTitle: document.getElementById("btn-end-title")
  };

  var director = new PatternDirector();
  var particles = new ParticleSystem();

  var input = {
    jumpHeld: false,
    slideHeld: false,
    jumpBuffer: 0,
    coyoteTimer: 0
  };

  var state = {
    modeState: "TITLE", // TITLE | PLAYING | PAUSED | CAUGHT | ESCAPED
    gameMode: "escape", // escape | endless
    skin: "classic",
    totalRunsSeen: 0,
    time: 0,
    worldScroll: 0,
    distance: 0,
    score: 0,
    lives: CONFIG.PLAYER.MAX_LIVES,
    combo: 1,
    comboTimer: 0,
    maxCombo: 1,
    nearMisses: 0,
    knifeNearMisses: 0,
    parries: 0,
    bonks: 0,
    chiliSmashes: 0,
    pumpkinBounces: 0,
    collectedCount: 0,
    unlockedThisRun: [],
    currentZoneIdx: 0,
    zoneBannerTimer: 0,
    achToastTimer: 0,
    frenzyTriggered: false,
    frenzyEndTriggered: false,
    hitstopTimer: 0,
    slowMoTimer: 0,
    timeScale: 1,
    cameraZoom: 1,
    shakeTime: 0,
    shakeMag: 0,
    endLockTimer: 0,
    goalGateX: null,
    celebrateTimer: 0,
    leafTimer: 0,
    afterimageTimer: 0,
    hintText: "",
    cloche: null,
    pointer: { x: W * 0.5, y: H * 0.5, active: false },
    lastTime: 0,

    player: null,
    farmer: null,
    obstacles: [],
    collectibles: [],
    platforms: [],
    pumpkins: [],
    particles: particles
  };

  function getSkinObj(skinId) {
    for (var i = 0; i < CONFIG.SKINS.length; i++) {
      if (CONFIG.SKINS[i].id === skinId) return CONFIG.SKINS[i];
    }
    return CONFIG.SKINS[0];
  }

  function buildSkinSelector() {
    ui.skinButtons.innerHTML = "";
    for (var i = 0; i < CONFIG.SKINS.length; i++) {
      (function (sk) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "skin-pill" + (state.skin === sk.id ? " active" : "");
        btn.setAttribute("data-skin", sk.id);
        btn.setAttribute("aria-pressed", state.skin === sk.id ? "true" : "false");
        btn.innerHTML = "<span>" + sk.badge + "</span><span>" + sk.name + "</span>";
        btn.addEventListener("click", function () {
          Audio.init();
          state.skin = sk.id;
          Storage.setSkin(sk.id);
          syncSkinButtons();
          Audio.playGobble(1.06);
        });
        ui.skinButtons.appendChild(btn);
      })(CONFIG.SKINS[i]);
    }
  }

  function syncSkinButtons() {
    var btns = ui.skinButtons.querySelectorAll(".skin-pill");
    for (var i = 0; i < btns.length; i++) {
      var active = btns[i].getAttribute("data-skin") === state.skin;
      btns[i].classList.toggle("active", active);
      btns[i].setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function createFreshRunState(mode) {
    var P = CONFIG.PLAYER;
    state.gameMode = mode || state.gameMode;
    state.worldScroll = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = P.MAX_LIVES;
    state.combo = 1;
    state.comboTimer = 0;
    state.maxCombo = 1;
    state.nearMisses = 0;
    state.knifeNearMisses = 0;
    state.parries = 0;
    state.bonks = 0;
    state.chiliSmashes = 0;
    state.pumpkinBounces = 0;
    state.collectedCount = 0;
    state.unlockedThisRun = [];
    state.currentZoneIdx = 0;
    state.zoneBannerTimer = 0;
    state.achToastTimer = 0;
    state.frenzyTriggered = false;
    state.frenzyEndTriggered = false;
    state.hitstopTimer = 0;
    state.slowMoTimer = 0;
    state.timeScale = 1;
    state.cameraZoom = 1;
    state.shakeTime = 0;
    state.shakeMag = 0;
    state.endLockTimer = 0;
    state.goalGateX = null;
    state.celebrateTimer = 0;
    state.afterimageTimer = 0;
    state.hintText = "";
    state.cloche = null;
    state.obstacles = [];
    state.collectibles = [];
    state.platforms = [];
    state.pumpkins = [];
    particles.clear();
    director.reset();

    state.player = {
      x: P.BASE_X,
      y: GY,
      vy: 0,
      width: P.WIDTH,
      height: P.STAND_HEIGHT,
      grounded: true,
      jumpsLeft: 2,
      gliding: false,
      sliding: false,
      slideTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      waveCooldown: 0,
      chiliTimer: 0,
      invulnTimer: 0,
      gobbleTimer: 0,
      tauntCooldown: 0,
      runCycle: 0,
      squashX: 1,
      squashY: 1,
      wingAngle: 0,
      panicLevel: 0,
      onPlatform: false
    };

    state.farmer = {
      x: P.BASE_X - CONFIG.FARMER.COMFORT_GAP,
      y: GY,
      gap: CONFIG.FARMER.COMFORT_GAP,
      runCycle: 0,
      windupTimer: 0,
      nextThrowTimer: 4.4,
      frenzyActive: false,
      bonkedTimer: 0,
      speechText: "GET BACK HERE!",
      speechTimer: 2.2,
      tripped: false
    };

    input.jumpHeld = false;
    input.slideHeld = false;
    input.jumpBuffer = 0;
    input.coyoteTimer = P.COYOTE_TIME;
  }

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function refreshTitleRecords() {
    var save = Storage.load();
    state.skin = save.skin || "classic";
    state.totalRunsSeen = save.totalRuns || 0;
    ui.titleBestScore.textContent = save.bestScore.toLocaleString();
    ui.titleBestDist.textContent = save.bestDistance + "m";
    ui.titleEscapes.textContent = String(save.escapes);
    var totalAch = Object.keys(CONFIG.ACHIEVEMENTS).length;
    var earnedAch = Object.keys(save.achievements || {}).length;
    ui.titleAchievements.textContent = earnedAch + "/" + totalAch;
    Audio.setMuted(save.muted);
    syncMuteButtons();
    syncSkinButtons();
  }

  function syncMuteButtons() {
    var m = Audio.isMuted();
    ui.btnMute.textContent = m ? "🔇" : "🔊";
    ui.btnTitleMute.textContent = m ? "🔇 Sound: OFF" : "🔊 Sound: ON";
  }

  function showOnlyOverlay(screenName) {
    ui.screenTitle.classList.toggle("hidden", screenName !== "TITLE");
    ui.screenPause.classList.toggle("hidden", screenName !== "PAUSED");
    ui.screenEnd.classList.toggle("hidden", screenName !== "END");
    ui.hud.classList.toggle("hidden", screenName === "TITLE");
  }

  function unlockAchievement(id) {
    var meta = CONFIG.ACHIEVEMENTS[id];
    if (!meta) return;
    if (state.unlockedThisRun.indexOf(id) === -1) {
      var newlyEarned = Storage.unlockAchievement(id);
      if (newlyEarned) {
        state.unlockedThisRun.push(id);
        ui.achIcon.textContent = meta.icon;
        ui.achTitle.textContent = meta.title;
        ui.achToast.classList.remove("hidden");
        state.achToastTimer = 2.8;
        Audio.playAchievement();
      }
    }
  }

  function showBanner(eyebrow, title, isFrenzy) {
    ui.zoneBannerEyebrow.textContent = eyebrow;
    ui.zoneBannerTitle.textContent = title;
    ui.zoneBanner.classList.toggle("is-frenzy", !!isFrenzy);
    ui.zoneBanner.classList.remove("hidden");
    state.zoneBannerTimer = 2.6;
  }

  function startRun(mode) {
    Audio.init();
    createFreshRunState(mode || state.gameMode);
    state.modeState = "PLAYING";
    ui.zoneBanner.classList.add("hidden");
    ui.achToast.classList.add("hidden");

    // Dramatic Kitchen Cloche Burst Intro!
    state.cloche = {
      x: CONFIG.PLAYER.BASE_X,
      y: GY - 34,
      vx: -210,
      vy: -560,
      rot: 0,
      life: 1.05
    };
    particles.emitSparks(CONFIG.PLAYER.BASE_X, GY - 40, 12, "#fde047");
    particles.addPopup(CONFIG.PLAYER.BASE_X + 16, GY - 92, "NOT TODAY!", "#fde047", 1.15);

    showOnlyOverlay(null);
    updateHUD();
    Audio.startMusic();
    Audio.playDoorCrash();
    Audio.playGobble(1.0);
    canvas.focus();
  }

  function continueEndlessAfterVictory() {
    Audio.init();
    state.gameMode = "endless";
    state.modeState = "PLAYING";
    state.farmer.tripped = false;
    state.farmer.frenzyActive = false;
    state.farmer.gap = CONFIG.FARMER.COMFORT_GAP;
    state.farmer.speechText = "ROUND TWO!!";
    state.farmer.speechTimer = 2.0;
    state.goalGateX = null;
    state.player.invulnTimer = 1.6;
    director.nextSpawnX = W + 220;
    showOnlyOverlay(null);
    updateHUD();
    Audio.startMusic();
    Audio.playGobble(1.18);
    canvas.focus();
  }

  function togglePause() {
    if (state.modeState === "PLAYING") {
      state.modeState = "PAUSED";
      Audio.stopMusic();
      showOnlyOverlay("PAUSED");
    } else if (state.modeState === "PAUSED") {
      state.modeState = "PLAYING";
      Audio.startMusic();
      showOnlyOverlay(null);
      canvas.focus();
    }
  }

  function goToTitle() {
    Audio.stopMusic();
    createFreshRunState(state.gameMode);
    state.modeState = "TITLE";
    ui.zoneBanner.classList.add("hidden");
    ui.achToast.classList.add("hidden");
    refreshTitleRecords();
    showOnlyOverlay("TITLE");
  }

  function triggerJump() {
    if (state.modeState !== "PLAYING") return;
    var p = state.player;
    var P = CONFIG.PLAYER;

    if (p.grounded || input.coyoteTimer > 0) {
      p.vy = P.JUMP_VELOCITY;
      p.grounded = false;
      p.onPlatform = false;
      p.sliding = false;
      p.jumpsLeft = 1;
      input.coyoteTimer = 0;
      input.jumpBuffer = 0;
      p.squashX = 0.78;
      p.squashY = 1.24;
      particles.emitDust(p.x, p.y, 6);
      Audio.playJump(false);
    } else if (p.jumpsLeft > 0) {
      p.vy = P.DOUBLE_JUMP_VELOCITY;
      p.jumpsLeft -= 1;
      p.sliding = false;
      input.jumpBuffer = 0;
      p.squashX = 0.82;
      p.squashY = 1.2;
      p.wingAngle = -1.1;
      particles.emitFeathers(p.x - 10, p.y - 26, 4, 0.7);
      Audio.playJump(true);
    } else {
      input.jumpBuffer = P.JUMP_BUFFER;
    }
  }

  function releaseJump() {
    input.jumpHeld = false;
    var p = state.player;
    if (!p) return;
    p.gliding = false;
    if (p.vy < -220) {
      p.vy *= CONFIG.PLAYER.JUMP_CUT_MULTIPLIER;
    }
  }

  function triggerSlideOrDive() {
    if (state.modeState !== "PLAYING") return;
    var p = state.player;
    var P = CONFIG.PLAYER;
    if (!p.grounded) {
      p.vy = Math.max(p.vy, P.FAST_FALL_VELOCITY);
      p.gliding = false;
      p.sliding = true;
      p.slideTimer = P.SLIDE_DURATION;
    } else if (!p.sliding) {
      p.sliding = true;
      p.slideTimer = P.SLIDE_DURATION;
      p.squashX = 1.25;
      p.squashY = 0.74;
      particles.emitDust(p.x - 10, p.y, 5);
      Audio.playSlide();
    }
  }

  function triggerDash() {
    if (state.modeState !== "PLAYING") return;
    var p = state.player;
    var P = CONFIG.PLAYER;
    if (p.dashCooldown > 0 || p.dashTimer > 0) return;

    p.dashTimer = P.DASH_DURATION;
    p.dashCooldown = P.DASH_COOLDOWN;
    p.invulnTimer = Math.max(p.invulnTimer, P.DASH_DURATION + 0.08);
    p.squashX = 1.32;
    p.squashY = 0.78;
    state.farmer.gap = Math.min(CONFIG.FARMER.MAX_GAP, state.farmer.gap + CONFIG.FARMER.DASH_PUSHBACK);
    particles.emitFeathers(p.x - 16, p.y - 30, 8, 1.2);
    particles.addPopup(p.x, p.y - 78, "FEATHER DASH!", "#7dd3fc", 1.0);
    Audio.playDash();
  }

  function triggerGobbleWave() {
    if (state.modeState !== "PLAYING") return;
    var p = state.player;
    var P = CONFIG.PLAYER;

    p.gobbleTimer = 0.85;

    if (p.waveCooldown > 0) {
      Audio.playGobble(1.06);
      return;
    }

    p.waveCooldown = P.WAVE_COOLDOWN;
    p.squashX = 1.18;
    p.squashY = 0.86;
    particles.addShockwave(p.x + 14, p.y - 32, P.WAVE_RADIUS, "#fde047");
    Audio.playWave();

    var reflectedCount = 0;
    var cooledCount = 0;

    for (var i = 0; i < state.obstacles.length; i++) {
      var ob = state.obstacles[i];
      if (ob.smashed || ob.deflected) continue;

      var dx = ob.x - p.x;
      var dy = (ob.kind === "oven" ? ob.y - ob.h * 0.5 : ob.y) - (p.y - 32);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var nearPointer = state.pointer.active &&
        Math.hypot(ob.x - state.pointer.x, ob.y - state.pointer.y) < 95 &&
        ob.x < W - 20;

      if (ob.kind === "knife" && (dist <= P.WAVE_RADIUS + 40 || nearPointer)) {
        ob.deflected = true;
        ob.planted = false;
        ob.vx = -900;
        ob.vy = (GY - 52 - ob.y) * 1.45;
        ob.spin = 22;
        reflectedCount += 1;
        particles.emitSparks(ob.x, ob.y, 10, "#fde047");
        particles.addPopup(ob.x, ob.y - 30, "DEFLECTED!", "#fde047", 1.05);
      } else if (ob.kind === "oven" && ob.variant === "steam" && dist <= P.WAVE_RADIUS + 40) {
        ob.steamTimer = 0;
        ob.steamActive = false;
        ob.steamWarn = false;
        cooledCount += 1;
        particles.emitSteam(ob.x, ob.y - ob.h, 8);
        particles.addPopup(ob.x, ob.y - ob.h - 20, "COOLED!", "#7dd3fc", 1.0);
      }
    }

    // Magnetize nearby treats!
    for (var c = 0; c < state.collectibles.length; c++) {
      var item = state.collectibles[c];
      if (Math.hypot(item.x - p.x, item.baseY - (p.y - 30)) <= P.WAVE_RADIUS + 140) {
        item.magnetized = true;
      }
    }

    if (reflectedCount === 0 && cooledCount === 0) {
      state.score += CONFIG.SCORE.TAUNT_BONUS;
      particles.addPopup(p.x + 12, p.y - 108, "GOBBLE! +" + CONFIG.SCORE.TAUNT_BONUS, "#fef08a", 0.9);
    }
  }

  function getWorldSpeed() {
    var t = Math.min(1, state.distance / 1100);
    var mps = CONFIG.BASE_METERS_PER_SEC + (CONFIG.MAX_METERS_PER_SEC - CONFIG.BASE_METERS_PER_SEC) * t;
    if (state.distance > CONFIG.ESCAPE_DISTANCE) {
      mps += Math.min(6, (state.distance - CONFIG.ESCAPE_DISTANCE) * 0.008);
    }
    var p = state.player;
    if (p.chiliTimer > 0) mps *= CONFIG.PLAYER.CHILI_SPEED_MULT;
    else if (p.dashTimer > 0) mps *= CONFIG.PLAYER.DASH_SPEED_MULT;
    return mps * CONFIG.PX_PER_METER;
  }

  function getPlayerHitbox(p) {
    var topOffset = p.sliding ? 30 : 56;
    return {
      left: p.x - 17,
      right: p.x + 17,
      top: p.y - topOffset,
      bottom: p.y - 4
    };
  }

  function getObstacleHitbox(ob) {
    if (ob.kind === "oven") {
      var steamBoost = ob.variant === "steam" && ob.steamActive ? 30 : 0;
      return {
        left: ob.x - ob.w * 0.39,
        right: ob.x + ob.w * 0.39,
        top: ob.y - ob.h * 0.88 - steamBoost,
        bottom: ob.y
      };
    }
    if (ob.kind === "skillet") {
      return {
        left: ob.x - 28,
        right: ob.x + 24,
        top: ob.y - 25,
        bottom: ob.y
      };
    }
    return {
      left: ob.x - 23,
      right: ob.x + 23,
      top: ob.y - 9,
      bottom: ob.y + 9
    };
  }

  function boxesOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function boxDistance(a, b) {
    var dx = Math.max(0, b.left - a.right, a.left - b.right);
    var dy = Math.max(0, b.top - a.bottom, a.top - b.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function hurtPlayer(sourceOb) {
    var p = state.player;
    if (p.invulnTimer > 0 || p.chiliTimer > 0 || p.dashTimer > 0) return;

    state.lives -= 1;
    state.combo = 1;
    state.comboTimer = 0;
    p.invulnTimer = CONFIG.PLAYER.INVULN_DURATION;
    p.squashX = 0.72;
    p.squashY = 1.28;

    state.hitstopTimer = 0.045;
    state.shakeTime = 0.25;
    state.shakeMag = 12;

    particles.emitFeathers(p.x, p.y - 35, 14, 1.3);
    particles.emitSparks(p.x + 10, p.y - 30, 8, "#fb923c");
    var hitText = sourceOb.kind === "oven" ? "HOT OUCH!" : sourceOb.kind === "skillet" ? "PAN SLAM!" : "CLIPPED!";
    particles.addPopup(p.x, p.y - 80, hitText, "#f87171", 1.15);

    state.farmer.gap = Math.max(CONFIG.FARMER.MIN_GAP, state.farmer.gap - CONFIG.FARMER.HIT_SURGE);
    state.farmer.speechText = state.lives <= 1 ? "ALMOST GOTCHA!" : "GOTCHA SOON!";
    state.farmer.speechTimer = 1.8;

    Audio.playHit();

    if (state.lives <= 0) {
      finishRun(false);
    }
  }

  function smashObstacle(ob, isDashParry) {
    ob.smashed = true;
    ob.smashVx = 440 + Math.random() * 240;
    ob.smashVy = -440 - Math.random() * 200;

    if (isDashParry) {
      state.parries += 1;
      state.combo = Math.min(8, state.combo + 1);
      state.comboTimer = 4.0;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      var parryPts = Math.round(CONFIG.SCORE.PARRY_KNIFE * state.combo * (state.combo >= 5 ? 1.25 : 1));
      state.score += parryPts;
      state.hitstopTimer = 0.032;
      state.shakeTime = 0.16;
      state.shakeMag = 8;
      particles.emitSparks(ob.x, ob.y - 24, 14, "#38bdf8");
      particles.addShockwave(ob.x, ob.y - 20, 95, "#38bdf8");
      particles.addPopup(ob.x, ob.y - 58, "PARRY! +" + parryPts, "#7dd3fc", 1.18);
      Audio.playParry();
      unlockAchievement("knife_parry");
    } else {
      state.chiliSmashes += 1;
      var pts = CONFIG.SCORE.SMASH_OBSTACLE * state.combo;
      state.score += pts;
      state.hitstopTimer = 0.025;
      state.shakeTime = 0.14;
      state.shakeMag = 7;
      particles.emitSparks(ob.x, ob.y - 25, 12, "#fde047");
      particles.addPopup(ob.x, ob.y - 54, "SMASH! +" + pts, "#fde047", 1.1);
      Audio.playSmash();
      if (state.chiliSmashes >= 3) unlockAchievement("spicy_smash");
    }
  }

  function bonkFarmer(ob) {
    state.bonks += 1;
    state.combo = Math.min(8, state.combo + 1);
    state.comboTimer = 4.2;
    state.maxCombo = Math.max(state.maxCombo, state.combo);

    var pts = CONFIG.SCORE.FARMER_BONK * state.combo;
    state.score += pts;
    state.farmer.bonkedTimer = 1.65;
    state.farmer.gap = Math.min(CONFIG.FARMER.MAX_GAP, state.farmer.gap + CONFIG.FARMER.BONK_PUSHBACK);
    state.farmer.speechText = "MY OWN KNIFE?!";
    state.farmer.speechTimer = 1.9;

    state.hitstopTimer = 0.036;
    state.shakeTime = 0.18;
    state.shakeMag = 9;
    particles.emitSparks(state.farmer.x + 10, GY - 65, 16, "#fde047");
    particles.addShockwave(state.farmer.x + 10, GY - 65, 110, "#fde047");
    particles.addPopup(state.farmer.x + 18, GY - 118, "BONK! +" + pts, "#fde047", 1.24);
    Audio.playBonk();
    unlockAchievement("return_sender");
    ob.smashed = true;
    ob.smashVx = -180;
    ob.smashVy = -380;
  }

  function finishRun(escaped) {
    state.modeState = escaped ? "ESCAPED" : "CAUGHT";
    state.endLockTimer = 0.45;
    state.slowMoTimer = 0;
    state.timeScale = 1;
    ui.zoneBanner.classList.add("hidden");
    Audio.stopMusic();

    if (escaped) {
      state.farmer.tripped = true;
      state.farmer.frenzyActive = false;
      state.farmer.speechText = "NOOOOO! MY ROAST!";
      state.farmer.speechTimer = 3.0;
      state.score += CONFIG.SCORE.ESCAPE_BONUS + state.lives * CONFIG.SCORE.LIFE_BONUS;
      particles.emitConfetti(state.player.x + 60, GY - 120, 48);
      particles.emitConfetti(state.player.x + 220, GY - 180, 40);
      unlockAchievement("freedom_hero");
      Audio.playVictory();
    } else {
      state.farmer.gap = 96;
      state.farmer.x = state.player.x - 96;
      state.farmer.speechText = "DINNER IS SERVED!";
      state.farmer.speechTimer = 3.0;
      Audio.playCaught();
    }

    var finalScore = Math.floor(state.score);
    var finalDist = Math.floor(state.distance);
    var rec = Storage.recordRun({
      score: finalScore,
      distance: finalDist,
      escaped: escaped
    });

    populateEndScreen(escaped, finalScore, finalDist, rec);
    updateHUD();
    showOnlyOverlay("END");
  }

  function computeEscapeRank(score, lives, nearMisses, parries, bonks) {
    var total = score + lives * 600 + nearMisses * 150 + parries * 220 + bonks * 260;
    if (lives === CONFIG.PLAYER.MAX_LIVES && total >= 16500) return "S";
    if (total >= 13500) return "A";
    if (total >= 10500) return "B";
    return "C";
  }

  function populateEndScreen(escaped, finalScore, finalDist, rec) {
    ui.endCard.classList.toggle("is-escaped", escaped);
    ui.endCard.classList.toggle("is-caught", !escaped);
    ui.endBadge.textContent = escaped ? "ESCAPED!" : "CAUGHT!";
    ui.endHeading.textContent = escaped ? "FREEDOM FEATHERS!" : "ON THE PLATTER!";

    var quips = escaped ? CONFIG.QUIPS.escaped : CONFIG.QUIPS.caught;
    ui.endQuip.textContent = quips[Math.floor(Math.random() * quips.length)];

    if (escaped) {
      ui.endRankRow.classList.remove("hidden");
      ui.endRankLetter.textContent = computeEscapeRank(finalScore, state.lives, state.nearMisses, state.parries, state.bonks);
      ui.btnContinueEndless.classList.remove("hidden");
    } else {
      ui.endRankRow.classList.add("hidden");
      ui.btnContinueEndless.classList.add("hidden");
    }

    ui.endScore.textContent = finalScore.toLocaleString();
    ui.endDistance.textContent = finalDist + "m";
    ui.endNearMiss.textContent = state.parries + " / " + state.bonks;
    ui.endZone.textContent = CONFIG.ZONES[state.currentZoneIdx].name;
    ui.endCombo.textContent = "x" + state.maxCombo;
    ui.endCollected.textContent = state.collectedCount + " treats · " + state.nearMisses + " close";

    ui.endNewScore.classList.toggle("hidden", !rec.isNewScore);
    ui.endNewDist.classList.toggle("hidden", !rec.isNewDistance);

    if (state.unlockedThisRun.length > 0) {
      var chips = "";
      for (var i = 0; i < state.unlockedThisRun.length; i++) {
        var meta = CONFIG.ACHIEVEMENTS[state.unlockedThisRun[i]];
        if (meta) {
          chips += '<span class="end-ach-chip">' + meta.icon + " " + meta.title + "</span>";
        }
      }
      ui.endAchievements.innerHTML = chips;
      ui.endAchievements.classList.remove("hidden");
    } else {
      ui.endAchievements.classList.add("hidden");
    }
  }

  function spawnFarmerLobbedKnife() {
    var f = state.farmer;
    var targetX = 830;
    var flightTime = 1.06;
    var startX = f.x + 32;
    var startY = GY - 76;
    var vx = (targetX - startX) / flightTime;

    state.obstacles.push({
      id: Date.now() + Math.random(),
      kind: "knife",
      variant: "farmerLob",
      x: startX,
      y: startY,
      w: 74,
      h: 22,
      extraSpeed: 0,
      vx: vx,
      vy: -925,
      gravity: 1650,
      angle: 0,
      spin: 14,
      planted: false,
      deflected: false,
      warned: true,
      nearMissed: false,
      minApproachDist: Infinity,
      smashed: false,
      smashVx: 0,
      smashVy: 0,
      smashRot: 0
    });
    f.speechText = "CATCH THIS!";
    f.speechTimer = 1.4;
    Audio.playKnifeWarn();
  }

  function updatePlaying(rawDt) {
    if (state.hitstopTimer > 0) {
      state.hitstopTimer -= rawDt;
      return;
    }

    // Clutch slow-motion time dilation & dynamic camera zoom
    if (state.slowMoTimer > 0) {
      state.slowMoTimer = Math.max(0, state.slowMoTimer - rawDt);
      state.timeScale = 0.42;
    } else {
      state.timeScale = 1;
    }
    var dt = rawDt * state.timeScale;

    var p = state.player;
    var f = state.farmer;
    var P = CONFIG.PLAYER;
    var worldSpeed = getWorldSpeed();

    // Camera zoom smoothing
    var targetZoom = 1;
    if (state.slowMoTimer > 0 || f.frenzyActive) targetZoom = 1.045;
    else if (p.y < GY - 150) targetZoom = 0.95;
    state.cameraZoom += (targetZoom - state.cameraZoom) * Math.min(1, rawDt * 4.5);

    // Cloche pop intro animation
    if (state.cloche && state.cloche.life > 0) {
      state.cloche.life -= rawDt;
      state.cloche.x += state.cloche.vx * rawDt;
      state.cloche.vy += 1200 * rawDt;
      state.cloche.y += state.cloche.vy * rawDt;
      state.cloche.rot -= 8 * rawDt;
    }

    // Advance distance & score
    var metersGained = (worldSpeed / CONFIG.PX_PER_METER) * dt;
    state.distance += metersGained;
    state.worldScroll += worldSpeed * dt;
    var feverMult = state.combo >= 5 ? 1.25 : 1;
    state.score += metersGained * CONFIG.SCORE.DISTANCE_TICK * feverMult;

    // Diegetic hints on first run (0m - 125m)
    if (state.totalRunsSeen < 2 && state.distance < 125) {
      if (state.distance < 38) state.hintText = "SPACE / L-CLICK: Jump & Hold to Glide";
      else if (state.distance < 82) state.hintText = "S / R-CLICK: Belly Slide Under High Knives";
      else state.hintText = "SHIFT: Dash Parry  ·  F / G: Gobble Wave (Reflect Knives!)";
    } else {
      state.hintText = "";
    }

    if (state.achToastTimer > 0) {
      state.achToastTimer -= rawDt;
      if (state.achToastTimer <= 0) {
        ui.achToast.classList.add("hidden");
      }
    }

    // Zone transitions + Untouchable milestone + Door Crash
    var zb = Renderer.getZoneBlend(state.distance, state.gameMode);
    if (zb.idx !== state.currentZoneIdx) {
      state.currentZoneIdx = zb.idx;
      showBanner("NEW ZONE", CONFIG.ZONES[zb.idx].name, false);
      Audio.playZoneUp();
      if (zb.idx === 1) {
        Audio.playDoorCrash();
        particles.emitSparks(p.x + 40, GY - 60, 14, "#fbbf24");
        if (state.lives === P.MAX_LIVES) unlockAchievement("untouchable");
      }
    }
    if (state.zoneBannerTimer > 0) {
      state.zoneBannerTimer -= rawDt;
      if (state.zoneBannerTimer <= 0) {
        ui.zoneBanner.classList.add("hidden");
      }
    }

    // Farmer Frenzy Finale (855m - 965m in Escape Run)
    if (state.gameMode === "escape") {
      if (state.distance >= CONFIG.FRENZY_START && !state.frenzyTriggered) {
        state.frenzyTriggered = true;
        f.frenzyActive = true;
        f.speechText = "NO ESCAPE NOW!!";
        f.speechTimer = 2.2;
        showBanner("FINAL STRETCH", "FARMER FRENZY! TRIPLE VOLLEY!", true);
        Audio.playFrenzy();
        director.spawnFrenzyVolley(state.obstacles, state.collectibles, W + 240);
        director.nextSpawnX = Math.max(director.nextSpawnX, W + 1580);
      }
      if (state.distance >= CONFIG.FRENZY_END && !state.frenzyEndTriggered) {
        state.frenzyEndTriggered = true;
        f.frenzyActive = false;
        f.speechText = "WAIT FOR ME!!";
        f.speechTimer = 1.6;
      }

      var remainingPx = (CONFIG.ESCAPE_DISTANCE - state.distance) * CONFIG.PX_PER_METER;
      if (remainingPx < W + 240) {
        state.goalGateX = p.x + remainingPx - 67;
      }
      if (state.distance >= CONFIG.ESCAPE_DISTANCE) {
        finishRun(true);
        return;
      }
    }

    // Combo decay
    if (state.combo > 1) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 1;
    }

    // Timers & afterimages
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.waveCooldown = Math.max(0, p.waveCooldown - dt);
    p.gobbleTimer = Math.max(0, p.gobbleTimer - dt);
    p.tauntCooldown = Math.max(0, p.tauntCooldown - dt);
    f.bonkedTimer = Math.max(0, f.bonkedTimer - dt);

    if (p.dashTimer > 0 || p.chiliTimer > 0) {
      state.afterimageTimer -= dt;
      if (state.afterimageTimer <= 0) {
        var afCol = p.chiliTimer > 0 ? "#f97316" : getSkinObj(state.skin).trailColor;
        particles.addAfterimage(p.x, p.y, p.sliding, afCol);
        state.afterimageTimer = 0.045;
      }
    }

    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt);
      if (Math.random() < 0.7) particles.emitSpeedLine(p.y - 10 - Math.random() * 50, "rgba(125, 211, 252, 0.5)");
    }
    if (p.chiliTimer > 0) {
      p.chiliTimer = Math.max(0, p.chiliTimer - dt);
      if (Math.random() < 0.85) particles.emitSpeedLine(120 + Math.random() * 460, "rgba(251, 146, 60, 0.52)");
      if (Math.random() < 0.4) particles.emitSparks(p.x - 16, p.y - 24, 1, "#f97316");
    }

    // Slide handling
    if (p.sliding) {
      p.slideTimer -= dt;
      if (p.grounded && Math.random() < 0.45) {
        particles.emitDust(p.x - 14, p.y, 1);
      }
      if (p.slideTimer <= 0 && !input.slideHeld) {
        p.sliding = false;
      }
    } else if (input.slideHeld && p.grounded) {
      p.sliding = true;
      p.slideTimer = 0.15;
    }

    // Jump buffer & Coyote time
    if (input.jumpBuffer > 0) {
      input.jumpBuffer -= dt;
      if (p.grounded || input.coyoteTimer > 0) {
        triggerJump();
      }
    }
    if (p.grounded) {
      input.coyoteTimer = P.COYOTE_TIME;
    } else {
      input.coyoteTimer = Math.max(0, input.coyoteTimer - dt);
    }

    // Vertical physics + Wing Glide
    var prevY = p.y;
    p.vy += P.GRAVITY * dt;
    if (!p.grounded && input.jumpHeld && p.vy > P.GLIDE_MAX_FALL && !input.slideHeld) {
      p.vy = P.GLIDE_MAX_FALL;
      p.gliding = true;
      p.wingAngle = Math.sin(state.time * 26) * 0.55 - 0.3;
    } else {
      p.gliding = false;
      p.wingAngle = p.grounded ? Math.sin(p.runCycle) * 0.18 : -0.35;
    }
    p.y += p.vy * dt;

    // Update platforms & one-way landing
    p.grounded = false;
    p.onPlatform = false;
    for (var pl = state.platforms.length - 1; pl >= 0; pl--) {
      var plat = state.platforms[pl];
      plat.x -= worldSpeed * dt;
      if (plat.x + plat.w < -120) {
        state.platforms.splice(pl, 1);
        continue;
      }
      if (!input.slideHeld && p.vy >= 0 && p.x + 14 > plat.x && p.x - 14 < plat.x + plat.w) {
        if (prevY <= plat.y + 10 && p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          p.grounded = true;
          p.onPlatform = true;
          p.jumpsLeft = 2;
        }
      }
    }

    // Bouncy Pumpkins update & spring launch
    for (var pm = state.pumpkins.length - 1; pm >= 0; pm--) {
      var pmp = state.pumpkins[pm];
      pmp.x -= worldSpeed * dt;
      if (pmp.bounceTimer > 0) pmp.bounceTimer = Math.max(0, pmp.bounceTimer - dt);
      if (pmp.x < -80) {
        state.pumpkins.splice(pm, 1);
        continue;
      }
      if (p.vy >= -140 && Math.abs(p.x - pmp.x) < 42 && p.y >= GY - 54 && p.y <= GY + 8) {
        p.y = GY - 40;
        p.vy = P.PUMPKIN_BOUNCE_VELOCITY;
        p.grounded = false;
        p.sliding = false;
        p.jumpsLeft = 2;
        p.squashX = 0.72;
        p.squashY = 1.32;
        pmp.bounceTimer = 0.25;
        state.pumpkinBounces += 1;
        var bPts = CONFIG.SCORE.PUMPKIN_BOUNCE * state.combo;
        state.score += bPts;
        particles.emitSparks(pmp.x, GY - 34, 10, "#fde047");
        particles.addPopup(pmp.x, GY - 76, "BOING! +" + bPts, "#fdba74", 1.15);
        Audio.playBounce();
        if (state.pumpkinBounces >= 2) unlockAchievement("sky_hopper");
      }
    }

    // Floor collision
    if (p.y >= GY) {
      if (prevY < GY - 8 && p.vy > 220) {
        p.squashX = 1.24;
        p.squashY = 0.78;
        particles.emitDust(p.x, GY, 5);
      }
      p.y = GY;
      p.vy = 0;
      p.grounded = true;
      p.jumpsLeft = 2;
    }

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);
    p.runCycle += dt * (worldSpeed * 0.036);

    // Farmer chase & knife thrower AI
    var targetComfortGap = f.frenzyActive ? CONFIG.FARMER.MIN_GAP + 36 : CONFIG.FARMER.COMFORT_GAP;
    if (p.chiliTimer > 0) {
      f.gap = Math.min(CONFIG.FARMER.MAX_GAP, f.gap + 95 * dt);
    } else if (f.gap < targetComfortGap) {
      f.gap = Math.min(targetComfortGap, f.gap + 14 * dt);
    } else if (f.frenzyActive && f.gap > targetComfortGap && f.bonkedTimer <= 0) {
      f.gap = Math.max(targetComfortGap, f.gap - 42 * dt);
    }
    f.x = p.x - f.gap;
    f.runCycle += dt * (worldSpeed * (f.frenzyActive ? 0.044 : 0.034));
    f.speechTimer = Math.max(0, f.speechTimer - dt);

    p.panicLevel = Math.max(0, Math.min(1, 1 - (f.gap - CONFIG.FARMER.MIN_GAP) / (CONFIG.FARMER.COMFORT_GAP - CONFIG.FARMER.MIN_GAP)));

    if (f.windupTimer > 0) {
      f.windupTimer -= dt;
      if (f.windupTimer <= 0) {
        spawnFarmerLobbedKnife();
      }
    } else {
      f.nextThrowTimer -= dt;
      if (f.nextThrowTimer <= 0 && !f.frenzyActive && f.bonkedTimer <= 0 && (state.gameMode !== "escape" || state.distance < CONFIG.ESCAPE_DISTANCE - 48)) {
        f.windupTimer = 0.78;
        f.speechText = "WATCH OUT!";
        f.speechTimer = 0.9;
        var span = CONFIG.FARMER.THROW_INTERVAL_MAX - CONFIG.FARMER.THROW_INTERVAL_MIN;
        f.nextThrowTimer = CONFIG.FARMER.THROW_INTERVAL_MIN + Math.random() * span;
      }
    }

    // Ambient autumn leaves in Zone 2/3
    if (state.currentZoneIdx >= 1) {
      state.leafTimer -= dt;
      if (state.leafTimer <= 0) {
        particles.emitLeaf(W + 20, 40 + Math.random() * 260);
        state.leafTimer = 0.25 + Math.random() * 0.35;
      }
    }

    director.update(dt, state, worldSpeed);

    // Update obstacles & collision / Dash Parry / Return-to-Sender Bonk
    var pBox = getPlayerHitbox(p);
    for (var i = state.obstacles.length - 1; i >= 0; i--) {
      var ob = state.obstacles[i];

      if (ob.smashed) {
        ob.x += ob.smashVx * dt;
        ob.y += ob.smashVy * dt;
        ob.smashVy += 1400 * dt;
        ob.smashRot += 14 * dt;
        if (ob.y > H + 120 || ob.x > W + 180 || ob.x < -180) {
          state.obstacles.splice(i, 1);
        }
        continue;
      }

      if (ob.deflected) {
        ob.x += ob.vx * dt;
        ob.y += ob.vy * dt;
        ob.angle += ob.spin * dt;
        if (ob.x <= f.x + 42 && ob.x >= f.x - 80) {
          bonkFarmer(ob);
        } else if (ob.x < -120) {
          state.obstacles.splice(i, 1);
        }
        continue;
      }

      if (ob.kind === "oven") {
        ob.x -= worldSpeed * dt;
        if (ob.x < W + 40 && ob.x > -40 && Math.random() < 0.14) {
          particles.emitSparks(ob.x + (Math.random() - 0.5) * 36, ob.y - ob.h - 4, 1, "#fb923c");
        }
        if (ob.variant === "steam") {
          ob.steamTimer = (ob.steamTimer + dt) % 2.4;
          var wasActive = ob.steamActive;
          ob.steamWarn = ob.steamTimer >= 1.1 && ob.steamTimer < 1.55;
          ob.steamActive = ob.steamTimer >= 1.55 && ob.steamTimer < 2.2;
          if (ob.steamActive && !wasActive && ob.x < W + 60 && ob.x > 0) {
            Audio.playOvenSteam();
          }
          if (ob.steamActive && Math.random() < 0.55) {
            particles.emitSteam(ob.x, ob.y - ob.h, 1);
          }
        }
      } else if (ob.kind === "skillet") {
        ob.x -= (worldSpeed + (ob.extraSpeed || 215)) * dt;
        if (Math.random() < 0.35 && ob.x < W) {
          particles.emitSparks(ob.x + 16, GY - 4, 1, "#f97316");
        }
      } else if (ob.kind === "knife") {
        if (ob.variant === "farmerLob" && !ob.planted) {
          ob.x += ob.vx * dt;
          ob.vy += ob.gravity * dt;
          ob.y += ob.vy * dt;
          ob.angle += ob.spin * dt;
          if (ob.y >= GY - 26) {
            ob.y = GY - 26;
            ob.vy = 0;
            ob.vx = 0;
            ob.planted = true;
            ob.spin = 0;
            ob.angle = -Math.PI * 0.44;
            particles.emitSparks(ob.x, GY - 6, 7, "#e2e8f0");
          }
        } else {
          ob.x -= (worldSpeed + (ob.extraSpeed || 0)) * dt;
          if (ob.variant === "arc") {
            ob.y = ob.baseY + Math.sin(state.time * ob.waveFreq + ob.phase) * ob.waveAmp;
          }
          if (ob.spin) ob.angle += ob.spin * dt;

          if (!ob.warned && ob.x <= W + 190 && ob.x > W - 20 && ob.variant !== "hanging") {
            ob.warned = true;
            Audio.playKnifeWarn();
          }
        }
      }

      if (ob.x < -160) {
        state.obstacles.splice(i, 1);
        continue;
      }

      var obBox = getObstacleHitbox(ob);
      if (boxesOverlap(pBox, obBox)) {
        if (p.chiliTimer > 0) {
          smashObstacle(ob, false);
        } else if (p.dashTimer > 0) {
          smashObstacle(ob, true);
        } else {
          hurtPlayer(ob);
        }
      } else if (!ob.nearMissed && ob.x > p.x - 140 && ob.x < p.x + 140) {
        var d = boxDistance(pBox, obBox);
        if (d < ob.minApproachDist) ob.minApproachDist = d;
      }

      if (!ob.nearMissed && ob.x + ob.w * 0.5 < p.x - 20) {
        ob.nearMissed = true;
        if (ob.minApproachDist < 36 && p.invulnTimer <= 0) {
          state.nearMisses += 1;
          if (ob.kind === "knife") {
            state.knifeNearMisses += 1;
            if (state.knifeNearMisses >= 3) unlockAchievement("blade_dancer");
          }
          state.combo = Math.min(8, state.combo + 1);
          state.comboTimer = 4.0;
          state.maxCombo = Math.max(state.maxCombo, state.combo);

          var isClutch = ob.minApproachDist < 15;
          var bonus = (isClutch ? CONFIG.SCORE.CLUTCH_DODGE : CONFIG.SCORE.NEAR_MISS) * state.combo;
          state.score += bonus;
          if (isClutch) {
            state.slowMoTimer = 0.2;
            particles.addShockwave(p.x, p.y - 32, 90, "#4ade80");
            particles.addPopup(p.x + 12, p.y - 82, "CLUTCH! +" + bonus, "#4ade80", 1.18);
          } else {
            particles.addPopup(p.x + 12, p.y - 76, "NEAR MISS! +" + bonus, "#4ade80", 1.02);
          }
          Audio.playNearMiss();
        }
      }
    }

    // Update collectibles (with Gobble Wave magnet swoop!)
    for (var c = state.collectibles.length - 1; c >= 0; c--) {
      var item = state.collectibles[c];
      if (item.magnetized) {
        item.x += (p.x - item.x) * Math.min(1, dt * 11);
        item.baseY += ((p.y - 32) - item.baseY) * Math.min(1, dt * 11);
      } else {
        item.x -= worldSpeed * dt;
      }
      if (item.x < -80) {
        state.collectibles.splice(c, 1);
        continue;
      }
      var itemBox = {
        left: item.x - 22,
        right: item.x + 22,
        top: item.baseY - 22,
        bottom: item.baseY + 22
      };
      if (boxesOverlap(pBox, itemBox)) {
        collectItem(item);
        state.collectibles.splice(c, 1);
      }
    }

    particles.update(dt, worldSpeed);
    Audio.updateMusic(dt, p.panicLevel, p.chiliTimer > 0 || f.frenzyActive || state.combo >= 5);
  }

  function collectItem(item) {
    state.collectedCount += 1;
    var wasFever = state.combo >= 5;
    state.combo = Math.min(8, state.combo + 1);
    state.comboTimer = 3.8;
    state.maxCombo = Math.max(state.maxCombo, state.combo);

    var p = state.player;
    if (!wasFever && state.combo >= 5) {
      particles.addShockwave(p.x, p.y - 32, 130, "#fbbf24");
      particles.addPopup(p.x, p.y - 104, "FEVER x5! +25% PTS", "#fde047", 1.22);
    }
    var fever = state.combo >= 5 ? 1.25 : 1;
    var pts = 0;

    if (item.kind === "corn") {
      pts = Math.round(CONFIG.SCORE.CORN * state.combo * fever);
      state.score += pts;
      particles.emitSparks(item.x, item.baseY, 6, "#facc15");
      particles.addPopup(item.x, item.baseY - 14, "+" + pts, "#fde047", 0.9);
    } else if (item.kind === "berry") {
      pts = Math.round(CONFIG.SCORE.BERRY * state.combo * fever);
      state.score += pts;
      particles.emitSparks(item.x, item.baseY, 8, "#fb7185");
      particles.addPopup(item.x, item.baseY - 16, "+" + pts, "#fda4af", 1.0);
    } else if (item.kind === "chili") {
      pts = Math.round(CONFIG.SCORE.CHILI * state.combo * fever);
      state.score += pts;
      p.chiliTimer = CONFIG.PLAYER.CHILI_DURATION;
      state.farmer.gap = Math.min(CONFIG.FARMER.MAX_GAP, state.farmer.gap + CONFIG.FARMER.CHILI_PUSHBACK);
      particles.emitSparks(item.x, item.baseY, 14, "#ef4444");
      particles.addPopup(item.x, item.baseY - 22, "CHILI RUSH!", "#fb923c", 1.2);
    } else if (item.kind === "wishbone") {
      if (state.lives < CONFIG.PLAYER.MAX_LIVES) {
        state.lives += 1;
        particles.addPopup(item.x, item.baseY - 22, "+1 LIFE!", "#4ade80", 1.2);
      } else {
        pts = Math.round(CONFIG.SCORE.WISHBONE * state.combo * fever);
        state.score += pts;
        particles.addPopup(item.x, item.baseY - 22, "LUCKY +" + pts, "#86efac", 1.1);
      }
      particles.emitSparks(item.x, item.baseY, 12, "#4ade80");
    }

    Audio.playCollect(item.kind, state.combo);
  }

  function updateTitleOrEndBackground(dt) {
    if (state.modeState === "TITLE") {
      state.worldScroll += 155 * dt;
      state.player.runCycle += dt * 7;
      state.farmer.runCycle += dt * 7;
      state.player.wingAngle = Math.sin(state.time * 6) * 0.14;
      state.farmer.x = state.player.x - 190;
    } else if (state.modeState === "ESCAPED") {
      state.celebrateTimer += dt;
      state.player.y = GY - Math.abs(Math.sin(state.time * 6)) * 26;
      state.player.wingAngle = Math.sin(state.time * 18) * 0.55;
      if (state.celebrateTimer > 0.7) {
        state.celebrateTimer = 0;
        particles.emitConfetti(220 + Math.random() * 840, 140 + Math.random() * 140, 18);
      }
      particles.update(dt, 40);
    } else if (state.modeState === "CAUGHT") {
      particles.update(dt, 0);
    }
  }

  function updateHUD() {
    if (state.modeState === "TITLE") return;

    var heartsHtml = "";
    for (var h = 0; h < CONFIG.PLAYER.MAX_LIVES; h++) {
      heartsHtml += '<span class="heart-icon' + (h < state.lives ? "" : " lost") + '">❤️</span>';
    }
    if (ui.hearts.innerHTML !== heartsHtml) {
      ui.hearts.innerHTML = heartsHtml;
    }

    ui.score.textContent = Math.floor(state.score).toLocaleString();
    var isFever = state.combo >= 5;
    ui.scorePill.classList.toggle("is-fever", isFever);
    if (state.combo > 1) {
      ui.combo.textContent = isFever ? "🔥x" + state.combo : "x" + state.combo;
      ui.combo.classList.remove("hidden");
    } else {
      ui.combo.classList.add("hidden");
    }

    var p = state.player;
    var dashPct = p.dashCooldown <= 0 ? 100 : Math.max(0, 100 * (1 - p.dashCooldown / CONFIG.PLAYER.DASH_COOLDOWN));
    ui.dashFill.style.width = dashPct.toFixed(0) + "%";
    var dashReady = p.dashCooldown <= 0;
    ui.dashState.textContent = dashReady ? "READY" : p.dashCooldown.toFixed(1) + "s";
    ui.btnHudDash.classList.toggle("cooling", !dashReady);

    var wavePct = p.waveCooldown <= 0 ? 100 : Math.max(0, 100 * (1 - p.waveCooldown / CONFIG.PLAYER.WAVE_COOLDOWN));
    ui.waveFill.style.width = wavePct.toFixed(0) + "%";
    var waveReady = p.waveCooldown <= 0;
    ui.waveState.textContent = waveReady ? "READY" : p.waveCooldown.toFixed(1) + "s";
    ui.btnHudWave.classList.toggle("cooling", !waveReady);

    var zoneName = CONFIG.ZONES[state.currentZoneIdx].name;
    ui.zoneChip.textContent = state.farmer.frenzyActive ? "⚡ FARMER FRENZY" : zoneName;

    var distInt = Math.floor(state.distance);
    if (state.gameMode === "escape") {
      ui.distance.textContent = distInt + "m / " + CONFIG.ESCAPE_DISTANCE.toLocaleString() + "m";
      ui.goalMarker.classList.remove("hidden");
      var prog = Math.min(97, (state.distance / CONFIG.ESCAPE_DISTANCE) * 90 + 7);
      ui.progressFill.style.width = prog.toFixed(1) + "%";
      ui.turkeyMarker.style.left = prog.toFixed(1) + "%";
      var farmerRatio = Math.max(0, Math.min(1, (state.farmer.gap - CONFIG.FARMER.MIN_GAP) / (CONFIG.FARMER.MAX_GAP - CONFIG.FARMER.MIN_GAP)));
      var farmerLeft = Math.max(2, prog - 3.2 - farmerRatio * 6.5);
      ui.farmerMarker.style.left = farmerLeft.toFixed(1) + "%";
    } else {
      ui.distance.textContent = distInt + "m (ENDLESS)";
      ui.goalMarker.classList.add("hidden");
      var endlessLoop = ((state.distance % 350) / 350) * 84 + 12;
      ui.progressFill.style.width = endlessLoop.toFixed(1) + "%";
      ui.turkeyMarker.style.left = endlessLoop.toFixed(1) + "%";
      ui.farmerMarker.style.left = Math.max(4, endlessLoop - (state.farmer.gap / CONFIG.FARMER.MAX_GAP) * 14).toFixed(1) + "%";
    }

    if (p.chiliTimer > 0) {
      ui.powerupBanner.classList.remove("hidden");
      ui.powerupFill.style.width = ((p.chiliTimer / CONFIG.PLAYER.CHILI_DURATION) * 100).toFixed(0) + "%";
    } else {
      ui.powerupBanner.classList.add("hidden");
    }
  }

  function frame(now) {
    if (!state.lastTime) state.lastTime = now;
    var dt = Math.min(0.05, Math.max(0, (now - state.lastTime) / 1000));
    state.lastTime = now;
    state.time += dt;

    if (state.shakeTime > 0) state.shakeTime = Math.max(0, state.shakeTime - dt);
    if (state.endLockTimer > 0) state.endLockTimer = Math.max(0, state.endLockTimer - dt);

    if (state.modeState === "PLAYING") {
      updatePlaying(dt);
      updateHUD();
    } else if (state.modeState !== "PAUSED") {
      updateTitleOrEndBackground(dt);
    }

    Renderer.render(ctx, state);
    window.requestAnimationFrame(frame);
  }

  // ==================== INPUT WIRING ====================
  function isJumpKey(code) {
    return code === "Space" || code === "KeyW" || code === "ArrowUp";
  }

  function isSlideKey(code) {
    return code === "KeyS" || code === "ArrowDown";
  }

  function isDashKey(code) {
    return code === "ShiftLeft" || code === "ShiftRight" || code === "KeyE" || code === "KeyD" || code === "ArrowRight";
  }

  window.addEventListener("keydown", function (e) {
    if (isJumpKey(e.code) || isSlideKey(e.code)) {
      e.preventDefault();
    }

    Audio.init();

    if (e.code === "KeyM") {
      Storage.setMuted(Audio.toggleMute());
      syncMuteButtons();
      return;
    }

    if (e.code === "KeyP" || e.code === "Escape") {
      if (state.modeState === "PLAYING" || state.modeState === "PAUSED") {
        togglePause();
      }
      return;
    }

    if (e.code === "KeyR") {
      if (state.modeState === "PAUSED" || state.modeState === "CAUGHT" || state.modeState === "ESCAPED") {
        startRun(state.gameMode);
      }
      return;
    }

    if (state.modeState === "TITLE" && (e.code === "Space" || e.code === "Enter")) {
      startRun(state.gameMode);
      return;
    }

    if ((state.modeState === "CAUGHT" || state.modeState === "ESCAPED") && state.endLockTimer <= 0 && (e.code === "Space" || e.code === "Enter")) {
      startRun(state.gameMode);
      return;
    }

    if (state.modeState !== "PLAYING") return;

    if (isJumpKey(e.code) && !e.repeat) {
      input.jumpHeld = true;
      triggerJump();
    } else if (isSlideKey(e.code) && !e.repeat) {
      input.slideHeld = true;
      triggerSlideOrDive();
    } else if (isDashKey(e.code) && !e.repeat) {
      triggerDash();
    } else if ((e.code === "KeyF" || e.code === "KeyG") && !e.repeat) {
      triggerGobbleWave();
    }
  });

  window.addEventListener("keyup", function (e) {
    if (isJumpKey(e.code)) {
      releaseJump();
    } else if (isSlideKey(e.code)) {
      input.slideHeld = false;
    }
  });

  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.pointer.x = ((e.clientX - rect.left) / rect.width) * W;
    state.pointer.y = ((e.clientY - rect.top) / rect.height) * H;
    state.pointer.active = true;
  });

  canvas.addEventListener("mouseleave", function () {
    state.pointer.active = false;
  });

  canvas.addEventListener("mousedown", function (e) {
    if (state.modeState !== "PLAYING") return;
    Audio.init();
    if (e.button === 0) {
      input.jumpHeld = true;
      triggerJump();
    } else if (e.button === 2) {
      e.preventDefault();
      input.slideHeld = true;
      triggerSlideOrDive();
    } else if (e.button === 1) {
      e.preventDefault();
      triggerDash();
    }
  });

  window.addEventListener("mouseup", function (e) {
    if (e.button === 0) {
      releaseJump();
    } else if (e.button === 2) {
      input.slideHeld = false;
    }
  });

  ui.btnStart.addEventListener("click", function () {
    startRun(state.gameMode);
  });

  ui.btnTitleMute.addEventListener("click", function () {
    Audio.init();
    Storage.setMuted(Audio.toggleMute());
    syncMuteButtons();
  });

  ui.btnMute.addEventListener("click", function (e) {
    e.stopPropagation();
    Audio.init();
    Storage.setMuted(Audio.toggleMute());
    syncMuteButtons();
  });

  ui.btnPause.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePause();
  });

  ui.btnHudDash.addEventListener("click", function (e) {
    e.stopPropagation();
    Audio.init();
    triggerDash();
  });

  ui.btnHudWave.addEventListener("click", function (e) {
    e.stopPropagation();
    Audio.init();
    triggerGobbleWave();
  });

  ui.btnResume.addEventListener("click", function () {
    togglePause();
  });

  ui.btnPauseRestart.addEventListener("click", function () {
    startRun(state.gameMode);
  });

  ui.btnPauseTitle.addEventListener("click", function () {
    goToTitle();
  });

  ui.btnRestart.addEventListener("click", function () {
    startRun(state.gameMode);
  });

  ui.btnContinueEndless.addEventListener("click", function () {
    continueEndlessAfterVictory();
  });

  ui.btnEndTitle.addEventListener("click", function () {
    goToTitle();
  });

  for (var m = 0; m < ui.modeButtons.length; m++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        state.gameMode = btn.getAttribute("data-mode") || "escape";
        for (var j = 0; j < ui.modeButtons.length; j++) {
          var active = ui.modeButtons[j] === btn;
          ui.modeButtons[j].classList.toggle("active", active);
          ui.modeButtons[j].setAttribute("aria-pressed", active ? "true" : "false");
        }
      });
    })(ui.modeButtons[m]);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state.modeState === "PLAYING") {
      togglePause();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  createFreshRunState("escape");
  buildSkinSelector();
  refreshTitleRecords();
  showOnlyOverlay("TITLE");
  window.requestAnimationFrame(frame);

  return {
    getState: function () {
      return state;
    },
    startRun: startRun,
    triggerJump: triggerJump,
    triggerSlideOrDive: triggerSlideOrDive,
    triggerDash: triggerDash,
    triggerGobbleWave: triggerGobbleWave,
    togglePause: togglePause
  };
})();
