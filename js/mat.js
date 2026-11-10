/* ============================================================
   OPERAÇÃO UZUMAKI — mat.js
   Biblioteca de matemática: vetores 3D e matrizes 4x4 (coluna-major,
   convenção exigida pelo WebGL). Todas as transformações geométricas
   do jogo (translação, rotação, escala) são compostas por estas funções.
   ============================================================ */
'use strict';

const M4 = {
  ident() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },
  /* produto a*b (aplica b primeiro, depois a) — coluna-major */
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k*4+r] * b[c*4+k];
        o[c*4+r] = s;
      }
    return o;
  },
  /* projeção em perspectiva: converte o frustum 3D em volume canônico */
  persp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([
      f/aspect,0,0,0,  0,f,0,0,
      0,0,(far+near)*nf,-1,  0,0,2*far*near*nf,0 ]);
  },
  /* matriz de visualização: posiciona/orienta a câmera no mundo */
  lookAt(eye, tgt, up) {
    let zx=eye[0]-tgt[0], zy=eye[1]-tgt[1], zz=eye[2]-tgt[2];
    let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;              // eixo Z da câmera (aponta p/ trás)
    let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
    l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;                  // eixo X (right)
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;            // eixo Y (up da câmera)
    return new Float32Array([
      xx,yx,zx,0,  xy,yy,zy,0,  xz,yz,zz,0,
      -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
      -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
      -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1 ]);
  },
  transl(x, y, z) {
    const m = M4.ident(); m[12]=x; m[13]=y; m[14]=z; return m;
  },
  scale(x, y, z) {
    const m = M4.ident(); m[0]=x; m[5]=y; m[10]=z; return m;
  },
  rotX(a) {
    const c=Math.cos(a), s=Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  },
  rotY(a) {
    const c=Math.cos(a), s=Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  },
  rotZ(a) {
    const c=Math.cos(a), s=Math.sin(a);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
  },
  transposta(m) {
    const o = new Float32Array(16);
    for (let c=0;c<4;c++) for (let r=0;r<4;r++) o[r*4+c]=m[c*4+r];
    return o;
  },
  /* inversa geral de matrizes 4x4 (cofatores) */
  inversa(m) {
    const o=new Float32Array(16),
      a00=m[0],a01=m[1],a02=m[2],a03=m[3], a10=m[4],a11=m[5],a12=m[6],a13=m[7],
      a20=m[8],a21=m[9],a22=m[10],a23=m[11], a30=m[12],a31=m[13],a32=m[14],a33=m[15],
      b00=a00*a11-a01*a10, b01=a00*a12-a02*a10, b02=a00*a13-a03*a10,
      b03=a01*a12-a02*a11, b04=a01*a13-a03*a11, b05=a02*a13-a03*a12,
      b06=a20*a31-a21*a30, b07=a20*a32-a22*a30, b08=a20*a33-a23*a30,
      b09=a21*a32-a22*a31, b10=a21*a33-a23*a31, b11=a22*a33-a23*a32;
    let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if(!det) return M4.ident();
    det=1/det;
    o[0]=(a11*b11-a12*b10+a13*b09)*det;  o[1]=(a02*b10-a01*b11-a03*b09)*det;
    o[2]=(a31*b05-a32*b04+a33*b03)*det;  o[3]=(a22*b04-a21*b05-a23*b03)*det;
    o[4]=(a12*b08-a10*b11-a13*b07)*det;  o[5]=(a00*b11-a02*b08+a03*b07)*det;
    o[6]=(a32*b02-a30*b05-a33*b01)*det;  o[7]=(a20*b05-a22*b02+a23*b01)*det;
    o[8]=(a10*b10-a11*b08+a13*b06)*det;  o[9]=(a01*b08-a00*b10-a03*b06)*det;
    o[10]=(a30*b04-a31*b02+a33*b00)*det; o[11]=(a21*b02-a20*b04-a23*b00)*det;
    o[12]=(a11*b07-a10*b09-a12*b06)*det; o[13]=(a00*b09-a01*b07+a02*b06)*det;
    o[14]=(a31*b01-a30*b03-a32*b00)*det; o[15]=(a20*b03-a21*b01+a22*b00)*det;
    return o;
  },
  /* matriz de normais 3x3 = transposta da inversa do modelo.
     Necessária porque escala não-uniforme distorce vetores normais. */
  normal3(m) {
    const t = M4.transposta(M4.inversa(m));
    return new Float32Array([t[0],t[1],t[2], t[4],t[5],t[6], t[8],t[9],t[10]]);
  },
  /* aplica matriz a um ponto (para depuração/posicionamento) */
  ponto(m, p) {
    const x=p[0],y=p[1],z=p[2];
    return [ m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14] ];
  }
};

/* ---------- utilidades de interpolação/tempo ---------- */
const clamp = (v,a,b) => v<a?a:(v>b?b:v);
/* suavização exponencial independente da taxa de quadros:
   com dt em segundos, a resposta é igual a 30 ou 144 fps */
const suaviza = (atual, alvo, lambda, dt) => atual + (alvo-atual)*(1-Math.exp(-lambda*dt));
const easeOutCubic = k => 1-Math.pow(1-k,3);
const easeOutBack  = k => 1+2.70158*Math.pow(k-1,3)+1.70158*Math.pow(k-1,2);
