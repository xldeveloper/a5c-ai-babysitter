const { File } = require("node:buffer");

if (typeof globalThis.File === "undefined" && File) {
  globalThis.File = File;
}
