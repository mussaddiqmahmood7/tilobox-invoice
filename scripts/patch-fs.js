const fs = require("fs");

// On Windows network drives and certain Windows filesystems, libuv readlink throws
// EISDIR instead of EINVAL when called on non-symlink paths (both files and directories).
// Enhanced-resolve (Webpack's resolver) expects EINVAL or ENOTDIR to indicate
// that the target is not a symbolic link. Normalizing EISDIR to EINVAL allows
// Webpack to resolve modules without crashing.
for (const method of ["readlinkSync", "readlink"]) {
    const orig = fs[method];
    if (typeof orig === "function") {
        if (method === "readlinkSync") {
            fs.readlinkSync = function (p, ...args) {
                try {
                    return orig.call(fs, p, ...args);
                } catch (err) {
                    if (err && err.code === "EISDIR") {
                        err.code = "EINVAL";
                    }
                    throw err;
                }
            };
        } else {
            fs.readlink = function (p, ...args) {
                const cb = args[args.length - 1];
                if (typeof cb === "function") {
                    orig.call(fs, p, ...args.slice(0, -1), (err, res) => {
                        if (err && err.code === "EISDIR") {
                            err.code = "EINVAL";
                        }
                        cb(err, res);
                    });
                } else {
                    return orig.call(fs, p, ...args);
                }
            };
        }
    }
}

if (fs.promises && fs.promises.readlink) {
    const origPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function (p, ...args) {
        try {
            return await origPromisesReadlink.call(fs.promises, p, ...args);
        } catch (err) {
            if (err && err.code === "EISDIR") {
                err.code = "EINVAL";
            }
            throw err;
        }
    };
}
