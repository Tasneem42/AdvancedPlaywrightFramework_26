import { test, expect, request } from "@playwright/test";

test('newContext for isolated headers', async () => {

    const cxt = await request.newContext({
        baseURL: 'https://gorest.in',
        extraHTTPHeaders: { 'X-Trace-Id': 'demo-123' },
        timeout: 15_000,
    });
    const ping = await cxt.get('/public/v2/users/1001?page=1&per_page=10');
    expect(ping.status()).toBe(200);
    await cxt.dispose();
})
