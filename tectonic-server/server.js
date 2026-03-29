/**
 * Minimal HTTP server wrapping the `tectonic` binary.
 * Matches the API expected by src/lib/compiler.ts:
 *   POST /compile  { source: "..." }  → PDF binary
 *   GET  /health                      → { status: "ok" }
 */

const http = require("http");
const { execFile } = require("child_process");
const { writeFileSync, readFileSync, unlinkSync, mkdtempSync } = require("fs");
const { join } = require("path");
const { tmpdir } = require("os");

const PORT = process.env.PORT || 9292;

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Compile endpoint
  if (req.method === "POST" && req.url === "/compile") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let source;
      try {
        source = JSON.parse(body).source;
        if (!source) throw new Error("missing source");
      } catch (e) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad request: body must be JSON { source: string }");
        return;
      }

      // Write to a temp dir and compile
      const dir = mkdtempSync(join(tmpdir(), "tectonic-"));
      const texFile = join(dir, "main.tex");
      const pdfFile = join(dir, "main.pdf");

      try {
        writeFileSync(texFile, source, "utf8");
      } catch (e) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Failed to write source file");
        return;
      }

      execFile(
        "tectonic",
        ["--outdir", dir, texFile],
        { timeout: 60000 },
        (err, stdout, stderr) => {
          if (err) {
            // Clean up
            try { unlinkSync(texFile); } catch {}
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end(stderr || err.message);
            return;
          }

          try {
            const pdf = readFileSync(pdfFile);
            res.writeHead(200, {
              "Content-Type": "application/pdf",
              "Content-Length": pdf.length,
            });
            res.end(pdf);
          } catch (e) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("PDF not found after compilation");
          } finally {
            // Clean up temp files
            try { unlinkSync(texFile); } catch {}
            try { unlinkSync(pdfFile); } catch {}
          }
        }
      );
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Tectonic server listening on port ${PORT}`);
});
