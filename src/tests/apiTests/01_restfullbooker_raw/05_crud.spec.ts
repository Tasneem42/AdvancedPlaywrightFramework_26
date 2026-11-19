import { test, expect } from "@playwright/test";
import { logger } from "../../../utils/logger";
interface BookingPayload {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates;
    additionalneeds: string;
}
interface BookingDates {
    checkin: string;
    checkout: string;
}
interface AuthTokenResponse {
    token: string;
}
interface CreateBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}
interface BookingFlowState {
    token?: string;
    bookingId?: number;
}

test.describe.serial('Restfull booker crud Api', () => {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    const payload: BookingPayload = {
        firstname: 'Pramod',
        lastname: 'Dutta',
        totalprice: 111,
        depositpaid: true,
        bookingdates: {
            checkin: '2018-01-01',
            checkout: '2019-01-01',
        },
        additionalneeds: 'Breakfast'
    };
    const bookingFlow: BookingFlowState = {};

    test('TC#1 @p0-create token', async ({ request }) => {
        await test.step("create  token", async () => {
            const responseData = await request.post('/auth', {
                headers,
                data: {
                    username: process.env.BOOKER_USERNAME,
                    password: process.env.BOOKER_PASSWORD,
                },
            });
            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as AuthTokenResponse;
            bookingFlow.token = data.token;
            expect(bookingFlow.token).toBeTruthy();
            logger.info('Created auth token ');
        })
    })
    test('TC#2-@p0 create booking', async ({ request }) => {
        await test.step('create booking', async () => {
            const responseData = await request.post('/booking', {
                headers,
                data: payload
            });
            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as CreateBookingResponse;
            logger.info(`Response is set: ${JSON.stringify(data)}`);
            expect(data.bookingid).toBeTruthy();//to check bookingid shld not be null
            bookingFlow.bookingId = data.bookingid; // save it so step 3 updates this booking
            expect(data.booking.firstname).toBe(payload.firstname);
            expect(data.booking.lastname).toBe(payload.lastname);
            expect(data.booking.bookingdates.checkin).toBe(payload.bookingdates.checkin);
            logger.info(`Created booking id: ${data.bookingid}`);

        })
    })
    test('TC#3-@p0 update booking', async ({ request }) => {
        await test.step('update booking', async () => {
            const token = bookingFlow.token;
            const bookingId = bookingFlow.bookingId;
            if (!token || !bookingId) {
                throw new Error('Create token and create booking tests must pass before update booking.');
            }
            const responseData = await request.put(`/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`
                },
                data: payload,

            })
            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as BookingPayload;
            expect(data.firstname).toBe(payload.firstname);
            expect(data.lastname).toBe(payload.lastname);
            logger.info(`Updated booking id ${bookingId}: ${data.firstname} ${data.lastname}`);

        })
    })
})