# OPERAÇÃO UZUMAKI — TP1 de Computação Gráfica

**Instituto Federal do Sul de Minas (IFSULDEMINAS) — Campus Machado**
Disciplina: Computação Gráfica — Professor: Renan — Trabalho Prático 1 (11/11/2026)
**Integrantes: Nicolas Alves, Lucas Antônio e Brian Martins**

Minijogo 3D interativo em **WebGL puro** (HTML + JavaScript, sem bibliotecas gráficas e sem
instalação). A estação orbital **Kepler-7** perdeu sua fonte principal de energia: pilote o
drone de manutenção **UZUMAKI-04** pela baía de carga, **recupere as 5 células de energia**,
desvie dos contêineres e **ative o portal de saída**.

---

## 1. Como executar

**Não há dependências.** Basta abrir o arquivo `index.html` em um navegador atualizado
(Chrome, Edge ou Firefox) — dar dois cliques no arquivo funciona.

Alternativa (opcional), servindo a pasta por HTTP:

```bash
python -m http.server 8000
# então acesse http://localhost:8000/
```

O jogo funciona em qualquer máquina sem caminhos específicos: todos os recursos
(texturas, geometrias e sons) são gerados por código em tempo de execução.

## 2. Controles

| Tecla | Ação |
|---|---|
| **W / A / S / D** | Mover o drone (A/D giram, W/S avançam/recuam) |
| **Q / E** | Deslocamento lateral |
| **SHIFT** | Turbo |
| **Setas / mouse (arrastar)** | Ajustar a câmera (roda do mouse = distância) |
| **L** | Ligar/desligar a luz principal |
| **C** | Alternar câmera: perseguição ↔ cinemática |
| **R** | Reiniciar a missão (sem fechar a aplicação) |
| **ESC** | Encerrar |
| **M** | Som ligado/mudo |

## 3. Estrutura do código

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Página, HUD e telas (menu, vitória, saída) |
| `js/mat.js` | Matrizes 4×4 coluna-major: translação, rotação, escala, `lookAt`, perspectiva, inversa e matriz de normais |
| `js/gl.js` | Contexto WebGL, shaders (iluminação Blinn-Phong + neblina; pontos) e rotinas de desenho |
| `js/texturas.js` | 6 texturas procedurais geradas em Canvas 2D (origem: código próprio) |
| `js/geometria.js` | Primitivas: quads, triângulos, linhas, cilindro/cone, toro, octaedro, disco |
| `js/cena.js` | Materiais, malhas e cenário estático (sala, pilares, vigas, plataforma, contêineres) |
| `js/jogo.js` | Estado da missão, entrada, simulação com **dt**, animações, câmera, renderização, HUD e sons |

## 4. Requisitos do enunciado (resumo)

- **Primitivas (≥ 3):** quadriláteros (piso/paredes/caixas), triângulos (cristais, sensor,
  disco do portal), linhas (antena, cabos, feixes-dia) e pontos (estrelas/poeira/partículas).
- **Cena:** piso, drone composto (corpo, 4 braços, 4 hélices, sensor, antena), 5 células,
  4 contêineres (+1 empilhado) e portal de saída — tudo construído por código.
- **Projeção perspectiva + teste de profundidade** (occlusão correta entre objetos).
- **Câmeras:** perseguição (padrão) e cinemática fixa — tecla **C**.
- **Transformações:** translação (movimento), rotação (hélices/células/portal), escala
  (peças, contêineres, encolhimento na coleta) e **hierárquica** (hélice → braço → corpo).
- **Animações (≥ 3):** contínua (hélices, células, anel), periódica (flutuação senoidal)
  e por evento (coleta, abertura do portal, colisão) — todas via **dt**.
- **Texturas (≥ 2):** 6 procedurais; **repetição** no piso (11×11) e paredes (11×3),
  mapeamento sem deformação evidente.
- **Iluminação:** luz pontual com atenuação, ambiente, difusa e **especular Blinn-Phong**
  no casco do drone; tecla **L** alterna a luz.
- **Regras:** limites da sala, coleta por distância, colisão AABB/circular, contador no
  HUD, mensagens de estado, reinício (R) e encerramento (ESC).
- **Identidade visual:** paleta azul-grafite + ciano (energia) + âmbar (obstáculos) +
  violeta→ciano (portal bloqueado→ativo).

## 5. Modo demonstração (capturas de tela)

`index.html?cena=<nome>` encena estados prontos para documentação:
`menu`, `jogo`, `portal-fechado`, `luz-off`, `portal-aberto`, `vitoria`.

No console do navegador, o objeto `MISSAO` permite demonstrações ao vivo, exigidas na
apresentação (alterar velocidade, posição da luz, escala etc.):

```js
MISSAO.teleportar(0, 0);        // move o drone
MISSAO.luz(false);              // desliga a luz principal
MISSAO.PARAMS.velMax = 12;      // muda a velocidade máxima
MISSAO.PARAMS.luzPos = [5, 8, 5]; // move a fonte de luz
MISSAO.coletarTodas();          // coleta todas as células
MISSAO.reiniciar();            // reinicia a missão
```

## 6. Regenerar o relatório PDF

`relatorio.pdf` (2 páginas) já está incluído. Para regenerá-lo a partir das capturas
em `screenshots/` (opcional):

```bash
python -m pip install -r requirements.txt
python tools/gerar_relatorio.py
```

## 7. Origem dos recursos

- **Texturas:** geradas proceduralmente em Canvas 2D por este projeto (`js/texturas.js`).
- **Geometrias, animações, sons (WebAudio) e código:** autoria própria da dupla.
- **Nenhuma imagem, modelo ou som de terceiros** é utilizado.
