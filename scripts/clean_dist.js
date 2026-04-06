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
      removeDirectory(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }

  fs.rmdirSync(targetPath);
}

removeDirectory(DIST_DIR);
