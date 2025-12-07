
import * as esbuild from "esbuild";
import fs from "fs";

(async () => {
    const code = `console.log(process.env.A);`;
    fs.writeFileSync("test-input.js", code);

    const envVars = { A: "WORKING" };
    const define = {};
    for (const [key, val] of Object.entries(envVars)) {
        define[`process.env.${key}`] = JSON.stringify(val);
    }

    await esbuild.build({
        entryPoints: ["test-input.js"],
        bundle: true,
        outfile: "test-output.js",
        format: "esm",
        platform: "node",
        target: "node18",
        define: define
    });

    const output = fs.readFileSync("test-output.js", "utf-8");
    console.log("Output Code:\n", output);
})();
