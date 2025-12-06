
import { add, format } from "./helpers.js";

// We simulate a dependency (but mapped via bundling). 
// If we had 'lodash', esbuild would bundle it.

export default async function (args) {
    const sum = add(10, 20);
    const msg = format("Math check: " + sum);

    return {
        message: msg,
        status: 200,
        timestamp: Date.now()
    };
}
