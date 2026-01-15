export default async function (inputs) {
    const N = inputs?.size || 100;

    const generateMatrix = (size) => {
        return Array.from({ length: size }, () =>
            Array.from({ length: size }, () => Math.random())
        );
    };

    const multiplyMatrices = (a, b) => {
        const size = a.length;
        const result = Array.from({ length: size }, () => new Array(size).fill(0));

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let sum = 0;
                for (let k = 0; k < size; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    };

    const start = Date.now();

    const matrixA = generateMatrix(N);
    const matrixB = generateMatrix(N);

    const resultMatrix = multiplyMatrices(matrixA, matrixB);

    const end = Date.now();
    const duration = end - start;

    return {
        status: 200,
        body: {
            operation: "Matrix Multiplication",
            matrix_size: `${N}x${N}`,
            duration_ms: duration,
            sample_result: resultMatrix[0][0],
            performance: duration < 1000 ? "EXCELLENT" : "GOOD",
            size: inputs?.size
        }
    };
}
