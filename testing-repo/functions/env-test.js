(async () => {
    const a = process.env.A;
    const b = process.env.B;

    return {
        status: 200,
        body: {
            operation: "Math Import Test",
            results: {
                valueA: a,
                valueB: b,
            }
        }
    };
})()