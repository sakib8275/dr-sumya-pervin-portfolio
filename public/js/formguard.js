// The pre-hydration submit guard. Loaded blocking from <head>, before any form
// on the page has been parsed.
//
// This replaces onsubmit="return false" on the booking form, removed in F9
// because the CSP in functions/_middleware.js has no 'unsafe-inline' in
// script-src and would have dropped that attribute without a console error, a
// failed request or a test failure -- the patient's booking would simply have
// been lost to a native GET on "/?", which is the exact regression the inline
// attribute was added to fix.
//
// Every form on this page (bookingForm, uploadForm, cmsConfigForm) is submitted
// through fetch by main.js and none has an action or method, so cancelling the
// native submission for all of them is what the markup already meant.
// preventDefault does not stop propagation, so main.js's own submit handlers
// still run exactly as before; between first paint and main.js executing, this
// is the only thing standing between an early Enter keypress and a lost booking.
//
// Capturing, and on document: submit bubbles, so a document-level listener
// registered before the forms exist still sees their events.
document.addEventListener('submit', function (event) {
  event.preventDefault();
}, true);
