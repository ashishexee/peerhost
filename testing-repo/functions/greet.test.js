const greet = require('./greet');

test('greets with Hello World by default', async () => {
    const result = await greet;
    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Hello World');
});

test('greets with name', async () => {
    process.env.NAME = 'Meta';
    delete require.cache[require.resolve('./greet')];
    const result = await require('./greet');
    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Hello Meta');
    delete process.env.NAME;
});
