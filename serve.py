# zeroto1.academy — Static Marketing Site
# Local dev server with clean URLs (/pricing → /pricing.html)
# Usage:  python3 serve.py  →  http://localhost:8000

import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", 8000))
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        # map clean URLs → .html
        if path != "/" and "." not in os.path.basename(path):
            candidate = os.path.join(ROOT, path.lstrip("/") + ".html")
            if os.path.isfile(candidate):
                self.path = path + ".html"
        # 404 fallback
        elif path == "/" and not os.path.isfile(os.path.join(ROOT, "index.html")):
            pass
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print(f"zeroto1.academy serving on http://localhost:{PORT}")
        httpd.serve_forever()
