/* ============================================================
   OPERAÇÃO UZUMAKI — texturas.js
   Texturas geradas PROCEDURALMENTE em Canvas 2D (256x256, potência
   de 2, com mipmaps e repetição). Nenhuma imagem de terceiros é
   utilizada — a origem de todas as texturas é este código-fonte.
   Cada função desenha UMA textura; coordenadas UV são definidas
   na construção das geometrias (geometria.js).
   ============================================================ */
'use strict';

/* Piso metálico: 2x2 painéis com juntas, parafusos e arranhões.
   Aplicada com REPEAT 12x12 no piso de 48x48 m (cópia = 4x4 m). */
function desenhaTexPiso(ctx, s) {
  ctx.fillStyle = '#1f2833'; ctx.fillRect(0, 0, s, s);
  const P = s / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = i * P, y = j * P, v = 0.9 + rnd() * 0.22;
    ctx.fillStyle = 'rgb(' + ((40 * v) | 0) + ',' + ((50 * v) | 0) + ',' + ((63 * v) | 0) + ')';
    ctx.fillRect(x + 4, y + 4, P - 8, P - 8);
    ctx.strokeStyle = '#0d131b'; ctx.lineWidth = 6;
    ctx.strokeRect(x + 3, y + 3, P - 6, P - 6);
    ctx.fillStyle = '#5d6b7c';
    for (const [bx, by] of [[x+16,y+16],[x+P-16,y+16],[x+16,y+P-16],[x+P-16,y+P-16]]) {
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
    for (let k = 0; k < 7; k++) {
      const ax = x + rnd() * P, ay = y + rnd() * P;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.lineTo(ax + rnd() * 60 - 30, ay + rnd() * 60 - 30); ctx.stroke();
    }
  }
  for (let k = 0; k < 9; k++) {                      /* manchas de óleo */
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.arc(rnd() * s, rnd() * s, rnd() * 26 + 6, 0, 7); ctx.fill();
  }
}

/* Parede com painéis: ventilação no topo, juntas verticais,
   luzes de status e faixa de sinalização âmbar/preta na base.
   Aplicada com REPEAT 12x3 em paredes de 48x12 m (cópia = 4x4 m). */
function desenhaTexParede(ctx, s) {
  ctx.fillStyle = '#2b3441'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#232c38'; ctx.fillRect(0, 0, s, s * 0.26);         /* faixa de ventilação */
  ctx.strokeStyle = '#161d26'; ctx.lineWidth = 5;
  for (let y = 10; y < s * 0.24; y += 13) {                            /* persianas */
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(s - 10, y); ctx.stroke();
  }
  ctx.strokeRect(4, 4, s - 8, s * 0.26 - 8);
  ctx.strokeStyle = '#161d26';                                       /* juntas verticais */
  for (const x of [s * 0.5, s]) { ctx.beginPath(); ctx.moveTo(x, s*0.28); ctx.lineTo(x, s*0.74); ctx.lineWidth = 7; ctx.stroke(); }
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, s * 0.74); ctx.lineTo(s, s * 0.74); ctx.stroke();
  ctx.fillStyle = '#3787a8';                                          /* luzes de status */
  for (const x of [s*0.25, s*0.75]) ctx.fillRect(x - 5, s * 0.33, 10, 16);
  ctx.fillStyle = '#5d6b7c';                                          /* parafusos */
  for (const x of [14, s-14]) for (const y of [s*0.3, s*0.7]) {
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#c98a2e'; ctx.fillRect(0, s * 0.76, s, s * 0.24);  /* faixa de perigo */
  ctx.save(); ctx.beginPath(); ctx.rect(0, s * 0.76, s, s * 0.24); ctx.clip();
  ctx.fillStyle = '#141a22';
  const d = s * 0.24;
  for (let x = -s; x < s * 2; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, s); ctx.lineTo(x + 24, s);
    ctx.lineTo(x + 24 + d, s * 0.76); ctx.lineTo(x + d, s * 0.76);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* Caixa de manutenção: moldura, enrijecedores diagonais,
   cantoneiras, placa de identificação e faixa de chevrons. */
function desenhaTexCaixa(ctx, s) {
  ctx.fillStyle = '#9c5717'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 5; i++) ctx.fillRect(0, i * s / 5 + 6, s, s / 14);
  ctx.strokeStyle = '#5a2c0a'; ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, s - 20, s - 20);                              /* moldura */
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(18, 18); ctx.lineTo(s - 18, s - 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s - 18, 18); ctx.lineTo(18, s - 18); ctx.stroke();
  ctx.fillStyle = '#3a1d07';                                          /* faixa de chevrons */
  for (let x = 34; x < s - 40; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 24); ctx.lineTo(x + 20, 38); ctx.lineTo(x, 52);
    ctx.lineTo(x + 8, 38); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#c8b89a';                                          /* placa */
  ctx.fillRect(s * 0.28, s * 0.40, s * 0.44, s * 0.24);
  ctx.strokeStyle = '#3a1d07'; ctx.lineWidth = 3;
  ctx.strokeRect(s * 0.28, s * 0.40, s * 0.44, s * 0.24);
  ctx.fillStyle = '#241503';
  ctx.font = 'bold 40px Consolas, monospace'; ctx.textAlign = 'center';
  ctx.fillText('M-07', s / 2, s * 0.55);
  ctx.font = 'bold 15px Consolas, monospace';
  ctx.fillText('MANUTENÇÃO', s / 2, s * 0.64);
  ctx.fillStyle = '#3a1d07';                                          /* cantoneiras */
  for (const [x, y] of [[22,22],[s-22,22],[22,s-22],[s-22,s-22]]) ctx.fillRect(x-11, y-11, 22, 22);
  ctx.fillStyle = '#d9a566';
  for (const [x, y] of [[22,22],[s-22,22],[22,s-22],[s-22,s-22]]) {
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  }
}

/* Núcleo da célula de energia: bandas ciano brilhantes, separadores
   verticais e emblema hexagonal. Usada com emissão ~0.9 (brilha). */
function desenhaTexCelula(ctx, s) {
  ctx.fillStyle = '#03131c'; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(47,214,255,0.16)'; ctx.lineWidth = 3;
  for (let x = 0; x <= s; x += s / 4) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke();
  }
  ctx.shadowColor = '#2fd6ff'; ctx.shadowBlur = 14;
  for (const y of [s * 0.22, s * 0.78]) {                              /* bandas de energia */
    const g = ctx.createLinearGradient(0, y - 9, 0, y + 9);
    g.addColorStop(0, '#0a6d8f'); g.addColorStop(0.5, '#4fe3ff'); g.addColorStop(1, '#0a6d8f');
    ctx.fillStyle = g; ctx.fillRect(0, y - 8, s, 16);
  }
  ctx.shadowBlur = 0;
  for (let x = 0; x <= s; x += s / 4) {                                /* "dentes" nas bandas */
    ctx.fillStyle = '#aef4ff';
    ctx.fillRect(x - 2, s * 0.22 - 3, 7, 6); ctx.fillRect(x - 2, s * 0.78 - 3, 7, 6);
  }
  ctx.strokeStyle = '#2fd6ff'; ctx.lineWidth = 4; ctx.shadowBlur = 10;
  ctx.beginPath();                                                      /* emblema hexagonal */
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 - Math.PI / 2;
    const px = s / 2 + Math.cos(a) * 44, py = s / 2 + Math.sin(a) * 44;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#bdf6ff';
  ctx.beginPath(); ctx.arc(s / 2, s / 2, 11, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;
}

/* Vórtice do portal: anéis concêntricos violeta/ciano e raios.
   Aplicada no disco interno (transparente) e cristais das células. */
function desenhaTexEnergia(ctx, s) {
  const cx = s / 2, cy = s / 2;
  ctx.fillStyle = '#0b0620'; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(140,110,220,0.25)'; ctx.lineWidth = 2;       /* raios */
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * s * 0.48, cy + Math.sin(a) * s * 0.48); ctx.stroke();
  }
  for (let r = 10, k = 0; r < s * 0.5; r += 13, k++) {                 /* anéis */
    ctx.strokeStyle = k % 2 ? 'rgba(47,214,255,0.85)' : 'rgba(139,92,246,0.85)';
    ctx.lineWidth = 2 + (k % 3);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);           /* núcleo */
  g.addColorStop(0, '#eafcff'); g.addColorStop(0.5, '#41d8ff'); g.addColorStop(1, 'rgba(65,216,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.fill();
}

/* Casco do drone: painéis claros com juntas, ventilação,
   decal de aviso e matrícula UZUMAKI-04 (alta resposta especular). */
function desenhaTexDrone(ctx, s) {
  ctx.fillStyle = '#c3cbd4'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {            /* painéis */
    const x = i * s / 3, y = j * s / 3, v = 0.92 + rnd() * 0.16;
    ctx.fillStyle = 'rgb(' + ((195*v)|0) + ',' + ((203*v)|0) + ',' + ((212*v)|0) + ')';
    ctx.fillRect(x + 3, y + 3, s/3 - 6, s/3 - 6);
  }
  ctx.strokeStyle = '#7d8791'; ctx.lineWidth = 3;                      /* juntas */
  for (let k = 1; k < 3; k++) {
    const p = k * s / 3;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(s, p); ctx.stroke();
  }
  ctx.strokeStyle = '#39424c'; ctx.lineWidth = 3;                      /* ventilação */
  for (let y = s*0.08; y < s*0.28; y += 9) {
    ctx.beginPath(); ctx.moveTo(s*0.08, y); ctx.lineTo(s*0.28, y); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(s*0.72, s*0.08); ctx.lineTo(s*0.28, s*0.30);  /* faixa diagonal */
  ctx.strokeStyle = '#d98f3d'; ctx.lineWidth = 10; ctx.stroke();
  ctx.fillStyle = '#242c35'; ctx.font = 'bold 26px Consolas, monospace';
  ctx.textAlign = 'center'; ctx.fillText('UZUMAKI-04', s / 2, s * 0.62);
  ctx.font = 'bold 17px Consolas, monospace'; ctx.fillText('KEPLER-7 · MANUTENÇÃO', s / 2, s * 0.72);
  ctx.fillStyle = '#e8a33d';                                          /* decal de aviso */
  ctx.beginPath(); ctx.moveTo(s*0.72, s*0.40); ctx.lineTo(s*0.80, s*0.54); ctx.lineTo(s*0.64, s*0.54);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#242c35'; ctx.font = 'bold 15px Consolas, monospace';
  ctx.fillText('!', s*0.72, s*0.52);
  ctx.fillStyle = '#6d7883';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    ctx.beginPath(); ctx.arc(i*s/3+10, j*s/3+10, 2.5, 0, 7); ctx.fill();
  }
}

/* Textura branca 1x1: usada para linhas e superfícies com cor chapada. */
function desenhaTexBranca(ctx, s) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s); }

/* instancia todas as texturas */
const TEX = {
  piso:    texturaDeCanvas(desenhaTexPiso),
  parede:  texturaDeCanvas(desenhaTexParede),
  caixa:   texturaDeCanvas(desenhaTexCaixa),
  celula:  texturaDeCanvas(desenhaTexCelula),
  energia: texturaDeCanvas(desenhaTexEnergia),
  drone:   texturaDeCanvas(desenhaTexDrone),
  branca:  texturaDeCanvas(desenhaTexBranca, 4),
};
