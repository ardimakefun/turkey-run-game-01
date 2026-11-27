window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.Storage = (function () {
  var KEY = "turkey_run_save_v2";

  var DEFAULTS = {
    bestScore: 0,
    bestDistance: 0,
    escapes: 0,
    totalRuns: 0,
    muted: false,
    skin: "classic",
    achievements: {}
  };

  function safeRead() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS, { achievements: {} });
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULTS, parsed || {}, {
        achievements: Object.assign({}, (parsed && parsed.achievements) || {})
      });
    } catch (_err) {
      return Object.assign({}, DEFAULTS, { achievements: {} });
    }
  }

  function safeWrite(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (_err) {
      // Ignore storage errors inside restricted browser sandboxes.
    }
  }

  function load() {
    return safeRead();
  }

  function setMuted(muted) {
    var data = safeRead();
    data.muted = !!muted;
    safeWrite(data);
    return data;
  }

  function setSkin(skinId) {
    var data = safeRead();
    data.skin = skinId || "classic";
    safeWrite(data);
    return data;
  }

  function unlockAchievement(id) {
    var data = safeRead();
    var already = !!data.achievements[id];
    if (!already) {
      data.achievements[id] = true;
      safeWrite(data);
    }
    return !already;
  }

  function recordRun(summary) {
    var data = safeRead();
    var isNewScore = summary.score > data.bestScore;
    var isNewDistance = summary.distance > data.bestDistance;

    if (isNewScore) data.bestScore = Math.floor(summary.score);
    if (isNewDistance) data.bestDistance = Math.floor(summary.distance);
    if (summary.escaped) data.escapes += 1;
    data.totalRuns += 1;

    safeWrite(data);
    return {
      isNewScore: isNewScore,
      isNewDistance: isNewDistance,
      data: data
    };
  }

  return {
    load: load,
    setMuted: setMuted,
    setSkin: setSkin,
    unlockAchievement: unlockAchievement,
    recordRun: recordRun
  };
})();
