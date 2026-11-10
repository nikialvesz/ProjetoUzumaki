/* ============================================================
   OPERAÇÃO UZUMAKI — gl.js
   Inicialização do WebGL, shaders e primitivas de desenho.
   Shaders: (1) triângulos/linhas com textura + iluminação
   Blinn-Phong (ambiente + difusa + especular) e neblina;
   (2) pontos (estrelas, poeira, partículas).
   ============================================================ */
'use strict';

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl', { antialias: true });
if (!gl) {
  document.getElementById('erroGL').style.display = 'flex';
  throw new Error('WebGL indisponível');
}

/* ---------- shaders ---------- */
const VS_PRINCIPAL = `
attribute vec3 aPos;        /* coordenadas LOCAIS do objeto */
attribute vec3 aNormal;     /* normal local da superfície */
attribute vec2 aUV;         /* coordenada de textura */
uniform mat4 uModel;        /* local -> mundo (translação/rotação/escala) */
uniform mat4 uView;         /* mundo -> câmera */
uniform mat4 uProj;         /* câmera -> clip (projeção em perspectiva) */
uniform mat3 uNormalMat;    /* corrige as normais quando há escala */
varying vec3 vPos;          /* posição no mundo */
varying vec3 vN;            /* normal no mundo */
varying vec2 vUV;
void main() {
  vec4 posMundo = uModel * vec4(aPos, 1.0);
  vPos = posMundo.xyz;
  vN = normalize(uNormalMat * aNormal);
  vUV = aUV;
  gl_Position = uProj * uView * posMundo;  /* pipeline local->mundo->câmera->tela */
}`;

const FS_PRINCIPAL = `
precision mediump float;
varying vec3 vPos; varying vec3 vN; varying vec2 vUV;
uniform sampler2D uTex;
uniform vec3  uTint;        /* tinta multiplicada à textura */
uniform vec3  uLightPos;    /* posição da luz pontual no mundo */
uniform vec3  uLightColor;  /* cor da luz (0 = desligada) */
uniform vec3  uCamPos;      /* posição da câmera (para especular) */
uniform float uAmbient;    /* contribuição ambiente */
uniform float uShininess;  /* expoente especular */
uniform float uSpecStr;     /* intensidade especular */
uniform float uEmissive;    /* 0..1: quanto o objeto brilha por si só */
uniform float uAlpha;       /* transparência */
uniform vec3  uFogColor;
uniform float uFogDensity;
void main() {
  vec4 texel = texture2D(uTex, vUV);
  vec3 base  = texel.rgb * uTint;
  vec3 N = normalize(vN);

  /* luz pontual com atenuação quadrática pela distância */
  vec3  paraLuz = uLightPos - vPos;
  float dist    = length(paraLuz);
  vec3  L       = paraLuz / max(dist, 0.0001);
  float atenua  = 1.0 / (1.0 + 0.0025 * dist * dist);

  /* resposta difusa (Lambert) */
  float ndl = max(dot(N, L), 0.0);
  vec3 difusa = uLightColor * (ndl * atenua);

  /* resposta especular (Blinn-Phong): depende de luz, superfície E câmera */
  vec3  V = normalize(uCamPos - vPos);
  vec3  H = normalize(L + V);
  float mascara = ndl > 0.0 ? 1.0 : 0.0;   /* sem especular em faces não iluminadas */
  float espec = pow(max(dot(N, H), 0.0), uShininess) * uSpecStr * atenua * mascara;

  vec3 iluminado = base * (uAmbient + difusa) + uLightColor * espec;
  vec3 emissivo  = base * 1.7 + 0.12;                  /* objetos que emitem luz própria */
  vec3 cor = mix(iluminado, emissivo, uEmissive);

  /* neblina: reforça a percepção de profundidade da cena */
  float dCam = length(uCamPos - vPos);
  float neblina = clamp(1.0 - exp(-uFogDensity * dCam * dCam), 0.0, 0.82);
  cor = mix(cor, uFogColor, neblina);

  gl_FragColor = vec4(cor, uAlpha);
}`;

const VS_PONTOS = `
attribute vec3 aPos;
attribute float aSize;
attribute float aAlpha;
uniform mat4 uVP;
uniform float uScale;
varying float vA;
void main() {
  vec4 p = uVP * vec4(aPos, 1.0);
  gl_Position = p;
  gl_PointSize = clamp(aSize * uScale / max(p.w, 0.0001), 1.0, 64.0);
  vA = aAlpha;
}`;

const FS_PONTOS = `
precision mediump float;
varying float vA;
uniform vec3 uColor;
uniform float uAlphaMul;
void main() {
  float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float a = smoothstep(1.0, 0.15, r) * vA * uAlphaMul;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}`;

function compila(tipo, src) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error('Shader: ' + gl.getShaderInfoLog(s));
  return s;
}
function programa(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compila(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compila(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.bindAttribLocation(p, 1, 'aNormal');
  gl.bindAttribLocation(p, 2, 'aUV');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error('Programa: ' + gl.getProgramInfoLog(p));
  return p;
}

const progP = programa(VS_PRINCIPAL, FS_PRINCIPAL);
const uP = {};
for (const n of ['uModel','uView','uProj','uNormalMat','uTint','uLightPos','uLightColor',
                 'uCamPos','uAmbient','uShininess','uSpecStr','uEmissive','uAlpha',
                 'uFogColor','uFogDensity']) uP[n] = gl.getUniformLocation(progP, n);
uP.uTex = gl.getUniformLocation(progP, 'uTex');

const progPt = (() => {
  const p = gl.createProgram();
  gl.attachShader(p, compila(gl.VERTEX_SHADER, VS_PONTOS));
  gl.attachShader(p, compila(gl.FRAGMENT_SHADER, FS_PONTOS));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.bindAttribLocation(p, 1, 'aSize');
  gl.bindAttribLocation(p, 2, 'aAlpha');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error('Programa pontos: ' + gl.getProgramInfoLog(p));
  return p;
})();
const uPt = {
  uVP: gl.getUniformLocation(progPt, 'uVP'),
  uScale: gl.getUniformLocation(progPt, 'uScale'),
  uColor: gl.getUniformLocation(progPt, 'uColor'),
  uAlphaMul: gl.getUniformLocation(progPt, 'uAlphaMul'),
};

/* atributos 0..2 ligados uma única vez (ambos os programas os utilizam) */
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);

/* ---------- criação de textura a partir de um canvas 2D ---------- */
let semente = 1234;                        /* RNG com semente fixa: texturas determinísticas */
function rnd() { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; }
function texturaDeCanvas(desenha, tam = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  desenha(c.getContext('2d'), tam);
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);               /* 256x256 = potência de 2: mipmaps ok */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return t;
}

/* ---------- desenho de malhas ---------- */
let vistaAtual = M4.ident(), projAtual = M4.ident(), olhoCam = [0,0,0];

function usaProgramaPrincipal() {
  gl.useProgram(progP);
  gl.uniformMatrix4fv(uP.uView, false, vistaAtual);
  gl.uniformMatrix4fv(uP.uProj, false, projAtual);
  gl.uniform3fv(uP.uCamPos, olhoCam);
  gl.uniform3fv(uP.uFogColor, [0.028, 0.045, 0.08]);
  gl.uniform1f(uP.uFogDensity, 0.00042);
  gl.uniform1i(uP.uTex, 0);
  gl.activeTexture(gl.TEXTURE0);
}
/* desenha uma malha com material e matriz-modelo (local -> mundo) */
function desenhaMalha(malha, mat, modelo) {
  gl.bindBuffer(gl.ARRAY_BUFFER, malha.vbo);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);   /* posição    */
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);  /* normal     */
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);  /* textura    */
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, malha.ibo);
  gl.uniformMatrix4fv(uP.uModel, false, modelo);
  gl.uniformMatrix3fv(uP.uNormalMat, false, M4.normal3(modelo));
  gl.uniform3fv(uP.uTint, mat.tint || [1, 1, 1]);
  gl.uniform1f(uP.uAmbient, mat.ambient !== undefined ? mat.ambient : 0.32);
  gl.uniform1f(uP.uShininess, mat.shin !== undefined ? mat.shin : 16);
  gl.uniform1f(uP.uSpecStr, mat.spec !== undefined ? mat.spec : 0.15);
  gl.uniform1f(uP.uEmissive, mat.emissive !== undefined ? mat.emissive : 0);
  gl.uniform1f(uP.uAlpha, mat.alpha !== undefined ? mat.alpha : 1);
  gl.bindTexture(gl.TEXTURE_2D, mat.tex);
  gl.drawElements(malha.mode, malha.count, gl.UNSIGNED_SHORT, 0);
}
/* desenha um conjunto de pontos (estrelas/poeira/partículas) */
function desenhaPontos(nuvem, cor, alphaMul, escala) {
  gl.useProgram(progPt);
  gl.uniformMatrix4fv(uPt.uVP, false, mat4MulVP());
  gl.uniform3fv(uPt.uColor, cor);
  gl.uniform1f(uPt.uAlphaMul, alphaMul);
  gl.uniform1f(uPt.uScale, escala);
  gl.bindBuffer(gl.ARRAY_BUFFER, nuvem.vbo);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 12);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
  gl.drawArrays(gl.POINTS, 0, nuvem.n);
}
function mat4MulVP() { return M4.mul(projAtual, vistaAtual); }

/* ---------- ajuste de janela ---------- */
function redimensiona() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = (canvas.clientWidth * dpr) | 0, h = (canvas.clientHeight * dpr) | 0;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  gl.viewport(0, 0, canvas.width, canvas.height);
}
