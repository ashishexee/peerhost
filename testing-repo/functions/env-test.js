(async () => {
    const a = env.A;
    const b = env.B;

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