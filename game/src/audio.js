window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.Audio = (function () {
  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var noiseBuffer = null;

  var muted = false;
  var musicPlaying = false;
  var musicTimer = 0;
  var musicStep = 0;

  // Upbeat F-major / D-minor bluegrass-arcade riff (MIDI note numbers)
  var BASS_PATTERN = [41, 0, 48, 0, 41, 0, 48, 0, 46, 0, 53, 0, 48, 0, 43, 0];
  var BANJO_PATTERN = [65, 69, 72, 69, 74, 72, 69, 65, 70, 74, 77, 74, 72, 69, 67, 72];

  function ensureContext() {
    if (muted) return null;
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.72;
        masterGain.connect(ctx.destination);

        musicGain = ctx.createGain();
        musicGain.gain.value = 0.24;
        musicGain.connect(masterGain);

        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.85;
        sfxGain.connect(masterGain);

        buildNoiseBuffer();
      } catch (_err) {
        ctx = null;
        return null;
      }
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function buildNoiseBuffer() {
    if (!ctx) return;
    var length = Math.floor(ctx.sampleRate * 0.6);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone(opts) {
    var c = ensureContext();
    if (!c || muted) return;
    var now = c.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.14;

    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || "triangle";
    osc.frequency.setValueAtTime(opts.freqStart || 440, now);
    if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
      if (opts.exp) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + dur);
      } else {
        osc.frequency.linearRampToValueAtTime(opts.freqEnd, now + dur);
      }
    }

    var peak = opts.vol != null ? opts.vol : 0.25;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + (opts.attack || 0.008));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(opts.toMusic ? musicGain : sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playNoise(opts) {
    var c = ensureContext();
    if (!c || muted || !noiseBuffer) return;
    var now = c.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.12;

    var src = c.createBufferSource();
    src.buffer = noiseBuffer;

    var filter = c.createBiquadFilter();
    filter.type = opts.filterType || "bandpass";
    filter.frequency.setValueAtTime(opts.freqStart || 1200, now);
    if (opts.freqEnd) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, opts.freqEnd), now + dur);
    }
    filter.Q.value = opts.q || 1.4;

    var gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(opts.vol || 0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(opts.toMusic ? musicGain : sfxGain);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  function init() {
    ensureContext();
  }

  function setMuted(value) {
    muted = !!value;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 0.72, ctx.currentTime);
    }
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function playJump(isDouble) {
    if (isDouble) {
      playTone({ type: "triangle", freqStart: 390, freqEnd: 740, dur: 0.13, vol: 0.22, exp: true });
      playNoise({ filterType: "bandpass", freqStart: 900, freqEnd: 2400, dur: 0.1, vol: 0.14 });
    } else {
      playTone({ type: "triangle", freqStart: 250, freqEnd: 560, dur: 0.14, vol: 0.26, exp: true });
    }
  }

  function playSlide() {
    playNoise({ filterType: "lowpass", freqStart: 1800, freqEnd: 380, dur: 0.18, vol: 0.18 });
    playTone({ type: "sine", freqStart: 310, freqEnd: 130, dur: 0.14, vol: 0.15, exp: true });
  }

  function playDash() {
    playNoise({ filterType: "bandpass", freqStart: 600, freqEnd: 3600, dur: 0.2, vol: 0.22 });
    playTone({ type: "sawtooth", freqStart: 420, freqEnd: 980, dur: 0.16, vol: 0.14, exp: true });
    playTone({ type: "triangle", freqStart: 880, freqEnd: 1320, dur: 0.12, delay: 0.04, vol: 0.16, exp: true });
  }

  function playGobble(pitchScale) {
    var c = ensureContext();
    if (!c || muted) return;
    var scale = pitchScale || 1;
    var now = c.currentTime;
    var dur = 0.28;

    var osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420 * scale, now);
    osc.frequency.linearRampToValueAtTime(310 * scale, now + dur);

    var lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(24, now);
    var lfoGain = c.createGain();
    lfoGain.gain.setValueAtTime(68 * scale, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    var filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(920 * scale, now);
    filter.Q.value = 2.6;

    var gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.02);
    lfo.stop(now + dur + 0.02);
  }

  function playCollect(kind, combo) {
    var step = Math.min(combo || 1, 8) - 1;
    var base = 523.25 * Math.pow(1.06, step);
    if (kind === "wishbone") {
      playTone({ type: "triangle", freqStart: 587, freqEnd: 587, dur: 0.11, vol: 0.24 });
      playTone({ type: "triangle", freqStart: 784, freqEnd: 784, dur: 0.12, delay: 0.07, vol: 0.24 });
      playTone({ type: "triangle", freqStart: 1046, freqEnd: 1046, dur: 0.22, delay: 0.14, vol: 0.28 });
    } else if (kind === "chili") {
      playTone({ type: "sawtooth", freqStart: 440, freqEnd: 880, dur: 0.15, vol: 0.2, exp: true });
      playTone({ type: "triangle", freqStart: 880, freqEnd: 1320, dur: 0.2, delay: 0.09, vol: 0.24, exp: true });
      playNoise({ filterType: "highpass", freqStart: 2400, dur: 0.18, delay: 0.05, vol: 0.14 });
    } else if (kind === "berry") {
      playTone({ type: "sine", freqStart: base * 1.15, freqEnd: base * 1.5, dur: 0.12, vol: 0.22, exp: true });
      playTone({ type: "triangle", freqStart: base * 1.5, freqEnd: base * 1.8, dur: 0.12, delay: 0.05, vol: 0.18, exp: true });
    } else {
      playTone({ type: "sine", freqStart: base, freqEnd: base * 1.28, dur: 0.1, vol: 0.2, exp: true });
    }
  }

  function playNearMiss() {
    playTone({ type: "sine", freqStart: 920, freqEnd: 1480, dur: 0.09, vol: 0.18, exp: true });
    playTone({ type: "triangle", freqStart: 1320, freqEnd: 1760, dur: 0.1, delay: 0.04, vol: 0.15, exp: true });
  }

  function playKnifeWarn() {
    playTone({ type: "sine", freqStart: 1980, freqEnd: 2420, dur: 0.11, vol: 0.12, exp: true });
    playTone({ type: "triangle", freqStart: 2740, freqEnd: 2300, dur: 0.12, vol: 0.09, exp: true });
  }

  function playOvenSteam() {
    playNoise({ filterType: "highpass", freqStart: 1900, freqEnd: 950, dur: 0.22, vol: 0.13 });
  }

  function playHit() {
    playTone({ type: "sawtooth", freqStart: 170, freqEnd: 55, dur: 0.22, vol: 0.34, exp: true });
    playNoise({ filterType: "lowpass", freqStart: 900, freqEnd: 220, dur: 0.2, vol: 0.25 });
    playGobble(1.38);
  }

  function playSmash() {
    playNoise({ filterType: "bandpass", freqStart: 1400, freqEnd: 400, dur: 0.16, vol: 0.24 });
    playTone({ type: "square", freqStart: 320, freqEnd: 680, dur: 0.12, vol: 0.18, exp: true });
  }

  function playParry() {
    playTone({ type: "triangle", freqStart: 1180, freqEnd: 1760, dur: 0.14, vol: 0.24, exp: true });
    playTone({ type: "sine", freqStart: 2240, freqEnd: 1580, dur: 0.16, delay: 0.02, vol: 0.18, exp: true });
    playNoise({ filterType: "bandpass", freqStart: 2600, freqEnd: 900, dur: 0.12, vol: 0.16 });
  }

  function playBounce() {
    playTone({ type: "sine", freqStart: 190, freqEnd: 660, dur: 0.2, vol: 0.26, exp: true });
    playTone({ type: "triangle", freqStart: 380, freqEnd: 920, dur: 0.16, delay: 0.04, vol: 0.16, exp: true });
  }

  function playFrenzy() {
    playTone({ type: "sawtooth", freqStart: 260, freqEnd: 390, dur: 0.18, vol: 0.18, exp: true });
    playTone({ type: "sawtooth", freqStart: 390, freqEnd: 580, dur: 0.24, delay: 0.14, vol: 0.2, exp: true });
    playTone({ type: "triangle", freqStart: 587, freqEnd: 784, dur: 0.26, delay: 0.26, vol: 0.22, exp: true });
  }

  function playAchievement() {
    playTone({ type: "triangle", freqStart: 659.25, freqEnd: 659.25, dur: 0.1, vol: 0.2 });
    playTone({ type: "triangle", freqStart: 880, freqEnd: 880, dur: 0.12, delay: 0.07, vol: 0.22 });
    playTone({ type: "triangle", freqStart: 1318.5, freqEnd: 1318.5, dur: 0.24, delay: 0.14, vol: 0.25 });
  }

  function playWave() {
    playGobble(1.16);
    playTone({ type: "sine", freqStart: 540, freqEnd: 1280, dur: 0.24, vol: 0.2, exp: true });
    playNoise({ filterType: "bandpass", freqStart: 1400, freqEnd: 3200, dur: 0.18, vol: 0.14 });
  }

  function playBonk() {
    playTone({ type: "triangle", freqStart: 520, freqEnd: 180, dur: 0.22, vol: 0.3, exp: true });
    playTone({ type: "square", freqStart: 980, freqEnd: 640, dur: 0.14, vol: 0.16, exp: true });
    playNoise({ filterType: "bandpass", freqStart: 1200, freqEnd: 400, dur: 0.16, vol: 0.2 });
  }

  function playDoorCrash() {
    playNoise({ filterType: "lowpass", freqStart: 1800, freqEnd: 300, dur: 0.24, vol: 0.24 });
    playTone({ type: "sawtooth", freqStart: 220, freqEnd: 95, dur: 0.18, vol: 0.2, exp: true });
  }

  function playZoneUp() {
    var notes = [523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < notes.length; i++) {
      playTone({ type: "triangle", freqStart: notes[i], freqEnd: notes[i], dur: 0.18, delay: i * 0.075, vol: 0.22 });
    }
  }

  function playCaught() {
    var notes = [349.23, 329.63, 311.13, 261.63];
    for (var i = 0; i < notes.length; i++) {
      playTone({
        type: "sawtooth",
        freqStart: notes[i],
        freqEnd: i === 3 ? notes[i] * 0.88 : notes[i],
        dur: i === 3 ? 0.45 : 0.18,
        delay: i * 0.17,
        vol: 0.18
      });
    }
  }

  function playVictory() {
    var fanfare = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    var delays = [0, 0.09, 0.18, 0.27, 0.42, 0.54];
    var durs = [0.12, 0.12, 0.12, 0.18, 0.12, 0.48];
    for (var i = 0; i < fanfare.length; i++) {
      playTone({
        type: "triangle",
        freqStart: fanfare[i],
        freqEnd: fanfare[i],
        dur: durs[i],
        delay: delays[i],
        vol: 0.26
      });
    }
    playGobble(1.12);
  }

  function startMusic() {
    musicPlaying = true;
    musicTimer = 0;
    musicStep = 0;
  }

  function stopMusic() {
    musicPlaying = false;
  }

  function updateMusic(dt, dangerRatio, inChili) {
    if (!musicPlaying || muted) return;
    var c = ensureContext();
    if (!c) return;

    var bpm = 138 + dangerRatio * 24 + (inChili ? 20 : 0);
    var stepDur = 60 / bpm / 2; // eighth-note steps
    musicTimer += dt;

    while (musicTimer >= stepDur) {
      musicTimer -= stepDur;
      var idx = musicStep % 16;
      var bass = BASS_PATTERN[idx];
      var banjo = BANJO_PATTERN[idx];

      if (bass > 0) {
        playTone({
          type: "triangle",
          freqStart: midiToFreq(bass),
          freqEnd: midiToFreq(bass) * 0.99,
          dur: stepDur * 0.88,
          vol: 0.36,
          toMusic: true
        });
      }
      if (banjo > 0) {
        var transpose = inChili ? 2 : 0;
        playTone({
          type: "square",
          freqStart: midiToFreq(banjo + transpose),
          freqEnd: midiToFreq(banjo + transpose),
          dur: stepDur * 0.52,
          vol: 0.11,
          toMusic: true
        });
      }
      if (idx % 4 === 2) {
        playNoise({
          filterType: "highpass",
          freqStart: 3200,
          dur: 0.05,
          vol: 0.12,
          toMusic: true
        });
      }

      musicStep = (musicStep + 1) % 64;
    }
  }

  return {
    init: init,
    setMuted: setMuted,
    isMuted: isMuted,
    toggleMute: toggleMute,
    playJump: playJump,
    playSlide: playSlide,
    playDash: playDash,
    playGobble: playGobble,
    playCollect: playCollect,
    playNearMiss: playNearMiss,
    playKnifeWarn: playKnifeWarn,
    playOvenSteam: playOvenSteam,
    playHit: playHit,
    playSmash: playSmash,
    playParry: playParry,
    playBounce: playBounce,
    playFrenzy: playFrenzy,
    playAchievement: playAchievement,
    playWave: playWave,
    playBonk: playBonk,
    playDoorCrash: playDoorCrash,
    playZoneUp: playZoneUp,
    playCaught: playCaught,
    playVictory: playVictory,
    startMusic: startMusic,
    stopMusic: stopMusic,
    updateMusic: updateMusic
  };
})();
