import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
// Railway (and any container host) needs 0.0.0.0; local runs keep loopback unless HOST is set.
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8"
};

http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  let urlPath = requested === "/" ? "/index.html" : requested;
  let filePath = path.join(root, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    if (fs.statSync(filePath).isDirectory()) {
      // Redirect to the trailing-slash form so relative links inside the page resolve
      // against the directory, not its parent (matters for /cases vs /cases/).
      if (!requested.endsWith("/")) {
        res.writeHead(301, { Location: `${requested}/${req.url.includes("?") ? req.url.slice(requested.length) : ""}` });
        res.end();
        return;
      }
      filePath = path.join(filePath, "index.html");
    }
  } catch {}
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const notFound = path.join(root, "404.html");
      if (fs.existsSync(notFound)) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fs.readFileSync(notFound));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
      }
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}).listen(port, host, () => {
  console.log(`EU JUST preview: http://${host}:${port}`);
});
