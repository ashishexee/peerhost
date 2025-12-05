import { executeFunction } from "../src/executor.js";

async function test() {
    console.log("Testing Executor...");
    const code = `
        const a = 10;
        const b = 20;
        a + b;
    `;

    try {
        const result = await executeFunction(code, {});
        console.log("Result (Expected 30):", result);
        if (result !== 30) throw new Error("Incorrect result");
        console.log("✅ Execution Test Passed");
    } catch (err) {
        console.error("❌ Execution Test Failed", err);
        process.exit(1);
    }
}

test();
