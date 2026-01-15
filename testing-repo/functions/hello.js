export default async function (inputs) {
    return {
        body: {
            message: "Hello from the Real Pinata Cloud (JSON)!",
            timestamp: Date.now()
        },
        status: 200
    };
}