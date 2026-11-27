window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.ParticleSystem = (function () {
  var FEATHER_COLORS = ["#d97706", "#b45309", "#dc2626", "#f59e0b", "#fef3c7"];
  var LEAF_COLORS = ["#ea580c", "#dc2626", "#eab308", "#b45309"];

  function ParticleSystem() {
    this.particles = [];
    this.popups = [];
    this.speedLines = [];
    this.afterimages = [];
    this.shockwaves = [];
  }

  ParticleSystem.prototype.clear = function () {
    this.particles.length = 0;
    this.popups.length = 0;
    this.speedLines.length = 0;
    this.afterimages.length = 0;
    this.shockwaves.length = 0;
  };

  ParticleSystem.prototype.addShockwave = function (x, y, maxRadius, color) {
    this.shockwaves.push({
      x: x,
      y: y,
      maxRadius: maxRadius || 230,
      color: color || "#fde047",
      life: 0,
      maxLife: 0.32
    });
  };

  ParticleSystem.prototype.addAfterimage = function (x, y, sliding, color) {
    this.afterimages.push({
      x: x,
      y: y,
      sliding: !!sliding,
      color: color || "#38bdf8",
      life: 0,
      maxLife: 0.22
    });
  };

  ParticleSystem.prototype.emitFeathers = function (x, y, count, speedScale) {
    var scale = speedScale || 1;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = (90 + Math.random() * 210) * scale;
      this.particles.push({
        kind: "feather",
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * spd - 60,
        vy: Math.sin(angle) * spd - 90,
        gravity: 340,
        drag: 0.96,
        size: 7 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 9,
        color: FEATHER_COLORS[Math.floor(Math.random() * FEATHER_COLORS.length)],
        life: 0,
        maxLife: 0.55 + Math.random() * 0.45
      });
    }
  };

  ParticleSystem.prototype.emitDust = function (x, y, count) {
    for (var i = 0; i < count; i++) {
      this.particles.push({
        kind: "circle",
        x: x + (Math.random() - 0.5) * 18,
        y: y - Math.random() * 6,
        vx: -80 - Math.random() * 130,
        vy: -20 - Math.random() * 75,
        gravity: 80,
        drag: 0.94,
        size: 4 + Math.random() * 6,
        color: "rgba(255, 232, 198, 0.72)",
        life: 0,
        maxLife: 0.28 + Math.random() * 0.22
      });
    }
  };

  ParticleSystem.prototype.emitSparks = function (x, y, count, color) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = 120 + Math.random() * 260;
      this.particles.push({
        kind: "spark",
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        gravity: 520,
        drag: 0.97,
        size: 3 + Math.random() * 4,
        color: color || "#fde047",
        life: 0,
        maxLife: 0.3 + Math.random() * 0.3
      });
    }
  };

  ParticleSystem.prototype.emitSteam = function (x, y, count) {
    for (var i = 0; i < count; i++) {
      this.particles.push({
        kind: "circle",
        x: x + (Math.random() - 0.5) * 26,
        y: y,
        vx: (Math.random() - 0.5) * 55 - 40,
        vy: -130 - Math.random() * 140,
        gravity: -40,
        drag: 0.96,
        size: 8 + Math.random() * 10,
        color: "rgba(255, 255, 255, 0.55)",
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35
      });
    }
  };

  ParticleSystem.prototype.emitLeaf = function (x, y) {
    this.particles.push({
      kind: "feather",
      x: x,
      y: y,
      vx: -110 - Math.random() * 140,
      vy: 45 + Math.random() * 65,
      gravity: 15,
      drag: 0.99,
      size: 6 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 4,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      life: 0,
      maxLife: 3.0
    });
  };

  ParticleSystem.prototype.emitConfetti = function (x, y, count) {
    var colors = ["#fde047", "#4ade80", "#f97316", "#f43f5e", "#38bdf8", "#ffffff"];
    for (var i = 0; i < count; i++) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      var spd = 180 + Math.random() * 380;
      this.particles.push({
        kind: "confetti",
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 480,
        drag: 0.985,
        size: 6 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 11,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 1.1 + Math.random() * 0.7
      });
    }
  };

  ParticleSystem.prototype.emitSpeedLine = function (y, color) {
    this.speedLines.push({
      x: 1300,
      y: y,
      len: 70 + Math.random() * 140,
      speed: 1100 + Math.random() * 600,
      color: color || "rgba(254, 240, 138, 0.45)",
      life: 0,
      maxLife: 0.9
    });
  };

  ParticleSystem.prototype.addPopup = function (x, y, text, color, scale) {
    var adjustedY = y;
    for (var i = 0; i < this.popups.length; i++) {
      var prev = this.popups[i];
      if (prev.life < 0.35 && Math.abs(prev.x - x) < 85 && Math.abs(prev.y - adjustedY) < 26) {
        adjustedY -= 26;
      }
    }
    this.popups.push({
      x: x,
      y: adjustedY,
      vy: -68,
      text: text,
      color: color || "#fde047",
      scale: scale || 1,
      life: 0,
      maxLife: 0.85
    });
  };

  ParticleSystem.prototype.update = function (dt, worldScrollSpeed) {
    var i;
    for (i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      var damp = Math.pow(p.drag, dt * 60);
      p.vx *= damp;
      p.vy *= damp;
      p.x += (p.vx - worldScrollSpeed * 0.25) * dt;
      p.y += p.vy * dt;
      if (p.vrot) p.rot += p.vrot * dt;
    }

    for (i = this.popups.length - 1; i >= 0; i--) {
      var pop = this.popups[i];
      pop.life += dt;
      if (pop.life >= pop.maxLife) {
        this.popups.splice(i, 1);
        continue;
      }
      pop.y += pop.vy * dt;
      pop.vy *= 0.95;
    }

    for (i = this.speedLines.length - 1; i >= 0; i--) {
      var s = this.speedLines[i];
      s.life += dt;
      s.x -= s.speed * dt;
      if (s.life >= s.maxLife || s.x + s.len < -40) {
        this.speedLines.splice(i, 1);
      }
    }

    for (i = this.afterimages.length - 1; i >= 0; i--) {
      var af = this.afterimages[i];
      af.life += dt;
      af.x -= worldScrollSpeed * 0.45 * dt;
      if (af.life >= af.maxLife) {
        this.afterimages.splice(i, 1);
      }
    }

    for (i = this.shockwaves.length - 1; i >= 0; i--) {
      var sw = this.shockwaves[i];
      sw.life += dt;
      if (sw.life >= sw.maxLife) {
        this.shockwaves.splice(i, 1);
      }
    }
  };

  ParticleSystem.prototype.draw = function (ctx) {
    var i;
    for (i = 0; i < this.shockwaves.length; i++) {
      var sw = this.shockwaves[i];
      var prog = sw.life / sw.maxLife;
      var rad = 24 + (sw.maxRadius - 24) * prog;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.78 * (1 - prog));
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(2, 9 * (1 - prog));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < this.afterimages.length; i++) {
      var af = this.afterimages[i];
      var afAlpha = Math.max(0, 0.45 * (1 - af.life / af.maxLife));
      ctx.save();
      ctx.globalAlpha = afAlpha;
      ctx.fillStyle = af.color;
      ctx.beginPath();
      ctx.ellipse(af.x, af.y - (af.sliding ? 16 : 30), af.sliding ? 26 : 22, af.sliding ? 14 : 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < this.speedLines.length; i++) {
      var s = this.speedLines[i];
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.stroke();
      ctx.restore();
    }

    for (i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      if (p.kind === "feather") {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(40, 18, 8, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.8, 0);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.stroke();
      } else if (p.kind === "confetti") {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
      } else if (p.kind === "spark") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.65 + (1 - alpha) * 0.65), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (i = 0; i < this.popups.length; i++) {
      var pop = this.popups[i];
      var t = pop.life / pop.maxLife;
      var popAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, popAlpha);
      ctx.font = "900 " + Math.round(19 * pop.scale) + "px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(22, 10, 4, 0.88)";
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }
  };

  return ParticleSystem;
})();
