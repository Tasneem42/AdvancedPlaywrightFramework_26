# Review: booking-crud.spec.ts

File: [src/tests/apiTests/03_restfullbooker_fixture_e2e/booking-crud.spec.ts](../src/tests/apiTests/03_restfullbooker_fixture_e2e/booking-crud.spec.ts)
Reviewed on 2026-11-19, along with the code it uses: `booker.fixture.ts`, `BookingApi.ts`, `booking.data.ts`, `playwright.config.ts`.
Assumed load: a small API test suite run locally or in CI (CI uses 1 worker and 2 retries) against the public restful-booker server.

**What this change does:** It runs three tests in order, one after another. The first creates a booking and saves its id. The second updates that booking and reads it back. The third deletes it and checks that the server returns 404 (not found).

## Should fix

1. **Tests 2 and 3 fail when run on their own** (`booking-crud.spec.ts:L5, L16-28`)
   - **What this is:** The tests share the booking id through the variable `let bookingId`, which only test 1 fills in.
   - **Problem:** If you run only test 2 or 3, for example by clicking "run" on it in VS Code or with `-g "update"`, test 1 never runs. `bookingId` is then `undefined`, and the request goes to `PUT /booking/undefined`. The error ("PUT /booking/undefined failed: 405") does not tell you why.
   - **Fix:** Merge the three tests into one test with three `test.step(...)` blocks, and keep `bookingId` as a local variable. This also removes `describe.serial` and the shared variable. The report still shows each step by name.
   - **If we skip it:** Anyone who debugs one step on its own gets a confusing failure and loses time.

2. **The title says "token from fixture", but the token fixture is never used** (`booking-crud.spec.ts:L4`)
   - **What this is:** `booker.fixture.ts` offers a `bookerToken` fixture that logs in through `POST /auth`. This spec only asks for `bookingApi`.
   - **Problem:** The token comes from `BookingApi`'s own token cache, not from the fixture. If `bookerToken` breaks, this test still passes, so nothing tests that fixture. No other spec uses it either.
   - **Fix:** Pick one. Either ask for `bookerToken` and pass it in, for example `bookingApi.updateBooking(bookingId, payload, bookerToken)`, or drop "(token from fixture)" from the title.
   - **If we skip it:** The title says this test checks something it does not check.

## Nice to have

3. **A failed run leaves the booking on the server** (`booking-crud.spec.ts:L16-28`)
   - **What this is:** Only the last test deletes the booking.
   - **Problem:** If the update fails, the delete is skipped, and an "E2E Journey" booking stays on the shared public server.
   - **Fix:** With the single-test version from finding 1, put the delete in a `try/finally`, or delete in `test.afterAll` when `bookingId` is set.
   - **If we skip it:** Test data piles up on a shared demo server. The server resets on its own, so the harm is small.

4. **It logs in twice per run** (`booker.fixture.ts:L11-13`)
   - **What this is:** The `bookingApi` fixture builds a new `BookingApi` for every test, and each one caches its own token.
   - **Problem:** The update test and the delete test each call `POST /auth`. That is one extra network call each run.
   - **Fix:** Finding 1 fixes this for free: one test means one `BookingApi` and one login.
   - **If we skip it:** About one extra second per run.

5. **Empty lines** (`booking-crud.spec.ts:L13, L29-33`)
   - **What this is:** A line with only spaces inside test 1, and five empty lines before the closing `});`.
   - **Fix:** Delete them.

**Verdict:** Ship. Fix 1 and 2 when you next touch this file.
**Lean:** -6 lines possible (blank lines, plus `describe.serial` and the shared variable from finding 1).
**Not checked:** I did not run the tests against the live server.
