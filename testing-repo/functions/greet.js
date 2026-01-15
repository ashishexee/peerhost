(async () => {
    const name = process.env.NAME;

    return {
        status: 200,
        body: {
            message: `Hello ${name || 'World'}`
        }
    };
})()