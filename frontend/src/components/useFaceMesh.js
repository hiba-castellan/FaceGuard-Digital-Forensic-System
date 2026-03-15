/**
 * useFaceMesh.js
 * Premium sci-fi biometric HUD.
 * Glass panel: fully see-through with subtle cyan (authentic) or red (fake) tint.
 * No yellow/amber anywhere — scanning state uses white/dim theme color instead.
 */

import { useCallback } from 'react';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function useFaceMesh() {

  const drawMeshOnCanvas = useCallback(async (source, canvas, opts = {}) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;
    const now = Date.now();

    const isFake   = opts.isFake   || false;
    const score    = opts.score    || 0;
    const scanning = opts.scanning !== false;
    const hasResult = score > 0;

    // Color theme — cyan for authentic/scanning, red for fake. No yellow anywhere.
    const primary   = isFake ? '#ff2d6b'           : '#00d4ff';
    const dimC      = isFake ? 'rgba(255,45,107,'  : 'rgba(0,212,255,';
    const white     = 'rgba(255,255,255,';

    ctx.clearRect(0, 0, W, H);

    // ── 1. AMBIENT GLOW ───────────────────────────────────────────────────────
    const breathe = 0.08 + 0.04 * Math.sin(now / 2000);

    const centerGlow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.6);
    centerGlow.addColorStop(0,   dimC + (breathe * 0.6) + ')');
    centerGlow.addColorStop(0.5, dimC + (breathe * 0.2) + ')');
    centerGlow.addColorStop(1,   'transparent');
    ctx.fillStyle = centerGlow; ctx.fillRect(0, 0, W, H);

    const topG = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    topG.addColorStop(0, dimC + (breathe * 1.8) + ')');
    topG.addColorStop(0.5, dimC + (breathe * 0.5) + ')');
    topG.addColorStop(1, 'transparent');
    ctx.fillStyle = topG; ctx.fillRect(0, 0, W, H * 0.3);

    const botG = ctx.createLinearGradient(0, H, 0, H * 0.7);
    botG.addColorStop(0, dimC + (breathe * 1.4) + ')');
    botG.addColorStop(0.5, dimC + (breathe * 0.3) + ')');
    botG.addColorStop(1, 'transparent');
    ctx.fillStyle = botG; ctx.fillRect(0, H * 0.7, W, H * 0.3);

    if (isFake) {
      ctx.fillStyle = 'rgba(255,20,60,0.18)';
      ctx.fillRect(0, 0, W, H);
    }

    // ── 2. SCAN LINE ──────────────────────────────────────────────────────────
    const scanY = ((now % 5000) / 5000) * (H + 160) - 80;
    const sg    = ctx.createLinearGradient(0, scanY - 80, 0, scanY + 80);
    sg.addColorStop(0,    'transparent');
    sg.addColorStop(0.35, dimC + '0.04)');
    sg.addColorStop(0.5,  dimC + (isFake ? '0.30' : '0.22') + ')');
    sg.addColorStop(0.65, dimC + '0.04)');
    sg.addColorStop(1,    'transparent');
    ctx.fillStyle = sg; ctx.fillRect(0, scanY - 80, W, 160);

    // ── 3. FACE FRAME GEOMETRY ────────────────────────────────────────────────
    const isPortrait = H > W * 1.1;
    let fX, fY, fW, fH;
    if (isPortrait) {
      fW = W * 0.70; fH = H * 0.60; fX = (W - fW) / 2; fY = H * 0.06;
    } else {
      fW = W * 0.58; fH = H * 0.80; fX = (W - fW) / 2; fY = H * 0.06;
    }

    const pulse = 0.80 + 0.20 * Math.sin(now / 800);
    const bLen  = Math.min(fW, fH) * 0.14;
    const bLen2 = bLen * 0.45;
    const midSeg = Math.min(fW, fH) * 0.08;

    const drawCorner = (x, y, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * bLen, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * bLen);
      ctx.stroke();
      const ix = x + dx * 6; const iy = y + dy * 6;
      ctx.beginPath();
      ctx.moveTo(ix + dx * bLen2, iy); ctx.lineTo(ix, iy); ctx.lineTo(ix, iy + dy * bLen2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + dx * (bLen * 0.6), y); ctx.lineTo(x + dx * (bLen * 0.6), y + dy * 5); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + dy * (bLen * 0.6)); ctx.lineTo(x + dx * 5, y + dy * (bLen * 0.6)); ctx.stroke();
    };

    const drawMidEdge = (cx, cy, horiz) => {
      const half = midSeg * 1.5; const tick = 6;
      ctx.beginPath();
      if (horiz) {
        ctx.moveTo(cx - half, cy); ctx.lineTo(cx + half, cy);
        ctx.moveTo(cx, cy - tick); ctx.lineTo(cx, cy + tick);
      } else {
        ctx.moveTo(cx, cy - half); ctx.lineTo(cx, cy + half);
        ctx.moveTo(cx - tick, cy); ctx.lineTo(cx + tick, cy);
      }
      ctx.stroke();
    };

    // Multi-pass bloom on frame
    const passes = [
      { lw: 8,   alpha: 0.08 * pulse, blur: 20 },
      { lw: 3.5, alpha: 0.25 * pulse, blur: 10 },
      { lw: 1.5, alpha: 0.70 * pulse, blur: 6  },
      { lw: 0.7, alpha: 0.95 * pulse, blur: 2  },
    ];
    passes.forEach(({ lw, alpha, blur }) => {
      ctx.strokeStyle = isFake ? `rgba(255,45,107,${alpha})` : `rgba(0,212,255,${alpha})`;
      ctx.lineWidth = lw; ctx.shadowColor = primary; ctx.shadowBlur = blur; ctx.lineCap = 'square';
      drawCorner(fX,      fY,       1,  1);
      drawCorner(fX + fW, fY,      -1,  1);
      drawCorner(fX,      fY + fH,  1, -1);
      drawCorner(fX + fW, fY + fH, -1, -1);
      drawMidEdge(fX + fW/2, fY,        true);
      drawMidEdge(fX + fW/2, fY + fH,   true);
      drawMidEdge(fX,         fY + fH/2, false);
      drawMidEdge(fX + fW,    fY + fH/2, false);
    });

    ctx.strokeStyle = dimC + (0.08 * pulse) + ')';
    ctx.lineWidth = 0.5; ctx.shadowBlur = 0;
    ctx.strokeRect(fX, fY, fW, fH);

    // Inner diagonal bloom
    const innerGlow = ctx.createLinearGradient(fX, fY, fX + fW, fY + fH);
    innerGlow.addColorStop(0,    dimC + (0.06 * breathe * 3) + ')');
    innerGlow.addColorStop(0.35, dimC + (0.12 * breathe * 2) + ')');
    innerGlow.addColorStop(0.5,  dimC + (0.04 * breathe) + ')');
    innerGlow.addColorStop(1,    'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(fX + 1, fY + 1, fW - 2, fH - 2);

    // ── 4. CENTER CROSSHAIR ───────────────────────────────────────────────────
    const ccx   = fX + fW / 2;
    const ccy   = fY + fH * (isPortrait ? 0.38 : 0.42);
    const chLen = fW * 0.035;

    ctx.shadowColor = primary; ctx.shadowBlur = 8;
    ctx.strokeStyle = white + (0.35 * pulse) + ')';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(ccx - chLen, ccy); ctx.lineTo(ccx + chLen, ccy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ccx, ccy - chLen); ctx.lineTo(ccx, ccy + chLen); ctx.stroke();
    ctx.beginPath(); ctx.arc(ccx, ccy, 3, 0, Math.PI * 2);
    ctx.strokeStyle = dimC + (0.6 * pulse) + ')'; ctx.lineWidth = 1.2; ctx.stroke();

    // ── 5. RETICLE LINES ──────────────────────────────────────────────────────
    ctx.setLineDash([3, 10]);
    ctx.strokeStyle = white + (0.08 + 0.04 * Math.sin(now / 1300)) + ')';
    ctx.lineWidth = 0.5; ctx.shadowBlur = 0;
    [0.33, 0.5, 0.67].forEach(t => {
      const ry = fY + fH * t;
      ctx.beginPath(); ctx.moveTo(fX + fW * 0.06, ry); ctx.lineTo(fX + fW * 0.94, ry); ctx.stroke();
    });
    ctx.setLineDash([]);

    // ── 6. EXPANDING RINGS ────────────────────────────────────────────────────
    const ringT = (now % 3200) / 3200;
    const maxR  = Math.min(fW, fH) * 0.32;
    for (let i = 0; i < 3; i++) {
      const t = (easeOut(ringT) + i * 0.33) % 1;
      const rr = t * maxR;
      const ra = (1 - t) * (isFake ? 0.5 : 0.3);
      if (ra < 0.01) continue;
      ctx.beginPath(); ctx.arc(ccx, ccy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = dimC + ra + ')';
      ctx.lineWidth = 1; ctx.shadowColor = primary; ctx.shadowBlur = 10; ctx.stroke();
    }

    // ── 7. GLASSMORPHISM DATA PANEL ───────────────────────────────────────────
    const pH = fH * 0.24;
    const pW = fW * 0.84;
    const pX = fX + (fW - pW) / 2;
    const pY = fY + fH - pH - fH * 0.04;
    const pR = 8;

    // ── Glass fill: very transparent, just a hint of cyan or red tint ─────────
    ctx.save();
    roundRectPath(ctx, pX, pY, pW, pH, pR);
    ctx.clip();

    // Base — almost fully transparent, very subtle tint
    ctx.fillStyle = isFake
      ? 'rgba(255, 20, 60, 0.10)'     // barely-there red
      : 'rgba(0, 180, 255, 0.08)';    // barely-there cyan
    ctx.fillRect(pX, pY, pW, pH);

    // Top-lit glass shimmer — white highlight at top, fading to nothing
    const shimmerG = ctx.createLinearGradient(pX, pY, pX, pY + pH);
    shimmerG.addColorStop(0,   white + '0.14)');
    shimmerG.addColorStop(0.3, white + '0.05)');
    shimmerG.addColorStop(0.7, white + '0.01)');
    shimmerG.addColorStop(1,   'transparent');
    ctx.fillStyle = shimmerG;
    ctx.fillRect(pX, pY, pW, pH);

    // Diagonal light streak
    const streakG = ctx.createLinearGradient(pX, pY, pX + pW * 0.6, pY + pH);
    streakG.addColorStop(0,   white + '0.08)');
    streakG.addColorStop(0.4, white + '0.03)');
    streakG.addColorStop(1,   'transparent');
    ctx.fillStyle = streakG;
    ctx.fillRect(pX, pY, pW, pH);

    ctx.restore();

    // Panel border — multi-pass glow
    [
      { lw: 5,   alpha: 0.12, blur: 14 },
      { lw: 1.2, alpha: 0.45, blur: 6  },
      { lw: 0.5, alpha: 0.80, blur: 2  },
    ].forEach(({ lw, alpha, blur }) => {
      ctx.strokeStyle = isFake ? `rgba(255,45,107,${alpha})` : `rgba(0,212,255,${alpha})`;
      ctx.lineWidth = lw; ctx.shadowColor = primary; ctx.shadowBlur = blur;
      roundRectPath(ctx, pX, pY, pW, pH, pR);
      ctx.stroke();
    });

    // Left accent bar
    ctx.fillStyle = dimC + '0.9)';
    ctx.shadowColor = primary; ctx.shadowBlur = 8;
    ctx.fillRect(pX, pY + pH * 0.2, 2.5, pH * 0.6);

    // ── Panel text ─────────────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    const tx     = pX + 14;
    const baseFZ = Math.max(9, Math.round(pH * 0.19));
    const bigFZ  = Math.max(11, Math.round(pH * 0.27));
    const smallFZ = Math.max(8, Math.round(pH * 0.15));

    // Row 1: label — white, dim
    ctx.font      = `bold ${baseFZ}px 'Share Tech Mono', monospace`;
    ctx.fillStyle = white + '0.4)';
    ctx.fillText('BIOMETRIC  SCAN', tx, pY + pH * 0.30);

    // Row 2: status — theme color, bright
    ctx.font = `bold ${bigFZ}px 'Share Tech Mono', monospace`;
    if (!hasResult) {
      // Scanning — white pulsing, no yellow
      const scanPulse = 0.55 + 0.45 * Math.sin(now / 600);
      ctx.fillStyle = white + (0.75 * scanPulse) + ')';
      ctx.fillText('⟳  ANALYZING...', tx, pY + pH * 0.60);
    } else {
      ctx.fillStyle = isFake
        ? 'rgba(255, 80, 110, 0.98)'
        : 'rgba(0, 220, 255, 0.97)';
      ctx.fillText(
        isFake
          ? `⚠  RISK: ${Math.round(score * 100)}%`
          : `✓  AUTHENTIC  ${Math.round((1 - score) * 100)}%`,
        tx, pY + pH * 0.60
      );
    }

    // Row 3: model — dim white
    ctx.font      = `${smallFZ}px 'Share Tech Mono', monospace`;
    ctx.fillStyle = white + '0.28)';
    ctx.fillText('FACEGUARD v3.0  ·  MobileNetV2', tx, pY + pH * 0.86);

    // Status dot + ring — theme color, no yellow
    const dotPulse = 0.5 + 0.5 * Math.sin(now / 450);
    const dotX = pX + pW - 16;
    const dotY = pY + pH * 0.38;
    // Scanning: dim theme color pulsing. Result: bright theme or red.
    const dotCol = !hasResult
      ? (isFake ? `rgba(255,45,107,${0.4 + 0.3 * dotPulse})` : `rgba(0,212,255,${0.4 + 0.3 * dotPulse})`)
      : isFake
        ? `rgba(255,45,107,${dotPulse})`
        : `rgba(0,230,118,${dotPulse})`;
    ctx.beginPath(); ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = dotCol; ctx.shadowColor = dotCol; ctx.shadowBlur = 12; ctx.fill();
    ctx.beginPath(); ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = dotCol; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke();

    // ── 8. CORNER LABEL ───────────────────────────────────────────────────────
    ctx.shadowBlur  = 0;
    ctx.font        = `bold ${Math.max(8, Math.round(H * 0.017))}px 'Share Tech Mono', monospace`;
    ctx.fillStyle   = white + '0.5)';
    ctx.fillText('FACE  DETECTION', fX + 4, Math.max(fY - 5, 11));
    ctx.textAlign   = 'right';
    ctx.fillStyle   = dimC + '0.5)';
    ctx.fillText('v3.0', fX + fW - 4, Math.max(fY - 5, 11));
    ctx.textAlign   = 'left';

    // ── 9. EDGE BLOOM LINES ───────────────────────────────────────────────────
    const bbG = ctx.createLinearGradient(0, H - 2, W, H - 2);
    bbG.addColorStop(0,    'transparent');
    bbG.addColorStop(0.25, dimC + (breathe * 3) + ')');
    bbG.addColorStop(0.5,  dimC + (breathe * 4) + ')');
    bbG.addColorStop(0.75, dimC + (breathe * 3) + ')');
    bbG.addColorStop(1,    'transparent');
    ctx.fillStyle = bbG; ctx.fillRect(0, H - 5, W, 5);

    const tbG = ctx.createLinearGradient(0, 0, W, 0);
    tbG.addColorStop(0,    'transparent');
    tbG.addColorStop(0.25, dimC + (breathe * 2.5) + ')');
    tbG.addColorStop(0.5,  dimC + (breathe * 3.5) + ')');
    tbG.addColorStop(0.75, dimC + (breathe * 2.5) + ')');
    tbG.addColorStop(1,    'transparent');
    ctx.fillStyle = tbG; ctx.fillRect(0, 0, W, 4);

  }, []);

  return { drawMeshOnCanvas, ready: true };
}
