"""Acceptance HTTP server with portable module MIME types; never imports game code."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class ModuleHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".js": "text/javascript",
                      ".wasm": "application/wasm", ".json": "application/json"}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--directory", type=Path, default=Path.cwd())
    args = parser.parse_args()
    with ThreadingHTTPServer(("127.0.0.1", args.port), partial(ModuleHandler, directory=str(args.directory.resolve()))) as server:
        print(f"Module server ready on 127.0.0.1:{server.server_port}", flush=True)
        server.serve_forever()

if __name__ == "__main__":
    main()
