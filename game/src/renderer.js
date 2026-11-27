window.TurkeyGame = window.TurkeyGame || {};

window.TurkeyGame.Renderer = (function () {
  var CONFIG = window.TurkeyGame.CONFIG;
  var W = CONFIG.LOGICAL_WIDTH;
  var H = CONFIG.LOGICAL_HEIGHT;
  var GY = CONFIG.GROUND_Y;

  function drawRoundedRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function lerpColor(hexA, hexB, t) {
    var a = parseInt(hexA.slice(1), 16);
    var b = parseInt(hexB.slice(1), 16);
    var r1 = (a >> 16) & 255, g1 = (a >> 8) & 255, b1 = a & 255;
    var r2 = (b >> 16) & 255, g2 = (b >> 8) & 255, b2 = b & 255;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var bl = Math.round(b1 + (b2 - b1) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  function getZoneBlend(distance, gameMode) {
    var zones = CONFIG.ZONES;
    var idx = 0;
    for (var i = 0; i < zones.length; i++) {
      if (distance >= zones[i].startDist && distance < zones[i].endDist) {
        idx = i;
        break;
      }
      if (i === zones.length - 1) idx = i;
    }
    if (gameMode === "escape" && idx >= 3) {
      idx = 2;
    }
    var current = zones[idx];
    var nextIdx = gameMode === "escape" ? Math.min(idx + 1, 2) : Math.min(idx + 1, zones.length - 1);
    var next = zones[nextIdx];
    var blend = 0;
    if (isFinite(current.endDist) && nextIdx !== idx && distance > current.endDist - 35) {
      blend = Math.min(1, Math.max(0, (distance - (current.endDist - 35)) / 35));
    }
    return { idx: idx, current: current, next: next, blend: blend };
  }

  function drawBackground(ctx, state) {
    var zb = getZoneBlend(state.distance, state.gameMode);
    var skyTop = lerpColor(zb.current.skyTop, zb.next.skyTop, zb.blend);
    var skyBot = lerpColor(zb.current.skyBottom, zb.next.skyBottom, zb.blend);

    var grad = ctx.createLinearGradient(0, 0, 0, GY);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, GY);

    var scroll = state.worldScroll;

    // Zone-specific atmospheric backdrop & parallax
    if (zb.idx === 0) {
      drawKitchenBackdrop(ctx, scroll, state.time);
    } else if (zb.idx === 1) {
      drawBarnBackdrop(ctx, scroll, state.time);
    } else {
      drawWoodsBackdrop(ctx, scroll, state.time, zb.idx === 3);
    }

    // Ground plane
    drawGround(ctx, scroll, zb);
  }

  function drawKitchenBackdrop(ctx, scroll, time) {
    // Wainscoting & warm kitchen wall panels
    ctx.fillStyle = "rgba(56, 24, 12, 0.35)";
    ctx.fillRect(0, 320, W, GY - 320);

    // Subtle vertical wallpaper stripes
    ctx.fillStyle = "rgba(255, 224, 178, 0.045)";
    var stripeOff = (scroll * 0.14) % 90;
    for (var sx = -stripeOff; sx < W; sx += 90) {
      ctx.fillRect(sx, 0, 38, 320);
    }

    // Windows showing autumn trees outside
    var winOff = (scroll * 0.22) % 440;
    for (var wx = -winOff - 120; wx < W + 200; wx += 440) {
      ctx.save();
      drawRoundedRect(ctx, wx, 118, 170, 148, 12);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#451a03";
      ctx.stroke();

      // Sunburst sky inside window
      var wg = ctx.createLinearGradient(wx, 118, wx, 266);
      wg.addColorStop(0, "#fb923c");
      wg.addColorStop(1, "#fef08a");
      ctx.fillStyle = wg;
      ctx.fillRect(wx + 5, 123, 160, 138);

      // Silhouette maple trees outside window
      ctx.fillStyle = "#78350f";
      ctx.fillRect(wx + 38, 228, 8, 34);
      ctx.fillRect(wx + 120, 218, 10, 44);
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(wx + 42, 222, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + 125, 214, 32, 0, Math.PI * 2);
      ctx.fill();

      // Window mullions
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(wx + 85, 120);
      ctx.lineTo(wx + 85, 264);
      ctx.moveTo(wx + 4, 192);
      ctx.lineTo(wx + 166, 192);
      ctx.stroke();

      // Diagonal warm sunlight shaft through window
      var rayGrad = ctx.createLinearGradient(wx + 40, 260, wx + 220, GY);
      rayGrad.addColorStop(0, "rgba(254, 240, 138, 0.12)");
      rayGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(wx + 8, 266);
      ctx.lineTo(wx + 164, 266);
      ctx.lineTo(wx + 295, GY);
      ctx.lineTo(wx + 90, GY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Hanging copper pots & kitchen shelves (mid parallax, higher rack)
    var rackOff = (scroll * 0.38) % 360;
    ctx.strokeStyle = "#291409";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(W, 52);
    ctx.stroke();

    for (var px = -rackOff - 80; px < W + 160; px += 360) {
      var swing = Math.sin(time * 2.2 + px * 0.01) * 0.05;
      // Copper skillet
      ctx.save();
      ctx.translate(px + 95, 52);
      ctx.rotate(swing);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 28);
      ctx.stroke();
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(0, 48, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(-5, 43, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Checkered bunting flags
      ctx.save();
      for (var b = 0; b < 5; b++) {
        var bx = px + 185 + b * 32;
        ctx.fillStyle = b % 2 === 0 ? "#dc2626" : "#fff7ed";
        ctx.beginPath();
        ctx.moveTo(bx, 52);
        ctx.lineTo(bx + 28, 52);
        ctx.lineTo(bx + 14, 84);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Warm string lights along upper kitchen beam
    var lightOff = (scroll * 0.32) % 240;
    for (var lx = -lightOff; lx < W + 120; lx += 240) {
      ctx.strokeStyle = "rgba(30, 15, 8, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 18);
      ctx.quadraticCurveTo(lx + 120, 44, lx + 240, 18);
      ctx.stroke();

      for (var bulb = 1; bulb <= 3; bulb++) {
        var bxL = lx + bulb * 60;
        var byL = bulb === 2 ? 32 : 27;
        ctx.fillStyle = "rgba(253, 224, 71, 0.25)";
        ctx.beginPath();
        ctx.arc(bxL, byL + 4, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(bxL, byL + 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Brick hearth & counter silhouettes in lower background
    var counterOff = (scroll * 0.5) % 520;
    for (var cx = -counterOff - 140; cx < W + 200; cx += 520) {
      ctx.fillStyle = "rgba(69, 26, 3, 0.52)";
      drawRoundedRect(ctx, cx, 360, 210, GY - 360, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
      ctx.fillRect(cx + 14, 348, 182, 16);
      // Warm fireplace arch glow inside counter bay
      ctx.fillStyle = "rgba(249, 115, 22, 0.16)";
      ctx.beginPath();
      ctx.arc(cx + 105, GY, 54, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawBarnBackdrop(ctx, scroll, time) {
    // Glowing autumn sun + drifting sunset clouds
    ctx.save();
    ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
    ctx.beginPath();
    ctx.arc(980, 145, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(980, 145, 58, 0, Math.PI * 2);
    ctx.fill();

    var clOff = (scroll * 0.08) % 520;
    ctx.fillStyle = "rgba(255, 237, 213, 0.26)";
    for (var clx = -clOff - 120; clx < W + 220; clx += 520) {
      ctx.beginPath();
      ctx.ellipse(clx + 120, 118, 66, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(clx + 155, 108, 42, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rolling distant hills
    var hillOff = (scroll * 0.12) % 640;
    ctx.fillStyle = "rgba(154, 52, 18, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, GY);
    for (var hx = -hillOff - 320; hx <= W + 320; hx += 320) {
      ctx.quadraticCurveTo(hx + 160, 390, hx + 320, 490);
    }
    ctx.lineTo(W, GY);
    ctx.closePath();
    ctx.fill();

    // Red barns & silos
    var barnOff = (scroll * 0.28) % 620;
    for (var bx = -barnOff - 220; bx < W + 260; bx += 620) {
      // Silo
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(bx + 150, 260, 56, 260);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(bx + 178, 260, 28, Math.PI, 0);
      ctx.fill();

      // Red Barn
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(bx, 320, 162, 200);
      ctx.beginPath();
      ctx.moveTo(bx - 12, 324);
      ctx.lineTo(bx + 81, 245);
      ctx.lineTo(bx + 174, 324);
      ctx.closePath();
      ctx.fillStyle = "#7f1d1d";
      ctx.fill();

      // White X barn door
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 5;
      ctx.strokeRect(bx + 44, 385, 74, 130);
      ctx.beginPath();
      ctx.moveTo(bx + 44, 385);
      ctx.lineTo(bx + 118, 515);
      ctx.moveTo(bx + 118, 385);
      ctx.lineTo(bx + 44, 515);
      ctx.stroke();
    }

    // Hay bales & split-rail fence (mid layer)
    var fenceOff = (scroll * 0.5) % 180;
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, GY - 74, W, 9);
    ctx.fillRect(0, GY - 42, W, 9);
    for (var fx = -fenceOff; fx < W + 80; fx += 180) {
      ctx.fillStyle = "#5c290b";
      ctx.fillRect(fx, GY - 92, 16, 92);

      // Golden hay bale every 360px
      if (Math.floor((fx + fenceOff) / 180) % 2 === 0) {
        ctx.fillStyle = "#eab308";
        drawRoundedRect(ctx, fx + 45, GY - 62, 74, 62, 10);
        ctx.fill();
        ctx.strokeStyle = "#a16207";
        ctx.lineWidth = 3;
        ctx.strokeRect(fx + 59, GY - 62, 46, 62);
      }
    }

    // Windmill silhouette spinning gently
    var wmOff = (scroll * 0.2) % 900;
    for (var wx = -wmOff + 420; wx < W + 200; wx += 900) {
      ctx.save();
      ctx.translate(wx, 250);
      ctx.strokeStyle = "rgba(67, 20, 7, 0.5)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-22, 260);
      ctx.lineTo(0, 0);
      ctx.lineTo(22, 260);
      ctx.stroke();
      ctx.rotate(time * 1.1);
      for (var b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = "rgba(255, 246, 229, 0.62)";
        ctx.fillRect(-5, 6, 10, 56);
      }
      ctx.restore();
    }
  }

  function drawWoodsBackdrop(ctx, scroll, time, isMidnight) {
    // Moon or Golden Sunset Sun
    ctx.save();
    ctx.fillStyle = isMidnight ? "rgba(254, 240, 138, 0.85)" : "rgba(253, 186, 116, 0.85)";
    ctx.beginPath();
    ctx.arc(1020, 135, isMidnight ? 44 : 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isMidnight) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      for (var s = 0; s < 22; s++) {
        var sx = (s * 173 + scroll * 0.02) % W;
        var sy = 35 + ((s * 97) % 210);
        var twinkle = 1.5 + Math.sin(time * 3 + s) * 0.9;
        ctx.beginPath();
        ctx.arc(sx, sy, twinkle, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Far pine & maple silhouettes
    var farOff = (scroll * 0.16) % 220;
    for (var tx = -farOff - 120; tx < W + 160; tx += 220) {
      ctx.fillStyle = isMidnight ? "rgba(15, 23, 42, 0.68)" : "rgba(69, 26, 3, 0.4)";
      ctx.beginPath();
      ctx.moveTo(tx, GY);
      ctx.lineTo(tx + 65, 250);
      ctx.lineTo(tx + 130, GY);
      ctx.closePath();
      ctx.fill();
    }

    // Vibrant autumn maple trees (mid layer)
    var treeOff = (scroll * 0.36) % 300;
    var canopyColors = isMidnight
      ? ["#9a3412", "#b91c1c", "#a16207"]
      : ["#ea580c", "#dc2626", "#f59e0b"];
    for (var mx = -treeOff - 150; mx < W + 200; mx += 300) {
      var ci = Math.abs(Math.floor((mx + treeOff) / 300)) % canopyColors.length;
      ctx.fillStyle = "#3f2212";
      ctx.fillRect(mx + 62, 330, 26, GY - 330);

      ctx.fillStyle = canopyColors[ci];
      ctx.beginPath();
      ctx.arc(mx + 75, 295, 68, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 34, 328, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + 116, 326, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sanctuary signposts every 700px
    var signOff = (scroll * 0.55) % 700;
    for (var gx = -signOff + 250; gx < W + 180; gx += 700) {
      ctx.fillStyle = "#451a03";
      ctx.fillRect(gx, GY - 122, 12, 122);
      ctx.fillStyle = "#fef3c7";
      drawRoundedRect(ctx, gx - 32, GY - 118, 118, 34, 6);
      ctx.fill();
      ctx.fillStyle = "#166534";
      ctx.font = "900 13px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SANCTUARY →", gx + 27, GY - 96);
    }
  }

  function drawGround(ctx, scroll, zb) {
    var topCol = lerpColor(zb.current.floorTop, zb.next.floorTop, zb.blend);
    var mainCol = lerpColor(zb.current.floorMain, zb.next.floorMain, zb.blend);
    var trimCol = lerpColor(zb.current.floorTrim, zb.next.floorTrim, zb.blend);

    ctx.fillStyle = mainCol;
    ctx.fillRect(0, GY, W, H - GY);

    ctx.fillStyle = topCol;
    ctx.fillRect(0, GY, W, 18);

    ctx.fillStyle = trimCol;
    ctx.fillRect(0, GY, W, 4);

    // Scrolling floor tiles / grass tufts / pebbles
    var step = 64;
    var off = scroll % step;
    for (var x = -off; x < W + step; x += step) {
      if (zb.idx === 0) {
        // Kitchen checkerboard grout lines
        ctx.fillStyle = "rgba(255, 246, 229, 0.14)";
        ctx.fillRect(x, GY + 18, 3, H - GY);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.fillRect(x + 3, GY + 22, 28, 30);
      } else {
        // Soil & fallen autumn grass blades
        ctx.fillStyle = "rgba(255, 237, 213, 0.18)";
        ctx.beginPath();
        ctx.ellipse(x + 18, GY + 34, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = topCol;
        ctx.beginPath();
        ctx.moveTo(x + 8, GY + 2);
        ctx.lineTo(x + 14, GY - 9);
        ctx.lineTo(x + 20, GY + 2);
        ctx.fill();
      }
    }
  }

  function drawPlatform(ctx, plat, zoneIdx) {
    ctx.save();
    if (zoneIdx === 0) {
      // Butcher-block prep table
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(plat.x + 12, plat.y + 18, 12, GY - (plat.y + 18));
      ctx.fillRect(plat.x + plat.w - 24, plat.y + 18, 12, GY - (plat.y + 18));

      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(plat.x + 14, plat.y + 18, 9, GY - (plat.y + 18));
      ctx.fillRect(plat.x + plat.w - 23, plat.y + 18, 9, GY - (plat.y + 18));

      ctx.fillStyle = "#d97706";
      drawRoundedRect(ctx, plat.x, plat.y, plat.w, 20, 6);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(plat.x + 6, plat.y + 3, plat.w - 12, 5);
    } else {
      // Rustic wooden harvest platform / wagon bed
      ctx.fillStyle = "#451a03";
      ctx.fillRect(plat.x + 18, plat.y + 18, 11, GY - (plat.y + 18));
      ctx.fillRect(plat.x + plat.w - 29, plat.y + 18, 11, GY - (plat.y + 18));

      ctx.fillStyle = "#92400e";
      drawRoundedRect(ctx, plat.x, plat.y, plat.w, 22, 6);
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(plat.x + 8, plat.y + 4, plat.w - 16, 4);
    }
    ctx.restore();
  }

  function drawOven(ctx, ob, time) {
    if (ob.smashed) {
      drawSmashedObject(ctx, ob, "#ea580c");
      return;
    }

    var x = ob.x - ob.w * 0.5;
    var y = ob.y - ob.h;
    var w = ob.w;
    var h = ob.h;

    ctx.save();
    // Heat aura behind oven
    var flicker = 0.55 + Math.sin(time * 16 + ob.id) * 0.25;
    var auraGrad = ctx.createRadialGradient(ob.x, y + h * 0.5, 8, ob.x, y + h * 0.5, w * 0.9);
    auraGrad.addColorStop(0, "rgba(249, 115, 22, " + (0.35 * flicker) + ")");
    auraGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = auraGrad;
    ctx.fillRect(x - 24, y - 40, w + 48, h + 40);

    // Shadow on floor
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(ob.x, GY + 3, w * 0.48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Oven chassis
    ctx.fillStyle = ob.variant === "steam" ? "#7f1d1d" : "#334155";
    drawRoundedRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // Stovetop burners & control panel
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 4, y + 4, w - 8, 15);
    // Burner coils on top
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x + 12, y - 4, 18, 5);
    ctx.fillRect(x + w - 30, y - 4, 18, 5);

    // Dials
    ctx.fillStyle = "#fde047";
    for (var d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(x + 14 + d * ((w - 28) / 2), y + 11, 3.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing oven window
    var doorY = y + 24;
    var doorH = h - 32;
    drawRoundedRect(ctx, x + 9, doorY, w - 18, doorH, 5);
    var fireGrad = ctx.createLinearGradient(0, doorY, 0, doorY + doorH);
    fireGrad.addColorStop(0, "#fbbf24");
    fireGrad.addColorStop(0.55, "#f97316");
    fireGrad.addColorStop(1, "#991b1b");
    ctx.fillStyle = fireGrad;
    ctx.fill();

    // Animated dancing flames inside glass
    ctx.fillStyle = "#fef08a";
    for (var f = 0; f < 3; f++) {
      var fx = x + 17 + f * ((w - 34) / 2);
      var fh = 10 + Math.sin(time * 18 + f * 2 + ob.id) * 5;
      ctx.beginPath();
      ctx.moveTo(fx - 6, doorY + doorH - 3);
      ctx.quadraticCurveTo(fx, doorY + doorH - 12 - fh, fx + 6, doorY + doorH - 3);
      ctx.fill();
    }

    // Chrome oven door handle + 450°F roast glow strip
    ctx.fillStyle = "#e2e8f0";
    drawRoundedRect(ctx, x + 12, doorY + 4, w - 24, 5, 2);
    ctx.fill();

    ctx.fillStyle = "rgba(251, 146, 60, 0.25)";
    ctx.beginPath();
    ctx.ellipse(ob.x, GY + 2, w * 0.52, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Steam hazard plume when active on steam ovens
    if (ob.variant === "steam" && ob.steamActive) {
      var steamGrad = ctx.createLinearGradient(0, y - 34, 0, y);
      steamGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      steamGrad.addColorStop(1, "rgba(253, 186, 116, 0.85)");
      ctx.fillStyle = steamGrad;
      ctx.beginPath();
      ctx.moveTo(x + 12, y);
      ctx.lineTo(x + 4, y - 34);
      ctx.lineTo(x + w - 4, y - 34);
      ctx.lineTo(x + w - 12, y);
      ctx.closePath();
      ctx.fill();
    } else if (ob.variant === "steam" && ob.steamWarn) {
      ctx.fillStyle = "rgba(254, 240, 138, " + (0.4 + 0.4 * Math.sin(time * 24)) + ")";
      ctx.font = "900 16px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("STEAM!", ob.x, y - 10);
    }

    ctx.restore();
  }

  function drawKnife(ctx, ob, time) {
    if (ob.smashed) {
      drawSmashedObject(ctx, ob, "#e2e8f0");
      return;
    }

    // Hanging butcher rack beam for hanging knives
    if (ob.variant === "hanging") {
      ctx.save();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ob.x, 0);
      ctx.lineTo(ob.x, ob.y - 22);
      ctx.stroke();

      // Twine knot
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(ob.x, ob.y - 22, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.rotate(ob.angle || 0);

    // Dramatic slash trail behind airborne knives
    if (!ob.planted && ob.variant !== "hanging") {
      ctx.strokeStyle = ob.deflected ? "rgba(253, 224, 71, 0.55)" : "rgba(254, 202, 202, 0.42)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, -4);
      ctx.lineTo(54, -8);
      ctx.moveTo(18, 4);
      ctx.lineTo(48, 8);
      ctx.stroke();
    }

    // Subtle motion smear ring for spinning knives
    if (Math.abs(ob.spin || 0) > 0.1) {
      ctx.strokeStyle = "rgba(248, 250, 252, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 1.4);
      ctx.stroke();
    }

    // Blade pointing left (danger direction)
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(-36, 2);
    ctx.quadraticCurveTo(-20, -12, 12, -9);
    ctx.lineTo(12, 7);
    ctx.lineTo(-26, 7);
    ctx.closePath();
    ctx.fill();

    // Razor edge highlight
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(-35, 2);
    ctx.quadraticCurveTo(-18, -8, 10, -7);
    ctx.lineTo(10, -3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Bolster
    ctx.fillStyle = "#64748b";
    ctx.fillRect(10, -8, 5, 16);

    // Wooden handle
    ctx.fillStyle = "#7c2d12";
    drawRoundedRect(ctx, 15, -6, 23, 12, 4);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brass rivets
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(22, 0, 2, 0, Math.PI * 2);
    ctx.arc(31, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Gleam sparkle
    var glint = 0.4 + 0.6 * Math.abs(Math.sin(time * 9 + ob.id));
    ctx.fillStyle = "rgba(255, 255, 255, " + glint + ")";
    ctx.beginPath();
    ctx.arc(-18, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawKnifeWarnings(ctx, obstacles, time) {
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      if (ob.kind !== "knife" || ob.smashed) continue;
      if (ob.x > W - 20 && ob.x < W + 420 && ob.variant !== "farmerLob" && ob.variant !== "hanging") {
        var pulse = 0.55 + 0.45 * Math.sin(time * 24);
        ctx.save();
        // Dashed lane preview
        ctx.strokeStyle = "rgba(239, 68, 68, " + (0.35 * pulse) + ")";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(W - 36, ob.y);
        ctx.lineTo(W - 220, ob.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Warning badge on right edge
        ctx.fillStyle = "rgba(220, 38, 38, " + (0.85 * pulse) + ")";
        ctx.beginPath();
        ctx.arc(W - 28, ob.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 18px 'Trebuchet MS', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", W - 28, ob.y + 1);
        ctx.restore();
      }
    }
  }

  function drawSmashedObject(ctx, ob, color) {
    ctx.save();
    ctx.translate(ob.x, ob.y - ob.h * 0.5);
    ctx.rotate(ob.smashRot || 0);
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = color;
    ctx.fillRect(-ob.w * 0.35, -ob.h * 0.35, ob.w * 0.7, ob.h * 0.7);
    ctx.restore();
  }

  function drawCollectible(ctx, item, time) {
    if (item.collected) return;
    var bob = Math.sin(time * 5.2 + item.phase) * 5;
    var x = item.x;
    var y = item.baseY + bob;

    ctx.save();
    ctx.translate(x, y);

    // Warm collectible halo
    var haloColor =
      item.kind === "chili" ? "rgba(239, 68, 68, 0.34)" :
      item.kind === "wishbone" ? "rgba(74, 222, 128, 0.36)" :
      item.kind === "berry" ? "rgba(244, 63, 94, 0.3)" :
      "rgba(250, 204, 21, 0.3)";
    ctx.fillStyle = haloColor;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    if (item.kind === "corn") {
      ctx.rotate(-0.35);
      // Husk leaves
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.ellipse(-6, 4, 6, 13, -0.4, 0, Math.PI * 2);
      ctx.ellipse(6, 4, 6, 13, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Golden cob
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(0, -2, 8, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (item.kind === "berry") {
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.arc(-5, 3, 8, 0, Math.PI * 2);
      ctx.arc(5, 3, 8, 0, Math.PI * 2);
      ctx.arc(0, -4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fda4af";
      ctx.beginPath();
      ctx.arc(-2, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-2, -14, 4, 6);
    } else if (item.kind === "chili") {
      ctx.rotate(0.25 + Math.sin(time * 8) * 0.12);
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.quadraticCurveTo(14, -4, 10, 15);
      ctx.quadraticCurveTo(-4, 10, -8, -10);
      ctx.fill();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#15803d";
      ctx.fillRect(-10, -15, 5, 7);
    } else if (item.kind === "wishbone") {
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.quadraticCurveTo(-8, -6, 0, -11);
      ctx.quadraticCurveTo(8, -6, 10, 12);
      ctx.stroke();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(0, -12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSkillet(ctx, ob, time) {
    if (ob.smashed) {
      drawSmashedObject(ctx, ob, "#334155");
      return;
    }
    ctx.save();
    ctx.translate(ob.x, ob.y);

    // Sizzling flame trail behind sliding cast-iron pan
    ctx.fillStyle = "rgba(249, 115, 22, " + (0.5 + 0.3 * Math.sin(time * 24)) + ")";
    ctx.beginPath();
    ctx.ellipse(26, -10, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pan handle pointing right
    ctx.fillStyle = "#1e293b";
    drawRoundedRect(ctx, 18, -22, 34, 8, 3);
    ctx.fill();

    // Cast-iron pan body
    ctx.fillStyle = "#0f172a";
    drawRoundedRect(ctx, -32, -26, 56, 26, 7);
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sizzling butter gleam inside rim
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-26, -28, 44, 4);
    ctx.restore();
  }

  function drawPumpkin(ctx, pmp, time) {
    ctx.save();
    ctx.translate(pmp.x, pmp.y);
    var squash = pmp.bounceTimer > 0 ? 1 + Math.sin((pmp.bounceTimer / 0.25) * Math.PI) * 0.35 : 1;
    ctx.scale(squash, 2 - squash);

    // Golden bounce aura
    ctx.fillStyle = "rgba(250, 204, 21, " + (0.22 + 0.1 * Math.sin(time * 7 + pmp.id)) + ")";
    ctx.beginPath();
    ctx.ellipse(0, -22, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillStyle = "#15803d";
    drawRoundedRect(ctx, -5, -49, 10, 14, 3);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ribbed orange pumpkin lobes with cel-shaded outline
    ctx.fillStyle = "#c2410c";
    ctx.beginPath();
    ctx.ellipse(-12, -20, 14, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(12, -20, 14, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.ellipse(0, -20, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Highlight & upward bounce chevron
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(-7, -25);
    ctx.lineTo(7, -25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(ctx, farmer, time) {
    var x = farmer.x;
    var y = farmer.y;
    var cycle = farmer.runCycle;
    var bob = farmer.tripped ? 12 : Math.abs(Math.sin(cycle)) * 6;

    ctx.save();
    ctx.translate(x, y);

    if (farmer.frenzyActive && !farmer.tripped) {
      ctx.fillStyle = "rgba(239, 68, 68, " + (0.28 + 0.14 * Math.sin(time * 18)) + ")";
      ctx.beginPath();
      ctx.ellipse(0, -52, 46, 56, 0, 0, Math.PI * 2);
      ctx.fill();

      // Speeding Harvest Wheelbarrow beneath Farmer!
      ctx.save();
      ctx.fillStyle = "#991b1b";
      drawRoundedRect(ctx, -34, -36, 68, 22, 6);
      ctx.fill();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.translate(24, -13);
      ctx.rotate(time * 18);
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(11, 0);
      ctx.moveTo(0, -11);
      ctx.lineTo(0, 11);
      ctx.stroke();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (farmer.tripped) {
      ctx.rotate(-0.9);
      ctx.translate(-15, -18);
    }

    var legSwing = Math.sin(cycle) * 18;

    // Back leg
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, -28 - bob * 0.5);
    ctx.lineTo(-10 - legSwing * 0.7, -6);
    ctx.stroke();
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-18 - legSwing * 0.7, -9, 17, 9);

    // Front leg
    ctx.beginPath();
    ctx.moveTo(8, -28 - bob * 0.5);
    ctx.lineTo(10 + legSwing * 0.7, -6);
    ctx.stroke();
    ctx.fillStyle = "#451a03";
    ctx.fillRect(2 + legSwing * 0.7, -9, 17, 9);

    // Torso (red plaid + denim overalls)
    ctx.save();
    ctx.translate(0, -48 - bob);
    ctx.rotate(0.14);

    // Red flannel shirt + ink outline
    ctx.fillStyle = "#dc2626";
    drawRoundedRect(ctx, -20, -24, 42, 46, 12);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // Denim overalls
    ctx.fillStyle = "#1d4ed8";
    drawRoundedRect(ctx, -18, -4, 38, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-14, -20, 8, 18);
    ctx.fillRect(6, -20, 8, 18);
    // Brass buttons
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-10, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(10, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(4, -38, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Bushy mustache & angry eyebrows
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.ellipse(12, -33, 9, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(11, -41, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, -46);
    ctx.lineTo(16, -43);
    ctx.stroke();

    // Straw farm hat
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.ellipse(2, -50, 26, 6, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawRoundedRect(ctx, -10, -64, 24, 15, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(-10, -54, 24, 4);

    // Arm wielding roasting pan / carving fork (or winding up to throw!)
    var armAngle = farmer.windupTimer > 0
      ? -1.4 - Math.sin(time * 24) * 0.25
      : -0.25 + Math.sin(cycle + 1) * 0.35;
    ctx.save();
    ctx.translate(14, -14);
    ctx.rotate(armAngle);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(24, -6);
    ctx.stroke();

    // Carving fork or windup knife
    if (farmer.windupTimer > 0) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(22, -26, 7, 22);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(23, -6, 5, 10);
    } else {
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.lineTo(44, -12);
      ctx.moveTo(44, -17);
      ctx.lineTo(52, -19);
      ctx.moveTo(44, -9);
      ctx.lineTo(52, -10);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();

    // Comic speech bubble
    if (farmer.speechTimer > 0 && farmer.speechText) {
      ctx.save();
      ctx.font = "900 13px 'Trebuchet MS', sans-serif";
      var tw = ctx.measureText(farmer.speechText).width + 20;
      drawRoundedRect(ctx, -tw * 0.5 + 16, -148, tw, 26, 9);
      ctx.fillStyle = "#fffaf0";
      ctx.fill();
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#991b1b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(farmer.speechText, 16, -135);
      ctx.restore();
    }

    // Dizzy stars when bonked by a deflected knife!
    if (farmer.bonkedTimer > 0) {
      for (var st = 0; st < 3; st++) {
        var ang = time * 8 + st * (Math.PI * 2 / 3);
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 20, -115 + Math.sin(ang) * 6, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function getSkin(skinId) {
    var skins = CONFIG.SKINS;
    for (var i = 0; i < skins.length; i++) {
      if (skins[i].id === skinId) return skins[i];
    }
    return skins[0];
  }

  function drawTurkeyHat(ctx, hatType) {
    if (hatType === "pilgrim") {
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(17, -28, 17, 4.5, 0.08, 0, Math.PI * 2);
      ctx.fill();
      drawRoundedRect(ctx, 7, -45, 20, 17, 3);
      ctx.fill();
      ctx.fillStyle = "#b45309";
      ctx.fillRect(7, -33, 20, 4);
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.strokeRect(14, -34, 6, 6);
    } else if (hatType === "chef") {
      ctx.fillStyle = "#f8fafc";
      drawRoundedRect(ctx, 8, -36, 18, 9, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(13, -40, 8, 0, Math.PI * 2);
      ctx.arc(21, -40, 8, 0, Math.PI * 2);
      ctx.arc(17, -44, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (hatType === "crown") {
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(8, -27);
      ctx.lineTo(10, -40);
      ctx.lineTo(14, -33);
      ctx.lineTo(18, -43);
      ctx.lineTo(22, -33);
      ctx.lineTo(26, -40);
      ctx.lineTo(27, -27);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(18, -31, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTurkey(ctx, p, time, skinId) {
    var skin = getSkin(skinId);
    var invulnBlink = p.invulnTimer > 0 && Math.floor(time * 20) % 2 === 0;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Ground shadow
    var shadowScale = Math.max(0.42, 1 - (GY - p.y) / 260);
    ctx.fillStyle = "rgba(0, 0, 0, " + (0.3 * shadowScale) + ")";
    ctx.beginPath();
    ctx.ellipse(0, GY - p.y + 3, 28 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chili / Dash aura
    if (p.chiliTimer > 0 || p.dashTimer > 0) {
      ctx.save();
      var auraCol = p.chiliTimer > 0 ? "rgba(239, 68, 68, 0.38)" : "rgba(56, 189, 248, 0.35)";
      ctx.fillStyle = auraCol;
      ctx.beginPath();
      ctx.ellipse(-8, -32, 46, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (invulnBlink) ctx.globalAlpha = 0.45;

    ctx.scale(p.squashX, p.squashY);

    if (p.sliding) {
      ctx.translate(0, -16);
      ctx.rotate(0.24);
    } else {
      var runBob = p.grounded ? Math.abs(Math.sin(p.runCycle)) * 4 : 0;
      ctx.translate(0, -30 - runBob);
      if (p.dashTimer > 0) ctx.rotate(0.18);
    }

    // Tail feather fan (5 articulated colorful feathers)
    var tailColors = skin.tail;
    var spread = p.gliding ? 0.28 : 0.21;
    for (var f = 0; f < 5; f++) {
      var angle = -1.9 + (f - 2) * spread + Math.sin(time * 12 + f) * 0.04;
      ctx.save();
      ctx.translate(-14, 0);
      ctx.rotate(angle);
      ctx.fillStyle = tailColors[f];
      ctx.beginPath();
      ctx.ellipse(0, -18, 8, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.ellipse(0, -32, 5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Running legs (when not sliding)
    if (!p.sliding) {
      var legA = p.grounded ? Math.sin(p.runCycle) * 14 : -10;
      var legB = p.grounded ? -Math.sin(p.runCycle) * 14 : 8;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, 14);
      ctx.lineTo(-4 + legA, 29);
      ctx.moveTo(6, 14);
      ctx.lineTo(6 + legB, 29);
      ctx.stroke();
    }

    // Plump turkey body with cel-shaded ink outline
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.ellipse(0, 2, 23, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = skin.chest;
    ctx.beginPath();
    ctx.ellipse(4, 3, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flapping wing
    ctx.save();
    ctx.translate(-2, 0);
    ctx.rotate(p.wingAngle);
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 14, 9, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Neck & head with cel-shaded outline
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.ellipse(16, -15, 11, 13, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#291207";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Head highlight
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.arc(17, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Red snood & wattle (wobbles!)
    var wobble = Math.sin(time * 20) * 2;
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.ellipse(24, -10 + wobble * 0.4, 4.5, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(24, -24 + wobble * 0.3, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(24, -20);
    ctx.lineTo(35, -17);
    ctx.lineTo(24, -14);
    ctx.closePath();
    ctx.fill();

    // Expressive eye (widens in panic or narrows during dash!)
    ctx.fillStyle = "#ffffff";
    var eyeR = 5.4 + p.panicLevel * 1.4;
    ctx.beginPath();
    ctx.arc(19, -20, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(20.5, -20, 2.7, 0, Math.PI * 2);
    ctx.fill();

    // Determined / panicked eyebrow
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (p.chiliTimer > 0 || p.dashTimer > 0) {
      ctx.moveTo(14, -26);
      ctx.lineTo(24, -23);
    } else if (p.panicLevel > 0.55) {
      ctx.moveTo(14, -25);
      ctx.lineTo(22, -28);
    }
    ctx.stroke();

    // Costume hat
    drawTurkeyHat(ctx, skin.hat);

    // Sweat drop when Farmer is dangerously close
    if (p.panicLevel > 0.62 && p.dashTimer <= 0) {
      var dropY = -28 + ((time * 28) % 10);
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(5, dropY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Playful Gobble bubble
    if (p.gobbleTimer > 0) {
      ctx.save();
      ctx.font = "900 13px 'Trebuchet MS', sans-serif";
      drawRoundedRect(ctx, p.x + 12, p.y - 98, 76, 24, 9);
      ctx.fillStyle = "#fef08a";
      ctx.fill();
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#7c2d12";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GOBBLE!", p.x + 50, p.y - 86);
      ctx.restore();
    }

    // Diegetic subtle cooldown arcs below Tom's feet during play
    if (p.dashCooldown > 0 || p.waveCooldown > 0) {
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      if (p.dashCooldown > 0) {
        var dp = Math.max(0, 1 - p.dashCooldown / CONFIG.PLAYER.DASH_COOLDOWN);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4, 34, Math.PI * 0.12, Math.PI * (0.12 + dp * 0.36));
        ctx.stroke();
      }
      if (p.waveCooldown > 0) {
        var wp = Math.max(0, 1 - p.waveCooldown / CONFIG.PLAYER.WAVE_COOLDOWN);
        ctx.strokeStyle = "rgba(250, 204, 21, 0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y + 4, 34, Math.PI * 0.52, Math.PI * (0.52 + wp * 0.36));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawCaughtTrap(ctx, p, time) {
    // Silver Thanksgiving Platter Dome slammed down over Tom when CAUGHT!
    ctx.save();
    ctx.translate(p.x, GY);

    // Tail feathers peeking awkwardly out of the left side of the dome
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.ellipse(-42, -10, 11, 5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(-40, -16, 10, 4.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Platter rim
    ctx.fillStyle = "#94a3b8";
    drawRoundedRect(ctx, -46, -8, 92, 10, 5);
    ctx.fill();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Gleaming Silver Cloche Dome
    var domeGrad = ctx.createLinearGradient(-38, -56, 38, -6);
    domeGrad.addColorStop(0, "#f8fafc");
    domeGrad.addColorStop(0.5, "#cbd5e1");
    domeGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, -6, 40, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Dome knob
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(0, -50, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dizzy stars orbiting above the captured dome
    for (var s = 0; s < 3; s++) {
      var ang = time * 5.5 + s * ((Math.PI * 2) / 3);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 24, -66 + Math.sin(ang) * 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGoalGate(ctx, gateX, time) {
    if (gateX > W + 160 || gateX < -160) return;
    ctx.save();
    // Wooden Sanctuary Archway
    ctx.fillStyle = "#451a03";
    ctx.fillRect(gateX - 10, GY - 250, 22, 250);
    ctx.fillRect(gateX + 120, GY - 250, 22, 250);

    // Overhead banner sign
    ctx.fillStyle = "#166534";
    drawRoundedRect(ctx, gateX - 28, GY - 270, 190, 56, 12);
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#fef9c3";
    ctx.font = "900 18px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TURKEY SANCTUARY", gateX + 67, GY - 244);
    ctx.fillStyle = "#86efac";
    ctx.font = "800 12px 'Trebuchet MS', sans-serif";
    ctx.fillText("★ SAFE HAVEN 1,000m ★", gateX + 67, GY - 225);

    // Checkered finish ribbon
    var wave = Math.sin(time * 9) * 5;
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(gateX + 12, GY - 92 + wave * 0.4, 108, 12);
    ctx.restore();
  }

  function drawCloche(ctx, cloche) {
    if (!cloche || cloche.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, cloche.life * 2);
    ctx.translate(cloche.x, cloche.y);
    ctx.rotate(cloche.rot);

    // Gleaming silver Thanksgiving platter dome
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(0, 0, 38, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(0, -40, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPointerReticle(ctx, state) {
    var pointer = state.pointer;
    if (!pointer || !pointer.active) return;

    var lockedKnife = null;
    var obstacles = state.obstacles || [];
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      if (ob.kind === "knife" && !ob.smashed && !ob.deflected && ob.x < W - 20) {
        if (Math.hypot(ob.x - pointer.x, ob.y - pointer.y) < 95) {
          lockedKnife = ob;
          break;
        }
      }
    }

    ctx.save();
    ctx.translate(pointer.x, pointer.y);
    ctx.save();
    ctx.rotate(state.time * (lockedKnife ? 4.4 : 2.2));
    ctx.strokeStyle = lockedKnife ? "#4ade80" : "rgba(253, 224, 71, 0.55)";
    ctx.lineWidth = lockedKnife ? 2.6 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, lockedKnife ? 18 : 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = lockedKnife ? "#4ade80" : "rgba(253, 224, 71, 0.8)";
    ctx.beginPath();
    ctx.arc(0, 0, lockedKnife ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (lockedKnife) {
      ctx.font = "900 10px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.textAlign = "center";
      ctx.fillText("WAVE LOCK", 0, -24);
    }
    ctx.restore();
  }

  function render(ctx, state) {
    ctx.save();

    // Dynamic camera zoom centered slightly ahead of Tom
    var zoom = state.cameraZoom || 1;
    if (Math.abs(zoom - 1) > 0.001) {
      ctx.translate(W * 0.35, GY * 0.72);
      ctx.scale(zoom, zoom);
      ctx.translate(-W * 0.35, -GY * 0.72);
    }

    // Screen shake
    if (state.shakeTime > 0) {
      var mag = state.shakeMag * (state.shakeTime / 0.25);
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    drawBackground(ctx, state);

    var zb = getZoneBlend(state.distance, state.gameMode);
    var i;

    if (state.goalGateX !== null) {
      drawGoalGate(ctx, state.goalGateX, state.time);
    }

    for (i = 0; i < state.platforms.length; i++) {
      drawPlatform(ctx, state.platforms[i], zb.idx);
    }

    for (i = 0; i < state.pumpkins.length; i++) {
      drawPumpkin(ctx, state.pumpkins[i], state.time);
    }

    for (i = 0; i < state.collectibles.length; i++) {
      drawCollectible(ctx, state.collectibles[i], state.time);
    }

    for (i = 0; i < state.obstacles.length; i++) {
      var ob = state.obstacles[i];
      if (ob.kind === "oven") {
        drawOven(ctx, ob, state.time);
      } else if (ob.kind === "knife") {
        drawKnife(ctx, ob, state.time);
      } else if (ob.kind === "skillet") {
        drawSkillet(ctx, ob, state.time);
      }
    }

    if (state.modeState === "TITLE") {
      // Showcase Oven, Knife, and Corn on open left stage beside Title Card
      drawOven(ctx, { id: 99, variant: "steam", x: 505, y: GY, w: 72, h: 76, steamActive: false, steamWarn: false }, state.time);
      drawKnife(ctx, { id: 98, variant: "low", x: 465, y: GY - 148, angle: Math.sin(state.time * 3) * 0.18 - 0.15, spin: 0.4 }, state.time);
      drawCollectible(ctx, { kind: "corn", x: 375, baseY: GY - 122, phase: 0.5 }, state.time);
      drawCollectible(ctx, { kind: "berry", x: 425, baseY: GY - 142, phase: 1.4 }, state.time);
    }

    drawKnifeWarnings(ctx, state.obstacles, state.time);
    drawFarmer(ctx, state.farmer, state.time);
    if (state.modeState === "CAUGHT") {
      drawCaughtTrap(ctx, state.player, state.time);
    } else {
      drawTurkey(ctx, state.player, state.time, state.skin);
    }
    drawCloche(ctx, state.cloche);
    state.particles.draw(ctx);

    // Diegetic onboarding hint pill on first 135m
    if (state.modeState === "PLAYING" && state.hintText) {
      ctx.save();
      ctx.font = "900 14px 'Trebuchet MS', sans-serif";
      var htw = ctx.measureText(state.hintText).width + 28;
      drawRoundedRect(ctx, W * 0.5 - htw * 0.5, 118, htw, 30, 999);
      ctx.fillStyle = "rgba(24, 13, 9, 0.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = "#fef08a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.hintText, W * 0.5, 133);
      ctx.restore();
    }

    // Golden Fever rim at Combo x5+
    if (state.modeState === "PLAYING" && state.combo >= 5) {
      var fAlpha = 0.1 + 0.06 * Math.sin(state.time * 10);
      ctx.strokeStyle = "rgba(253, 224, 71, " + fAlpha + ")";
      ctx.lineWidth = 18;
      ctx.strokeRect(0, 0, W, H);
    }

    // Subtle red danger vignette when on 1 life or farmer is right on your tail
    if (state.modeState === "PLAYING" && (state.lives === 1 || state.player.panicLevel > 0.72)) {
      var pulse = 0.14 + 0.1 * Math.sin(state.time * 8);
      var vig = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.34, W * 0.5, H * 0.5, W * 0.65);
      vig.addColorStop(0, "rgba(220, 38, 38, 0)");
      vig.addColorStop(1, "rgba(220, 38, 38, " + pulse + ")");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    if (state.modeState === "PLAYING") {
      drawPointerReticle(ctx, state);
    }

    ctx.restore();
  }

  return {
    render: render,
    getZoneBlend: getZoneBlend
  };
})();
