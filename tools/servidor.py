# -*- coding: utf-8 -*-
"""Servidor local para Operação Uzumaki.

- Serve os arquivos do projeto (igual a `python -m http.server`).
- POST /telemetria: grava um JSON de teste em telemetria.json (usado para
  validar automaticamente o fluxo do jogo em navegadores headless).

Uso:  python tools/servidor.py [porta]
"""
import http.server
import json
import os
import sys
import threading

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAVA = threading.Lock()


class Manipulador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=RAIZ, **kw)

    def log_message(self, fmt, *args):
        pass  # silencioso

    def do_POST(self):
        if self.path.split('?')[0] != '/telemetria':
            self.send_error(404)
            return
        n = int(self.headers.get('Content-Length', 0) or 0)
        dados = self.rfile.read(n).decode('utf-8', 'replace')
        try:
            json.loads(dados)
        except ValueError:
            self.send_error(400)
            return
        with TRAVA:
            with open(os.path.join(RAIZ, 'telemetria.json'), 'a', encoding='utf-8') as f:
                f.write(dados + '\n')
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'ok')


if __name__ == '__main__':
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print('Servindo %s em http://localhost:%d' % (RAIZ, porta))
    http.server.HTTPServer(('127.0.0.1', porta), Manipulador).serve_forever()
