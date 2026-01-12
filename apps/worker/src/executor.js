import vm from "vm";
import crypto from "crypto";
import path from "path";
import os from "os";

export async function executeFunction(code, args, envVars = {}) {
    const customRequire = (moduleName) => {
        switch (moduleName) {
            case "crypto": return crypto;
            case "path": return path;
            case "os": return os;
            case "fs": throw new Error("FileSystem access is restricted via require('fs').");
            default: throw new Error(`Module '${moduleName}' is not available in the sandbox.`);
        }
    };

    const sandbox = {
        console: {
            log: (...args) => console.log("[Func Log]", ...args),
            error: (...args) => console.error("[Func Err]", ...args)
        },
        fetch: global.fetch,
        URL: global.URL,
        URLSearchParams: global.URLSearchParams,
        Buffer: global.Buffer,
        TextEncoder: global.TextEncoder,
        TextDecoder: global.TextDecoder,
        clearTimeout: global.clearTimeout,
        setInterval: global.setInterval,
        clearInterval: global.clearInterval,
        require: customRequire,
        crypto: crypto, 
        process: {
            env: envVars,
            nextTick: global.process.nextTick,
            cwd: () => "/"
        },
        module: { exports: {} },
        exports: {},
        args,
        env: envVars,
        navigator: {
            userAgent: "PeerHost-Worker/1.0",
            language: "en-US",
            platform: "NodeJS"
        },
        self: {},
        window: {},
    };

    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    sandbox.window = sandbox;
    sandbox.exports = sandbox.module.exports;

    vm.createContext(sandbox);

    try {
        console.log("[Executor] Running code...");
        const result = await vm.runInContext(code, sandbox, {
            timeout: 5000,
            displayErrors: true
        });

        const entryPoint = sandbox.module.exports.default || sandbox.module.exports;

        if (typeof entryPoint === 'function') {
            console.log("[Executor] Invoking exported function...");
            const functionResult = await entryPoint(args || {});
            return functionResult;
        }
        if (sandbox.peerhost_worker && sandbox.peerhost_worker.default) {
            const functionResult = await sandbox.peerhost_worker.default(args || {});
            return functionResult;
        }

        return result;

    } catch (err) {
        console.error("[Executor] Execution failed:", err);
        throw err;
    }
}
