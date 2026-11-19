import { test, expect } from "@playwright/test";
import { logger } from "../../../utils/logger";

test.describe("Restful booker booking API", () => {

    // PUT
    // Create Token -> Post Auth -> token
    // Create Booking -> Post Booking -> bookng ID
    // by using this token and bookingid
    // we can make the put request. 

    test('TC#2 @p0-Put:Verify that update the existing bookiging is working fine.', async ({ request }) => {

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
        await test.step("Step-1 create auth token", async () => {
            const responseData = await request.post('/auth', {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                }
            });
            expect(responseData.status()).toBe(200);
            const data = await responseData.json();
            token = data.token;
            expect(token).toBeTruthy();
            logger.info('Created auth token for PUT booking flow');
        })

        await test.step("step2- create booking to update", async () => {
            const responseData = await request.post('/booking', {
                headers,
                data: payload
            });
            expect(responseData.status()).toBe(200);
            const data = await responseData.json();
            logger.info(`Response is set: ${JSON.stringify(data)}`);
            expect(data.bookingid).toBeTruthy();//to check bookingid shld not be null
            bookingId = data.bookingid; // save it so step 3 updates this booking
            expect(data.booking.firstname).toBe(payload.firstname);
            expect(data.booking.lastname).toBe(payload.lastname);
            expect(data.booking.bookingdates.checkin).toBe(payload.bookingdates.checkin);
            logger.info(`Created booking id: ${data.bookingid}`);

        })


        await test.step('step 3-update booking', async () => {
            const responseData = await request.put(`/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`
                },
                data: payload,

            })
            expect(responseData.status()).toBe(200);
            const data = await responseData.json();
            expect(data.firstname).toBe(payload.firstname);
            expect(data.lastname).toBe(payload.lastname);
            logger.info(`Updated booking id ${bookingId}: ${data.firstname} ${data.lastname}`);
        })
    })
})