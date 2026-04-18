const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  const filePath = path.join(__dirname, url);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType =
      ext === ".html"
        ? "text/html"
        : ext === ".js"
          ? "application/javascript"
          : "text/plain";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    const html = fs.readFileSync("./ai/dashboard.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  }
});

server.listen(3200, "0.0.0.0", () => {
  console.log("Dashboard: http://localhost:3200 and http://192.168.1.109:3200");
});
