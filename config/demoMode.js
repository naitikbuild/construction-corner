// Demo / sample-data mode — for previewing the profile experience only.
//
// When true, a handful of fully-filled sample profiles (see ../demoData.js) are merged
// into category listings and search results, and can be opened as full profile screens,
// so the app doesn't look empty before real users sign up.
//
// Demo profiles live entirely in memory (demoData.js) and are looked up by a `demo_` uid
// prefix — they are NEVER written to the real `users` or `verified_work` Firestore
// collections. Flipping this flag to false removes every trace of them from the app.
export const DEMO_MODE = true;
