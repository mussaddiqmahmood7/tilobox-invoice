const { spawnSync } = require("child_process");
const path = require("path");

const patchPath = path.resolve(__dirname, "patch-fs.js").replace(/\\/g, "/");
const nodeOptions = `${process.env.NODE_OPTIONS || ""} --require "${patchPath}"`.trim();
const nextBin = path.resolve(__dirname, "../node_modules/next/dist/bin/next");

const res = spawnSync(process.execPath, [nextBin, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
    },
});

process.exit(res.status || 0);
