
import { sharedMath } from "../lib/shared.js";

(async () => {
    const result = sharedMath(10, 5);
    return {
        status: 200,
        body: {
            message: "Import worked!",
            result: result
        }
    };
})();
