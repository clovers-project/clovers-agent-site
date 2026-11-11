"""Local preview server with explicit MIME types for Windows.
Run from any directory: python path/to/08-source/serve-preview.py [--port 8765]
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".woff2": "font/woff2",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preview Clovers Agent Design Kit")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root)))
    print(f"Clovers Agent preview: http://127.0.0.1:{args.port}/START-HERE.html", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
