const { spawn } = require("child_process");
const serve = spawn(
  "npx",
  ["-y", "serve", "-s", ".", "-l", "9000", "-H", "0.0.0.0"],
  {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: true,
    shell: true,
  },
);
serve.unref();
console.log("Server started on port 9000");
