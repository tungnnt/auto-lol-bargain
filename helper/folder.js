const fs = require("fs");
const nodeDiskInfo = require("node-disk-info");

module.exports = {
  listChildFiles: ({ folder, fullPath = true }) =>
    fs
      .readdirSync(folder)
      .map((file) => (fullPath ? `${folder}\\${file}` : file)),
  readFileContent: ({ path }) => fs.readFileSync(path).toString(),
  checkFileExist: async ({ path }) => fs.existsSync(path),
  listWindowsDisks: () => nodeDiskInfo.getDiskInfoSync(),
};
