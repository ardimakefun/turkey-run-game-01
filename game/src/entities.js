window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.PatternDirector = (function () {
  var CONFIG = window.TurkeyGame.CONFIG;
  var W = CONFIG.LOGICAL_WIDTH;
  var GY = CONFIG.GROUND_Y;
  var nextEntityId = 1;

  function makeOven(x, variant) {
    var isSteam = variant === "steam";
    var isWide = variant === "wide";
    return {
      id: nextEntityId++,
      kind: "oven",
      variant: variant || "normal",
      x: x,
      y: GY,
      w: isWide ? 94 : 70,
      h: isSteam ? 78 : 72,
      steamTimer: Math.random() * 1.4,
      steamActive: false,
      steamWarn: false,
      nearMissed: false,
      minApproachDist: Infinity,
      smashed: false,
      smashVx: 0,
      smashVy: 0,
      smashRot: 0
    };
  }

  function makeSkillet(x) {
    return {
      id: nextEntityId++,
      kind: "skillet",
      variant: "pan",
      x: x,
      y: GY,
      w: 64,
      h: 28,
      extraSpeed: 215,
      nearMissed: false,
      minApproachDist: Infinity,
      smashed: false,
      smashVx: 0,
      smashVy: 0,
      smashRot: 0
    };
  }

  function makeKnife(x, y, variant, extraSpeed) {
    return {
      id: nextEntityId++,
      kind: "knife",
      variant: variant || "low",
      x: x,
      y: y,
      w: 74,
      h: 22,
      extraSpeed: extraSpeed != null ? extraSpeed : 185,
      vx: 0,
      vy: 0,
      gravity: 0,
      baseY: y,
      waveAmp: variant === "arc" ? 38 : 0,
      waveFreq: variant === "arc" ? 4.4 : 0,
      phase: Math.random() * Math.PI * 2,
      angle: variant === "hanging" ? -Math.PI * 0.5 : 0,
      spin: variant === "low" || variant === "arc" ? -9.5 : 0,
      planted: false,
      deflected: false,
      warned: false,
      nearMissed: false,
      minApproachDist: Infinity,
      smashed: false,
      smashVx: 0,
      smashVy: 0,
      smashRot: 0
    };
  }

  function makePlatform(x, y, w) {
    return {
      id: nextEntityId++,
      kind: "table",
      x: x,
      y: y,
      w: w || 210,
      h: 22
    };
  }

  function makePumpkin(x) {
    return {
      id: nextEntityId++,
      x: x,
      y: GY,
      bounceTimer: 0
    };
  }

  function makeCollectible(x, y, kind) {
    return {
      id: nextEntityId++,
      kind: kind || "corn",
      x: x,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      magnetized: false,
      collected: false
    };
  }

  function addCornArc(collectibles, startX, count, peakY, stepX) {
    var mid = (count - 1) * 0.5;
    for (var i = 0; i < count; i++) {
      var norm = mid === 0 ? 0 : (i - mid) / mid;
      var y = peakY + norm * norm * 42;
      collectibles.push(makeCollectible(startX + i * (stepX || 48), y, "corn"));
    }
  }

  function addCornLine(collectibles, startX, y, count, stepX) {
    for (var i = 0; i < count; i++) {
      collectibles.push(makeCollectible(startX + i * (stepX || 46), y, "corn"));
    }
  }

  function PatternDirector() {
    this.nextSpawnX = W + 180;
    this.lastPatternIdx = -1;
    this.chiliCooldown = 14;
    this.wishboneCooldown = 18;
  }

  PatternDirector.prototype.reset = function () {
    this.nextSpawnX = W + 140;
    this.lastPatternIdx = -1;
    this.chiliCooldown = 12;
    this.wishboneCooldown = 16;
  };

  PatternDirector.prototype.spawnFrenzyVolley = function (obstacles, collectibles, startX) {
    obstacles.push(makeKnife(startX, GY - 32, "low", 215));
    obstacles.push(makeKnife(startX + 430, GY - 54, "high", 215));
    obstacles.push(makeKnife(startX + 860, GY - 32, "low", 225));
    obstacles.push(makeSkillet(startX + 1240));
    addCornLine(collectibles, startX + 260, GY - 24, 3, 46);
    collectibles.push(makeCollectible(startX + 860, GY - 150, "berry"));
  };

  PatternDirector.prototype.update = function (dt, state, worldSpeed) {
    this.chiliCooldown = Math.max(0, this.chiliCooldown - dt);
    this.wishboneCooldown = Math.max(0, this.wishboneCooldown - dt);

    if (state.gameMode === "escape" && state.distance >= CONFIG.ESCAPE_DISTANCE - 38) {
      return;
    }

    this.nextSpawnX -= worldSpeed * dt;
    while (this.nextSpawnX < W + 240) {
      this.spawnNextPattern(state, worldSpeed);
    }
  };

  PatternDirector.prototype.spawnNextPattern = function (state, worldSpeed) {
    var dist = state.distance;
    var zoneIdx = dist < 350 ? 0 : dist < 700 ? 1 : 2;
    var x = Math.max(W + 120, this.nextSpawnX);

    var pool = [0, 1, 2, 3, 4];
    if (dist > 75) pool.push(5, 6, 14);
    if (dist > 180) pool.push(12);
    if (zoneIdx >= 1 || dist > 260) pool.push(7, 8, 9, 13);
    if (zoneIdx >= 2 || dist > 540) pool.push(10, 11);

    var pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick === this.lastPatternIdx && pool.length > 1) {
      pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    }
    this.lastPatternIdx = pick;

    var span = 300;
    var obs = state.obstacles;
    var cols = state.collectibles;
    var plats = state.platforms;
    var pmps = state.pumpkins;

    switch (pick) {
      case 0:
        obs.push(makeOven(x + 90, "normal"));
        addCornArc(cols, x + 22, 4, GY - 142, 46);
        span = 260;
        break;

      case 1:
        obs.push(makeKnife(x + 220, GY - 54, "high", 170));
        addCornLine(cols, x + 20, GY - 22, 4, 46);
        span = 290;
        break;

      case 2:
        obs.push(makeKnife(x + 210, GY - 32, "low", 185));
        cols.push(makeCollectible(x + 95, GY - 126, "berry"));
        addCornArc(cols, x + 30, 3, GY - 118, 52);
        span = 280;
        break;

      case 3:
        plats.push(makePlatform(x + 20, GY - 112, 230));
        obs.push(makeOven(x + 140, "wide"));
        addCornLine(cols, x + 65, GY - 148, 3, 52);
        cols.push(makeCollectible(x + 220, GY - 152, "berry"));
        span = 340;
        break;

      case 4:
        obs.push(makeOven(x + 70, "normal"));
        obs.push(makeOven(x + 340, "normal"));
        addCornArc(cols, x + 20, 3, GY - 138, 48);
        addCornArc(cols, x + 290, 3, GY - 138, 48);
        span = 470;
        break;

      case 5:
        obs.push(makeOven(x + 80, "normal"));
        obs.push(makeKnife(x + 480, GY - 54, "high", 160));
        addCornLine(cols, x + 240, GY - 24, 3, 46);
        cols.push(makeCollectible(x + 80, GY - 145, "berry"));
        span = 490;
        break;

      case 6:
        plats.push(makePlatform(x + 20, GY - 118, 155));
        obs.push(makeOven(x + 250, "steam"));
        addCornLine(cols, x + 50, GY - 156, 3, 45);
        span = 360;
        break;

      case 7:
        obs.push(makeKnife(x + 110, GY - 58, "hanging", 0));
        addCornLine(cols, x + 55, GY - 22, 3, 44);
        obs.push(makeKnife(x + 455, GY - 32, "low", 190));
        span = 460;
        break;

      case 8:
        obs.push(makeKnife(x + 220, GY - 82, "arc", 175));
        obs.push(makeOven(x + 430, "normal"));
        addCornArc(cols, x + 380, 3, GY - 140, 48);
        span = 520;
        break;

      case 9:
        plats.push(makePlatform(x + 30, GY - 110, 180));
        obs.push(makeOven(x + 125, "steam"));
        plats.push(makePlatform(x + 295, GY - 165, 195));
        obs.push(makeOven(x + 385, "wide"));
        cols.push(makeCollectible(x + 120, GY - 150, "berry"));
        cols.push(makeCollectible(x + 390, GY - 205, "berry"));
        span = 560;
        break;

      case 10:
        obs.push(makeKnife(x + 220, GY - 54, "high", 205));
        obs.push(makeKnife(x + 560, GY - 32, "low", 215));
        addCornLine(cols, x + 40, GY - 22, 3, 44);
        cols.push(makeCollectible(x + 390, GY - 138, "berry"));
        span = 520;
        break;

      case 11:
        obs.push(makeOven(x + 80, "wide"));
        obs.push(makeKnife(x + 340, GY - 58, "hanging", 0));
        obs.push(makeOven(x + 560, "steam"));
        addCornLine(cols, x + 285, GY - 22, 3, 44);
        span = 660;
        break;

      case 12:
        pmps.push(makePumpkin(x + 65));
        obs.push(makeOven(x + 215, "normal"));
        obs.push(makeOven(x + 325, "normal"));
        addCornArc(cols, x + 150, 5, GY - 265, 52);
        cols.push(makeCollectible(x + 254, GY - 295, "berry"));
        span = 470;
        break;

      case 13:
        pmps.push(makePumpkin(x + 60));
        obs.push(makeOven(x + 215, "steam"));
        obs.push(makeKnife(x + 510, GY - 54, "high", 170));
        addCornLine(cols, x + 155, GY - 245, 3, 52);
        cols.push(makeCollectible(x + 340, GY - 22, "berry"));
        span = 520;
        break;

      default: // Case 14: Sliding Sizzling Skillet + High Knife Weave
        obs.push(makeSkillet(x + 220));
        obs.push(makeKnife(x + 540, GY - 54, "high", 180));
        addCornArc(cols, x + 70, 3, GY - 115, 46);
        addCornLine(cols, x + 310, GY - 22, 3, 44);
        span = 520;
        break;
    }

    if (this.chiliCooldown <= 0 && Math.random() < 0.58) {
      cols.push(makeCollectible(x + span * 0.52, GY - 178, "chili"));
      this.chiliCooldown = 18;
    } else if (state.lives < CONFIG.PLAYER.MAX_LIVES && this.wishboneCooldown <= 0 && Math.random() < 0.55) {
      cols.push(makeCollectible(x + span * 0.45, GY - 150, "wishbone"));
      this.wishboneCooldown = 19;
    }

    var speedFactor = worldSpeed / (CONFIG.BASE_METERS_PER_SEC * CONFIG.PX_PER_METER);
    var recoveryGap = (275 - Math.min(55, dist * 0.05)) * (0.85 + speedFactor * 0.25);
    this.nextSpawnX = x + span + recoveryGap;
  };

  return PatternDirector;
})();
