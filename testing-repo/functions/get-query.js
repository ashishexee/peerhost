
(async () => {
    const { query } = args.http;
    const name = query.name || "Anonymous";

    return {
        status: 200,
        body: {
            greeting: `Hello, ${name}!`,
            params: query
        }
    };
})()
