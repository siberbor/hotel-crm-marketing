const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3456;
const HTML = fs.readFileSync("./ai/dashboard.html", "utf8");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/kanban") {
    try {
      const data = JSON.parse(
        fs.readFileSync("./ai/kanban/index.json", "utf8"),
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(HTML);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Dashboard: http://localhost:${PORT}`);
  console.log(`✅ Or:        http://192.168.1.109:${PORT}\n`);
});
