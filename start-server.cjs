const { spawn } = require("child_process");
const server = spawn("node", ["ai/bin/server.js"], {
  cwd: process.cwd(),
  detached: true,
  stdio: "ignore",
});
server.unref();
console.log("Server started in background");
