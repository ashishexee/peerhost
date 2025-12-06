
import { add, multiply } from "../utils/math.js";

(async () => {
    const a = 10;
    const b = 5;

    return {
        status: 200,
        body: {
            operation: "Math Import Test",
            results: {
                addition: add(a, b),
                multiplication: multiply(a, b)
            }
        }
    };
})()
