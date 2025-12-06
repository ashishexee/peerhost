
(async () => {
    const { body, query, method } = args.http;

    if (method !== 'POST') {
        return {
            status: 405,
            body: { error: "Method Not Allowed. Please use POST." }
        };
    }

    return {
        status: 200,
        body: {
            message: "Echo Service",
            received: body,
            timestamp: Date.now()
        }
    };
})()
