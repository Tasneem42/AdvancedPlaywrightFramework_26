import { test, expect } from '../../../fixtures/booker.fixture';
import { buildBookingFromGenerator } from '../../../testdata/booking.data';
import {JSONPath} from 'jsonpath-plus';
test.describe.serial('@e2e @P0 Level 3 - Booking lifecycle (token from fixture)', () => {
    let bookingId: number;
     test('create a booking', async ({ bookingApi }) => {
        const payload = buildBookingFromGenerator({ firstname: 'E2E', lastname: 'Journey' });
        const response = await bookingApi.createBooking(payload);
        const {bookingid,booking}=response;
        expect(bookingid).toBeGreaterThan(0);
        expect(booking.firstname).toBe('E2E');
        // Paths run on the whole response, so they start at $.booking; wrap:false returns the value, not an array.
        const read = (path: string) => JSONPath({ path, json: response, wrap: false });
        expect(read('$.bookingid')).toBe(bookingid);
        expect(read('$.booking.firstname')).toBe(payload.firstname);
        expect(read('$.booking.lastname')).toBe(payload.lastname);
        expect(read('$.booking.totalprice')).toBe(payload.totalprice);
        expect(read('$.booking.depositpaid')).toBe(payload.depositpaid);
        expect(read('$.booking.bookingdates.checkin')).toBe(payload.bookingdates.checkin);
        expect(read('$.booking.bookingdates.checkout')).toBe(payload.bookingdates.checkout);
        expect(read('$.booking.additionalneeds')).toBe(payload.additionalneeds);
        
    
    });

   
});