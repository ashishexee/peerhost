import vm from "vm";

export async function executeFunction(code, args, envVars = {}) {
    // Create a sandbox
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
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        setInterval: global.setInterval,
        clearInterval: global.clearInterval,
        process: {
            env: envVars,
            nextTick: global.process.nextTick,
            cwd: () => "/"
        },
        args,
        env: envVars
    };

    vm.createContext(sandbox);

    const wrappedCode = `
        (async () => {
            ${code}
             // Expecting the user code to perform logic and return something
             // If user code is just a script, we might need a specific structure
             // For now, assuming standard JS script that might return valid JSON-serializable data
        })();
    `;

    try {
        console.log("[Executor] Running code...");
        const result = await vm.runInContext(code, sandbox, {
            timeout: 5000, // 5s timeout
            displayErrors: true
        });

        // If code exports a default function, we might need to call it.
        // But for this prototype, we assume the code *evaluates* to the result 
        // OR the users code sets a global 'result' variable. 
        // Let's assume standard "eval" return for simplicity.
        return result;

    } catch (err) {
        console.error("[Executor] Execution failed:", err);
        throw err;
    }
}
