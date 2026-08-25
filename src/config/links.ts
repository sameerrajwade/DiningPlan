// Central place for all store / web links so a URL change never has to be
// hunted down across screens.
//
// The Play Store URL is package-based (details?id=<applicationId>). That URL
// resolves the moment the app goes live on Google Play — no app update or code
// change is needed at Android launch. Until then it simply 404s, which is why
// share copy labels it "coming soon".
export const APP_STORE_URL = 'https://apps.apple.com/app/id6797710095';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.thaliplan.app';
export const WEBSITE_URL = 'https://sofra.savvylabs.dev';

// Whether to surface the Google Play link in in-app sharing. Sameer's call: keep
// this ON now (app is in testing / rolling to production) so the share card ships
// both store links and we never have to rebuild + reinstall to add Android later.
// NOTE: this only affects in-app sharing — the marketing website keeps its Play
// button as "coming soon" until the public listing is live (a dead public link
// there would hurt), flipped separately in docs/index.html.
export const PLAY_STORE_LIVE = true;
