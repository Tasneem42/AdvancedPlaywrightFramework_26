import { test, expect } from '../../../fixtures/booker.fixture';
import { buildBookingFromGenerator } from '../../../testdata/booking.data';

// One test with steps: the create step returns the id, so no step can run without it.
test('@e2e @P0 Level 3 - Booking lifecycle (token from fixture)', async ({ bookingApi, bookerToken }) => {
    const bookingId = await test.step('create a booking', async () => {
        const { bookingid, booking } = await bookingApi.createBooking(
            buildBookingFromGenerator({ firstname: 'E2E', lastname: 'Journey' }),
        );
        expect(bookingid).toBeGreaterThan(0);
        expect(booking.firstname).toBe('E2E');
        return bookingid;
    });

    await test.step('update the booking, then read it back', async () => {
        const updated = await bookingApi.updateBooking(
            bookingId,
            buildBookingFromGenerator({ firstname: 'E2E', lastname: 'Updated', totalprice: 950 }),
            bookerToken,
        );
        expect(updated).toMatchObject({ lastname: 'Updated', totalprice: 950 });
        expect((await bookingApi.getBooking(bookingId)).lastname).toBe('Updated');
    });

    await test.step('delete the booking and confirm it is gone', async () => {
        expect(await bookingApi.deleteBooking(bookingId, bookerToken)).toBe(201); // booker returns 201, not 204
        expect((await bookingApi.getBookingResponse(bookingId)).status()).toBe(404);
    });
});
