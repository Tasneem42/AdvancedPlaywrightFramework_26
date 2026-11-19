# Review with fixed code: booking-crud.spec.ts

File: [src/tests/apiTests/03_restfullbooker_fixture_e2e/booking-crud.spec.ts](../src/tests/apiTests/03_restfullbooker_fixture_e2e/booking-crud.spec.ts)
Reviewed on 2026-11-19. This version includes the smallest code that fixes each finding, and explains it.
The fixed code below compiles and passed one run against the live restful-booker server (4.8 s).

**What this file does:** It tests the full life of one booking: create it, update it, read it back, delete it, then check that it is gone (404).

---

## Findings

### 1. Tests 2 and 3 fail when run on their own (should fix)

**Now:** The three tests share the booking id through `let bookingId`, which only test 1 fills in.

```ts
test.describe.serial('...', () => {
    let bookingId: number;          // only test 1 sets this
    test('create a booking', ...)   // bookingId = bookingid;
    test('update the booking', ...) // uses bookingId
    test('delete the booking', ...) // uses bookingId
});
```

**Problem:** If you click "run" on only the update test in VS Code, test 1 never runs. `bookingId` is `undefined`, the call goes to `PUT /booking/undefined`, and the error doesn't say why.

**Fix:** Use one test with three steps. `test.step` returns whatever its function returns, so the create step can hand the id to the next steps directly:

```ts
const bookingId = await test.step('create a booking', async () => {
    // ...create and check...
    return bookingid;   // this becomes the value of bookingId
});
```

You can no longer run one step without the others, so the id always exists. The HTML report still shows each step by name.

### 2. The title says "token from fixture", but the fixture is never used (should fix)

**Now:** The tests ask only for `bookingApi`. The token comes from `BookingApi`'s own token cache, not from the `bookerToken` fixture.

**Problem:** If the `bookerToken` fixture breaks, this test still passes. The title claims something the test doesn't check.

**Fix:** Ask for the fixture and pass it to the calls that need a login (update and delete):

```ts
async ({ bookingApi, bookerToken }) => {
    ...
    await bookingApi.updateBooking(bookingId, payload, bookerToken);
    await bookingApi.deleteBooking(bookingId, bookerToken);
```

`bookerToken` calls `bookingApi.getToken()`, which logs in once and caches the token. So the test now logs in **once** instead of once per test, which fixes the extra login as well.

### 3. Extra blank lines (nice to have)

There's a line with only spaces (line 13) and five empty lines before the closing `});` (lines 29-33). The fixed code drops them.

---

## The fixed file (all three findings)

```ts
import { test, expect } from '../../../fixtures/booker.fixture';
import { buildBookingFromGenerator } from '../../../testdata/booking.data';

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
```

### What each part does

| Code | Why it is there |
| --- | --- |
| `import { test, expect } from '.../booker.fixture'` | Uses the project's own `test`, which adds the `bookingApi` and `bookerToken` fixtures. |
| `async ({ bookingApi, bookerToken })` | Playwright builds these before the test starts: an API client, and a login token from `POST /auth`. |
| `const bookingId = await test.step(...)` | Runs the create step and keeps the id it returns. No shared variable. |
| `buildBookingFromGenerator({ firstname: 'E2E', ... })` | Random booking data, with the fields we check pinned to known values. |
| `expect(bookingid).toBeGreaterThan(0)` | The server really created the booking and gave it an id. |
| `updateBooking(bookingId, ..., bookerToken)` | `PUT` needs a login. Passing the token explicitly is what makes the test check the fixture. |
| `toMatchObject({ lastname, totalprice })` | Checks only the fields we changed and ignores the rest. |
| `getBooking(bookingId)` | Reads the booking again, so we know the change was saved, not just echoed back. |
| `deleteBooking(...)).toBe(201)` | restful-booker answers a delete with 201, not the usual 204. The comment says so, so nobody "fixes" it. |
| `getBookingResponse(...).status()).toBe(404)` | Proves the booking is really gone. This uses the raw response because `getBooking` would throw on 404. |

### What changed, in short

- `test.describe.serial` with three tests became **one test with three `test.step`s**.
- `let bookingId` became **a value returned by the create step**.
- **`bookerToken` is now used** in update and delete.
- Blank lines are gone. The file goes from 34 to 28 lines.

---

## Left out on purpose

- **Clean-up when a step fails:** if the update fails, the booking stays on the server. You could add a `try/finally` that deletes it, but restful-booker is a public demo that resets itself, so it isn't worth the extra lines here. Add it if you ever test against a server you own.
- **Token renewal:** when you pass an explicit token, `BookingApi` doesn't log in again on a 403. A token outliving a 5-second test isn't a real risk.

**Verdict:** Ship. Apply the fixed file when you next touch this spec.
**Lean:** -6 lines.
**Not checked:** I ran the fixed version once. I didn't test how it behaves with CI retries.
