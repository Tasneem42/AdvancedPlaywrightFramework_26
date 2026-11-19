import { test, expect } from "@playwright/test";
import { logger } from "../../../utils/logger";

test.describe("Restful booker booking API - PUT negative", () => {

    // Negative PUT scenarios
    // No token / invalid token -> 403 Forbidden
    // Non-existent booking id -> 405 Method Not Allowed (restful-booker behaviour)
    // Missing mandatory fields -> 400 Bad Request
    // Wrong credentials on /auth -> 200 with reason "Bad credentials", no token

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    const payload = {
        firstname: 'Pramod',
        lastname: 'Dutta',
        totalprice: 111,
        depositpaid: true,
        bookingdates: {
            checkin: '2018-01-01',
            checkout: '2019-01-01',
        },
        additionalneeds: 'Breakfast',
    };

    let token = '';
    let bookingId = 0;

    test.beforeEach(async ({ request }) => {
        const authResponse = await request.post('/auth', {
            headers,
            data: { username: 'admin', password: 'password123' }
        });
        expect(authResponse.status()).toBe(200);
        token = (await authResponse.json()).token;
        expect(token).toBeTruthy();

        const bookingResponse = await request.post('/booking', { headers, data: payload });
        expect(bookingResponse.status()).toBe(200);
        bookingId = (await bookingResponse.json()).bookingid;
        expect(bookingId).toBeTruthy();
        logger.info(`Created booking id ${bookingId} for negative PUT`);
    })

    test('TC#1 @p1-Put:Verify update without token is rejected with 403', async ({ request }) => {
        const responseData = await request.put(`/booking/${bookingId}`, { headers, data: payload });
        expect(responseData.status()).toBe(403);
        logger.info(`PUT without token returned ${responseData.status()}`);
    })

    test('TC#2 @p1-Put:Verify update with invalid token is rejected with 403', async ({ request }) => {
        const responseData = await request.put(`/booking/${bookingId}`, {
            headers: { ...headers, Cookie: 'token=invalid_token_123' },
            data: payload
        });
        expect(responseData.status()).toBe(403);
        logger.info(`PUT with invalid token returned ${responseData.status()}`);
    })

    test('TC#3 @p1-Put:Verify update of non-existent booking id fails', async ({ request }) => {
        const responseData = await request.put('/booking/999999999', {
            headers: { ...headers, Cookie: `token=${token}` },
            data: payload
        });
        expect(responseData.status()).toBe(405);
        logger.info(`PUT on non-existent booking returned ${responseData.status()}`);
    })

    test('TC#4 @p1-Put:Verify update with missing mandatory fields is rejected with 400', async ({ request }) => {
        const responseData = await request.put(`/booking/${bookingId}`, {
            headers: { ...headers, Cookie: `token=${token}` },
            data: { firstname: 'OnlyFirstName' }
        });
        expect(responseData.status()).toBe(400);
        logger.info(`PUT with partial payload returned ${responseData.status()}`);
    })

    test('TC#5 @p1-Auth:Verify wrong credentials do not return a token', async ({ request }) => {
        const responseData = await request.post('/auth', {
            headers,
            data: { username: 'admin', password: 'wrongpassword' }
        });
        expect(responseData.status()).toBe(200);
        const data = await responseData.json();
        expect(data.token).toBeUndefined();
        expect(data.reason).toBe('Bad credentials');
        logger.info(`Auth with wrong credentials: ${JSON.stringify(data)}`);
    })
})
