/* ============================================================
   OPERAÇÃO UZUMAKI — jogo.js
   Estado da missão, entrada, simulação com dt, animações,
   câmera, renderização e HUD.

   PIPELINE DE RENDERIZAÇÃO (por objeto):
     coordenadas locais --uModel--> mundo --uView--> câmera
     --uProj--> recorte/perspectiva --> tela (com teste de profundidade)
   ============================================================ */
'use strict';

/* ---------- parâmetros ajustáveis (demonstração em aula) ---------- */
const PARAMS = {
  velMax: 7.2,             // m/s
  turbo: 1.6,
  giro: 2.7,               // rad/s
  raioDrone: 0.85,         // m (colisão)
  luzPos: [0, 9.3, 0],
  luzCor: [1.0, 0.95, 0.85],
};

/* ---------- estado ---------- */
const S = {
  modo: 'menu',            // menu | jogando | concluida | encerrado
  timer: 0,
  celulas: 0,
  luzOn: true,
};

const drone = {
  pos: [-17.5, 1.55, 17.5],
  yaw: Math.PI * 0.75,     // virado para o centro da sala
  velF: 0, velL: 0,        // velocidade frontal/lateral (m/s)
  bank: 0, pitch: 0,
  propVel: 8, propAng: [0, 0, 0, 0],
  bobT: 0, flash: 0, coolCol: 0,
};

const celulas = CELULAS_POS.map(([x, z], i) => ({
  x, z, baseY: 1.35, fase: i * 1.7,
  estado: 'viva', animT: 0, yColeta: 0,
}));
const celMats = celulas.map(() => ({
  nucleo: { ...MAT.nucleo }, cristal: { ...MAT.cristal }, anel: { ...MAT.anelCel },
}));
const feixesMats = CELULAS_POS.map(() => ({ ...MAT.feixeDia }));

const portal = {
  aberto: false, animT: 0,
  giroAnel: 0, velAnel: 0.45, giroDisco: 0, velDisco: 0.35,
  discoEscala: 0.12, discoAlfa: 0.22, feixeH: 0,
};
const matCorpoDrone = { ...MAT.drone };
const matPonta = { tex: TEX.branca, tint: [1.7, 0.35, 0.28], emissive: 1, ambient: 0.05 };
const matLuzDrone = { tex: TEX.branca, tint: [1.3, 1.15, 0.9], emissive: 1, ambient: 0.05 };
const matTrava = { tex: TEX.energia, tint: [0.75, 0.55, 1.25], emissive: 0.55, ambient: 0.05 };
const matDisco = { ...MAT.portalDisco };
const matAnelPortal = { ...MAT.portalAnel };
const matFeixePortal = { ...MAT.portalFeixe };

/* ---------- câmera (perseguição OU cinemática fixa — tecla C) ---------- */
const cam = {
  modo: 'perseguicao',
  yaw: Math.PI * 0.75, pitch: 0.42, dist: 8.5,
  olho: [-17.5, 6, 26], alvo: [-17.5, 2, 17.5],
  tremor: 0,
};
function alvoCamera() {
  return [drone.pos[0], drone.pos[1] + 1.05, drone.pos[2]];
}
function olhoDesejado() {
  const cp = Math.cos(cam.pitch);
  return [
    cam.alvo[0] + Math.sin(cam.yaw) * cp * cam.dist,
    cam.alvo[1] + Math.sin(cam.pitch) * cam.dist,
    cam.alvo[2] + Math.cos(cam.yaw) * cp * cam.dist,
  ];
}

/* ---------- áudio minimalista (WebAudio, criado no 1º gesto) ---------- */
let AC = null, mudo = false;
function som(freq, dur, tipo, vol, desl, atraso) {
  if (mudo) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { return; }
  const t0 = AC.currentTime + (atraso || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = tipo || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (desl) o.frequency.exponentialRampToValueAtTime(desl, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
const somColeta = () => { som(740, 0.09, 'sine', 0.16); som(1108, 0.14, 'sine', 0.13, null, 0.07); };
const somPortal  = () => { som(160, 1.1, 'sawtooth', 0.08, 760); som(320, 1.1, 'triangle', 0.05, 1520); };
const somVitoria = () => [523, 659, 784, 1046].forEach((f, i) => som(f, 0.26, 'triangle', 0.12, null, i * 0.13));
const somBatida  = () => som(95, 0.09, 'square', 0.10, 55);
const somInicio  = () => som(392, 0.14, 'triangle', 0.10, 523);

/* ---------- HUD ---------- */
const $ = id => document.getElementById(id);
const ui = {
  cel: $('hudCel'), portal: $('hudPortal'), timer: $('hudTimer'),
  luz: $('hudLuz'), cam: $('hudCam'), msg: $('msg'),
  menu: $('menu'), vitoria: $('telaVitoria'), saida: $('telaSaida'),
  vitoriaTempo: $('vitoriaTempo'),
};
let msgAte = 0;
function mostraMsg(txt, dur) { ui.msg.textContent = txt; msgAte = performance.now() / 1000 + (dur || 3.4); }
function fmtTempo(s) {
  const m = (s / 60) | 0, r = (s % 60) | 0;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}
function atualizaHUD(t) {
  ui.cel.textContent = '●'.repeat(S.celulas) + '○'.repeat(5 - S.celulas) + '  ' + S.celulas + '/5';
  ui.portal.textContent = portal.aberto ? 'ATIVO — VÁ ATÉ ELE' : 'BLOQUEADO';
  ui.portal.className = portal.aberto ? 'ativo' : '';
  ui.timer.textContent = 'T+ ' + fmtTempo(S.timer);
  ui.luz.textContent = S.luzOn ? 'LIGADA' : 'DESLIGADA';
  ui.cam.textContent = cam.modo === 'perseguicao' ? 'PERSEGUIÇÃO' : 'CINEMÁTICA';
  ui.msg.style.opacity = clamp((msgAte - t) / 0.45, 0, 1);
}

/* ---------- entrada ---------- */
const teclas = {};
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
    if (S.modo === 'menu') iniciarMissao();
    else if (S.modo === 'concluida') reiniciar();
  }
  if (e.code === 'KeyL') { S.luzOn = !S.luzOn; mostraMsg('LUZ PRINCIPAL: ' + (S.luzOn ? 'LIGADA' : 'DESLIGADA'), 2); }
  if (e.code === 'KeyC' && S.modo === 'jogando') {
    cam.modo = cam.modo === 'perseguicao' ? 'cinematica' : 'perseguicao';
    mostraMsg('CÂMERA: ' + (cam.modo === 'perseguicao' ? 'PERSEGUIÇÃO' : 'CINEMÁTICA'), 2);
  }
  if (e.code === 'KeyR') { if (S.modo === 'menu') iniciarMissao(); else if (S.modo !== 'encerrado') reiniciar(); }
  if (e.code === 'KeyM') { mudo = !mudo; mostraMsg('SOM: ' + (mudo ? 'MUDO' : 'LIGADO'), 1.5); }
  if (e.code === 'Escape') encerrar();
});
addEventListener('keyup', e => { teclas[e.code] = false; });
addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; });

/* mouse: arrastar gira a câmera; roda ajusta a distância */
let arrastando = false, mx = 0, my = 0;
canvas.addEventListener('mousedown', e => { arrastando = true; mx = e.clientX; my = e.clientY; });
addEventListener('mouseup', () => { arrastando = false; });
addEventListener('mousemove', e => {
  if (!arrastando) return;
  cam.yaw   -= (e.clientX - mx) * 0.006;
  cam.pitch  = clamp(cam.pitch + (e.clientY - my) * 0.005, 0.08, 1.25);
  mx = e.clientX; my = e.clientY;
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.001), 4, 16);
}, { passive: false });

$('btnIniciar').addEventListener('click', iniciarMissao);
$('btnDeNovo').addEventListener('click', reiniciar);

/* ---------- fluxo da missão ---------- */
function iniciarMissao() {
  if (S.modo === 'jogando') return;
  S.modo = 'jogando'; S.timer = 0;
  ui.menu.classList.add('oculto');
  ui.vitoria.classList.add('oculto');
  mostraMsg('RECUPERE AS 5 CÉLULAS DE ENERGIA DA BAÍA DE CARGO', 4);
  somInicio();
}
function reiniciar() {
  drone.pos = [-17.5, 1.55, 17.5]; drone.yaw = Math.PI * 0.75;
  drone.velF = drone.velL = drone.bank = drone.pitch = 0;
  drone.flash = 0;
  celulas.forEach(c => { c.estado = 'viva'; c.animT = 0; });
  S.celulas = 0; S.timer = 0;
  portal.aberto = false; portal.animT = 0;
  portal.velAnel = 0.45; portal.velDisco = 0.35;
  portal.discoEscala = 0.12; portal.discoAlfa = 0.22; portal.feixeH = 0;
  PARTICULAS.length = 0;
  ui.menu.classList.add('oculto'); ui.vitoria.classList.add('oculto'); ui.saida.classList.add('oculto');
  S.modo = 'jogando';
  mostraMsg('MISSÃO REINICIADA — RECUPERE AS 5 CÉLULAS', 3);
  somInicio();
}
function coletar(c, silencioso) {
  if (c.estado !== 'viva') return;
  c.estado = 'coletada'; c.animT = 0;
  c.yColeta = c.baseY + Math.sin(performance.now() / 1000 * 1.5 + c.fase) * 0.32;
  S.celulas++;
  burst(c.x, c.yColeta + 0.5, c.z, 30, 3.2, 1.5, [0.35, 1.6, 2.0]);
  if (!silencioso) {
    somColeta();
    mostraMsg('CÉLULA RECUPERADA — ' + S.celulas + '/5', 2.2);
  }
  if (S.celulas === 5) abrirPortal(silencioso);
}
function abrirPortal(silencioso) {
  if (portal.aberto) return;
  portal.aberto = true; portal.animT = 0;
  burst(PORTAL.centro[0], PORTAL.centro[1], PORTAL.centro[2], 60, 4.5, 0.8, [0.4, 1.7, 2.2]);
  if (!silencioso) {
    somPortal();
    mostraMsg('TODAS AS CÉLULAS RECUPERADAS — PORTAL ATIVADO!', 5);
  }
}
function concluirMissao() {
  S.modo = 'concluida';
  ui.vitoriaTempo.textContent = fmtTempo(S.timer);
  ui.vitoria.classList.remove('oculto');
  burst(drone.pos[0], drone.pos[1], drone.pos[2], 80, 5, 2.5, [0.4, 1.7, 2.2]);
  somVitoria();
}
function encerrar() {
  if (S.modo === 'encerrado') return;
  S.modo = 'encerrado';
  ui.saida.classList.remove('oculto');
  cancelAnimationFrame(rafId);
  setTimeout(() => { try { window.close(); } catch (e) {} }, 900);
}

/* ---------- partículas (pontos animados por dt) ---------- */
function burst(x, y, z, n, vel, sub, cor) {
  for (let i = 0; i < n; i++) {
    if (PARTICULAS.length >= 360) break;
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
    const v = vel * (0.4 + Math.random() * 0.8);
    PARTICULAS.push({
      x, y, z,
      vx: Math.cos(a) * Math.cos(b) * v, vy: Math.sin(b) * v + sub, vz: Math.sin(a) * Math.cos(b) * v,
      vida: 0, max: 0.55 + Math.random() * 0.5, tam: 1.2 + Math.random() * 1.6,
    });
  }
}
function atualizaParticulas(dt) {
  for (let i = PARTICULAS.length - 1; i >= 0; i--) {
    const p = PARTICULAS[i];
    p.vida += dt;
    if (p.vida >= p.max) { PARTICULAS.splice(i, 1); continue; }
    p.vy -= 3.2 * dt;                      /* "gravidade" suave */
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  }
  let n = 0;
  for (const p of PARTICULAS) {
    NUVEM_PARTICULAS.dados[n*5] = p.x; NUVEM_PARTICULAS.dados[n*5+1] = p.y; NUVEM_PARTICULAS.dados[n*5+2] = p.z;
    NUVEM_PARTICULAS.dados[n*5+3] = p.tam * (1 - p.vida / p.max);
    NUVEM_PARTICULAS.dados[n*5+4] = 1 - p.vida / p.max;
    n++;
  }
  NUVEM_PARTICULAS.n = n;
  if (n) enviaNuvem(NUVEM_PARTICULAS);
}

/* ---------- simulação (tudo em função de dt, nunca de fps) ---------- */
function atualiza(dt, t) {
  if (S.modo === 'jogando') {
    S.timer += dt;

    /* controle do drone (estilo "tanque": A/D giram, W/S avançam) */
    const av   = (teclas.KeyW ? 1 : 0) - (teclas.KeyS ? 1 : 0);
    const giro = (teclas.KeyA ? 1 : 0) - (teclas.KeyD ? 1 : 0);
    const lat  = (teclas.KeyE ? 1 : 0) - (teclas.KeyQ ? 1 : 0);
    const turbo = teclas.ShiftLeft || teclas.ShiftRight ? PARAMS.turbo : 1;
    drone.yaw += giro * PARAMS.giro * dt;
    drone.velF = suaviza(drone.velF, av * PARAMS.velMax * turbo, 5, dt);
    drone.velL = suaviza(drone.velL, lat * PARAMS.velMax * 0.6 * turbo, 5, dt);

    const fx = Math.sin(drone.yaw), fz = Math.cos(drone.yaw);   // frente
    const rx = -fz, rz = fx;                                     // direita
    drone.pos[0] += (fx * drone.velF + rx * drone.velL) * dt;
    drone.pos[2] += (fz * drone.velF + rz * drone.velL) * dt;

    /* limites da sala */
    drone.pos[0] = clamp(drone.pos[0], -21.2, 21.2);
    drone.pos[2] = clamp(drone.pos[2], -21.2, 21.2);

    /* colisão com caixas (AABB no plano XZ) */
    drone.coolCol = Math.max(0, drone.coolCol - dt);
    for (const c of CAIXAS) {
      const hw = c.sx / 2 + PARAMS.raioDrone, hd = c.sz / 2 + PARAMS.raioDrone;
      const dx = drone.pos[0] - c.x, dz = drone.pos[2] - c.z;
      const px = hw - Math.abs(dx), pz = hd - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) drone.pos[0] = c.x + Math.sign(dx || 1) * hw;
        else         drone.pos[2] = c.z + Math.sign(dz || 1) * hd;
        bateu();
      }
    }
    /* colisão com pilares (distância entre centros) */
    for (const p of PILARES) {
      const dx = drone.pos[0] - p.x, dz = drone.pos[2] - p.z;
      const d = Math.hypot(dx, dz), r = p.r + PARAMS.raioDrone;
      if (d < r && d > 0.001) {
        drone.pos[0] = p.x + dx / d * r;
        drone.pos[2] = p.z + dz / d * r;
        bateu();
      }
    }

    /* coleta das células (distância entre centros) */
    for (const c of celulas) {
      if (c.estado === 'viva' && Math.hypot(drone.pos[0] - c.x, drone.pos[2] - c.z) < 1.45) coletar(c);
    }

    /* conclusão: chegar ao portal ativo */
    if (portal.aberto && portal.animT > 1.8 &&
        Math.hypot(drone.pos[0] - PORTAL.chao[0], drone.pos[2] - PORTAL.chao[2]) < PORTAL.raioVitoria)
      concluirMissao();

    /* inclinações visuais (rotação perceptível ao mover/girar) */
    drone.bank  = suaviza(drone.bank, giro * 0.42, 6, dt);
    drone.pitch = suaviza(drone.pitch, drone.velF / PARAMS.velMax * 0.17, 6, dt);
  }

  /* animações contínuas: hélices, flutuação — sempre ativas */
  drone.bobT += dt * (2.1 + Math.abs(drone.velF) * 0.06);
  drone.propVel = suaviza(drone.propVel, 8 + Math.abs(drone.velF) * 4 + Math.abs(drone.velL) * 3, 2.5, dt);
  for (let i = 0; i < 4; i++) drone.propAng[i] += drone.propVel * dt;
  drone.flash = Math.max(0, drone.flash - dt * 2.2);

  /* células: animação de coleta (encolhe/sobe/some) */
  for (const c of celulas) {
    if (c.estado === 'coletada') {
      c.animT += dt;
      if (c.animT >= 0.55) c.estado = 'feita';
    }
  }

  /* portal: giro contínuo + animação de abertura acionada por evento */
  portal.giroAnel += portal.velAnel * dt;
  portal.giroDisco += portal.velDisco * dt;
  if (!portal.aberto) {
    portal.discoEscala = 0.12 + 0.03 * Math.sin(t * 2.0);
    portal.discoAlfa = 0.20 + 0.08 * Math.sin(t * 2.7);
  } else {
    portal.animT += dt;
    const k = clamp(portal.animT / 2.2, 0, 1), ke = easeOutCubic(k);
    portal.velAnel = suaviza(portal.velAnel, 5.4, 1.3, dt);
    portal.velDisco = suaviza(portal.velDisco, 1.8, 1.3, dt);
    portal.discoEscala = 0.12 + 0.88 * easeOutBack(k);
    portal.discoAlfa = 0.22 + 0.62 * ke;
    portal.feixeH = 13 * ke;
  }

  atualizaParticulas(dt);

  /* poeira flutuante: movimento periódico senoidal */
  for (let i = 0; i < POEIRA_BASE.length; i++) {
    const p = POEIRA_BASE[i];
    NUVEM_POEIRA.dados[i*5]   = p.x + Math.sin(t * 0.13 + p.f) * 1.4;
    NUVEM_POEIRA.dados[i*5+1] = p.y + Math.sin(t * 0.21 + p.f * 2) * 0.7;
    NUVEM_POEIRA.dados[i*5+2] = p.z + Math.cos(t * 0.11 + p.f) * 1.4;
    NUVEM_POEIRA.dados[i*5+3] = p.s; NUVEM_POEIRA.dados[i*5+4] = p.a;
  }
  NUVEM_POEIRA.n = POEIRA_BASE.length;
  enviaNuvem(NUVEM_POEIRA);

  /* câmera */
  if (cam.modo === 'perseguicao') {
    const alvoD = alvoCamera();
    for (let i = 0; i < 3; i++) {
      cam.alvo[i] = suaviza(cam.alvo[i], alvoD[i], 9, dt);
      cam.olho[i] = suaviza(cam.olho[i], olhoDesejado()[i], 7, dt);
    }
    if (teclas.ArrowLeft)  cam.yaw += 2.3 * dt;
    if (teclas.ArrowRight) cam.yaw -= 2.3 * dt;
    if (teclas.ArrowUp)    cam.pitch = clamp(cam.pitch + 1.4 * dt, 0.08, 1.25);
    if (teclas.ArrowDown)  cam.pitch = clamp(cam.pitch - 1.4 * dt, 0.08, 1.25);
  } else {
    const olhoFixo = [23.5, 13, 23.5];
    for (let i = 0; i < 3; i++) {
      cam.olho[i] = suaviza(cam.olho[i], olhoFixo[i], 4, dt);
      cam.alvo[i] = suaviza(cam.alvo[i], alvoCamera()[i], 5, dt);
    }
  }
  if (cam.tremor > 0) cam.tremor = Math.max(0, cam.tremor - dt * 2.4);

  /* materiais pulsantes */
  const pt = 0.9 + 0.1 * Math.sin(t * 9.3);
  MAT.tira.tint = [0.35 * pt, 1.3 * pt, 1.6 * pt];
  MAT.sensor.emissive = 0.65 + 0.35 * Math.sin(t * 6);
  if (S.luzOn) { MAT.lampada.emissive = 1; MAT.lampada.tint = [1.2, 1.12, 0.95]; }
  else { MAT.lampada.emissive = 0.04; MAT.lampada.tint = [0.10, 0.11, 0.13]; }
  const fl = drone.flash;
  matCorpoDrone.tint = [1 + fl * 1.6, 1 - fl * 0.6, 1 - fl * 0.6];
  matPonta.alpha = 0.5 + 0.5 * Math.sin(t * 5.2);
  const nk = 0.88 + 0.12 * Math.sin(t * 3.3);
  for (const m of celMats) { m.nucleo.tint = [0.9 * nk, 1.35 * nk, 1.55 * nk]; }
}
function bateu() {
  if (drone.coolCol > 0) return;
  drone.coolCol = 0.5; drone.flash = 1; cam.tremor = 0.5;
  somBatida();
  mostraMsg('COLISÃO — DESVIE DOS CONTÊINERES', 1.4);
}

/* ---------- renderização ---------- */
function renderiza(t) {
  redimensiona();
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
  gl.depthMask(true); gl.disable(gl.BLEND);
  gl.clearColor(0.028, 0.045, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /* olho da câmera com tremor de colisão */
  const tr = cam.tremor;
  const olho = [
    cam.olho[0] + (Math.random() - 0.5) * tr * 0.5,
    cam.olho[1] + (Math.random() - 0.5) * tr * 0.5,
    cam.olho[2] + (Math.random() - 0.5) * tr * 0.5,
  ];

  projAtual = M4.persp(55 * Math.PI / 180, canvas.width / Math.max(canvas.height, 1), 0.1, 160);
  vistaAtual = M4.lookAt(olho, cam.alvo, [0, 1, 0]);
  olhoCam = olho;

  usaProgramaPrincipal();
  gl.uniform3fv(uP.uLightPos, PARAMS.luzPos);
  gl.uniform3fv(uP.uLightColor, S.luzOn ? PARAMS.luzCor : [0, 0, 0]);

  /* cenário estático */
  for (const [malha, mat, modelo] of ESTATICOS) desenhaMalha(malha, mat, modelo);

  /* contêineres (posição via translação, variação via escala) */
  for (const c of CAIXAS)
    desenhaMalha(MALHAS.caixa, MAT.caixa,
      M4.mul(M4.mul(M4.transl(c.x, c.sy / 2, c.z), M4.rotY(c.girar)), M4.scale(c.sx, c.sy, c.sz)));
  {
    const c = CAIXA_EMPILHADA;
    desenhaMalha(MALHAS.caixa, MAT.caixa,
      M4.mul(M4.mul(M4.transl(c.x, c.y, c.z), M4.rotY(c.girar)), M4.scale(c.sx, c.sy, c.sz)));
  }

  desenhaPortal(t, false);
  desenhaDrone(t);
  desenhaCelulas(t);

  /* fase transparente */
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  desenhaPortal(t, true);
  for (let i = 0; i < celulas.length; i++) {
    if (celulas[i].estado === 'feita') continue;
    desenhaMalha(feixesDia[i], feixesMats[i], M4.ident());
  }
  desenhaPontos(NUVEM_ESTRELAS, [0.75, 0.85, 1.0], 1, 80);
  desenhaPontos(NUVEM_POEIRA, [0.45, 0.85, 1.0], 1, 55);
  if (NUVEM_PARTICULAS.n) desenhaPontos(NUVEM_PARTICULAS, [0.35, 0.95, 1.25], 1, 55);
  gl.depthMask(true); gl.disable(gl.BLEND);
}

function desenhaDrone(t) {
  /* matriz do drone: translação (mundo) -> rotação (orientação) -> oscilação */
  const bob = Math.sin(drone.bobT) * 0.12;
  const M = M4.mul(M4.transl(drone.pos[0], drone.pos[1] + bob, drone.pos[2]), M4.rotY(drone.yaw));
  const Mbase = M4.mul(M, M4.mul(M4.rotX(drone.pitch), M4.rotZ(drone.bank)));

  desenhaMalha(MALHAS.corpo, matCorpoDrone, Mbase);
  desenhaMalha(MALHAS.antena, MAT.antena, Mbase);
  desenhaMalha(MALHAS.pontaAntena, matPonta, M4.mul(Mbase, M4.transl(0, 0.76, 0)));
  desenhaMalha(MALHAS.luzInferior, matLuzDrone, M4.mul(Mbase, M4.transl(0, -0.30, 0)));
  desenhaMalha(MALHAS.sensor, MAT.sensor, M4.mul(Mbase, M4.mul(M4.transl(0, 0.03, 0.86), M4.rotX(Math.PI / 2))));

  /* TRANSFORMAÇÃO HIERÁRQUICA:
     braço acompanha o corpo (posição+orientação do drone);
     hélice acompanha o braço e ainda gira em torno do PRÓPRIO centro. */
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const Mbraco = M4.mul(Mbase, M4.mul(
      M4.mul(M4.transl(dx * 0.62, 0.06, dz * 0.62), M4.rotY(Math.atan2(dx, dz))),
      M4.rotX(-0.20)));
    desenhaMalha(MALHAS.braco, MAT.metal, Mbraco);
    const Mhelice = M4.mul(Mbraco, M4.mul(M4.transl(0, 0.15, 0.50), M4.rotY(drone.propAng[i])));
    desenhaMalha(MALHAS.helice, MAT.helice, Mhelice);
  }
}

function desenhaCelulas(t) {
  for (let i = 0; i < celulas.length; i++) {
    const c = celulas[i], m = celMats[i];
    if (c.estado === 'feita') { feixesMats[i].alpha = 0; continue; }
    let escala = 1, alfa = 1, y;
    if (c.estado === 'viva') {
      y = c.baseY + Math.sin(t * 1.5 + c.fase) * 0.32;          /* flutuação periódica */
      feixesMats[i].alpha = 0.28 + 0.10 * Math.sin(t * 2 + c.fase);
    } else {                                                     /* animação de coleta */
      const e = clamp(c.animT / 0.55, 0, 1);
      escala = (1 - e) * (1 - e);
      y = c.yColeta + easeOutCubic(e) * 1.4;
      alfa = 1 - e;
      feixesMats[i].alpha = 0.3 * alfa;
    }
    m.nucleo.alpha = alfa; m.cristal.alpha = alfa; m.anel.alpha = alfa;
    const M = M4.mul(M4.transl(c.x, y, c.z), M4.mul(M4.rotY(t * 1.2 + c.fase), M4.scale(escala, escala, escala)));
    desenhaMalha(MALHAS.nucleo, m.nucleo, M);
    desenhaMalha(MALHAS.cristal, m.cristal, M4.mul(M4.transl(c.x, y, c.z), M4.rotY(-t * 1.7 - c.fase)));
    desenhaMalha(MALHAS.anelCelula, m.anel, M4.mul(M4.transl(c.x, y, c.z), M4.rotY(t * 0.8 + c.fase)));
  }
}

function desenhaPortal(t, faseTransp) {
  const Mp = M4.transl(PORTAL.centro[0], PORTAL.centro[1], PORTAL.centro[2]);
  const k = clamp(portal.animT / 2.2, 0, 1), ke = easeOutCubic(k);
  const lerpC = (a, b) => [a[0] + (b[0] - a[0]) * ke, a[1] + (b[1] - a[1]) * ke, a[2] + (b[2] - a[2]) * ke];
  if (!faseTransp) {
    matAnelPortal.tint = lerpC([0.75, 0.55, 1.15], [0.25, 1.35, 1.55]);
    matAnelPortal.emissive = 0.4 + 0.5 * ke;
    desenhaMalha(MALHAS.portalAnel, matAnelPortal, M4.mul(Mp, M4.rotZ(portal.giroAnel)));
    matTrava.tint = lerpC([0.75, 0.55, 1.25], [0.35, 1.6, 2.0]);
    matTrava.emissive = 0.55 + 0.45 * ke;
    for (let j = 0; j < 6; j++) {
      const a = j / 6 * Math.PI * 2;
      desenhaMalha(MALHAS.portalTrava, matTrava,
        M4.mul(M4.mul(Mp, M4.rotZ(portal.giroAnel)), M4.transl(Math.cos(a) * 2.35, Math.sin(a) * 2.35, 0)));
    }
  } else {
    matDisco.tint = lerpC([0.80, 0.60, 1.20], [0.30, 1.30, 1.60]);
    matDisco.alpha = portal.discoAlfa;
    desenhaMalha(MALHAS.portalDisco, matDisco,
      M4.mul(Mp, M4.mul(M4.rotZ(portal.giroDisco), M4.scale(portal.discoEscala, portal.discoEscala, 1))));
    if (portal.feixeH > 0.05) {
      matFeixePortal.alpha = 0.03 + 0.09 * ke;
      desenhaMalha(MALHAS.portalFeixe, matFeixePortal,
        M4.mul(M4.transl(0, 0, -20), M4.scale(1, portal.feixeH / 13, 1)));
    }
  }
}

/* ---------- laço principal: dt = tempo entre quadros ---------- */
let ultimo = performance.now(), rafId = 0;
function laco(agora) {
  /* dt limitado a 50 ms evita "saltos" após perda de foco da janela */
  const dt = clamp((agora - ultimo) / 1000, 0, 0.05);
  ultimo = agora;
  atualiza(dt, agora / 1000);
  renderiza(agora / 1000);
  atualizaHUD(agora / 1000);
  rafId = requestAnimationFrame(laco);
}
rafId = requestAnimationFrame(laco);

/* ---------- API de depuração/demonstração (console do navegador) ----------
   Ex.: MISSAO.coletarTodas(); MISSAO.teleportar(0,-15); MISSAO.luz(false)  */
window.MISSAO = {
  iniciar: iniciarMissao,
  reiniciar: reiniciar,
  coletar: i => coletar(celulas[i], true),
  coletarTodas: () => celulas.forEach(c => coletar(c, true)),
  abrirPortal: () => abrirPortal(true),
  teleportar: (x, z, yaw) => {
    drone.pos[0] = x; drone.pos[2] = z;
    if (yaw !== undefined) drone.yaw = yaw;
    cam.alvo = alvoCamera(); cam.olho = olhoDesejado();
  },
  vencer: () => { if (!portal.aberto) abrirPortal(true); portal.animT = 2.3; concluirMissao(); },
  luz: on => { S.luzOn = !!on; },
  camera: m => { if (m) cam.modo = m; },
  estado: S, PARAMS, drone, portal, celulas,
};

/* ---------- modo demonstração (capturas de tela do relatório) ----------
   index.html?cena=menu|jogo|portal-fechado|luz-off|portal-aberto|vitoria
   Encena um estado determinístico da missão para documentação.      */
(function modoDemonstracao() {
  const cena = new URLSearchParams(location.search).get('cena');
  if (!cena || cena === 'menu') return;
  const aguarda = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    await aguarda(150);
    iniciarMissao();
    if (cena === 'jogo') {
      cam.yaw = Math.PI * 0.55 + Math.PI; cam.pitch = 0.34; cam.dist = 9.5;
      MISSAO.teleportar(9, 7, Math.PI * 0.8);
      coletar(celulas[4], true);
    } else if (cena === 'portal-fechado' || cena === 'luz-off') {
      cam.yaw = 0.66; cam.pitch = 0.20; cam.dist = 7.5;
      MISSAO.teleportar(3.5, -15.5, -2.48);
      if (cena === 'luz-off') S.luzOn = false;
    } else if (cena === 'portal-aberto') {
      MISSAO.coletarTodas();
      cam.yaw = 0.66; cam.pitch = 0.20; cam.dist = 7.5;
      MISSAO.teleportar(3.5, -15.5, -2.48);
      portal.animT = 2.25;                        /* animação de abertura concluída */
    } else if (cena === 'vitoria') {
      MISSAO.coletarTodas();
      cam.yaw = 0.66; cam.pitch = 0.20; cam.dist = 7.5;
      MISSAO.teleportar(1.5, -17.8, -2.9);
      MISSAO.vencer();
    }
    msgAte = 0;                                    /* sem mensagens flutuantes na foto */
  })();
})();
