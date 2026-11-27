import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GAME_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "game");
const PORT = Number(process.env.PORT || 8080);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

const server = createServer((req, res) => {
  const rawPath = (req.url || "/").split("?")[0];
  const relPath = normalize(rawPath === "/" ? "/index.html" : rawPath).replace(/^([/\\])+/, "");
  const fullPath = resolve(GAME_DIR, relPath);

  if (!fullPath.startsWith(GAME_DIR) || !existsSync(fullPath) || statSync(fullPath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(fullPath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  createReadStream(fullPath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Turkey Run preview server running at http://127.0.0.1:${PORT}/`);
});
