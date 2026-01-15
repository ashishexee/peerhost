
export default async function (inputs) {
    const size = inputs?.size || 10;
    const seed = inputs?.seed || 1;

    // Simple Linear Congruential Generator for deterministic "random" numbers
    const lcg = (s) => {
        return () => {
            s = Math.imul(1664525, s) + 1013904223 | 0;
            return (s >>> 0) / 4294967296;
        }
    };

    const rng = lcg(seed);

    const generateMatrix = (n) => {
        return Array.from({ length: n }, () =>
            Array.from({ length: n }, () => Math.floor(rng() * 10)) // Integers 0-9
        );
    };

    const matrixA = generateMatrix(size);
    const matrixB = generateMatrix(size);

    // Matrix Multiplication
    let sumHash = 0;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let sum = 0;
            for (let k = 0; k < size; k++) {
                sum += matrixA[i][k] * matrixB[k][j];
            }
            // Simple checksum of the result matrix to avoid returning huge arrays
            sumHash = (sumHash + sum) % 1000000;
        }
    }

    return {
        status: 200,
        body: {
            result: sumHash, // Deterministic Result
            matrix_size: size,
            seed: seed
        }
    };
}
