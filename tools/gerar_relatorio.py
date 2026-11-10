# -*- coding: utf-8 -*-
"""
OPERAÇÃO UZUMAKI — gerador do relatório técnico (TP1 Computação Gráfica)
Gera relatorio.pdf (2 páginas, A4) a partir das capturas em screenshots/.
Uso:  python tools/gerar_relatorio.py
"""
import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
FOTOS = os.path.join(RAIZ, "screenshots")
SAIDA = os.path.join(RAIZ, "relatorio.pdf")

CIANO = colors.HexColor("#0e7a99")
AZUL = colors.HexColor("#1f3346")
CINZA = colors.HexColor("#4a5a68")

st_titulo = ParagraphStyle("titulo", fontName="Helvetica-Bold", fontSize=15,
                           leading=18, textColor=AZUL, alignment=TA_CENTER, spaceAfter=2)
st_sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=8.5, leading=11,
                        textColor=CINZA, alignment=TA_CENTER)
st_h = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10, leading=13,
                      textColor=CIANO, spaceBefore=7, spaceAfter=2)
st_corpo = ParagraphStyle("corpo", fontName="Helvetica", fontSize=8.8, leading=11.6,
                          textColor=colors.HexColor("#222c36"))
st_leg = ParagraphStyle("leg", fontName="Helvetica-Oblique", fontSize=7.2, leading=9,
                       textColor=CINZA, alignment=TA_CENTER)
st_tab = ParagraphStyle("tab", fontName="Helvetica", fontSize=7.0, leading=8.5)
st_tabb = ParagraphStyle("tabb", fontName="Helvetica-Bold", fontSize=7.2, leading=8.7,
                         textColor=colors.white)


def P(txt, s=st_corpo):
    return Paragraph(txt, s)


def figura(nome, legenda, largura):
    img = Image(os.path.join(FOTOS, nome), width=largura, height=largura * 720.0 / 1280.0)
    return [img, Spacer(1, 2), Paragraph(legenda, st_leg)]


def monta():
    doc = SimpleDocTemplate(SAIDA, pagesize=A4,
                            leftMargin=1.4 * cm, rightMargin=1.4 * cm,
                            topMargin=1.1 * cm, bottomMargin=1.1 * cm,
                            title="Operação Uzumaki — Relatório Técnico TP1",
                            author="Nicolas Alves, Lucas Antônio e Brian Martins")
    el = []

    # ---------- cabeçalho ----------
    cab = Table([
        [P("<b>Instituto Federal do Sul de Minas (IFSULDEMINAS) — Campus Machado</b>", st_sub)],
        [P("Computação Gráfica — Professor: Renan — <b>Trabalho Prático 1</b> — 11/11/2026", st_sub)],
        [P("<b>Integrantes: Nicolas Alves, Lucas Antônio e Brian Martins</b>", st_sub)],
    ], colWidths=[18.2 * cm])
    cab.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 1),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    el += [cab, Spacer(1, 6)]
    el.append(P("OPERAÇÃO UZUMAKI — minijogo 3D interativo em WebGL puro", st_titulo))
    el.append(P("Recuperação de células de energia e reativação do portal de saída da Estação Orbital Kepler-7", st_sub))
    el.append(Spacer(1, 6))

    # ---------- 1. proposta ----------
    el.append(P("1. Descrição da proposta", st_h))
    el.append(P(
        "<b>Operação Uzumaki</b> é um minijogo 3D desenvolvido em <b>WebGL puro</b> (HTML/JavaScript, "
        "sem bibliotecas gráficas) que atende ao desafio do enunciado: a estação orbital Kepler-7 perdeu sua "
        "fonte principal de energia e o drone de manutenção <b>UZUMAKI-04</b> deve voar pela baía de carga, "
        "<b>recuperar 5 células de energia</b>, desviar dos contêineres de manutenção e <b>reativar o portal "
        "de saída</b>, que muda de aparência quando a coleta se completa. Identidade visual: paleta azul-grafite "
        "com <b>ciano</b> (energia/coletáveis), <b>âmbar</b> (obstáculos) e <b>violeta→ciano</b> (portal bloqueado→ativo); "
        "movimentação sobre plano horizontal com altura aproximadamente constante (~1,55 m). A missão tem sequência "
        "completa: menu com história e controles, exploração com contador de células e conclusão com tempo. "
        "O código está organizado em <b>js/mat.js</b> (matrizes), <b>js/gl.js</b> (shaders/WebGL), <b>js/texturas.js</b> "
        "(texturas procedurais), <b>js/geometria.js</b> (primitivas), <b>js/cena.js</b> (materiais/cenário) e "
        "<b>js/jogo.js</b> (missão, entrada, simulação e renderização)."))

    # ---------- 2. capturas ----------
    el.append(P("2. Capturas de tela", st_h))
    L = 7.9 * cm
    f1 = figura("jogo.png", "(a) Missão em andamento: drone UZUMAKI-04, células ciano e contêineres âmbar", L)
    f2 = figura("portal_fechado.png", "(b) Portal bloqueado (violeta) antes de completar a coleta", L)
    f3 = figura("portal_aberto.png", "(c) Portal ativado após 5/5 células: anel ciano, disco e feixe de energia", L)
    f4 = figura("luz_off.png", "(d) Luz principal desligada (tecla L): restam ambiente e materiais emissivos", L)
    grid = Table([[f1, f2], [f3, f4]], colWidths=[9.1 * cm, 9.1 * cm])
    grid.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"),
                              ("VALIGN", (0, 0), (-1, -1), "TOP"),
                              ("LEFTPADDING", (0, 0), (-1, -1), 0),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    el.append(grid)

    # ---------- 3. tabela técnica ----------
    el.append(P("3. Técnicas exigidas × aplicação no jogo", st_h))
    linhas = [
        ("Primitivas (≥ 3 tipos)",
         "Quadriláteros: piso, paredes, caixas, corpo/braços do drone (cada quad = 2 triângulos). Triângulos: "
         "cristais (octaedro), cone do sensor, disco do portal. Linhas: antena, cabos aéreos, feixes-dia. Pontos: "
         "estrelas, poeira e partículas."),
        ("Cena mínima",
         "Piso/plataforma, drone composto, 5 células, 4 contêineres (+1 empilhado) e portal (anel + disco + pedestal)."),
        ("Drone composto",
         "Corpo central, 4 braços, 4 hélices (duas lâminas cruzadas + cubo), sensor frontal cônico e antena "
         "com luz piscante — tudo por código."),
        ("Coordenadas 3D e projeção",
         "Pipeline local → mundo (uModel) → câmera (uView) → perspectiva (uProj): FOV 55°, near 0,1 m, far 160 m."),
        ("Câmera",
         "Perseguição com suavização exponencial e cinemática fixa (tecla C); setas/mouse giram, roda dá zoom."),
        ("Teste de profundidade",
         "gl.DEPTH_TEST: o drone é corretamente ocluído ao passar atrás de contêineres, pilares e portal."),
        ("Translação",
         "Deslocamento do drone (v·dt) e posicionamento de células, caixas, pilares, portal, vigas e estrelas."),
        ("Rotação",
         "Orientação (yaw) do drone, giro das hélices, células e anel/disco do portal, câmera orbital."),
        ("Escala",
         "Peças do drone; contêineres de 1,6–2,6 m; encolhimento da célula coletada; expansão do disco do portal."),
        ("Transformação hierárquica",
         "Corpo → braço → hélice: a hélice gira em torno do próprio centro acompanhando o drone (seção 4)."),
        ("Animação contínua",
         "Hélices giram ∝ à velocidade; células giram/flutuam; anel e disco do portal rotacionam sempre."),
        ("Movimento periódico",
         "Flutuação senoidal das células, oscilação do drone, poeira à deriva, pulso dos emissivos."),
        ("Animação acionada por evento",
         "Coleta (célula encolhe, sobe e some, com partículas), abertura do portal (anel acelera, disco expande, "
         "feixe cresce), colisão (flash + tremor de câmera)."),
        ("Uso de dt",
         "Velocidades em m/s e rad/s multiplicadas por dt limitado a 50 ms (seção 5)."),
        ("Texturas (≥ 2)",
         "6 texturas procedurais em Canvas 2D (256², mipmaps, REPEAT), sem imagens de terceiros. Repetição: piso "
         "11×11 cópias quadradas de 4 m; paredes 11×3; célula 2,6 voltas (texels ≈ quadrados)."),
        ("Iluminação",
         "Luz pontual com atenuação quadrática + ambiente 0,30; difusa de Lambert; especular Blinn-Phong no casco do "
         "drone (expoente 64); tecla L alterna (figs. c × d)."),
        ("Interação e regras",
         "WASD (+Q/E, SHIFT turbo), limites, coleta por distância, colisão AABB (caixas) e circular (pilares), "
         "contador 0–5/5, mensagens, R reinicia, ESC encerra."),
    ]
    dados = [[P("Técnica exigida", st_tabb), P("Aplicação em Operação Uzumaki", st_tabb)]]
    for tec, apl in linhas:
        dados.append([P("<b>" + tec + "</b>", st_tab), P(apl, st_tab)])
    tab = Table(dados, colWidths=[3.6 * cm, 14.6 * cm], repeatRows=1)
    tab.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef4f8")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b9c6d1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 1.1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.1),
    ]))
    el.append(tab)

    # ---------- 4. hierárquica ----------
    el.append(P("4. Transformação hierárquica: a hélice do drone", st_h))
    el.append(P(
        "Em <b>desenhaDrone</b> (js/jogo.js) a matriz de cada hélice é composta em cadeia a partir do corpo:"))
    el.append(P("<font face='Courier' size='8'>M_hélice = M_corpo · T(braço_i) · R_y(yaw_i) · R_x(inclinação) · "
                "T(ponta do braço) · R_y(θ_hélice)</font>", st_corpo))
    el.append(P(
        "onde <font face='Courier' size='8'>M_corpo = T(posição) · R_y(yaw) · R_x(pitch) · R_z(bank)</font> "
        "concentra a translação do mundo, a orientação do drone e a oscilação de altura. O efeito prático: quando o "
        "jogador move ou gira o drone, <b>os braços e as hélices acompanham automaticamente</b> (herdam a matriz do "
        "corpo) e, ao mesmo tempo, <b>cada hélice mantém sua animação local</b> — gira em torno do próprio centro com "
        "θ += ω·dt, ω proporcional à velocidade. O sensor frontal, a antena e a luz inferior seguem o mesmo esquema. "
        "No portal, os 6 cristais de trava orbitam o anel por M_portal · R_z(giro) · T(raio)."))

    # ---------- 5. dt ----------
    el.append(P("5. Uso de dt nas animações", st_h))
    el.append(P(
        "O laço principal calcula <font face='Courier' size='8'>dt = (agora − último_t)/1000</font> a cada quadro e o "
        "limita a 50 ms. Todas as velocidades são declaradas <b>por segundo</b> — metros/s no deslocamento do drone e "
        "radianos/s nas rotações — e aplicadas como <font face='Courier' size='8'>pos += v·dt</font> e "
        "<font face='Courier' size='8'>ângulo += ω·dt</font>. Assim, a experiência é <b>independente da quantidade de "
        "quadros por segundo</b>: a 30 ou 144 fps o drone percorre a mesma distância no mesmo tempo e as hélices "
        "completam as mesmas voltas. As suavizações usam <font face='Courier' size='8'>1 − e^(−λ·dt)</font> (resposta "
        "exponencial idêntica em qualquer taxa de quadros) e o teto de 50 ms evita saltos quando a aba perde o foco."))

    # ---------- 6. texturas, normais, iluminação ----------
    el.append(P("6. Texturas, normais e iluminação", st_h))
    el.append(P(
        "<b>Texturas.</b> Seis texturas geradas por código em Canvas 2D (piso metálico, painéis de parede, caixa de "
        "manutenção, núcleo da célula, vórtice de energia e casco do drone), com 256×256 pixels (potência de 2, "
        "permitindo mipmaps e REPEAT) — origem 100% dos autores, sem imagens externas. As coordenadas UV foram "
        "definidas para <b>evitar deformação evidente</b>: o piso de 45 m repete a textura 11×11 (cada cópia cobre "
        "4×4 m, texels quadrados), as paredes de 48×12 m usam 11×3 cópias e a lateral cilíndrica das células usa 2,6 "
        "voltas para compensar a circunferência. A <b>repetição</b> exigida é visível no piso e nas paredes."))
    el.append(P(
        "<b>Normais.</b> Cada face das caixas usa normal plana; cilindros e toro usam normais suaves analíticas "
        "(a fórmula do cone já incorpora a inclinação rb/h); os vetores são transformados pela <b>matriz de normais "
        "(transposta da inversa do modelo)</b>, corrigindo a distorção causada por escalas não uniformes."))
    el.append(P(
        "<b>Iluminação.</b> Luz pontual na lâmpada central com atenuação 1/(1+0,0025·d²), contribuição ambiente 0,30 "
        "(cena visível com a luz desligada), termo <b>difuso</b> de Lambert e termo <b>especular Blinn-Phong</b> "
        "perceptível no casco metálico do drone quando sua orientação muda. Materiais emissivos (células, tiras de "
        "led, portal, sensor) não dependem da luz. A tecla <b>L</b> alterna a fonte — compare as figuras (c) e (d)."))

    # ---------- 7. limitações ----------
    el.append(P("7. Limitações e referências dos recursos", st_h))
    el.append(P(
        "<b>Limitações:</b> colisões simplificadas no plano XZ (caixas delimitadoras alinhadas e círculos, sem física "
        "realista); sem sombras dinâmicas; espessura de linhas fixa em 1 px (limitação do WebGL); o ESC encerra a "
        "simulação, mas navegadores podem impedir o fechamento automático da aba; desempenho dependente do "
        "acelerador de vídeo. <b>Referências:</b> MDN Web Docs e WebGL Fundamentals (WebGL 1.0 / OpenGL ES 2.0); "
        "modelo Blinn-Phong conforme bibliografia da disciplina. Geometrias, texturas (procedurais), sons sintetizados "
        "e código: autoria própria da dupla — nenhum recurso de terceiros foi embutido."))

    doc.build(el)
    return SAIDA


if __name__ == "__main__":
    out = monta()
    try:
        from pypdf import PdfReader
        n = len(PdfReader(out).pages)
        print("OK:", out, "-", n, "pagina(s)")
    except Exception as e:
        print("OK:", out, "- (pypdf indisponivel:", e, ")")
