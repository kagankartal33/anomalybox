/**
 * Local-only Netlify CLI compatibility shim for Windows sessions without
 * Developer Mode. It dereferences dependency symlinks while packaging the
 * server function. Netlify's Linux production build does not load this file.
 */
if (process.platform === "win32") {
  const fsPromises = require("node:fs/promises");
  const { dirname, resolve } = require("node:path");
  const { syncBuiltinESMExports } = require("node:module");
  const originalCopy = fsPromises.cp.bind(fsPromises);
  const originalSymlink = fsPromises.symlink.bind(fsPromises);

  fsPromises.cp = (source, destination, options = {}) =>
    originalCopy(source, destination, {
      ...options,
      dereference: true,
      verbatimSymlinks: false,
    });

  fsPromises.symlink = async (target, destination, type) => {
    try {
      return await originalSymlink(target, destination, type);
    } catch (error) {
      if (!error || error.code !== "EPERM") throw error;
      const source = resolve(dirname(destination), target);
      return originalCopy(source, destination, {
        recursive: true,
        force: true,
        dereference: true,
        verbatimSymlinks: false,
      });
    }
  };

  syncBuiltinESMExports();
}