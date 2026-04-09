const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(path.resolve(__dirname, ".."), "dist");

function removeDirectory(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const entryPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    } else {
      fs.unlinkSync(entryPath);
    }
  }

  fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
}

removeDirectory(DIST_DIR);
