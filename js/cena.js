/* ============================================================
   OPERAÇÃO UZUMAKI — cena.js
   Materiais, malhas e cenário estático da Baía de Carga da
   Estação Kepler-7. Posições no MUNDO via matrizes-modelo.
   Coordenadas: X = leste, Y = altura, Z = sul (câmera padrão olha
   para -Z). A sala tem 44x44 m e paredes com 12 m de altura.
   ============================================================ */
'use strict';

/* ---------- materiais (compartilham malhas/escala) ---------- */
const MAT = {
  piso:         { tex: TEX.piso,   ambient: 0.34, shin: 26, spec: 0.35 },
  parede:       { tex: TEX.parede, ambient: 0.30, shin: 10, spec: 0.06 },
  caixa:        { tex: TEX.caixa,  ambient: 0.34, shin: 12, spec: 0.22 },
  drone:        { tex: TEX.drone,  ambient: 0.35, shin: 64, spec: 0.90 },  /* brilho especular forte */
  metal:        { tex: TEX.drone,  ambient: 0.30, shin: 36, spec: 0.40 },
  helice:       { tex: TEX.branca, tint: [0.16,0.19,0.23], ambient: 0.55, shin: 8, spec: 0.10 },
  nucleo:       { tex: TEX.celula,  tint: [0.90,1.35,1.55], emissive: 0.90, ambient: 0.10 },
  cristal:      { tex: TEX.energia, tint: [0.35,1.50,1.80], emissive: 1.00, ambient: 0.05 },
  anelCel:      { tex: TEX.branca,  tint: [0.20,1.00,1.30], emissive: 0.75, ambient: 0.10 },
  feixeDia:     { tex: TEX.branca,  tint: [0.25,0.95,1.25], emissive: 1.00, ambient: 0.05, alpha: 0.32 },
  portalAnel:   { tex: TEX.celula,  tint: [0.75,0.55,1.15], emissive: 0.40, ambient: 0.12, shin: 30, spec: 0.30 },
  portalDisco:  { tex: TEX.energia, tint: [0.80,0.60,1.20], emissive: 1.00, ambient: 0.05, alpha: 0.30 },
  portalFeixe:  { tex: TEX.energia, tint: [0.30,1.10,1.40], emissive: 1.00, ambient: 0.05, alpha: 0.10 },
  tira:         { tex: TEX.branca,  tint: [0.35,1.30,1.60], emissive: 1.00, ambient: 0.05 },
  cabos:        { tex: TEX.branca,  tint: [0.20,0.75,0.95], emissive: 0.60, ambient: 0.10, alpha: 0.80 },
  antena:       { tex: TEX.branca,  tint: [0.30,1.10,1.40], emissive: 1.00, ambient: 0.05 },
  sensor:       { tex: TEX.branca,  tint: [0.30,1.40,1.70], emissive: 0.80, ambient: 0.05 },
  lampada:      { tex: TEX.branca,  tint: [1.20,1.12,0.95], emissive: 1.00, ambient: 0.05 },
};

/* ---------- malhas (coordenadas locais) ---------- */
const MALHAS = {};
(function criaMalhas() {
  /* drone */
  const corpo = new MB(); corpo.addCaixa(1.15, 0.50, 1.55, 0.8, 0.4);
  MALHAS.corpo = corpo.build();
  const braco = new MB(); braco.addCaixa(0.26, 0.12, 1.00, 0.2, 0.2);
  MALHAS.braco = braco.build();
  const hel = new MB();
  hel.addCilindro(0.07, 0.07, 0.16, 8, true);
  hel.addCaixa(0.95, 0.02, 0.10);            /* lâmina 1 */
  hel.addCaixa(0.10, 0.02, 0.95);            /* lâmina 2 (cruzada) */
  MALHAS.helice = hel.build();
  const sensor = new MB(); sensor.addCilindro(0.16, 0.001, 0.42, 10, true);
  MALHAS.sensor = sensor.build();
  const ant = new MB(); ant.linha([0, 0.30, 0], [0, 0.74, 0]);
  MALHAS.antena = ant.build(gl.LINES);
  const pt = new MB(); pt.addOctaedro(0.06);
  MALHAS.pontaAntena = pt.build();
  const lamp = new MB(); lamp.addCaixa(0.17, 0.05, 0.17);
  MALHAS.luzInferior = lamp.build();

  /* células de energia */
  const nuc = new MB(); nuc.addCilindro(0.42, 0.42, 1.05, 16, true, 2.6, 1.0);
  MALHAS.nucleo = nuc.build();
  const cri = new MB(); cri.addOctaedro(0.30);
  MALHAS.cristal = cri.build();
  const anel = new MB(); anel.addToroXY(0.62, 0.05, 24, 8);
  MALHAS.anelCelula = anel.build();

  /* caixas (obstáculos) — cubo unitário escalado por matriz-modelo */
  const cx = new MB(); cx.addCaixa(1, 1, 1);
  MALHAS.caixa = cx.build();

  /* portal */
  const anelP = new MB(); anelP.addToroXY(2.35, 0.26, 48, 12);
  MALHAS.portalAnel = anelP.build();
  const dP = new MB(); dP.addDiscoXY(1.95, 40);
  MALHAS.portalDisco = dP.build();
  const fb = new MB(); fb.addCilindro(1.15, 1.15, 13, 20, false, 3, 1);
  MALHAS.portalFeixe = fb.build();
  const tr = new MB(); tr.addOctaedro(0.40);       /* cristais de trava do anel */
  MALHAS.portalTrava = tr.build();

  /* estrutura da sala */
  const piso = new MB(); piso.addCaixa(45.2, 0.6, 45.2, 11, 11);
  MALHAS.piso = piso.build();
  const paredeNS = new MB(); paredeNS.addCaixa(45.2, 12, 0.6, 11, 3);
  MALHAS.paredeNS = paredeNS.build();
  const paredeEO = new MB(); paredeEO.addCaixa(0.6, 12, 45.2, 3, 11);
  MALHAS.paredeEO = paredeEO.build();
  const pilar = new MB(); pilar.addCilindro(1.1, 1.1, 12, 14, true, 6, 3);
  MALHAS.pilar = pilar.build();
  const plataf = new MB(); plataf.addCilindro(4.2, 4.2, 0.5, 28, true, 6.6, 0.13);
  MALHAS.plataforma = plataf.build();
  const pedestal = new MB(); pedestal.addCaixa(1.3, 1.5, 1.3, 0.35, 0.4);
  MALHAS.pedestal = pedestal.build();
  const vigaX = new MB(); vigaX.addCaixa(45.2, 0.8, 0.8, 11, 0.2);
  MALHAS.vigaX = vigaX.build();
  const vigaZ = new MB(); vigaZ.addCaixa(0.8, 0.8, 45.2, 0.2, 11);
  MALHAS.vigaZ = vigaZ.build();
  const tiraNS = new MB(); tiraNS.addCaixa(34, 0.28, 0.28);
  MALHAS.tiraNS = tiraNS.build();
  const tiraEO = new MB(); tiraEO.addCaixa(0.28, 0.28, 34);
  MALHAS.tiraEO = tiraEO.build();
  const lampSala = new MB(); lampSala.addCaixa(1.6, 0.5, 1.6);
  MALHAS.lampadaSala = lampSala.build();

  /* cabos aéreos (linhas decorativas entre as vigas) */
  const cabos = new MB();
  for (let x = -20; x <= 20; x += 8) {
    cabos.linha([x, 10.55, -12], [x, 10.55, 0]);
    cabos.linha([x, 10.55, 0], [x, 10.55, 12]);
  }
  MALHAS.cabos = cabos.build(gl.LINES);
})();

/* ---------- cenário estático: [malha, material, modelo] ---------- */
const ESTATICOS = [
  [MALHAS.piso,       MAT.piso,   M4.transl(0, -0.3, 0)],
  [MALHAS.paredeNS,   MAT.parede, M4.transl(0, 6, -22.3)],
  [MALHAS.paredeNS,   MAT.parede, M4.transl(0, 6, 22.3)],
  [MALHAS.paredeEO,   MAT.parede, M4.transl(22.3, 6, 0)],
  [MALHAS.paredeEO,   MAT.parede, M4.transl(-22.3, 6, 0)],
  [MALHAS.pilar,      MAT.parede, M4.transl(19, 0, 19)],
  [MALHAS.pilar,      MAT.parede, M4.transl(-19, 0, 19)],
  [MALHAS.pilar,      MAT.parede, M4.transl(19, 0, -19)],
  [MALHAS.pilar,      MAT.parede, M4.transl(-19, 0, -19)],
  [MALHAS.plataforma, MAT.piso,   M4.transl(0, 0, -20)],
  [MALHAS.pedestal,   MAT.parede, M4.transl(0, 1.25, -20)],
  [MALHAS.vigaX,      MAT.parede, M4.transl(0, 10.6, -12)],
  [MALHAS.vigaX,      MAT.parede, M4.transl(0, 10.6, 0)],
  [MALHAS.vigaX,      MAT.parede, M4.transl(0, 10.6, 12)],
  [MALHAS.vigaZ,      MAT.parede, M4.transl(12, 10.6, 0)],
  [MALHAS.vigaZ,      MAT.parede, M4.transl(-12, 10.6, 0)],
  [MALHAS.cabos,      MAT.cabos,  M4.ident()],
  [MALHAS.tiraNS,     MAT.tira,   M4.transl(0, 5.5, -21.55)],
  [MALHAS.tiraNS,     MAT.tira,   M4.transl(0, 5.5, 21.55)],
  [MALHAS.tiraEO,     MAT.tira,   M4.transl(21.55, 5.5, 0)],
  [MALHAS.tiraEO,     MAT.tira,   M4.transl(-21.55, 5.5, 0)],
  [MALHAS.lampadaSala, MAT.lampada, M4.transl(0, 9.95, 0)],
];

/* pilares: colisão circular */
const PILARES = [
  { x: 19,  z: 19,  r: 1.25 },
  { x: -19, z: 19,  r: 1.25 },
  { x: 19,  z: -19, r: 1.25 },
  { x: -19, z: -19, r: 1.25 },
];

/* ---------- obstáculos: contêineres (colisão AABB no plano XZ) ---------- */
/* sx/sy/sz = tamanho em metros (a malha é um cubo unitário); meia-largura = sx/2 */
const CAIXAS = [
  { x: 5,     z: -5,    sx: 2.5, sy: 2.5, sz: 2.5, girar: 0 },
  { x: -4,    z: 4.5,   sx: 2.2, sy: 1.9, sz: 2.5, girar: 0 },
  { x: 10.5,  z: 3,     sx: 2.3, sy: 2.1, sz: 2.3, girar: 0 },
  { x: -11.5, z: 12.5,  sx: 2.6, sy: 1.6, sz: 2.2, girar: 0 },
];
/* contêiner decorativo empilhado (acima da altura de voo — sem colisão) */
const CAIXA_EMPILHADA = { x: 5, z: -5, sx: 1.24, sy: 1.24, sz: 1.24, y: 2.5 + 0.62, girar: 0.4 };

/* ---------- células de energia (posições no mundo) ---------- */
const CELULAS_POS = [
  [ 15.0, -11.0], [-15.5, -7.0], [ 16.5, 11.0], [-9.0, 15.5], [ 0.5, 1.5],
];
const feixesDia = CELULAS_POS.map(([x, z]) => {
  const mb = new MB();
  mb.linha([x, 2.7, z], [x, 8.6, z]);           /* coluna de luz vertical acima da célula */
  return mb.build(gl.LINES);
});

/* ---------- portal ---------- */
const PORTAL = {
  centro: [0, 3.45, -20],      /* centro do anel */
  chao: [0, 0, -20],          /* centro da plataforma */
  raioVitoria: 2.9,
};

/* ---------- céu: estrelas e poeira (nuvens de pontos) ---------- */
const NUVEM_ESTRELAS = criaNuvem(260);
(function geraEstrelas() {
  let i = 0;
  while (i < 260) {
    const x = (rnd() * 2 - 1) * 85, z = (rnd() * 2 - 1) * 85, y = 16 + rnd() * 55;
    NUVEM_ESTRELAS.dados[i*5] = x; NUVEM_ESTRELAS.dados[i*5+1] = y; NUVEM_ESTRELAS.dados[i*5+2] = z;
    NUVEM_ESTRELAS.dados[i*5+3] = 1.4 + rnd() * 2.0; NUVEM_ESTRELAS.dados[i*5+4] = 0.45 + rnd() * 0.55;
    i++;
  }
  NUVEM_ESTRELAS.n = 260;
  enviaNuvem(NUVEM_ESTRELAS);
})();

const NUVEM_POEIRA = criaNuvem(90);
const POEIRA_BASE = [];
(function geraPoeira() {
  for (let i = 0; i < 90; i++) {
    POEIRA_BASE.push({ x: (rnd()*2-1)*20, y: 0.8 + rnd()*8.5, z: (rnd()*2-1)*20,
                       f: rnd()*Math.PI*2, s: 0.35 + rnd()*0.45, a: 0.10 + rnd()*0.12 });
  }
})();

/* nuvem de partículas (explosões de coleta/conclusão) */
const NUVEM_PARTICULAS = criaNuvem(360);
const PARTICULAS = [];
