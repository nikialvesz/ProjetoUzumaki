/* ============================================================
   OPERAÇÃO UZUMAKI — geometria.js
   Construção de geometrias por código, em COORDENADAS LOCAIS.
   Cada primitiva é enviada à GPU como um buffer intercalado
   [posição(3) normal(3) uv(2)] + índices. Tipos de primitiva
   utilizados no jogo:
     • QUADRILÁTEROS  -> pisos, paredes, caixas, braços (cada quad = 2 triângulos)
     • TRIÂNGULOS     -> cristais (octaedro), cone do sensor, disco do portal
     • LINHAS         -> antena, cabos da estrutura, feixes-dia das células
     • PONTOS         -> estrelas, poeira e partículas (gl.js)
   Os objetos são posicionados no MUNDO por matrizes-modelo (cena.js/jogo.js).
   ============================================================ */
'use strict';

class MB {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.idx = []; }
  vert(p, n, uv) {
    this.pos.push(p[0], p[1], p[2]);
    this.nrm.push(n[0], n[1], n[2]);
    this.uv.push(uv[0], uv[1]);
  }
  /* quadrilátero (rasterizado como 2 triângulos) */
  quad(p0, p1, p2, p3, n, u0, u1, u2, u3) {
    const b = this.pos.length / 3;
    this.vert(p0, n, u0); this.vert(p1, n, u1);
    this.vert(p2, n, u2); this.vert(p3, n, u3);
    this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  /* triângulo com normal explícita (sombreamento plano) */
  tri(p0, p1, p2, n, u0, u1, u2) {
    const b = this.pos.length / 3;
    this.vert(p0, n, u0); this.vert(p1, n, u1); this.vert(p2, n, u2);
    this.idx.push(b, b + 1, b + 2);
  }
  /* segmento de linha (primitiva gl.LINES) */
  linha(p0, p1) {
    const b = this.pos.length / 3;
    this.vert(p0, [0, 1, 0], [0, 0]);
    this.vert(p1, [0, 1, 0], [0, 0]);
    this.idx.push(b, b + 1);
  }
  build(mode) {
    const n = this.pos.length / 3;
    const dados = new Float32Array(n * 8);
    for (let i = 0; i < n; i++) {
      dados[i*8+0]=this.pos[i*3]; dados[i*8+1]=this.pos[i*3+1]; dados[i*8+2]=this.pos[i*3+2];
      dados[i*8+3]=this.nrm[i*3]; dados[i*8+4]=this.nrm[i*3+1]; dados[i*8+5]=this.nrm[i*3+2];
      dados[i*8+6]=this.uv[i*2];  dados[i*8+7]=this.uv[i*2+1];
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.idx), gl.STATIC_DRAW);
    return { vbo, ibo, count: this.idx.length, mode: mode !== undefined ? mode : gl.TRIANGLES };
  }

  /* ---------- primitivas compostas ---------- */

  /* caixa centrada na origem; uv uMul/vMul permitem repetir a textura
     em cada face sem deformação (mantém texels quadrados) */
  addCaixa(w, h, d, uMul, vMul) {
    uMul = uMul || 1; vMul = vMul || 1;
    const x = w / 2, y = h / 2, z = d / 2;
    this.quad([ x, y,-z],[ x, y, z],[-x, y, z],[-x, y,-z],[0,1,0], [0,0],[uMul,0],[uMul,vMul],[0,vMul]);  /* topo    */
    this.quad([ x,-y, z],[ x,-y,-z],[-x,-y,-z],[-x,-y, z],[0,-1,0],[0,0],[uMul,0],[uMul,vMul],[0,vMul]); /* base    */
    this.quad([-x, y, z],[ x, y, z],[ x,-y, z],[-x,-y, z],[0,0,1], [0,0],[uMul,0],[uMul,vMul],[0,vMul]); /* +Z      */
    this.quad([ x, y,-z],[-x, y,-z],[-x,-y,-z],[ x,-y,-z],[0,0,-1],[0,0],[uMul,0],[uMul,vMul],[0,vMul]); /* -Z      */
    this.quad([ x, y, z],[ x, y,-z],[ x,-y,-z],[ x,-y, z],[1,0,0], [0,0],[uMul,0],[uMul,vMul],[0,vMul]); /* +X      */
    this.quad([-x, y,-z],[-x, y, z],[-x,-y, z],[-x,-y,-z],[-1,0,0],[0,0],[uMul,0],[uMul,vMul],[0,vMul]); /* -X      */
  }

  /* cilindro/cone com base em y=0 e topo em y=h.
     Normais suaves: para o cone (rt=0) a fórmula já gera a normal
     correta da superfície lateral (inclinação rb/h). */
  addCilindro(rb, rt, h, segs, tampas, uMul, vMul) {
    uMul = uMul || 1; vMul = vMul || 1;
    const incl = (rb - rt) / h;
    for (let i = 0; i < segs; i++) {
      const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const nl = a => { const n = [Math.cos(a), incl, Math.sin(a)];
        const l = Math.hypot(n[0], n[1], n[2]); return [n[0]/l, n[1]/l, n[2]/l]; };
      const n0 = nl(a0), n1 = nl(a1);
      this.vert([c0*rb, 0, s0*rb], n0, [i/segs*uMul, 0]);
      this.vert([c1*rb, 0, s1*rb], n1, [(i+1)/segs*uMul, 0]);
      this.vert([c0*rt, h, s0*rt], n0, [i/segs*uMul, vMul]);
      this.vert([c1*rt, h, s1*rt], n1, [(i+1)/segs*uMul, vMul]);
      const b = this.pos.length / 3 - 4;
      this.idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
    if (tampas) {
      const bC = this.pos.length / 3;
      this.vert([0, 0, 0], [0, -1, 0], [0.5, 0.5]);
      for (let i = 0; i <= segs; i++) {
        const a = i / segs * Math.PI * 2;
        this.vert([Math.cos(a)*rb, 0, Math.sin(a)*rb], [0,-1,0],
                  [0.5 + Math.cos(a)/2, 0.5 - Math.sin(a)/2]);
      }
      for (let i = 0; i < segs; i++) this.idx.push(bC, bC + 1 + i, bC + 2 + i);
      if (rt > 0.001) {
        const tC = this.pos.length / 3;
        this.vert([0, h, 0], [0, 1, 0], [0.5, 0.5]);
        for (let i = 0; i <= segs; i++) {
          const a = i / segs * Math.PI * 2;
          this.vert([Math.cos(a)*rt, h, Math.sin(a)*rt], [0, 1, 0],
                    [0.5 + Math.cos(a)/2, 0.5 + Math.sin(a)/2]);
        }
        for (let i = 0; i < segs; i++) this.idx.push(tC, tC + 2 + i, tC + 1 + i);
      }
    }
  }

  /* octaedro (8 triângulos) centrado na origem — cristal das células */
  addOctaedro(s) {
    const Xp=[s,0,0], Xm=[-s,0,0], Yp=[0,s,0], Ym=[0,-s,0], Zp=[0,0,s], Zm=[0,0,-s];
    const faces = [ [Xp,Zp,Yp],[Zp,Xm,Yp],[Xm,Zm,Yp],[Zm,Xp,Yp],
                    [Zp,Xp,Ym],[Xm,Zp,Ym],[Zm,Xm,Ym],[Xp,Zm,Ym] ];
    for (const f of faces) {
      const u=[f[1][0]-f[0][0],f[1][1]-f[0][1],f[1][2]-f[0][2]];
      const v=[f[2][0]-f[0][0],f[2][1]-f[0][1],f[2][2]-f[0][2]];
      let n=[u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      const c=[(f[0][0]+f[1][0]+f[2][0])/3,(f[0][1]+f[1][1]+f[2][1])/3,(f[0][2]+f[1][2]+f[2][2])/3];
      if (n[0]*c[0]+n[1]*c[1]+n[2]*c[2] < 0) n=[-n[0],-n[1],-n[2]];   /* normal para fora */
      const l=Math.hypot(n[0],n[1],n[2]); n=[n[0]/l,n[1]/l,n[2]/l];
      this.tri(f[0], f[1], f[2], n, [0.2,0.8],[0.8,0.8],[0.5,0.2]);
    }
  }

  /* toro "de pé" no plano XY (eixo +Z) — anel do portal.
     R = raio maior, r = raio do tubo; normais analíticas suaves. */
  addToroXY(R, r, segMaior, segMenor) {
    const base = this.pos.length / 3;
    for (let i = 0; i < segMaior; i++) {
      const a = i / segMaior * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let j = 0; j < segMenor; j++) {
        const f = j / segMenor * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f);
        const n = [cf*ca, cf*sa, sf];
        this.vert([ca*R + n[0]*r, sa*R + n[1]*r, n[2]*r], n, [i/segMaior*4, j/segMenor*2]);
      }
    }
    for (let i = 0; i < segMaior; i++) {
      const i2 = (i + 1) % segMaior;
      for (let j = 0; j < segMenor; j++) {
        const j2 = (j + 1) % segMenor;
        const a = base + i*segMenor + j, b = base + i2*segMenor + j;
        this.idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }

  /* disco no plano XY, normal +Z (voltada para o jogador) */
  addDiscoXY(r, segs) {
    const c = this.pos.length / 3;
    this.vert([0, 0, 0], [0, 0, 1], [0.5, 0.5]);
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * Math.PI * 2;
      this.vert([Math.cos(a)*r, Math.sin(a)*r, 0], [0,0,1],
                [0.5 + Math.cos(a)/2, 0.5 + Math.sin(a)/2]);
    }
    for (let i = 0; i < segs; i++) this.idx.push(c, c + 1 + i, c + 2 + i);
  }
}

/* ---------- nuvens de pontos (estrelas / poeira / partículas) ---------- */
/* layout: [x, y, z, tamanho, alfa] — 5 floats por ponto */
function criaNuvem(max) {
  const nuvem = { vbo: gl.createBuffer(), n: 0, dados: new Float32Array(max * 5) };
  return nuvem;
}
function enviaNuvem(nuvem) {
  gl.bindBuffer(gl.ARRAY_BUFFER, nuvem.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, nuvem.dados.subarray(0, nuvem.n * 5), gl.DYNAMIC_DRAW);
}
