#!/usr/bin/env node
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PORT = 3200;
const ROOT = join(process.cwd());
const INDEX = join(ROOT, "ai/kanban/index.json");
const DASH = join(ROOT, "ai/dashboard.html");

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/api/kanban") {
    const data = JSON.parse(readFileSync(INDEX, "utf8"));
    res.end(JSON.stringify(data));
    return;
  }
  res.end(readFileSync(DASH, "utf8"));
});

server.on("error", (e) => console.error("Error:", e.message));
server.listen(PORT, "0.0.0.0", () => console.log(`http://localhost:${PORT}`));

// Keep alive
setInterval(() => {}, 100000);
